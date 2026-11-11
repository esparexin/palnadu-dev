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
