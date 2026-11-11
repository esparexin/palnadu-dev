import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
import { sanitizePhoneNumber, maskPhone } from './whatsapp-api.util';
import { validateTemplateAgainstMeta } from './whatsapp-template.util';
import { buildTemplateComponents } from './whatsapp-template-params.util';
import { verifyConsentEvidence } from './whatsapp-outreach-consent.util';
import {
  enforceDistributedRateLimits,
  acquireIdempotencyReservation,
} from './whatsapp-outreach-reservation.util';
import {
  upsertOutreachContact,
  recordOutboundMessage,
  reconcileOutreachMessage,
  formatOutreachHistoryItem,
} from './whatsapp-outreach-persistence.util';
import { handleOutreachDispatchFailure } from './whatsapp-outreach-reconciliation.util';
import { WHATSAPP_CONFIG_KEYS } from './whatsapp.constants';
import type {
  SendIndividualOutreachInput,
  IndividualOutreachDispatchResult,
  IndividualOutreachMessageItem,
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

    const approvedTemplates = await this.apiClient.fetchApprovedTemplates();
    const matchedTemplate = validateTemplateAgainstMeta(
      input.templateName,
      input.languageCode,
      approvedTemplates,
    );
    const templateCategory = matchedTemplate.category || 'MARKETING';

    await verifyConsentEvidence(this.prisma, cleanPhone, input.consentEvidence, templateCategory);

    const { components, resolvedParameters } = buildTemplateComponents({
      templateName: matchedTemplate.name,
      matchedTemplate,
      parameters: input.parameters,
      fallbackBusinessName: input.businessName,
    });

    const idempKey = input.idempotencyKey || `auto-${cleanPhone}-${Date.now()}`;
    const claimKey = `resv:idemp:${idempKey}`;
    const claim = await acquireIdempotencyReservation(this.prisma, claimKey, cleanPhone, admin.id);
    if (claim.deduplicated) {
      return claim.result!;
    }

    await enforceDistributedRateLimits(this.prisma, admin.id, cleanPhone);

    const businessPhone =
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.BUSINESS_PHONE)?.trim() || 'palnadu_business';

    let metaWamId: string;
    try {
      const response = await this.apiClient.sendTemplateMessage({
        to: cleanPhone,
        templateName: matchedTemplate.name,
        languageCode: matchedTemplate.language,
        ...(components.length > 0 ? { components } : {}),
      });
      metaWamId = response.messages?.[0]?.id?.trim();
      if (!metaWamId) throw new Error('Meta API returned response without message ID');
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.error(`Outbound dispatch error for ${maskPhone(cleanPhone)}: ${msg}`);
      return handleOutreachDispatchFailure(
        this.prisma,
        err,
        claim.reservationId!,
        cleanPhone,
        admin,
        input,
        matchedTemplate,
      );
    }

    let contactId: string | undefined;
    if (input.saveContact) {
      const hasVerifiedMarketingConsent =
        templateCategory === 'MARKETING' &&
        input.consentEvidence.consentType !== 'INBOUND_WHATSAPP_INQUIRY' &&
        input.consentEvidence.consentPurpose !== 'CUSTOMER_SERVICE';
      contactId = await upsertOutreachContact(
        this.prisma,
        cleanPhone,
        input.businessName,
        input.contactName,
        hasVerifiedMarketingConsent,
      );
    }

    await recordOutboundMessage(
      this.prisma,
      metaWamId,
      claim.reservationId!,
      cleanPhone,
      businessPhone,
      input,
      admin,
      {
        templateName: matchedTemplate.name,
        languageCode: matchedTemplate.language,
        templateCategory,
        resolvedParameters,
      },
    );

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

    const formatted: IndividualOutreachMessageItem[] = data.map(formatOutreachHistoryItem);
    return { data: formatted, total, page, totalPages: Math.ceil(total / limit) || 1 };
  }

  async reconcileOutreach(
    id: string,
    dto: { confirmedStatus: 'SENT' | 'DELIVERED' | 'FAILED'; metaWamId?: string; notes?: string },
    admin: { id: string },
  ) {
    const statusMap: Record<string, WhatsAppDeliveryStatus> = {
      SENT: WhatsAppDeliveryStatus.SENT,
      DELIVERED: WhatsAppDeliveryStatus.DELIVERED,
      FAILED: WhatsAppDeliveryStatus.FAILED,
    };
    const deliveryStatus = statusMap[dto.confirmedStatus] || WhatsAppDeliveryStatus.SENT;
    await reconcileOutreachMessage(this.prisma, id, deliveryStatus, admin, dto.metaWamId, dto.notes);
    return { success: true, id, status: dto.confirmedStatus, reconciled: true };
  }
}
