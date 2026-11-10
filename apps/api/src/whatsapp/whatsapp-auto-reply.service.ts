import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import {
  Prisma,
  WhatsAppDeliveryStatus,
  WhatsAppMessageDirection,
  type WhatsAppMessage,
} from '@prisma/client';
import {
  WHATSAPP_CONFIG_KEYS,
  DEFAULT_ACK_MESSAGE,
  AUTO_REPLY_COOLDOWN_HOURS,
} from './whatsapp.constants';

@Injectable()
export class WhatsAppAutoReplyService {
  private readonly logger = new Logger(WhatsAppAutoReplyService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly apiClient: WhatsAppApiClient,
  ) {}

  isEnabled(): boolean {
    const enabledVal = this.config.get<string>(WHATSAPP_CONFIG_KEYS.AUTO_REPLY_ENABLED);
    if (enabledVal === 'false' || enabledVal === '0') return false;
    return this.apiClient.isConfigured();
  }

  getAcknowledgmentMessage(): string {
    const custom = this.config.get<string>(WHATSAPP_CONFIG_KEYS.AUTO_REPLY_MESSAGE)?.trim();
    return custom || DEFAULT_ACK_MESSAGE;
  }

  async handleAutoReply(
    inboundMessage: WhatsAppMessage,
  ): Promise<WhatsAppMessage | null> {
    if (!this.isEnabled()) {
      return null;
    }

    if (inboundMessage.direction !== WhatsAppMessageDirection.INBOUND) {
      return null;
    }

    const recipientPhone = inboundMessage.from;
    const maskedPhone = this.maskPhone(recipientPhone);

    // 1. Verify message is within WhatsApp's 24-hour customer service window
    const messageTime = inboundMessage.statusTimestamp || inboundMessage.createdAt;
    const windowAgeMs = Date.now() - new Date(messageTime).getTime();
    const twentyFourHoursMs = 24 * 60 * 60 * 1000;
    if (windowAgeMs > twentyFourHoursMs) {
      this.logger.warn(
        `Auto-reply skipped for ${maskedPhone}: inbound message is outside the 24-hour customer service window.`,
      );
      return null;
    }

    // 2. Prevent duplicate replies to the exact same message
    const existingReplyForMessage = await this.prisma.whatsAppMessage.findFirst({
      where: {
        contextWamId: inboundMessage.wamId,
        direction: WhatsAppMessageDirection.OUTBOUND,
      },
    });

    if (existingReplyForMessage) {
      this.logger.log(
        `Auto-reply skipped for ${maskedPhone}: reply already dispatched for message ${inboundMessage.wamId}.`,
      );
      return null;
    }

    // 3. Prevent reply loops: Check cooldown window (default 24h)
    const cooldownMs = AUTO_REPLY_COOLDOWN_HOURS * 60 * 60 * 1000;
    const cooldownThreshold = new Date(Date.now() - cooldownMs);

    const recentOutbound = await this.prisma.whatsAppMessage.findFirst({
      where: {
        to: recipientPhone,
        direction: WhatsAppMessageDirection.OUTBOUND,
        createdAt: { gte: cooldownThreshold },
      },
    });

    if (recentOutbound) {
      this.logger.log(
        `Auto-reply skipped for ${maskedPhone}: outbound message already sent within the cooldown window (last wamId: ${recentOutbound.wamId}).`,
      );
      return null;
    }

    // 4. Dispatch outbound acknowledgment

    const ackText = this.getAcknowledgmentMessage();
    try {
      const sendResult = await this.apiClient.sendTextMessage({
        to: recipientPhone,
        text: ackText,
        replyToWamId: inboundMessage.wamId,
      });

      const assignedWamId = sendResult.messages?.[0]?.id;
      if (!assignedWamId) {
        throw new Error('Meta API response did not contain an assigned message ID');
      }

      const businessNumber = inboundMessage.to || 'palnadu_business';
      const createdOutbound = await this.prisma.whatsAppMessage.create({
        data: {
          wamId: assignedWamId,
          direction: WhatsAppMessageDirection.OUTBOUND,
          from: businessNumber,
          to: recipientPhone,
          type: 'text',
          body: ackText,
          contextWamId: inboundMessage.wamId,
          status: WhatsAppDeliveryStatus.SENT,
          statusTimestamp: new Date(),
          rawPayload: sendResult as unknown as Prisma.InputJsonValue,
        },
      });

      this.logger.log(
        `Automated acknowledgment persisted for ${maskedPhone} (outbound wamId: ${assignedWamId}, in reply to: ${inboundMessage.wamId})`,
      );

      return createdOutbound;
    } catch (sendErr: unknown) {
      const errMessage = sendErr instanceof Error ? sendErr.message : String(sendErr);
      this.logger.error(
        `Failed to send automated WhatsApp acknowledgment to ${maskedPhone}: ${errMessage}`,
      );
      return null;
    }
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 4) return '****';
    return phone.slice(0, 2) + '******' + phone.slice(-2);
  }
}
