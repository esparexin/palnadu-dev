import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
import { isOptOutKeywordText } from './whatsapp-opt-out.util';
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
  private readonly inFlightReplies = new Set<string>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly apiClient: WhatsAppApiClient,
    @Optional() private readonly optOutService?: WhatsAppOptOutService,
  ) {}

  isEnabled(): boolean {
    const enabledVal = this.config.get<string>(WHATSAPP_CONFIG_KEYS.AUTO_REPLY_ENABLED);
    if (enabledVal === 'false' || enabledVal === '0') return false;
    return this.apiClient.isConfigured();
  }

  getCooldownHours(): number {
    const configured = this.config.get<string>(WHATSAPP_CONFIG_KEYS.AUTO_REPLY_COOLDOWN_HOURS);
    if (configured) {
      const parsed = Number.parseInt(configured, 10);
      if (!Number.isNaN(parsed) && parsed >= 0) return parsed;
    }
    return AUTO_REPLY_COOLDOWN_HOURS;
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

    if (isOptOutKeywordText(inboundMessage.body)) {
      this.logger.log(`Auto-reply skipped for ${this.maskPhone(inboundMessage.from)}: inbound opt-out keyword.`);
      return null;
    }

    if (this.optOutService && (await this.optOutService.isSuppressed(inboundMessage.from))) {
      this.logger.log(`Auto-reply skipped for ${this.maskPhone(inboundMessage.from)}: recipient is opted out.`);
      return null;
    }

    // In-memory mutex prevents microsecond webhook delivery races from dispatching duplicate replies
    if (this.inFlightReplies.has(inboundMessage.wamId)) {
      this.logger.warn(
        `Auto-reply already in-flight for ${inboundMessage.wamId}, skipping concurrent dispatch.`,
      );
      return null;
    }

    this.inFlightReplies.add(inboundMessage.wamId);
    const recipientPhone = inboundMessage.from;
    const maskedPhone = this.maskPhone(recipientPhone);

    try {
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
          status: { not: WhatsAppDeliveryStatus.FAILED },
        },
      });

      if (existingReplyForMessage) {
        this.logger.log(
          `Auto-reply skipped for ${maskedPhone}: reply already dispatched for message ${inboundMessage.wamId}.`,
        );
        return null;
      }

      // 3. Prevent reply loops: Check cooldown window (configurable, default 24h)
      const cooldownHours = this.getCooldownHours();
      if (cooldownHours > 0) {
        const cooldownMs = cooldownHours * 60 * 60 * 1000;
        const cooldownThreshold = new Date(Date.now() - cooldownMs);

        const recentOutbound = await this.prisma.whatsAppMessage.findFirst({
          where: {
            to: recipientPhone,
            direction: WhatsAppMessageDirection.OUTBOUND,
            campaignId: null,
            status: { not: WhatsAppDeliveryStatus.FAILED },
            createdAt: { gte: cooldownThreshold },
          },
        });

        if (recentOutbound) {
          this.logger.log(
            `Auto-reply skipped for ${maskedPhone}: outbound message already sent within the cooldown window (last wamId: ${recentOutbound.wamId}).`,
          );
          return null;
        }
      }

      // 4. Multi-instance atomic claim: Guarantees cross-instance idempotency via MongoDB unique wamId index
      const businessNumber = inboundMessage.to || 'palnadu_business';
      const claimWamId = `claim:${inboundMessage.wamId}`;
      let claimRecord: WhatsAppMessage;
      try {
        claimRecord = await this.prisma.whatsAppMessage.create({
          data: {
            wamId: claimWamId,
            direction: WhatsAppMessageDirection.OUTBOUND,
            from: businessNumber,
            to: recipientPhone,
            type: 'text',
            contextWamId: inboundMessage.wamId,
            status: WhatsAppDeliveryStatus.RECEIVED,
            statusTimestamp: new Date(),
          },
        });
      } catch (claimErr: unknown) {
        if (
          claimErr &&
          typeof claimErr === 'object' &&
          'code' in claimErr &&
          (claimErr as { code: string }).code === 'P2002'
        ) {
          this.logger.warn(
            `Multi-instance concurrent auto-reply claim intercepted for ${inboundMessage.wamId}`,
          );
          return null;
        }
        throw claimErr;
      }

      // 5. Dispatch outbound acknowledgment to Meta API
      const ackText = this.getAcknowledgmentMessage();
      let sendResult;
      try {
        sendResult = await this.apiClient.sendTextMessage({
          to: recipientPhone,
          text: ackText,
          replyToWamId: inboundMessage.wamId,
        });
      } catch (sendErr: unknown) {
        await this.prisma.whatsAppMessage.update({
          where: { id: claimRecord.id },
          data: {
            status: WhatsAppDeliveryStatus.FAILED,
            errorMessage: sendErr instanceof Error ? sendErr.message : String(sendErr),
          },
        }).catch(() => null);
        throw sendErr;
      }

      const assignedWamId = sendResult.messages?.[0]?.id;
      if (!assignedWamId) {
        throw new Error('Meta API response did not contain an assigned message ID');
      }

      let createdOutbound: WhatsAppMessage;
      try {
        createdOutbound = await this.prisma.whatsAppMessage.update({
          where: { id: claimRecord.id },
          data: {
            wamId: assignedWamId,
            status: WhatsAppDeliveryStatus.SENT,
            body: ackText,
            rawPayload: sendResult as unknown as Prisma.InputJsonValue,
          },
        });
      } catch (updateErr: unknown) {
        if (
          updateErr &&
          typeof updateErr === 'object' &&
          'code' in updateErr &&
          (updateErr as { code: string }).code === 'P2002'
        ) {
          this.logger.warn(`Delivery status webhook arrived before claim update for ${assignedWamId}, reconciling.`);
          createdOutbound = await this.prisma.whatsAppMessage.update({
            where: { wamId: assignedWamId },
            data: {
              body: ackText,
              contextWamId: inboundMessage.wamId,
              rawPayload: sendResult as unknown as Prisma.InputJsonValue,
            },
          });
          await this.prisma.whatsAppMessage.delete({ where: { id: claimRecord.id } }).catch(() => null);
        } else {
          throw updateErr;
        }
      }

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
    } finally {
      this.inFlightReplies.delete(inboundMessage.wamId);
    }
  }

  private maskPhone(phone: string): string {
    if (phone.length <= 4) return '****';
    return phone.slice(0, 2) + '******' + phone.slice(-2);
  }
}
