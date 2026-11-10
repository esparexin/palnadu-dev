import * as crypto from 'node:crypto';

/**
 * Validates Meta webhook payload signature against Meta App Secret using HMAC-SHA256.
 * Uses constant-time comparison to protect against timing attacks.
 */
export function verifyMetaWebhookSignature(
  rawBody: Buffer | string | undefined,
  signatureHeader: string | undefined,
  appSecret: string | undefined,
): boolean {
  if (!appSecret || !signatureHeader || rawBody === undefined || rawBody === null) {
    return false;
  }

  // Meta signature format: "sha256=<hex_digest>"
  if (!signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const providedHex = signatureHeader.slice('sha256='.length).trim();
  if (!providedHex || !/^[0-9a-fA-F]+$/.test(providedHex)) {
    return false;
  }

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  const expectedHex = crypto.createHmac('sha256', appSecret).update(bodyBuffer).digest('hex');

  const providedBuf = Buffer.from(providedHex.toLowerCase(), 'utf8');
  const expectedBuf = Buffer.from(expectedHex.toLowerCase(), 'utf8');

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Validates verification token against configured secret using constant-time comparison.
 */
export function verifyTokenConstantTime(
  providedToken: string | undefined,
  expectedToken: string | undefined,
): boolean {
  if (!providedToken || !expectedToken) {
    return false;
  }

  const providedBuf = Buffer.from(providedToken, 'utf8');
  const expectedBuf = Buffer.from(expectedToken, 'utf8');

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

