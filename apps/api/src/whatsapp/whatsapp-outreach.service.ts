import {
  Injectable,
  Logger,
  BadRequestException,
  HttpException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient, WhatsAppApiException } from './whatsapp-api.client';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
import { sanitizePhoneNumber, maskPhone } from './whatsapp-api.util';
import { validateTemplateAgainstMeta } from './whatsapp-template.util';
import { verifyConsentEvidence } from './whatsapp-outreach-consent.util';
import {
  enforceDistributedRateLimits,
  acquireIdempotencyReservation,
} from './whatsapp-outreach-reservation.util';
import {
  upsertOutreachContact,
  recordOutboundMessage,
} from './whatsapp-outreach-persistence.util';
import { WHATSAPP_CONFIG_KEYS } from './whatsapp.constants';
import type {
  SendIndividualOutreachInput,
  IndividualOutreachDispatchResult,
  IndividualOutreachMessageItem,
  WhatsAppTemplateComponent,
} from '@palnadu/types';
import {
  WhatsAppDeliveryStatus,
  WhatsAppMessageDirection,
} from '@prisma/client';

@Injectable()
export class WhatsAppOutreachService {
  private readonly logger = new Logger(WhatsAppOutreachService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly apiClient: WhatsAppApiClient,
    private readonly optOutService: WhatsAppOptOutService,
  ) {}

  async sendOutreach(
    input: SendIndividualOutreachInput,
    admin: { id: string; email: string },
  ): Promise<IndividualOutreachDispatchResult> {
    const cleanPhone = sanitizePhoneNumber(input.phone);
    if (!cleanPhone || cleanPhone.length < 8) {
      throw new BadRequestException('Invalid recipient phone number.');
    }

    if (await this.optOutService.isSuppressed(cleanPhone)) {
      throw new BadRequestException('Recipient has opted out and is on the suppression list.');
    }

    await verifyConsentEvidence(this.prisma, cleanPhone, input.consentEvidence);

    const approvedTemplates = await this.apiClient.fetchApprovedTemplates();
    validateTemplateAgainstMeta(input.templateName, input.languageCode, approvedTemplates);

    const idempKey = input.idempotencyKey || `auto-${cleanPhone}-${Date.now()}`;
    await enforceDistributedRateLimits(this.prisma, admin.id, cleanPhone);

    const claimKey = `resv:idemp:${idempKey}`;
    const claim = await acquireIdempotencyReservation(this.prisma, claimKey, cleanPhone, admin.id);
    if (claim.deduplicated) {
      return claim.result!;
    }

    const businessPhone =
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.BUSINESS_PHONE)?.trim() || 'palnadu_business';
    const components = this.buildComponents(input);

    let metaWamId: string;
    try {
      const response = await this.apiClient.sendTemplateMessage({
        to: cleanPhone,
        templateName: input.templateName,
        languageCode: input.languageCode,
        ...(components.length > 0 ? { components } : {}),
      });
      metaWamId = response.messages[0]?.id;
      if (!metaWamId) throw new Error('Meta API returned response without message ID');
    } catch (err: unknown) {
      return this.handleDispatchFailure(err, claim.reservationId!, cleanPhone, admin);
    }

    let contactId: string | undefined;
    if (input.saveContact) {
      contactId = await upsertOutreachContact(this.prisma, cleanPhone, input.businessName, input.contactName);
    }

    await recordOutboundMessage(this.prisma, metaWamId, claim.reservationId!, cleanPhone, businessPhone, input, admin);

    return {
      success: true,
      wamId: metaWamId,
      recipientPhone: cleanPhone,
      status: 'SENT',
      contactSaved: Boolean(contactId),
      contactId,
      timestamp: new Date().toISOString(),
    };
  }

  private buildComponents(input: SendIndividualOutreachInput): WhatsAppTemplateComponent[] {
    const textParam = input.parameters?.business_name || input.businessName;
    return textParam ? [{ type: 'body', parameters: [{ type: 'text', text: textParam.trim() }] }] : [];
  }

  private async handleDispatchFailure(
    err: unknown,
    resId: string,
    phone: string,
    admin: { id: string },
  ): Promise<IndividualOutreachDispatchResult> {
    const isAmbiguous = err instanceof WhatsAppApiException && Boolean(err.isAmbiguous);
    const msg = err instanceof Error ? err.message : String(err);
    this.logger.error(`Outbound dispatch error for ${maskPhone(phone)}: ${msg}`);

    await this.prisma.whatsAppMessage.update({
      where: { id: resId },
      data: {
        status: isAmbiguous ? WhatsAppDeliveryStatus.RECEIVED : WhatsAppDeliveryStatus.FAILED,
        errorMessage: msg,
        rawPayload: { failedAt: new Date().toISOString(), requiresReconciliation: isAmbiguous, error: msg, adminId: admin.id },
      },
    });

    if (isAmbiguous) {
      return {
        success: false,
        wamId: `ambiguous:${resId}`,
        recipientPhone: phone,
        status: 'RECONCILIATION_PENDING',
        requiresReconciliation: true,
        timestamp: new Date().toISOString(),
      };
    }
    throw err instanceof HttpException ? err : new BadRequestException(`Meta WhatsApp dispatch failed: ${msg}`);
  }

  async listIndividualOutreachMessages(params: { page?: number; limit?: number } = {}) {
    const page = Math.max(1, params.page || 1);
    const limit = Math.min(100, Math.max(1, params.limit || 20));
    const skip = (page - 1) * limit;

    const where = {
      campaignId: null,
      direction: WhatsAppMessageDirection.OUTBOUND,
      wamId: { not: { startsWith: 'resv:' } },
    };

    const [data, total] = await Promise.all([
      this.prisma.whatsAppMessage.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        select: {
          id: true,
          wamId: true,
          to: true,
          status: true,
          statusTimestamp: true,
          body: true,
          errorCode: true,
          errorMessage: true,
          createdAt: true,
          rawPayload: true,
        },
      }),
      this.prisma.whatsAppMessage.count({ where }),
    ]);

    const formatted: IndividualOutreachMessageItem[] = data.map((m) => {
      const payload = (m.rawPayload as Record<string, unknown>) || {};
      const consent = (payload.consentEvidence as Record<string, unknown>) || {};
      return {
        id: m.id,
        wamId: m.wamId,
        to: m.to,
        templateName: m.body?.split('|')[0]?.replace('Template:', '').trim() || 'template',
        languageCode: 'en_US',
        status: m.status,
        statusTimestamp: m.statusTimestamp?.toISOString(),
        errorCode: m.errorCode || undefined,
        errorMessage: m.errorMessage || undefined,
        createdAt: m.createdAt.toISOString(),
        consentType: (consent.consentType as never) || undefined,
        consentEvidenceRef: (consent.consentEvidenceRef as string) || undefined,
      };
    });

    return { data: formatted, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }
}
