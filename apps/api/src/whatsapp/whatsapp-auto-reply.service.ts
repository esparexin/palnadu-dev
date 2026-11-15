import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { WhatsAppOptOutService } from './whatsapp-opt-out.service';
import { isOptOutKeywordText } from './whatsapp-opt-out.util';
import { isPrismaP2002 } from './whatsapp-outreach-reservation.util';
import { maskPhone } from './whatsapp-api.util';
import { isBusinessPhoneNumber, isOwnerPhoneNumber } from './whatsapp-choice.util';
import { acquireDispatchLock, releaseDispatchLock } from './whatsapp-dispatch-lock.util';
import { finalizeAutoReplyOutbound } from './whatsapp-auto-reply-persistence.util';
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
  DEFAULT_BUSINESS_PHONE_NUMBER,
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
    const raw = this.config.get<string>(WHATSAPP_CONFIG_KEYS.AUTO_REPLY_ENABLED);
    const val = raw ? raw.trim().toLowerCase() : '';
    return val !== 'false' && val !== '0' && val !== 'off' && this.apiClient.isConfigured();
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
    if (!this.isEnabled() || inboundMessage.direction !== WhatsAppMessageDirection.INBOUND) {
      return null;
    }

    const recipientPhone = inboundMessage.from;
    const maskedPhone = maskPhone(recipientPhone);

    const businessPhone =
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.BUSINESS_PHONE) || DEFAULT_BUSINESS_PHONE_NUMBER;
    if (isBusinessPhoneNumber(recipientPhone, [businessPhone, inboundMessage.to])) {
      this.logger.log(`Auto-reply skipped for ${maskedPhone}: business self-message.`);
      return null;
    }

    const ownerPhone = this.config.get<string>(WHATSAPP_CONFIG_KEYS.OWNER_PHONE);
    if (isOwnerPhoneNumber(recipientPhone, ownerPhone)) {
      this.logger.log(`Auto-reply skipped for ${maskedPhone}: authorized internal owner number.`);
      return null;
    }

    if (isOptOutKeywordText(inboundMessage.body)) {
      this.logger.log(`Auto-reply skipped for ${maskedPhone}: inbound opt-out keyword.`);
      return null;
    }

    if (this.optOutService && (await this.optOutService.isSuppressed(recipientPhone))) {
      this.logger.log(`Auto-reply skipped for ${maskedPhone}: recipient is opted out.`);
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

    try {
      // 1. Verify message is within WhatsApp's 24-hour customer service window
      const messageTime = inboundMessage.statusTimestamp || inboundMessage.createdAt;
      if (Date.now() - new Date(messageTime).getTime() > 24 * 3600000) {
        this.logger.warn(`Auto-reply skipped for ${maskedPhone}: outside 24-hour window.`);
        return null;
      }

      // 2. Prevent duplicate replies to the exact same message
      const existingReply = await this.prisma.whatsAppMessage.findFirst({
        where: { contextWamId: inboundMessage.wamId, direction: WhatsAppMessageDirection.OUTBOUND, status: { not: WhatsAppDeliveryStatus.FAILED } },
      });

      if (existingReply) {
        this.logger.log(`Auto-reply skipped for ${maskedPhone}: reply already dispatched.`);
        return null;
      }

      // 3. Prevent reply loops: Check cooldown window (configurable, default 24h)
      const cooldownHours = this.getCooldownHours();
      if (cooldownHours > 0) {
        const recentOutbound = await this.prisma.whatsAppMessage.findFirst({
          where: {
            to: recipientPhone,
            direction: WhatsAppMessageDirection.OUTBOUND,
            campaignId: null,
            status: { not: WhatsAppDeliveryStatus.FAILED },
            createdAt: { gte: new Date(Date.now() - cooldownHours * 3600000) },
          },
        });

        if (recentOutbound) {
          this.logger.log(`Auto-reply skipped for ${maskedPhone}: sent within cooldown.`);
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
        if (isPrismaP2002(claimErr)) {
          this.logger.warn(`Multi-instance concurrent auto-reply claim intercepted for ${inboundMessage.wamId}`);
          return null;
        }
        throw claimErr;
      }

      // 5. Acquire exclusive distributed dispatch lease
      const workerId = `autoreply_${inboundMessage.wamId}_${Date.now()}`;
      const lease = await acquireDispatchLock(this.prisma, recipientPhone, workerId);
      if (!lease.acquired) {
        this.logger.warn(`Auto-reply skipped for ${maskedPhone}: dispatch lease unavailable (${lease.reason}).`);
        await this.prisma.whatsAppMessage?.delete?.({ where: { id: claimRecord.id } }).catch(() => null);
        return null;
      }

      try {
        // Re-verify human takeover under lease protection
        const freshConv = await this.prisma.whatsAppConversation?.findUnique({
          where: { customerPhone: recipientPhone },
          select: { humanTakeover: true, mode: true },
        });
        if (freshConv?.humanTakeover || freshConv?.mode === 'HUMAN_TAKEOVER') {
          this.logger.warn(`Auto-reply aborted for ${maskedPhone}: takeover activated before dispatch.`);
          await this.prisma.whatsAppMessage?.delete?.({ where: { id: claimRecord.id } }).catch(() => null);
          return null;
        }

        // 6. Dispatch outbound acknowledgment to Meta API
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

        const createdOutbound = await finalizeAutoReplyOutbound(
          this.prisma,
          this.logger,
          claimRecord.id,
          assignedWamId,
          inboundMessage.wamId,
          ackText,
          sendResult,
        );

        this.logger.log(`Automated acknowledgment persisted for ${maskedPhone} (outbound: ${assignedWamId})`);
        return createdOutbound;
      } finally {
        await releaseDispatchLock(this.prisma, recipientPhone, workerId);
      }
    } catch (sendErr: unknown) {
      const errMessage = sendErr instanceof Error ? sendErr.message : String(sendErr);
      this.logger.error(`Failed to send automated WhatsApp acknowledgment to ${maskedPhone}: ${errMessage}`);
      return null;
    } finally {
      this.inFlightReplies.delete(inboundMessage.wamId);
    }
  }
}
