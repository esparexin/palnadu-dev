import type { PrismaService } from '../prisma.service';
import { WhatsAppDeliveryStatus } from '@prisma/client';

/**
 * Updates campaign metrics when delivery status events arrive for campaign messages.
 * Atomic Prisma increments ensure accurate tracking even under concurrent webhooks.
 */
export async function updateCampaignMetricsForStatus(
  prisma: PrismaService,
  campaignId: string,
  targetStatus: WhatsAppDeliveryStatus,
  previousStatus?: WhatsAppDeliveryStatus,
): Promise<void> {
  try {
    if (
      targetStatus === WhatsAppDeliveryStatus.DELIVERED &&
      previousStatus !== WhatsAppDeliveryStatus.DELIVERED &&
      previousStatus !== WhatsAppDeliveryStatus.READ
    ) {
      await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: { deliveredCount: { increment: 1 } },
      });
    } else if (
      targetStatus === WhatsAppDeliveryStatus.READ &&
      previousStatus !== WhatsAppDeliveryStatus.READ
    ) {
      await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: { readCount: { increment: 1 } },
      });
    } else if (
      targetStatus === WhatsAppDeliveryStatus.FAILED &&
      previousStatus !== WhatsAppDeliveryStatus.FAILED
    ) {
      await prisma.marketingCampaign.update({
        where: { id: campaignId },
        data: { failedCount: { increment: 1 } },
      });
    }
  } catch {
    // Non-blocking: Campaign metrics update failure must not abort message status transition
  }
}
