import { Injectable, Logger, BadRequestException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
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
} from './whatsapp.constants';

export interface DispatchCampaignOptions {
  batchSize?: number;
  delayMs?: number;
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
    private readonly optOutService?: WhatsAppOptOutService,
  ) {}

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  async getCampaign(id: string): Promise<MarketingCampaign | null> {
    return this.prisma.marketingCampaign.findUnique({ where: { id } });
  }

  async pauseCampaign(id: string): Promise<MarketingCampaign> {
    const campaign = await this.prisma.marketingCampaign.findUnique({ where: { id } });
    if (!campaign) throw new NotFoundException(`Campaign ${id} not found`);
    return this.prisma.marketingCampaign.update({
      where: { id },
      data: { status: CampaignStatus.PAUSED },
    });
  }

  async dispatchCampaign(
    campaignId: string,
    options?: DispatchCampaignOptions,
  ): Promise<DispatchResult> {
    const campaign = await this.prisma.marketingCampaign.findUnique({
      where: { id: campaignId },
    });
    if (!campaign) throw new NotFoundException(`Campaign ${campaignId} not found`);

    if (
      campaign.status !== CampaignStatus.DRAFT &&
      campaign.status !== CampaignStatus.SCHEDULED &&
      campaign.status !== CampaignStatus.PAUSED
    ) {
      throw new BadRequestException(
        `Campaign ${campaignId} cannot be dispatched in status ${campaign.status}`,
      );
    }

    await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: { status: CampaignStatus.RUNNING },
    });

    const batchLimit = options?.batchSize ?? DEFAULT_CAMPAIGN_BATCH_SIZE;
    const delay = options?.delayMs ?? DEFAULT_CAMPAIGN_DELAY_MS;

    const contacts = await this.fetchEligibleContacts(campaign, batchLimit);
    const existingMessages = await this.prisma.whatsAppMessage.findMany({
      where: { campaignId },
      select: { to: true },
    });
    const alreadyMessaged = new Set(existingMessages.map((m) => m.to));

    let sent = 0;
    let failed = 0;
    let skipped = 0;

    for (const contact of contacts) {
      if (alreadyMessaged.has(contact.phone)) {
        skipped++;
        continue;
      }

      if (contact.optInStatus === ContactOptInStatus.OPTED_OUT) {
        skipped++;
        continue;
      }

      if (this.optOutService && (await this.optOutService.isSuppressed(contact.phone))) {
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

      if (delay > 0) {
        await this.sleep(delay);
      }
    }

    const finalStatus =
      contacts.length === 0 || sent + skipped >= contacts.length
        ? CampaignStatus.COMPLETED
        : CampaignStatus.RUNNING;

    await this.prisma.marketingCampaign.update({
      where: { id: campaignId },
      data: {
        status: finalStatus,
        sentCount: { increment: sent },
        failedCount: { increment: failed },
      },
    });

    return {
      campaignId,
      totalTargeted: contacts.length,
      sentCount: sent,
      failedCount: failed,
      skippedCount: skipped,
      status: finalStatus,
    };
  }

  private async fetchEligibleContacts(
    campaign: MarketingCampaign,
    limit: number,
  ): Promise<MarketingContact[]> {
    const where: Record<string, unknown> = {
      optInStatus: { not: ContactOptInStatus.OPTED_OUT },
    };

    if (campaign.targetAudience === 'NO_WEBSITE') {
      where.hasWebsite = false;
    }

    return this.prisma.marketingContact.findMany({
      where,
      take: limit,
      orderBy: { createdAt: 'asc' },
    });
  }

  private async sendToContact(
    campaign: MarketingCampaign,
    contact: MarketingContact,
  ): Promise<boolean> {
    const businessPhone =
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.PHONE_NUMBER_ID) || 'palnadu_business';

    try {
      const response = await this.apiClient.sendTemplateMessage({
        to: contact.phone,
        templateName: campaign.templateName,
        languageCode: campaign.languageCode,
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: contact.businessName }],
          },
        ],
      });

      const wamId = response.messages[0]?.id;
      if (!wamId) {
        throw new Error('Meta API response missing message id');
      }

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
