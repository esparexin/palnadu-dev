import {
  Injectable,
  Logger,
  BadRequestException,
  Optional,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
import { WhatsAppTakeoverService } from './whatsapp-takeover.service';
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
  listOutreachMessages,
} from './whatsapp-outreach-persistence.util';
import { handleOutreachDispatchFailure } from './whatsapp-outreach-reconciliation.util';
import {
  isHumanSalesOutreach,
  activateOutreachTakeover,
  updateOutreachConversation,
} from './whatsapp-outreach-takeover.util';
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
    @Optional() private readonly takeoverService?: WhatsAppTakeoverService,
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

    const verifiedConsent = await verifyConsentEvidence(
      this.prisma,
      cleanPhone,
      input.consentEvidence,
      templateCategory,
    );

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

    const isHumanSales = isHumanSalesOutreach(input, admin);
    if (isHumanSales) {
      await activateOutreachTakeover(
        this.prisma,
        cleanPhone,
        admin,
        input,
        this.takeoverService,
      );
    }

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
        verifiedConsent,
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
        verifiedConsent,
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
        verifiedConsent,
      },
    );

    if (isHumanSales) {
      await updateOutreachConversation(this.prisma, cleanPhone, admin);
    }

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
    return listOutreachMessages(this.prisma, params);
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
