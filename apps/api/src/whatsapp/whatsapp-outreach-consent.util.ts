import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import { arePhoneNumbersEquivalent, sanitizePhoneNumber } from './whatsapp-api.util';
import type { WhatsAppConsentEvidence } from '@palnadu/types';
import { WhatsAppMessageDirection } from '@prisma/client';

const CONSENT_MAX_AGE_MS = 180 * 24 * 60 * 60 * 1000;
const INBOUND_SERVICE_WINDOW_MS = 24 * 60 * 60 * 1000;

export interface VerifiedConsentRecord {
  consentType: WhatsAppConsentEvidence['consentType'];
  consentEvidenceRef: string;
  consentTimestamp: Date;
  consentSource: string;
  consentVersion?: string;
}

function validateConsentWindow(rawTimestamp: string | Date, label: string): number {
  const ts = new Date(rawTimestamp).getTime();
  if (Number.isNaN(ts) || ts > Date.now() || Date.now() - ts > CONSENT_MAX_AGE_MS) {
    throw new BadRequestException(`${label} is invalid or older than 180 days.`);
  }
  return ts;
}

export async function verifyConsentEvidence(
  prisma: PrismaService,
  phone: string,
  evidence: WhatsAppConsentEvidence,
  templateCategory = 'MARKETING',
): Promise<VerifiedConsentRecord> {
  if (!arePhoneNumbersEquivalent(evidence.recipientPhone, phone)) {
    throw new BadRequestException('Consent evidence phone number does not match recipient.');
  }

  const consentTime = validateConsentWindow(evidence.consentTimestamp, 'Consent timestamp');
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
    if (Number.isNaN(inboundTime) || Date.now() - inboundTime > INBOUND_SERVICE_WINDOW_MS) {
      throw new BadRequestException(
        'Inbound WhatsApp inquiry is outside Meta’s applicable 24-hour customer-service window.',
      );
    }
    if (!inbound.from || !arePhoneNumbersEquivalent(inbound.from, phone)) {
      throw new BadRequestException('Referenced inbound message sender does not match recipient phone.');
    }
    return {
      consentType: evidence.consentType,
      consentEvidenceRef: evidence.consentEvidenceRef,
      consentTimestamp: new Date(inboundTime),
      consentSource: 'INBOUND_WHATSAPP_INQUIRY',
    };
  }

  if (evidence.consentType === 'WEBSITE_LEAD_FORM' || evidence.consentType === 'VERIFIED_CRM_LEAD') {
    const lead = await prisma.lead.findUnique({ where: { id: evidence.consentEvidenceRef } });
    if (!lead) throw new BadRequestException('Referenced consent lead record not found.');

    const consentPhone = lead.whatsappConsentPhone || lead.phone || '';
    const leadDigits = sanitizePhoneNumber(consentPhone);
    if (!leadDigits || leadDigits.length < 8) {
      throw new BadRequestException('Consent lead record does not contain a valid phone number.');
    }
    if (!arePhoneNumbersEquivalent(consentPhone, phone)) {
      throw new BadRequestException('Consent lead record phone does not match recipient.');
    }
    if (
      lead.phone &&
      lead.whatsappConsentPhone &&
      !arePhoneNumbersEquivalent(lead.phone, lead.whatsappConsentPhone)
    ) {
      throw new BadRequestException('Consent lead record phone does not match recipient.');
    }
    if (lead.whatsappMarketingConsent !== true) {
      throw new BadRequestException(
        'Referenced lead enquiry has not explicitly opted in to WhatsApp marketing communication.',
      );
    }
    const rawLeadTime = lead.whatsappConsentAt || lead.createdAt || new Date(consentTime);
    const dbConsentTime = validateConsentWindow(rawLeadTime, 'Referenced lead consent timestamp');
    return {
      consentType: evidence.consentType,
      consentEvidenceRef: evidence.consentEvidenceRef,
      consentTimestamp: new Date(dbConsentTime),
      consentSource: lead.whatsappConsentSource || evidence.consentType,
      consentVersion: lead.whatsappConsentVersion || undefined,
    };
  }

  if (evidence.consentType === 'SIGNED_AGREEMENT') {
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
    const rawDocPhone = meta.recipientPhone ?? meta.phone;
    const docPhoneStr =
      typeof rawDocPhone === 'string' || typeof rawDocPhone === 'number' ? String(rawDocPhone).trim() : '';
    const docPhoneDigits = sanitizePhoneNumber(docPhoneStr);
    if (!docPhoneDigits || docPhoneDigits.length < 8) {
      throw new BadRequestException(
        'Stored agreement document must bind authorization to a valid recipient phone number.',
      );
    }
    if (!arePhoneNumbersEquivalent(docPhoneStr, phone)) {
      throw new BadRequestException('Stored agreement phone authorization does not match recipient.');
    }
    const rawDocTime = meta.consentTimestamp ?? meta.signedAt;
    const resolvedDocTime =
      typeof rawDocTime === 'string' || rawDocTime instanceof Date
        ? rawDocTime
        : doc.createdAt || new Date(consentTime);
    const docConsentMs = validateConsentWindow(resolvedDocTime, 'Stored agreement consent timestamp');
    return {
      consentType: evidence.consentType,
      consentEvidenceRef: doc.id || evidence.consentEvidenceRef,
      consentTimestamp: new Date(docConsentMs),
      consentSource:
        typeof meta.consentSource === 'string' && meta.consentSource.trim()
          ? meta.consentSource.trim()
          : 'SIGNED_AGREEMENT',
      consentVersion:
        typeof meta.consentVersion === 'string' && meta.consentVersion.trim()
          ? meta.consentVersion.trim()
          : undefined,
    };
  }

  throw new BadRequestException('Unsupported consent evidence type.');
}

