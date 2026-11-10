import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Headers,
  HttpCode,
  HttpStatus,
  Header,
  UnauthorizedException,
  Logger,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request } from 'express';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';
import { META_SIGNATURE_HEADER } from './whatsapp.constants';
import type { WhatsAppWebhookPayload } from '@palnadu/types';

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly webhookService: WhatsAppWebhookService) {}

  /**
   * Meta Webhook Verification Handshake.
   * Responds to Meta's GET challenge when configuring webhook subscriptions.
   */
  @Get()
  @Header('Content-Type', 'text/plain')
  @HttpCode(HttpStatus.OK)
  verifyWebhook(@Query() query: Record<string, unknown>): string {
    return this.webhookService.verifyHandshake(query);
  }

  /**
   * Meta Incoming Webhook Receiver.
   * Handles incoming WhatsApp messages and status events.
   * Cryptographically validates the X-Hub-Signature-256 header before processing.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers(META_SIGNATURE_HEADER) signature?: string,
  ): Promise<{ status: string }> {
    // Retrieve raw body buffer for authentic HMAC validation
    const rawBody =
      req.rawBody ||
      (req.body
        ? Buffer.isBuffer(req.body)
          ? req.body
          : Buffer.from(typeof req.body === 'string' ? req.body : JSON.stringify(req.body))
        : undefined);

    const isSignatureValid = this.webhookService.validateSignature(rawBody, signature);
    if (!isSignatureValid) {
      this.logger.warn('Rejected incoming WhatsApp webhook: invalid or missing X-Hub-Signature-256');
      throw new UnauthorizedException('Invalid or missing webhook signature');
    }

    const payload: WhatsAppWebhookPayload = req.body;
    await this.webhookService.processIncomingPayload(payload, rawBody);

    return { status: 'success' };
  }
}

