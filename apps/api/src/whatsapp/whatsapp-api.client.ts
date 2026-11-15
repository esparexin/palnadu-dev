import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  WhatsAppSendTextMessageParams,
  WhatsAppSendTemplateParams,
  WhatsAppSendInteractiveParams,
  WhatsAppSendResponse,
  WhatsAppMetaTemplate,
} from '@palnadu/types';
import {
  WHATSAPP_CONFIG_KEYS,
  DEFAULT_GRAPH_API_VERSION,
  META_GRAPH_API_BASE_URL,
  DEFAULT_OUTBOUND_TIMEOUT_MS,
  DEFAULT_MAX_RETRIES,
  DEFAULT_RETRY_DELAY_MS,
} from './whatsapp.constants';
import {
  WhatsAppApiException,
  type OutboundClientOptions,
  sanitizePhoneNumber,
} from './whatsapp-api.util';
import { fetchMetaApprovedTemplates } from './whatsapp-template.util';
import { executeOutboundDispatchWithRetries } from './whatsapp-api-dispatch.util';

export { WhatsAppApiException, type OutboundClientOptions };

@Injectable()
export class WhatsAppApiClient {
  private readonly logger = new Logger(WhatsAppApiClient.name);
  private readonly timeoutMs: number;
  private readonly maxRetries: number;
  private readonly retryDelayMs: number;
  private readonly fetchImpl: typeof fetch;

  constructor(
    private readonly config: ConfigService,
    @Optional() options?: OutboundClientOptions,
  ) {
    this.timeoutMs = options?.timeoutMs ?? DEFAULT_OUTBOUND_TIMEOUT_MS;
    this.maxRetries = options?.maxRetries ?? DEFAULT_MAX_RETRIES;
    this.retryDelayMs = options?.retryDelayMs ?? DEFAULT_RETRY_DELAY_MS;
    this.fetchImpl = options?.fetchFn ?? globalThis.fetch;
  }

  isConfigured(): boolean {
    const token = (
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.ACCESS_TOKEN) ||
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.ACCESS_TOKEN_FALLBACK)
    )?.trim();
    const phoneId = this.getPhoneNumberId();
    return Boolean(token && phoneId);
  }

  getPhoneNumberId(): string | undefined {
    const raw = this.config.get<string>(WHATSAPP_CONFIG_KEYS.PHONE_NUMBER_ID)?.trim();
    if (!raw) return undefined;
    const clean = raw.replace(/[^0-9]/g, '');
    return clean || undefined;
  }

  getApiVersion(): string {
    return (
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.GRAPH_API_VERSION)?.trim() ||
      DEFAULT_GRAPH_API_VERSION
    );
  }

  async fetchApprovedTemplates(): Promise<WhatsAppMetaTemplate[]> {
    return fetchMetaApprovedTemplates(this.config, this.fetchImpl);
  }

  async sendTextMessage(
    params: WhatsAppSendTextMessageParams,
  ): Promise<WhatsAppSendResponse> {
    const cleanRecipient = sanitizePhoneNumber(params.to);
    if (!cleanRecipient) {
      throw new WhatsAppApiException('Invalid recipient phone number');
    }

    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanRecipient,
      type: 'text',
      text: {
        preview_url: Boolean(params.previewUrl),
        body: params.text,
      },
    };

    if (params.replyToWamId) {
      payload.context = { message_id: params.replyToWamId };
    }

    return this.dispatchMessage(cleanRecipient, payload, `text message (length: ${params.text.length})`);
  }

  async sendInteractiveMessage(
    params: WhatsAppSendInteractiveParams,
  ): Promise<WhatsAppSendResponse> {
    const cleanRecipient = sanitizePhoneNumber(params.to);
    if (!cleanRecipient) {
      throw new WhatsAppApiException('Invalid recipient phone number');
    }

    if (!params.interactive?.type) {
      throw new WhatsAppApiException('Interactive payload is required');
    }

    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanRecipient,
      type: 'interactive',
      interactive: params.interactive,
    };

    if (params.replyToWamId) {
      payload.context = { message_id: params.replyToWamId };
    }

    return this.dispatchMessage(
      cleanRecipient,
      payload,
      `interactive ${params.interactive.type} message`,
    );
  }

  async sendTemplateMessage(
    params: WhatsAppSendTemplateParams,
  ): Promise<WhatsAppSendResponse> {
    const cleanRecipient = sanitizePhoneNumber(params.to);
    if (!cleanRecipient) {
      throw new WhatsAppApiException('Invalid recipient phone number');
    }

    if (!params.templateName?.trim()) {
      throw new WhatsAppApiException('Template name is required');
    }

    if (!params.languageCode?.trim()) {
      throw new WhatsAppApiException('Template language code is required');
    }

    const templateObj: Record<string, unknown> = {
      name: params.templateName.trim(),
      language: { code: params.languageCode.trim() },
    };

    if (params.components && params.components.length > 0) {
      templateObj.components = params.components;
    }

    const payload: Record<string, unknown> = {
      messaging_product: 'whatsapp',
      recipient_type: 'individual',
      to: cleanRecipient,
      type: 'template',
      template: templateObj,
    };

    return this.dispatchMessage(
      cleanRecipient,
      payload,
      `template "${params.templateName}" (${params.languageCode})`,
    );
  }

  private async dispatchMessage(
    cleanRecipient: string,
    payload: Record<string, unknown>,
    logDescription: string,
  ): Promise<WhatsAppSendResponse> {
    const accessToken = (
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.ACCESS_TOKEN) ||
      this.config.get<string>(WHATSAPP_CONFIG_KEYS.ACCESS_TOKEN_FALLBACK)
    )?.trim();
    const phoneNumberId = this.getPhoneNumberId();
    const version = this.getApiVersion();

    if (!accessToken || !phoneNumberId) {
      this.logger.error('WhatsApp API credentials missing (WHATSAPP_ACCESS_TOKEN or WHATSAPP_PHONE_NUMBER_ID)');
      throw new WhatsAppApiException('WhatsApp API credentials are not configured');
    }

    const url = `${META_GRAPH_API_BASE_URL}/${version}/${phoneNumberId}/messages`;

    return executeOutboundDispatchWithRetries({
      url,
      accessToken,
      payload,
      cleanRecipient,
      logDescription,
      fetchImpl: this.fetchImpl,
      timeoutMs: this.timeoutMs,
      maxRetries: this.maxRetries,
      retryDelayMs: this.retryDelayMs,
      logger: this.logger,
    });
  }
}
