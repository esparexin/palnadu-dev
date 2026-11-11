import type { WhatsAppApiErrorResponse } from '@palnadu/types';

export class WhatsAppApiException extends Error {
  constructor(
    message: string,
    public readonly statusCode?: number,
    public readonly metaError?: WhatsAppApiErrorResponse['error'],
    public readonly isAmbiguous?: boolean,
  ) {
    super(message);
    this.name = 'WhatsAppApiException';
  }
}

export interface OutboundClientOptions {
  timeoutMs?: number;
  maxRetries?: number;
  retryDelayMs?: number;
  fetchFn?: typeof fetch;
}

export function sanitizePhoneNumber(phone: string): string {
  return phone.replace(/[^0-9]/g, '');
}

export function maskPhone(phone: string): string {
  if (phone.length <= 4) return '****';
  return phone.slice(0, 2) + '******' + phone.slice(-2);
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function safeJson<T>(response: Response): Promise<T | null> {
  try {
    return (await response.json()) as T;
  } catch {
    return null;
  }
}
