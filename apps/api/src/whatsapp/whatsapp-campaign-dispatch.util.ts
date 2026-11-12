import { ConflictException, NotFoundException } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import {
  CampaignStatus,
  Prisma,
  WhatsAppDeliveryStatus,
  WhatsAppMessageDirection,
  type MarketingCampaign,
} from '@prisma/client';
import { STATUS_PROGRESSION_RANK } from './whatsapp.constants';
import { WhatsAppApiException } from './whatsapp-api.client';
import { isPrismaP2002 } from './whatsapp-outreach-reservation.util';

export async function claimCampaignAtomically(
  prisma: PrismaService,
  campaignId: string,
): Promise<MarketingCampaign> {
  const claim = await prisma.marketingCampaign.updateMany({
    where: {
      id: campaignId,
      status: { in: [CampaignStatus.DRAFT, CampaignStatus.SCHEDULED, CampaignStatus.PAUSED] },
    },
    data: {
      status: CampaignStatus.RUNNING,
      startedAt: new Date(),
    },
  });

  if (claim.count === 0) {
    const existing = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
    if (!existing) {
      throw new NotFoundException(`Campaign ${campaignId} not found`);
    }
    throw new ConflictException(
      `Campaign ${campaignId} is already running or cannot be claimed (status: ${existing.status})`,
    );
  }

  const campaign = await prisma.marketingCampaign.findUnique({ where: { id: campaignId } });
  return campaign!;
}

export async function acquireCampaignRecipientReservation(
  prisma: PrismaService,
  campaignId: string,
  phone: string,
): Promise<boolean> {
  const claimKey = `resv:cmp:${campaignId}:${phone}`;
  try {
    await prisma.whatsAppMessage.create({
      data: {
        wamId: claimKey,
        direction: WhatsAppMessageDirection.OUTBOUND,
        from: 'system_campaign_resv',
        to: phone,
        type: 'campaign_claim',
        status: WhatsAppDeliveryStatus.RECEIVED,
        campaignId,
        rawPayload: { inFlightAt: new Date().toISOString() },
      },
    });
    return true;
  } catch (err: unknown) {
    if (isPrismaP2002(err)) {
      return false;
    }
    throw err;
  }
}

export async function recordCampaignDispatchSuccess(
  prisma: PrismaService,
  campaignId: string,
  phone: string,
  metaWamId: string,
  businessPhone: string,
  templateName: string,
  languageCode?: string,
): Promise<void> {
  const claimKey = `resv:cmp:${campaignId}:${phone}`;
  const body = languageCode ? `Template: ${templateName} (${languageCode})` : `Template: ${templateName}`;
  const payload = {
    reservationKey: claimKey,
    templateName,
    ...(languageCode ? { languageCode } : {}),
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
        campaignId,
        body,
        rawPayload: payload as unknown as Prisma.InputJsonValue,
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
        campaignId,
        body,
        ...(existingRank < sentRank
          ? { status: WhatsAppDeliveryStatus.SENT, statusTimestamp: new Date() }
          : {}),
        rawPayload: {
          ...existingPayload,
          ...payload,
        } as unknown as Prisma.InputJsonValue,
      },
    });
  }
  await prisma.whatsAppMessage.delete({ where: { wamId: claimKey } }).catch(() => null);
}

export async function recordCampaignDispatchFailure(
  prisma: PrismaService,
  campaignId: string,
  phone: string,
  businessPhone: string,
  templateName: string,
  error: unknown,
  languageCode?: string,
): Promise<void> {
  const claimKey = `resv:cmp:${campaignId}:${phone}`;
  const isAmbiguous = error instanceof WhatsAppApiException && Boolean(error.isAmbiguous);
  const msg = error instanceof Error ? error.message : String(error);
  const body = languageCode ? `Template: ${templateName} (${languageCode})` : `Template: ${templateName}`;
  const metaPayload = {
    error: msg,
    campaignId,
    templateName,
    ...(languageCode ? { languageCode } : {}),
  };

  if (isAmbiguous) {
    const updated = await prisma.whatsAppMessage
      .update({
        where: { wamId: claimKey },
        data: {
          wamId: `ambiguous:cmp:${campaignId}:${phone}`,
          status: WhatsAppDeliveryStatus.RECEIVED,
          statusTimestamp: new Date(),
          body,
          errorMessage: msg,
          rawPayload: { requiresReconciliation: true, ...metaPayload },
        },
      })
      .catch(() => null);

    if (!updated) {
      await prisma.whatsAppMessage
        .create({
          data: {
            wamId: `ambiguous:cmp:${campaignId}:${phone}`,
            direction: WhatsAppMessageDirection.OUTBOUND,
            from: businessPhone,
            to: phone,
            type: 'template',
            status: WhatsAppDeliveryStatus.RECEIVED,
            statusTimestamp: new Date(),
            campaignId,
            body,
            errorMessage: msg,
            rawPayload: { requiresReconciliation: true, ...metaPayload },
          },
        })
        .catch(() => null);
    }
  } else {
    await prisma.whatsAppMessage.delete({ where: { wamId: claimKey } }).catch(() => null);
    await prisma.whatsAppMessage
      .create({
        data: {
          wamId: `failed:cmp:${campaignId}:${phone}:${Date.now()}`,
          direction: WhatsAppMessageDirection.OUTBOUND,
          from: businessPhone,
          to: phone,
          type: 'template',
          status: WhatsAppDeliveryStatus.FAILED,
          statusTimestamp: new Date(),
          campaignId,
          body,
          errorMessage: msg,
          rawPayload: metaPayload,
        },
      })
      .catch(() => null);
  }
}

