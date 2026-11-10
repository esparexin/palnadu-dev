import { Injectable, Logger, ForbiddenException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'node:crypto';
import { PrismaService } from '../prisma.service';
import { WhatsAppMessageService } from './whatsapp-message.service';
import {
  verifyMetaWebhookSignature,
  verifyTokenConstantTime,
} from './whatsapp-signature.util';
import {
  WHATSAPP_CONFIG_KEYS,
  WHATSAPP_WEBHOOK_MODE,
} from './whatsapp.constants';
import {
  whatsAppWebhookVerifySchema,
  type WhatsAppWebhookVerifyInput,
} from '@palnadu/validation';
import type { WhatsAppWebhookPayload } from '@palnadu/types';

@Injectable()
export class WhatsAppWebhookService {
  private readonly logger = new Logger(WhatsAppWebhookService.name);

  constructor(
    private readonly config: ConfigService,
    private readonly messageService: WhatsAppMessageService,
    private readonly prisma: PrismaService,
  ) {}

  verifyHandshake(rawQuery: Record<string, unknown>): string {
    const parseResult = whatsAppWebhookVerifySchema.safeParse(rawQuery);
    if (!parseResult.success) {
      this.logger.warn('Webhook verification query failed schema validation');
      throw new ForbiddenException('Invalid verification query parameters');
    }

    const {
      'hub.mode': mode,
      'hub.verify_token': token,
      'hub.challenge': challenge,
    }: WhatsAppWebhookVerifyInput = parseResult.data;

    const expectedToken = this.config.get<string>(WHATSAPP_CONFIG_KEYS.VERIFY_TOKEN)?.trim();
    const isTokenValid = verifyTokenConstantTime(token, expectedToken);

    if (mode !== WHATSAPP_WEBHOOK_MODE || !isTokenValid) {
      this.logger.warn('Webhook verification failed: token mismatch or invalid mode');
      throw new ForbiddenException('Invalid verification token or mode');
    }

    this.logger.log('Meta WhatsApp webhook verification handshake succeeded');
    return challenge;
  }

  validateSignature(
    rawBody: Buffer | string | undefined,
    signatureHeader: string | undefined,
  ): boolean {
    const appSecret = this.config.get<string>(WHATSAPP_CONFIG_KEYS.APP_SECRET);
    return verifyMetaWebhookSignature(rawBody, signatureHeader, appSecret);
  }

  async processIncomingPayload(
    payload: WhatsAppWebhookPayload,
    rawBody?: Buffer | string,
  ): Promise<{ processed: boolean; messages: number; statuses: number }> {
    const rawBuffer = Buffer.isBuffer(rawBody)
      ? rawBody
      : typeof rawBody === 'string'
        ? Buffer.from(rawBody, 'utf8')
        : Buffer.from(JSON.stringify(payload));
    const payloadHash = crypto.createHash('sha256').update(rawBuffer).digest('hex');

    // Durably persist webhook receipt before processing to guarantee auditability.
    // If persistence fails, do not acknowledge HTTP 200 so Meta will retry delivery.
    const log = await this.prisma.whatsAppWebhookLog.create({
      data: {
        payloadHash,
        field: 'messages',
        processed: false,
      },
    });
    const webhookLogId = log.id;

    let messageCount = 0;
    let statusCount = 0;

    try {
      if (payload.object === 'whatsapp_business_account' && Array.isArray(payload.entry)) {
        for (const entry of payload.entry) {
          if (!Array.isArray(entry.changes)) continue;

          for (const change of entry.changes) {
            if (change.field !== 'messages' || !change.value) continue;
            const value = change.value;
            const businessNumber =
              value.metadata?.display_phone_number || value.metadata?.phone_number_id || 'unknown';

            // Map contact profile names
            const contactMap = new Map<string, string>();
            if (Array.isArray(value.contacts)) {
              for (const c of value.contacts) {
                if (c.wa_id && c.profile?.name) {
                  contactMap.set(c.wa_id, c.profile.name);
                }
              }
            }

            // 1. Process Messages
            if (Array.isArray(value.messages)) {
              for (const msg of value.messages) {
                if (!msg.id || !msg.from) continue;
                await this.messageService.saveInboundMessage({
                  wamId: msg.id,
                  from: msg.from,
                  to: businessNumber,
                  profileName: contactMap.get(msg.from),
                  type: msg.type || 'text',
                  body: msg.text?.body || msg.image?.caption || msg.document?.caption,
                  mediaId: msg.image?.id || msg.document?.id || msg.audio?.id || msg.video?.id,
                  mimeType: msg.image?.mime_type || msg.document?.mime_type || msg.audio?.mime_type,
                  contextWamId: msg.context?.id,
                  rawPayload: msg as unknown as Record<string, unknown>,
                  timestamp: msg.timestamp,
                });
                messageCount++;
              }
            }

            // 2. Process Statuses
            if (Array.isArray(value.statuses)) {
              for (const st of value.statuses) {
                if (!st.id || !st.status) continue;
                const firstError = st.errors?.[0];
                await this.messageService.updateMessageStatus({
                  wamId: st.id,
                  recipientId: st.recipient_id,
                  status: st.status,
                  timestamp: st.timestamp,
                  errorCode: firstError?.code ? String(firstError.code) : undefined,
                  errorMessage: firstError?.message || firstError?.title,
                });
                statusCount++;
              }
            }
          }
        }
      }

      if (webhookLogId) {
        await this.prisma.whatsAppWebhookLog.update({
          where: { id: webhookLogId },
          data: { processed: true },
        });
      }

      return { processed: true, messages: messageCount, statuses: statusCount };
    } catch (err: unknown) {
      const errMessage = err instanceof Error ? err.message : String(err);
      const errStack = err instanceof Error ? err.stack : undefined;
      this.logger.error(`Error processing webhook payload: ${errMessage}`, errStack);
      if (webhookLogId) {
        await this.prisma.whatsAppWebhookLog.update({
          where: { id: webhookLogId },
          data: { error: errMessage },
        }).catch(() => null);
      }
      throw err;
    }
  }
}
