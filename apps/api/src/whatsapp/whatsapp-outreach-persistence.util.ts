import { BadRequestException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import type { SendIndividualOutreachInput } from '@palnadu/types';
import {
  Prisma,
  WhatsAppDeliveryStatus,
  WhatsAppMessageDirection,
  ContactOptInStatus,
} from '@prisma/client';

export async function upsertOutreachContact(
  prisma: PrismaService,
  phone: string,
  businessName: string,
  contactName?: string,
): Promise<string> {
  const existing = await prisma.marketingContact.findUnique({ where: { phone } });
  if (existing) {
    const updated = await prisma.marketingContact.update({
      where: { phone },
      data: {
        businessName: businessName.trim(),
        contactName: contactName?.trim() || existing.contactName,
        lastContactedAt: new Date(),
      },
    });
    return updated.id;
  }

  const created = await prisma.marketingContact.create({
    data: {
      businessName: businessName.trim(),
      contactName: contactName?.trim(),
      phone,
      source: 'individual_outreach',
      optInStatus: ContactOptInStatus.OPTED_IN,
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
  templateCategory = 'MARKETING',
): Promise<void> {
  await prisma.whatsAppMessage.create({
    data: {
      wamId: metaWamId,
      direction: WhatsAppMessageDirection.OUTBOUND,
      from: businessPhone,
      to: phone,
      type: 'template',
      status: WhatsAppDeliveryStatus.SENT,
      statusTimestamp: new Date(),
      body: `Template: ${input.templateName} (${input.languageCode}) | Business: ${input.businessName}`,
      rawPayload: {
        consentEvidence: input.consentEvidence as unknown as Prisma.InputJsonValue,
        consentPurpose: templateCategory,
        evidenceSource: input.consentEvidence.consentType,
        adminId: admin.id,
        adminEmail: admin.email,
      },
    },
  });

  await prisma.whatsAppMessage.update({
    where: { id: resId },
    data: { rawPayload: { dispatchedWamId: metaWamId, completedAt: new Date().toISOString() } },
  });
}

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

  const updatedPayload = {
    ...payload,
    requiresReconciliation: false,
    reconciledAt: new Date().toISOString(),
    reconciledBy: admin.id,
    reconciliationNotes: notes || 'Confirmed by administrator without duplicate dispatch',
  };

  await prisma.whatsAppMessage.update({
    where: { id },
    data: {
      status: confirmedStatus,
      statusTimestamp: new Date(),
      ...(metaWamId ? { wamId: metaWamId.trim() } : {}),
      rawPayload: updatedPayload as unknown as Prisma.InputJsonValue,
    },
  });
}
