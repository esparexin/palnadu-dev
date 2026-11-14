import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma.service';
import { WhatsAppApiClient } from './whatsapp-api.client';
import { WhatsAppConversationService } from './whatsapp-conversation.service';
import { sanitizePhoneNumber, maskPhone } from './whatsapp-api.util';
import { isOptOutKeywordText } from './whatsapp-opt-out.util';
import { isPrismaP2002 } from './whatsapp-outreach-reservation.util';
import { acquireDispatchLock, releaseDispatchLock } from './whatsapp-dispatch-lock.util';
import { WHATSAPP_CONFIG_KEYS } from './whatsapp.constants';
import {
  Prisma,
  WhatsAppDeliveryStatus,
  WhatsAppMessageDirection,
  type WhatsAppMessage,
} from '@prisma/client';

@Injectable()
export class WhatsAppAssistantService {
  private readonly logger = new Logger(WhatsAppAssistantService.name);
  private readonly phoneLocks = new Map<string, Promise<void>>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly apiClient: WhatsAppApiClient,
    private readonly conversationService: WhatsAppConversationService,
  ) {}

  isEnabled(): boolean {
    const val = this.config.get<string>(WHATSAPP_CONFIG_KEYS.ASSISTANT_ENABLED);
    if (val !== 'true') return false;
    return this.apiClient.isConfigured();
  }

  async handleInboundMessage(inboundMessage: WhatsAppMessage): Promise<WhatsAppMessage | null> {
    if (!this.isEnabled()) return null;
    const phone = sanitizePhoneNumber(inboundMessage.from);
    if (!phone) return null;

    // Per-phone sequential locking prevents concurrent inbound webhooks from racing
    const currentLock = this.phoneLocks.get(phone) || Promise.resolve();
    let lockPromise: Promise<void>;
    const task = currentLock
      .then(() => this.processMessageInternal(phone, inboundMessage))
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        this.logger.error(`Assistant error for ${maskPhone(phone)}: ${msg}`);
        return null;
      });

    lockPromise = task
      .then(() => {})
      .finally(() => {
        if (this.phoneLocks.get(phone) === lockPromise) {
          this.phoneLocks.delete(phone);
        }
      });
    this.phoneLocks.set(phone, lockPromise);

    return task;
  }

  private async processMessageInternal(
    phone: string,
    inboundMessage: WhatsAppMessage,
  ): Promise<WhatsAppMessage | null> {
    const masked = maskPhone(phone);

    // 1. Deduplication guard against Meta webhook retries
    const existingReply = await this.prisma.whatsAppMessage.findFirst({
      where: {
        contextWamId: inboundMessage.wamId,
        direction: WhatsAppMessageDirection.OUTBOUND,
        status: { not: WhatsAppDeliveryStatus.FAILED },
      },
    });
    if (existingReply) return null;

    // 2. Opt-out keyword guard
    if (isOptOutKeywordText(inboundMessage.body)) {
      this.logger.log(`Bot reply skipped for ${masked}: inbound opt-out keyword.`);
      return null;
    }

    // 3. 24-hour customer service window verification
    const messageTime = inboundMessage.statusTimestamp || inboundMessage.createdAt;
    const windowAgeMs = Date.now() - new Date(messageTime).getTime();
    if (windowAgeMs > 24 * 60 * 60 * 1000) {
      this.logger.warn(`Bot reply skipped for ${masked}: outside 24-hour window.`);
      return null;
    }

    // 4. Load or initialize conversation
    let conv = await this.prisma.whatsAppConversation.findUnique({
      where: { customerPhone: phone },
    });

    if (!conv) {
      conv = await this.prisma.whatsAppConversation.create({
        data: {
          customerPhone: phone,
          customerName: inboundMessage.profileName,
          lastInboundWamId: inboundMessage.wamId,
          lastInboundAt: new Date(),
        },
      });
    } else {
      conv = await this.prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: {
          customerName: inboundMessage.profileName || conv.customerName,
          lastInboundWamId: inboundMessage.wamId,
          lastInboundAt: new Date(),
        },
      });
    }

    // 5. Concurrency-safe human takeover verification
    if (conv.humanTakeover) {
      this.logger.log(`Bot reply suppressed for ${masked}: human takeover is active.`);
      return null;
    }

    // 6. Multi-instance atomic claim guard
    const claimWamId = `bot_claim:${inboundMessage.wamId}`;
    let claimRecord: WhatsAppMessage;
    try {
      claimRecord = await this.prisma.whatsAppMessage.create({
        data: {
          wamId: claimWamId,
          direction: WhatsAppMessageDirection.OUTBOUND,
          from: inboundMessage.to || 'palnadu_business',
          to: phone,
          type: 'text',
          contextWamId: inboundMessage.wamId,
          status: WhatsAppDeliveryStatus.RECEIVED,
        },
      });
    } catch (claimErr: unknown) {
      if (isPrismaP2002(claimErr)) return null;
      throw claimErr;
    }

    // 7. Acquire exclusive distributed dispatch lease
    const workerId = `bot_${inboundMessage.wamId}_${Date.now()}`;
    const lease = await acquireDispatchLock(this.prisma, phone, workerId);
    if (!lease.acquired) {
      this.logger.warn(`Bot reply skipped for ${masked}: dispatch lease unavailable (${lease.reason}).`);
      await this.prisma.whatsAppMessage?.delete?.({ where: { id: claimRecord.id } }).catch(() => null);
      return null;
    }

    try {
      // 8. Process state machine transition
      let step;
      try {
        step = await this.conversationService.processCustomerMessage(inboundMessage, conv);
      } catch (stepErr: unknown) {
        await this.prisma.whatsAppMessage?.delete?.({ where: { id: claimRecord.id } }).catch(() => null);
        throw stepErr;
      }

      // 9. Pre-dispatch atomic re-verification under lease protection
      const freshConv = await this.prisma.whatsAppConversation.findUnique({
        where: { id: conv.id },
        select: { humanTakeover: true },
      });
      if (freshConv?.humanTakeover) {
        this.logger.warn(`Bot reply aborted for ${masked}: takeover activated before dispatch.`);
        await this.prisma.whatsAppMessage?.delete?.({ where: { id: claimRecord.id } }).catch(() => null);
        return null;
      }

      // 10. Dispatch outbound WhatsApp message to Meta Cloud API
      let sendResult;
      try {
        sendResult = await this.apiClient.sendTextMessage({
          to: phone,
          text: step.responseText,
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

      const assignedWamId = sendResult.messages?.[0]?.id || `wamid.bot.${Date.now()}`;

      // 11. Update claim record and conversation state
      const createdOutbound = await this.prisma.whatsAppMessage.update({
        where: { id: claimRecord.id },
        data: {
          wamId: assignedWamId,
          status: WhatsAppDeliveryStatus.SENT,
          body: step.responseText,
          rawPayload: sendResult as unknown as Prisma.InputJsonValue,
        },
      });

      await this.prisma.whatsAppConversation.update({
        where: { id: conv.id },
        data: {
          state: step.nextState,
          selectedCategory: step.selectedCategory !== undefined ? step.selectedCategory : conv.selectedCategory,
          selectedSubmenu: step.selectedSubmenu !== undefined ? step.selectedSubmenu : conv.selectedSubmenu,
          enquiryDraft: step.enquiryDraft !== undefined ? step.enquiryDraft : conv.enquiryDraft,
          lastOutboundAt: new Date(),
        },
      });

      return createdOutbound;
    } finally {
      await releaseDispatchLock(this.prisma, phone, workerId);
    }
  }
}
