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

function stripIndiaOrTrunkPrefix(digits: string): string {
  if (digits.length === 11 && digits.startsWith('0')) {
    return digits.slice(1);
  }
  return digits;
}

export function arePhoneNumbersEquivalent(phoneA: string, phoneB: string): boolean {
  const digitsA = sanitizePhoneNumber(phoneA);
  const digitsB = sanitizePhoneNumber(phoneB);
  if (!digitsA || !digitsB || digitsA.length < 8 || digitsB.length < 8) {
    return false;
  }
  if (digitsA === digitsB) {
    return true;
  }

  const localA = stripIndiaOrTrunkPrefix(digitsA);
  const localB = stripIndiaOrTrunkPrefix(digitsB);
  if (localA === localB) {
    return true;
  }
  if (localA.length === 10 && localB === `91${localA}`) {
    return true;
  }
  if (localB.length === 10 && localA === `91${localB}`) {
    return true;
  }
  return false;
}

export function buildPhoneVariants(phone: string): string[] {
  const trimmed = phone.trim();
  const digits = sanitizePhoneNumber(phone);
  const variants = new Set<string>();
  if (trimmed) variants.add(trimmed);
  if (digits) {
    variants.add(digits);
    variants.add(`+${digits}`);
    const local = stripIndiaOrTrunkPrefix(digits);
    if (local.length === 10) {
      variants.add(local);
      variants.add(`0${local}`);
      variants.add(`91${local}`);
      variants.add(`+91${local}`);
    } else if (digits.length === 12 && digits.startsWith('91')) {
      const subscriber = digits.slice(2);
      variants.add(subscriber);
      variants.add(`0${subscriber}`);
    }
  }
  return Array.from(variants);
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
