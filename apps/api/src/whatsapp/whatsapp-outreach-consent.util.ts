import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import { sanitizePhoneNumber } from './whatsapp-api.util';
import type { WhatsAppConsentEvidence } from '@palnadu/types';
import { WhatsAppMessageDirection } from '@prisma/client';

export async function verifyConsentEvidence(
  prisma: PrismaService,
  phone: string,
  evidence: WhatsAppConsentEvidence,
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

  if (evidence.consentType === 'WEBSITE_LEAD_FORM' || evidence.consentType === 'VERIFIED_CRM_LEAD') {
    const lead = await prisma.lead.findUnique({ where: { id: evidence.consentEvidenceRef } });
    if (!lead) throw new BadRequestException('Referenced consent lead record not found.');
    const leadDigits = sanitizePhoneNumber(lead.phone || '');
    if (leadDigits && leadDigits !== phone && !phone.endsWith(leadDigits) && !leadDigits.endsWith(phone)) {
      throw new BadRequestException('Consent lead record phone does not match recipient.');
    }
  } else if (evidence.consentType === 'INBOUND_WHATSAPP_INQUIRY') {
    const inbound = await prisma.whatsAppMessage.findUnique({
      where: { wamId: evidence.consentEvidenceRef },
    });
    if (!inbound || inbound.direction !== WhatsAppMessageDirection.INBOUND) {
      throw new BadRequestException('Referenced inbound WhatsApp consent interaction not found.');
    }
  } else if (evidence.consentType === 'SIGNED_AGREEMENT') {
    if (!/^AGR-[A-Za-z0-9_-]{4,32}$/.test(evidence.consentEvidenceRef)) {
      throw new BadRequestException('Invalid signed agreement reference format (must match AGR-XXXX).');
    }
  }
}

