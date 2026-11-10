import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma.service';
import { NotificationsService } from '../notifications/notifications.service';
import {
  Prisma,
  WhatsAppDeliveryStatus,
  WhatsAppMessageDirection,
  type WhatsAppMessage,
} from '@prisma/client';
import {
  STATUS_PROGRESSION_RANK,
  NOTIFICATION_TYPE_WHATSAPP_MESSAGE,
} from './whatsapp.constants';

export interface InboundMessageParams {
  wamId: string;
  from: string;
  to: string;
  profileName?: string;
  type: string;
  body?: string;
  mediaId?: string;
  mimeType?: string;
  contextWamId?: string;
  rawPayload?: Record<string, unknown>;
  timestamp?: string;
}

export interface StatusUpdateParams {
  wamId: string;
  recipientId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp?: string;
  errorCode?: string;
  errorMessage?: string;
}

@Injectable()
export class WhatsAppMessageService {
  private readonly logger = new Logger(WhatsAppMessageService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly notifications: NotificationsService,
  ) {}

  async saveInboundMessage(params: InboundMessageParams): Promise<WhatsAppMessage> {
    const existing = await this.prisma.whatsAppMessage.findUnique({
      where: { wamId: params.wamId },
    });

    if (existing) {
      this.logger.warn(`Duplicate inbound WhatsApp message received for wamId: ${params.wamId}`);
      return existing;
    }

    const eventDate = params.timestamp
      ? new Date(Number.parseInt(params.timestamp, 10) * 1000)
      : new Date();

    const created = await this.prisma.whatsAppMessage.create({
      data: {
        wamId: params.wamId,
        direction: WhatsAppMessageDirection.INBOUND,
        from: params.from,
        to: params.to,
        profileName: params.profileName,
        type: params.type,
        body: params.body,
        mediaId: params.mediaId,
        mimeType: params.mimeType,
        contextWamId: params.contextWamId,
        status: WhatsAppDeliveryStatus.RECEIVED,
        statusTimestamp: eventDate,
        rawPayload: params.rawPayload as Prisma.InputJsonValue,
      },
    });

    try {
      await this.notifications.create({
        title: 'New WhatsApp Message',
        message: `From ${params.profileName || params.from}: ${
          params.body ? params.body.slice(0, 80) : `[${params.type}]`
        }`,
        type: NOTIFICATION_TYPE_WHATSAPP_MESSAGE,
        data: {
          wamId: params.wamId,
          from: params.from,
          messageId: created.id,
        },
      });
    } catch (notifErr: unknown) {
      const errMessage = notifErr instanceof Error ? notifErr.message : String(notifErr);
      this.logger.error(
        `Failed to create notification for WhatsApp message ${params.wamId}: ${errMessage}`,
      );
    }

    return created;
  }

  async updateMessageStatus(params: StatusUpdateParams): Promise<WhatsAppMessage> {
    const statusMap: Record<string, WhatsAppDeliveryStatus> = {
      sent: WhatsAppDeliveryStatus.SENT,
      delivered: WhatsAppDeliveryStatus.DELIVERED,
      read: WhatsAppDeliveryStatus.READ,
      failed: WhatsAppDeliveryStatus.FAILED,
    };

    const targetStatus = statusMap[params.status] || WhatsAppDeliveryStatus.SENT;
    const existing = await this.prisma.whatsAppMessage.findUnique({
      where: { wamId: params.wamId },
    });

    const eventDate = params.timestamp
      ? new Date(Number.parseInt(params.timestamp, 10) * 1000)
      : new Date();

    if (!existing) {
      this.logger.log(
        `Received status "${params.status}" for untracked outbound message ${params.wamId}. Creating record.`,
      );
      return this.prisma.whatsAppMessage.create({
        data: {
          wamId: params.wamId,
          direction: WhatsAppMessageDirection.OUTBOUND,
          from: 'palnadu_business',
          to: params.recipientId,
          type: 'text',
          status: targetStatus,
          statusTimestamp: eventDate,
          errorCode: params.errorCode,
          errorMessage: params.errorMessage,
        },
      });
    }

    const isEstablishedDelivery =
      existing.status === WhatsAppDeliveryStatus.DELIVERED ||
      existing.status === WhatsAppDeliveryStatus.READ;

    // Failure events must never overwrite established delivery states (DELIVERED or READ).
    // Preserves provider error information for diagnostic tracing without corrupting delivery status.
    if (targetStatus === WhatsAppDeliveryStatus.FAILED && isEstablishedDelivery) {
      this.logger.warn(
        `Preserving established delivery state ${existing.status} for ${params.wamId} despite incoming failure event: ${params.errorCode} ${params.errorMessage}`,
      );
      if (params.errorCode || params.errorMessage) {
        return this.prisma.whatsAppMessage.update({
          where: { wamId: params.wamId },
          data: {
            ...(params.errorCode ? { errorCode: params.errorCode } : {}),
            ...(params.errorMessage ? { errorMessage: params.errorMessage } : {}),
          },
        });
      }
      return existing;
    }

    const currentRank = STATUS_PROGRESSION_RANK[existing.status] ?? 0;
    const targetRank = STATUS_PROGRESSION_RANK[targetStatus] ?? 0;

    // Prevent regressing an advanced status (e.g. READ back to DELIVERED or SENT)
    if (targetRank <= currentRank && existing.status !== WhatsAppDeliveryStatus.SENT) {
      this.logger.warn(
        `Ignoring out-of-order status update for ${params.wamId}: current is ${existing.status}, received ${targetStatus}`,
      );
      return existing;
    }

    return this.prisma.whatsAppMessage.update({
      where: { wamId: params.wamId },
      data: {
        status: targetStatus,
        statusTimestamp: eventDate,
        ...(params.errorCode ? { errorCode: params.errorCode } : {}),
        ...(params.errorMessage ? { errorMessage: params.errorMessage } : {}),
      },
    });
  }

  async findByWamId(wamId: string): Promise<WhatsAppMessage | null> {
    return this.prisma.whatsAppMessage.findUnique({
      where: { wamId },
    });
  }
}
