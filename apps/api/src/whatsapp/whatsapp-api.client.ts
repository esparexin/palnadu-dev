import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type {
  WhatsAppSendTextMessageParams,
  WhatsAppSendTemplateParams,
  WhatsAppSendResponse,
  WhatsAppApiErrorResponse,
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
  maskPhone,
  delay,
  safeJson,
} from './whatsapp-api.util';

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
    options?: OutboundClientOptions,
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
    const maskedTo = maskPhone(cleanRecipient);
    this.logger.log(`Dispatching outbound WhatsApp ${logDescription} to ${maskedTo}`);

    let lastError: Error | null = null;
    for (let attempt = 0; attempt <= this.maxRetries; attempt++) {
      if (attempt > 0) {
        const backoff = this.retryDelayMs * Math.pow(2, attempt - 1);
        this.logger.warn(`Retrying WhatsApp dispatch to ${maskedTo} (attempt ${attempt + 1}/${this.maxRetries + 1}) after ${backoff}ms`);
        await delay(backoff);
      }

      try {
        const response = await this.executeFetch(url, accessToken, payload);
        if (response.ok) {
          const data = (await response.json()) as WhatsAppSendResponse;
          const assignedId = data.messages?.[0]?.id;
          this.logger.log(`Outbound WhatsApp message dispatched successfully to ${maskedTo} (wamId: ${assignedId})`);
          return data;
        }

        const isRetryable = response.status >= 500 || response.status === 429;
        const errorBody = await safeJson<WhatsAppApiErrorResponse>(response);
        const metaError = errorBody?.error;
        const errMessage = metaError?.message || `Meta API HTTP ${response.status}: ${response.statusText}`;

        this.logger.error(
          `Meta WhatsApp API returned HTTP ${response.status}: ${errMessage} (code: ${metaError?.code}, subcode: ${metaError?.error_subcode}, trace: ${metaError?.fbtrace_id})`,
        );

        lastError = new WhatsAppApiException(errMessage, response.status, metaError);
        if (!isRetryable) {
          throw lastError;
        }
      } catch (err: unknown) {
        if (err instanceof WhatsAppApiException && err.statusCode && err.statusCode < 500 && err.statusCode !== 429) {
          throw err;
        }
        lastError = err instanceof Error ? err : new Error(String(err));
        this.logger.warn(`WhatsApp dispatch attempt failed: ${lastError.message}`);
      }
    }

    throw lastError || new WhatsAppApiException('WhatsApp dispatch failed after retries');
  }

  private async executeFetch(
    url: string,
    token: string,
    body: Record<string, unknown>,
  ): Promise<Response> {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    try {
      return await this.fetchImpl(url, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
    } finally {
      clearTimeout(timer);
    }
  }
}
