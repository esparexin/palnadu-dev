import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import { sanitizePhoneNumber } from './whatsapp-api.util';
import type { WhatsAppConsentEvidence } from '@palnadu/types';
import { WhatsAppMessageDirection } from '@prisma/client';

export async function verifyConsentEvidence(
  prisma: PrismaService,
  phone: string,
  evidence: WhatsAppConsentEvidence,
  templateCategory = 'MARKETING',
): Promise<void> {
  const evidencePhone = sanitizePhoneNumber(evidence.recipientPhone);
  if (evidencePhone !== phone) {
    throw new BadRequestException('Consent evidence phone number does not match recipient.');
  }

  const consentTime = new Date(evidence.consentTimestamp).getTime();
  const maxAge = 180 * 24 * 60 * 60 * 1000;
  if (Number.isNaN(consentTime) || consentTime > Date.now() || Date.now() - consentTime > maxAge) {
    throw new BadRequestException('Consent timestamp is invalid or older than 180 days.');
  }

  const isMarketing = templateCategory.toUpperCase() === 'MARKETING';

  if (isMarketing && evidence.consentPurpose === 'CUSTOMER_SERVICE') {
    throw new BadRequestException(
      'Customer-service consent evidence cannot be used for promotional marketing templates.',
    );
  }

  if (evidence.consentType === 'INBOUND_WHATSAPP_INQUIRY') {
    if (isMarketing) {
      throw new BadRequestException(
        'Inbound customer enquiry authorizes customer service response only, not promotional marketing templates. Promotional outreach requires explicit marketing opt-in consent.',
      );
    }
    const inbound = await prisma.whatsAppMessage.findUnique({
      where: { wamId: evidence.consentEvidenceRef },
    });
    if (!inbound || inbound.direction !== WhatsAppMessageDirection.INBOUND) {
      throw new BadRequestException('Referenced inbound WhatsApp consent interaction not found.');
    }
    const inboundTime = new Date(inbound.statusTimestamp || inbound.createdAt).getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    if (Date.now() - inboundTime > twentyFourHoursMs) {
      throw new BadRequestException(
        'Inbound WhatsApp inquiry is outside Meta’s applicable 24-hour customer-service window.',
      );
    }
    const inboundFrom = sanitizePhoneNumber(inbound.from);
    if (inboundFrom && inboundFrom !== phone && !phone.endsWith(inboundFrom) && !inboundFrom.endsWith(phone)) {
      throw new BadRequestException('Referenced inbound message sender does not match recipient phone.');
    }
  } else if (evidence.consentType === 'WEBSITE_LEAD_FORM' || evidence.consentType === 'VERIFIED_CRM_LEAD') {
    const lead = await prisma.lead.findUnique({ where: { id: evidence.consentEvidenceRef } });
    if (!lead) throw new BadRequestException('Referenced consent lead record not found.');
    const leadDigits = sanitizePhoneNumber(lead.phone || '');
    if (!leadDigits) {
      throw new BadRequestException('Consent lead record does not contain a valid phone number.');
    }
    if (leadDigits !== phone && !phone.endsWith(leadDigits) && !leadDigits.endsWith(phone)) {
      throw new BadRequestException('Consent lead record phone does not match recipient.');
    }
  } else if (evidence.consentType === 'SIGNED_AGREEMENT') {
    const isObjectId = /^[0-9a-fA-F]{24}$/.test(evidence.consentEvidenceRef);
    const doc = isObjectId
      ? await prisma.media.findUnique({ where: { id: evidence.consentEvidenceRef } })
      : await prisma.media.findFirst({
          where: {
            OR: [
              { filename: evidence.consentEvidenceRef },
              { originalName: evidence.consentEvidenceRef },
            ],
          },
        });
    if (!doc) {
      throw new BadRequestException('Referenced signed agreement document not found in stored documents.');
    }
    const meta = (doc.metadata as Record<string, unknown>) || {};
    const hasMarketingConsent =
      meta.authorizesWhatsAppMarketing === true ||
      meta.whatsappConsent === true ||
      meta.whatsappMarketingAuthorized === true;
    if (!hasMarketingConsent) {
      throw new BadRequestException(
        'Stored agreement document does not explicitly authorize WhatsApp marketing communication.',
      );
    }
    const docPhone =
      meta.recipientPhone || meta.phone
        ? sanitizePhoneNumber(String(meta.recipientPhone || meta.phone))
        : null;
    if (docPhone && docPhone !== phone && !phone.endsWith(docPhone) && !docPhone.endsWith(phone)) {
      throw new BadRequestException('Stored agreement phone authorization does not match recipient.');
    }
  }
}

