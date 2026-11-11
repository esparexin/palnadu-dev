import { Injectable, Logger, Optional, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient, WhatsAppApiException } from './whatsapp-api.client';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
import type { CreateMarketingCampaignInput } from '@palnadu/validation';
import type { WhatsAppTemplateComponent } from '@palnadu/types';
import {
  CampaignStatus,
  ContactOptInStatus,
  WhatsAppDeliveryStatus,
  WhatsAppMessageDirection,
  type MarketingCampaign,
  type MarketingContact,
} from '@prisma/client';
import {
  WHATSAPP_CONFIG_KEYS,
  DEFAULT_CAMPAIGN_BATCH_SIZE,
  DEFAULT_CAMPAIGN_DELAY_MS,
  MIN_CAMPAIGN_BATCH_SIZE,
  MAX_CAMPAIGN_BATCH_SIZE,
} from './whatsapp.constants';

export interface DispatchCampaignOptions {
  batchSize?: number;
}

export interface DispatchResult {
  campaignId: string;
  totalTargeted: number;
  sentCount: number;
  failedCount: number;
  skippedCount: number;
  status: CampaignStatus;
}

@Injectable()
export class WhatsAppCampaignService {
  private readonly logger = new Logger(WhatsAppCampaignService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly apiClient: WhatsAppApiClient,
    @Optional() private readonly optOutService?: WhatsAppOptOutService,
  ) {}

  private sleep(): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, DEFAULT_CAMPAIGN_DELAY_MS));
  }

  async createCampaign(data: CreateMarketingCampaignInput): Promise<MarketingCampaign> {
    return this.prisma.marketingCampaign.create({
      data: {
        name: data.name.trim(),
        description: data.description?.trim(),
        templateName: data.templateName.trim(),
        languageCode: data.languageCode || 'en_US',
        targetAudience: data.targetAudience?.trim(),
        scheduledAt: data.scheduledAt ? new Date(data.scheduledAt) : null,
        status: CampaignStatus.DRAFT,
      },
    });
  }

  async listCampaigns(params: { page?: number; limit?: number; status?: CampaignStatus } = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;
    const where = params.status ? { status: params.status } : {};

    const [data, total] = await Promise.all([
      this.prisma.marketingCampaign.findMany({ where, skip, take: limit, orderBy: { createdAt: 'desc' } }),
      this.prisma.marketingCampaign.count({ where }),
    ]);

    return { data, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  async getCampaign(id: string): Promise<MarketingCampaign | null> {
    return this.prisma.marketingCampaign.findUnique({
      where: { id },
      include: {
        messages: {
          take: 20,
          orderBy: { createdAt: 'desc' },
          select: { id: true, wamId: true, to: true, status: true, statusTimestamp: true, errorCode: true, errorMessage: true },
        },
      },
    });
  }

  async pauseCampaign(id: string): Promise<MarketingCampaign> {
    const campaign = await this.prisma.marketingCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return this.prisma.marketingCampaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
    });
  }

  async dispatchCampaign(campaignId: string, options?: DispatchCampaignOptions): Promise<DispatchResult> {
    const campaign = await this.prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!campaign) throw new NotFoundException(`Campaign ${campaignId} not found`);

    if (campaign.status !== CampaignStatus.DRAFT && campaign.status !== CampaignStatus.SCHEDULED && campaign.status !== CampaignStatus.PAUSED) {
      throw new BadRequestException(`Campaign ${campaignId} cannot be dispatched in status ${campaign.status}`);
    }

    await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.RUNNING, startedAt: campaign.startedAt || new Date() },
    });

    const reqBatch = options?.batchSize;
    const batchLimit =
      typeof reqBatch === 'number' && Number.isFinite(reqBatch)
        ? Math.max(MIN_CAMPAIGN_BATCH_SIZE, Math.min(MAX_CAMPAIGN_BATCH_SIZE, Math.trunc(reqBatch)))
        : DEFAULT_CAMPAIGN_BATCH_SIZE;

    const contacts = await this.fetchEligibleContacts(campaign, batchLimit);
    const existing = await this.prisma.whatsAppMessage.findMany({ where: { campaignId }, select: { to: true } });
    const alreadyMessaged = new Set(existing.map((m) => m.to));

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const contact of contacts) {
      if (
        alreadyMessaged.has(contact.phone) ||
        contact.optInStatus === ContactOptInStatus.OPTED_OUT ||
        (this.optOutService && (await this.optOutService.isSuppressed(contact.phone)))
      ) {
        skipped++;
        continue;
      }

      const success = await this.sendToContact(campaign, contact);
      if (success) {
        sent++;
        alreadyMessaged.add(contact.phone);
      } else {
        failed++;
      }
      await this.sleep();
    }

    const finalStatus = contacts.length === 0 || sent + skipped >= contacts.length ? CampaignStatus.COMPLETED : CampaignStatus.RUNNING;
    await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        completedAt: finalStatus === CampaignStatus.COMPLETED ? new Date() : undefined,
        sentCount: { increment: sent },
        failedCount: { increment: failed },
        totalContacts: contacts.length,
      },
    });

    return { campaignId, totalTargeted: contacts.length, sentCount: sent, failedCount: failed, skippedCount: skipped, status: finalStatus };
  }

  private async fetchEligibleContacts(campaign: MarketingCampaign, limit: number): Promise<MarketingContact[]> {
    const where: Record<string, unknown> = { optInStatus: { not: ContactOptInStatus.OPTED_OUT } };
    if (campaign.targetAudience === 'NO_WEBSITE') where.hasWebsite = false;
    return this.prisma.marketingContact.findMany({ where, take: limit, orderBy: { createdAt: 'asc' } });
  }

  private async sendToContact(campaign: MarketingCampaign, contact: MarketingContact): Promise<boolean> {
    const businessPhone =
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.BUSINESS_PHONE)?.trim() ||
      'palnadu_business';
    const components: WhatsAppTemplateComponent[] = contact.businessName?.trim()
      ? [{ type: 'body', parameters: [{ type: 'text', text: contact.businessName.trim() }] }]
      : [];

    try {
      const response = await this.apiClient.sendTemplateMessage({
        to: contact.phone,
        templateName: campaign.templateName,
        languageCode: campaign.languageCode,
        ...(components.length > 0 ? { components } : {}),
      });

      const wamId = response.messages[0]?.id;
      if (!wamId) throw new Error('Meta API response missing message id');

      await this.prisma.whatsAppMessage.create({
        data: {
          wamId,
          direction: WhatsAppMessageDirection.OUTBOUND,
          from: businessPhone,
          to: contact.phone,
          type: 'template',
          status: WhatsAppDeliveryStatus.SENT,
          statusTimestamp: new Date(),
          campaignId: campaign.id,
          body: `Template: ${campaign.templateName}`,
        },
      });
      return true;
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Campaign dispatch error for ${contact.phone}: ${msg}`);
      return false;
    }
  }
}
