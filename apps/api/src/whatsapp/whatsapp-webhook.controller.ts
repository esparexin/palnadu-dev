import {
  Controller,
  Get,
  Post,
  Query,
  Req,
  Res,
  Headers,
  HttpCode,
  HttpStatus,
  UnauthorizedException,
  Logger,
  type RawBodyRequest,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { WhatsAppWebhookService } from './whatsapp-webhook.service';
import { META_SIGNATURE_HEADER } from './whatsapp.constants';
import { whatsAppWebhookPayloadSchema } from '@palnadu/validation';
import type { WhatsAppWebhookPayload } from '@palnadu/types';

@Controller('webhooks/whatsapp')
export class WhatsAppWebhookController {
  private readonly logger = new Logger(WhatsAppWebhookController.name);

  constructor(private readonly webhookService: WhatsAppWebhookService) {}

  /**
   * Meta Webhook Verification Handshake.
   * Responds to Meta's GET challenge when configuring webhook subscriptions.
   * Dynamically sets Content-Type to text/plain only on verified handshake to prevent
   * ExpressAdapter warnings when handling rejected verification exceptions.
   */
  @Get()
  @HttpCode(HttpStatus.OK)
  verifyWebhook(
    @Query() query: Record<string, unknown>,
    @Res({ passthrough: true }) res?: Response,
  ): string {
    const challenge = this.webhookService.verifyHandshake(query);
    res?.setHeader('Content-Type', 'text/plain');
    return challenge;
  }

  /**
   * Meta Incoming Webhook Receiver.
   * Handles incoming WhatsApp messages and status events.
   * Cryptographically validates the X-Hub-Signature-256 header against the authentic raw buffer.
   * Never re-serializes parsed JSON. Rejects missing, malformed, or unverified signatures.
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleIncomingWebhook(
    @Req() req: RawBodyRequest<Request>,
    @Headers(META_SIGNATURE_HEADER) signature?: string,
  ): Promise<{ status: string }> {
    // Preserve and strictly utilize the raw request body Buffer captured by body-parser.
    // Never fall back to re-serialized JSON, which causes cryptographic desynchronization.
    const rawBody = req.rawBody;

    if (!rawBody || !Buffer.isBuffer(rawBody) || rawBody.length === 0) {
      this.logger.warn('Rejected incoming WhatsApp webhook: missing or empty raw body buffer');
      throw new UnauthorizedException('Missing raw request body for signature verification');
    }

    const isSignatureValid = this.webhookService.validateSignature(rawBody, signature);
    if (!isSignatureValid) {
      this.logger.warn('Rejected incoming WhatsApp webhook: invalid or missing X-Hub-Signature-256');
      throw new UnauthorizedException('Invalid or missing webhook signature');
    }

    const parseResult = whatsAppWebhookPayloadSchema.safeParse(req.body);
    if (!parseResult.success) {
      this.logger.warn(`WhatsApp webhook payload validation warning: ${parseResult.error.message}`);
    }

    const payload: WhatsAppWebhookPayload = req.body;
    await this.webhookService.processIncomingPayload(payload, rawBody);

    return { status: 'success' };
  }
}


