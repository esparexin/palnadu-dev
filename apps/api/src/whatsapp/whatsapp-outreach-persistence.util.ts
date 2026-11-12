import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import type { SendIndividualOutreachInput } from '@palnadu/types';
import {
  Prisma,
  WhatsAppDeliveryStatus,
  WhatsAppMessageDirection,
} from '@prisma/client';
import { STATUS_PROGRESSION_RANK } from './whatsapp.constants';
import { buildPhoneVariants } from './whatsapp-api.util';
import type { VerifiedConsentRecord } from './whatsapp-outreach-consent.util';
import { isPrismaP2002 } from './whatsapp-outreach-reservation.util';

export {
  reconcileOutreachMessage,
  formatOutreachHistoryItem,
} from './whatsapp-outreach-reconciliation.util';

export interface OutboundTemplateRecordMeta {
  templateName: string;
  languageCode: string;
  templateCategory?: string;
  resolvedParameters?: Record<string, string>;
  verifiedConsent?: VerifiedConsentRecord;
}

export async function upsertOutreachContact(
  prisma: PrismaService,
  phone: string,
  businessName: string,
  contactName?: string,
  hasVerifiedMarketingConsent = false,
  verifiedConsent?: VerifiedConsentRecord,
): Promise<string> {
  const variants = buildPhoneVariants(phone);
  const existing =
    typeof prisma.marketingContact.findFirst === 'function'
      ? await prisma.marketingContact.findFirst({
          where: { phone: { in: variants } },
          orderBy: { createdAt: 'asc' },
        })
      : await prisma.marketingContact.findUnique({ where: { phone } });
  if (existing) {
    if (existing.optInStatus === 'OPTED_OUT') {
      throw new BadRequestException(
        'Recipient has opted out and cannot be marked as active outreach contact.',
      );
    }
    const updated = await prisma.marketingContact.update({
      where: { phone: existing.phone },
      data: {
        businessName: businessName.trim(),
        contactName: contactName?.trim() || existing.contactName,
        lastContactedAt: new Date(),
      },
    });
    return updated.id;
  }

  const canOptIn = Boolean(
    hasVerifiedMarketingConsent &&
      verifiedConsent &&
      verifiedConsent.consentType !== 'INBOUND_WHATSAPP_INQUIRY',
  );

  const created = await prisma.marketingContact.create({
    data: {
      businessName: businessName.trim(),
      contactName: contactName?.trim(),
      phone,
      source: 'individual_outreach',
      optInStatus: canOptIn ? 'OPTED_IN' : 'UNVERIFIED',
      ...(canOptIn && verifiedConsent
        ? {
            consentType: verifiedConsent.consentType,
            consentEvidenceRef: verifiedConsent.consentEvidenceRef,
            consentTimestamp: verifiedConsent.consentTimestamp,
            consentSource: verifiedConsent.consentSource,
            consentVersion: verifiedConsent.consentVersion,
          }
        : {}),
      lastContactedAt: new Date(),
    },
  });
  return created.id;
}

export async function recordOutboundMessage(
  prisma: PrismaService,
  metaWamId: string,
  resId: string,
  phone: string,
  businessPhone: string,
  input: SendIndividualOutreachInput,
  admin: { id: string; email: string },
  templateCategoryOrMeta: string | OutboundTemplateRecordMeta = 'MARKETING',
): Promise<void> {
  const meta: OutboundTemplateRecordMeta =
    typeof templateCategoryOrMeta === 'string'
      ? {
          templateName: input.templateName,
          languageCode: input.languageCode,
          templateCategory: templateCategoryOrMeta,
        }
      : templateCategoryOrMeta;

  const templateCategory = meta.templateCategory || 'MARKETING';
  const customerName = meta.resolvedParameters?.customer_name;
  const targetLabel = customerName
    ? `Customer: ${customerName}`
    : `Business: ${input.businessName}`;
  const body = `Template: ${meta.templateName} (${meta.languageCode}) | ${targetLabel}`;

  const auditPayload: Record<string, unknown> = {
    templateName: meta.templateName,
    languageCode: meta.languageCode,
    templateCategory,
    ...(meta.resolvedParameters && Object.keys(meta.resolvedParameters).length > 0
      ? { templateParameters: meta.resolvedParameters }
      : {}),
    businessName: input.businessName,
    consentEvidence: input.consentEvidence,
    consentPurpose: templateCategory,
    evidenceSource: meta.verifiedConsent?.consentSource || input.consentEvidence.consentType,
    ...(meta.verifiedConsent
      ? {
          verifiedConsentTimestamp: meta.verifiedConsent.consentTimestamp.toISOString(),
          ...(meta.verifiedConsent.consentVersion
            ? { consentVersion: meta.verifiedConsent.consentVersion }
            : {}),
        }
      : {}),
    adminId: admin.id,
    adminEmail: admin.email,
  };

  try {
    await prisma.whatsAppMessage.create({
      data: {
        wamId: metaWamId,
        direction: WhatsAppMessageDirection.OUTBOUND,
        from: businessPhone,
        to: phone,
        type: 'template',
        status: WhatsAppDeliveryStatus.SENT,
        statusTimestamp: new Date(),
        body,
        rawPayload: auditPayload as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err: unknown) {
    if (!isPrismaP2002(err)) throw err;

    const existing = await prisma.whatsAppMessage.findUnique({ where: { wamId: metaWamId } });
    const existingRank = existing ? (STATUS_PROGRESSION_RANK[existing.status] ?? 0) : 0;
    const sentRank = STATUS_PROGRESSION_RANK[WhatsAppDeliveryStatus.SENT] ?? 10;
    const existingPayload = (existing?.rawPayload as Record<string, unknown>) || {};

    await prisma.whatsAppMessage.update({
      where: { wamId: metaWamId },
      data: {
        from: businessPhone,
        to: phone,
        type: 'template',
        body,
        ...(existingRank < sentRank
          ? { status: WhatsAppDeliveryStatus.SENT, statusTimestamp: new Date() }
          : {}),
        rawPayload: {
          ...existingPayload,
          ...auditPayload,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }

  await prisma.whatsAppMessage.update({
    where: { id: resId },
    data: { rawPayload: { dispatchedWamId: metaWamId, completedAt: new Date().toISOString() } },
  });
}
