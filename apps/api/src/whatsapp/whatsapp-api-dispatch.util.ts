import { Logger } from '@nestjs/common';
import type { WhatsAppSendResponse, WhatsAppApiErrorResponse } from '@palnadu/types';
import {
  WhatsAppApiException,
  maskPhone,
  delay,
  safeJson,
} from './whatsapp-api.util';

export interface DispatchExecutionOptions {
  url: string;
  accessToken: string;
  payload: Record<string, unknown>;
  cleanRecipient: string;
  logDescription: string;
  fetchImpl: typeof fetch;
  timeoutMs: number;
  maxRetries: number;
  retryDelayMs: number;
  logger: Logger;
}

export async function executeFetchWithTimeout(
  url: string,
  token: string,
  body: Record<string, unknown>,
  timeoutMs: number,
  fetchImpl: typeof fetch,
): Promise<Response> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetchImpl(url, {
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

export async function executeOutboundDispatchWithRetries(
  options: DispatchExecutionOptions,
): Promise<WhatsAppSendResponse> {
  const {
    url,
    accessToken,
    payload,
    cleanRecipient,
    logDescription,
    fetchImpl,
    timeoutMs,
    maxRetries,
    retryDelayMs,
    logger,
  } = options;

  const maskedTo = maskPhone(cleanRecipient);
  logger.log(`Dispatching outbound WhatsApp ${logDescription} to ${maskedTo}`);

  let lastError: Error | null = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    if (attempt > 0) {
      const backoff = retryDelayMs * Math.pow(2, attempt - 1);
      logger.warn(
        `Retrying WhatsApp dispatch to ${maskedTo} (attempt ${attempt + 1}/${maxRetries + 1}) after ${backoff}ms`,
      );
      await delay(backoff);
    }

    try {
      const response = await executeFetchWithTimeout(
        url,
        accessToken,
        payload,
        timeoutMs,
        fetchImpl,
      );
      if (response.ok) {
        const data = (await response.json()) as WhatsAppSendResponse;
        const assignedId = data.messages?.[0]?.id;
        logger.log(
          `Outbound WhatsApp message dispatched successfully to ${maskedTo} (wamId: ${assignedId})`,
        );
        return data;
      }

      const isAmbiguous =
        response.status === 502 || response.status === 503 || response.status === 504;
      const errorBody = await safeJson<WhatsAppApiErrorResponse>(response);
      const metaError = errorBody?.error;
      const errMessage =
        metaError?.message || `Meta API HTTP ${response.status}: ${response.statusText}`;

      logger.error(`Meta WhatsApp API returned HTTP ${response.status}: ${errMessage}`);
      lastError = new WhatsAppApiException(errMessage, response.status, metaError, isAmbiguous);

      if (isAmbiguous) {
        throw lastError;
      }

      if (response.status >= 400 && response.status < 500 && response.status !== 429) {
        throw lastError;
      }

      if (response.status === 429) {
        const retryAfter = Number.parseInt(response.headers?.get('retry-after') || '', 10);
        if (!Number.isNaN(retryAfter) && retryAfter > 0) {
          await delay(Math.min(retryAfter * 1000, 10000));
        }
      }
    } catch (err: unknown) {
      if (err instanceof WhatsAppApiException) {
        if (err.isAmbiguous || (err.statusCode && err.statusCode < 500 && err.statusCode !== 429)) {
          throw err;
        }
      }
      const isTimeout =
        err instanceof Error && (err.name === 'AbortError' || err.message.includes('aborted'));
      if (isTimeout) {
        throw new WhatsAppApiException(`WhatsApp dispatch timeout to ${maskedTo}`, 504, undefined, true);
      }
      lastError =
        err instanceof WhatsAppApiException
          ? err
          : new WhatsAppApiException(err instanceof Error ? err.message : String(err));
      logger.warn(`WhatsApp dispatch attempt failed: ${lastError.message}`);
    }
  }

  throw lastError || new WhatsAppApiException('WhatsApp dispatch failed after retries');
}
