import { BadRequestException, HttpException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import type {
  IndividualOutreachDispatchResult,
  IndividualOutreachMessageItem,
  SendIndividualOutreachInput,
  WhatsAppMetaTemplate,
} from '@palnadu/types';
import { Prisma, WhatsAppDeliveryStatus } from '@prisma/client';
import { STATUS_PROGRESSION_RANK } from './whatsapp.constants';
import { WhatsAppApiException } from './whatsapp-api.client';
import type { VerifiedConsentRecord } from './whatsapp-outreach-consent.util';
import { isPrismaP2002 } from './whatsapp-outreach-reservation.util';

export async function reconcileOutreachMessage(
  prisma: PrismaService,
  id: string,
  confirmedStatus: WhatsAppDeliveryStatus,
  admin: { id: string },
  metaWamId?: string,
  notes?: string,
): Promise<void> {
  const msg = await prisma.whatsAppMessage.findUnique({ where: { id } });
  if (!msg) {
    throw new BadRequestException('Outreach message not found for reconciliation.');
  }

  const payload = (msg.rawPayload as Record<string, unknown>) || {};
  const isAmbiguous = payload.requiresReconciliation === true || msg.wamId.startsWith('ambiguous:');
  if (!isAmbiguous && msg.status !== WhatsAppDeliveryStatus.RECEIVED) {
    throw new BadRequestException('Message does not require reconciliation.');
  }

  const trimmedWamId = metaWamId?.trim();
  const updatedPayload = {
    ...payload,
    requiresReconciliation: false,
    reconciledAt: new Date().toISOString(),
    reconciledBy: admin.id,
    reconciliationNotes: notes || 'Confirmed by administrator without duplicate dispatch',
  };

  try {
    await prisma.whatsAppMessage.update({
      where: { id },
      data: {
        status: confirmedStatus,
        statusTimestamp: new Date(),
        ...(trimmedWamId ? { wamId: trimmedWamId } : {}),
        rawPayload: updatedPayload as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (err: unknown) {
    if (!isPrismaP2002(err) || !trimmedWamId) throw err;

    const existing = await prisma.whatsAppMessage.findUnique({ where: { wamId: trimmedWamId } });
    if (!existing) throw err;

    const existingRank = STATUS_PROGRESSION_RANK[existing.status] ?? 0;
    const targetRank = STATUS_PROGRESSION_RANK[confirmedStatus] ?? 0;
    const existingPayload = (existing.rawPayload as Record<string, unknown>) || {};

    await prisma.whatsAppMessage.update({
      where: { wamId: trimmedWamId },
      data: {
        ...(targetRank > existingRank
          ? { status: confirmedStatus, statusTimestamp: new Date() }
          : {}),
        body: existing.body || msg.body,
        rawPayload: {
          ...updatedPayload,
          ...existingPayload,
          requiresReconciliation: false,
          reconciledAt: updatedPayload.reconciledAt,
          reconciledBy: updatedPayload.reconciledBy,
          reconciliationNotes: updatedPayload.reconciliationNotes,
        } as unknown as Prisma.InputJsonValue,
      },
    });
    await prisma.whatsAppMessage.delete({ where: { id } }).catch(() => null);
  }
}

export function formatOutreachHistoryItem(m: {
  id: string;
  wamId: string;
  to: string;
  status: WhatsAppDeliveryStatus;
  statusTimestamp: Date | null;
  body: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  createdAt: Date;
  rawPayload: unknown;
}): IndividualOutreachMessageItem {
  const payload = (m.rawPayload as Record<string, unknown>) || {};
  const consent = (payload.consentEvidence as Record<string, unknown>) || {};
  const bodyMatch = m.body?.match(/^Template:\s*([^\s(|]+)(?:\s*\(([^)]+)\))?/);
  const templateName = (payload.templateName as string) || bodyMatch?.[1] || 'template';
  const languageCode = (payload.languageCode as string) || bodyMatch?.[2] || 'en_US';
  const status = payload.requiresReconciliation ? 'RECONCILIATION_PENDING' : m.status;

  return {
    id: m.id,
    wamId: m.wamId,
    to: m.to,
    businessName: (payload.businessName as string) || undefined,
    templateName,
    languageCode,
    status,
    statusTimestamp: m.statusTimestamp?.toISOString(),
    errorCode: m.errorCode || undefined,
    errorMessage: m.errorMessage || undefined,
    createdAt: m.createdAt.toISOString(),
    consentType: (consent.consentType as never) || undefined,
    consentEvidenceRef: (consent.consentEvidenceRef as string) || undefined,
    isReconciled: Boolean(payload.reconciledAt),
    reconciledAt: (payload.reconciledAt as string) || undefined,
    reconciledBy: (payload.reconciledBy as string) || undefined,
    reconciliationNotes: (payload.reconciliationNotes as string) || undefined,
  };
}

export async function handleOutreachDispatchFailure(
  prisma: PrismaService,
  err: unknown,
  resId: string,
  phone: string,
  admin: { id: string },
  input: SendIndividualOutreachInput,
  matchedTemplate: WhatsAppMetaTemplate,
  verifiedConsent?: VerifiedConsentRecord,
): Promise<IndividualOutreachDispatchResult> {
  const isAmbiguous = err instanceof WhatsAppApiException && Boolean(err.isAmbiguous);
  const msg = err instanceof Error ? err.message : String(err);

  const ambiguousWamId = `ambiguous:${resId}`;
  await prisma.whatsAppMessage.update({
    where: { id: resId },
    data: {
      wamId: isAmbiguous ? ambiguousWamId : undefined,
      status: isAmbiguous ? WhatsAppDeliveryStatus.RECEIVED : WhatsAppDeliveryStatus.FAILED,
      body: `Template: ${matchedTemplate.name} (${matchedTemplate.language})`,
      errorMessage: msg,
      rawPayload: {
        failedAt: new Date().toISOString(),
        requiresReconciliation: isAmbiguous,
        error: msg,
        adminId: admin.id,
        to: phone,
        templateName: matchedTemplate.name,
        languageCode: matchedTemplate.language,
        templateCategory: matchedTemplate.category || 'MARKETING',
        businessName: input.businessName,
        consentEvidence: input.consentEvidence as unknown as Prisma.InputJsonValue,
        evidenceSource: verifiedConsent?.consentSource || input.consentEvidence.consentType,
        ...(verifiedConsent
          ? {
              verifiedConsentTimestamp: verifiedConsent.consentTimestamp.toISOString(),
              ...(verifiedConsent.consentVersion
                ? { consentVersion: verifiedConsent.consentVersion }
                : {}),
            }
          : {}),
      },
    },
  });

  if (isAmbiguous) {
    return {
      success: false,
      wamId: ambiguousWamId,
      recipientPhone: phone,
      status: 'RECONCILIATION_PENDING',
      requiresReconciliation: true,
      timestamp: new Date().toISOString(),
    };
  }
  throw err instanceof HttpException ? err : new BadRequestException(`Meta WhatsApp dispatch failed: ${msg}`);
}
