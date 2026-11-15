import type { Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import { isPrismaP2002 } from './whatsapp-outreach-reservation.util';
import {
  Prisma,
  WhatsAppDeliveryStatus,
  type WhatsAppMessage,
} from '@prisma/client';
import type { WhatsAppSendResponse } from '@palnadu/types';

export async function finalizeAutoReplyOutbound(
  prisma: PrismaService,
  logger: Logger,
  claimRecordId: string,
  assignedWamId: string,
  inboundWamId: string,
  ackText: string,
  sendResult: WhatsAppSendResponse,
): Promise<WhatsAppMessage> {
  try {
    return await prisma.whatsAppMessage.update({
      where: { id: claimRecordId },
      data: {
        wamId: assignedWamId,
        status: WhatsAppDeliveryStatus.SENT,
        body: ackText,
        rawPayload: sendResult as unknown as Prisma.InputJsonValue,
      },
    });
  } catch (updateErr: unknown) {
    if (isPrismaP2002(updateErr)) {
      logger.warn(`Delivery status webhook arrived before claim update for ${assignedWamId}, reconciling.`);
      const createdOutbound = await prisma.whatsAppMessage.update({
        where: { wamId: assignedWamId },
        data: {
          body: ackText,
          contextWamId: inboundWamId,
          rawPayload: sendResult as unknown as Prisma.InputJsonValue,
        },
      });
      await prisma.whatsAppMessage.delete({ where: { id: claimRecordId } }).catch(() => null);
      return createdOutbound;
    }
    throw updateErr;
  }
}
