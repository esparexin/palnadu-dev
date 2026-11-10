import * as crypto from 'node:crypto';

/**
 * Validates Meta webhook payload signature against Meta App Secret using HMAC-SHA256.
 * Compares exact 32-byte binary HMAC digests in constant time to prevent timing attacks.
 */
export function verifyMetaWebhookSignature(
  rawBody: Buffer | string | undefined,
  signatureHeader: string | undefined,
  appSecret: string | undefined,
): boolean {
  if (
    typeof appSecret !== 'string' ||
    typeof signatureHeader !== 'string' ||
    rawBody === undefined ||
    rawBody === null
  ) {
    return false;
  }

  const cleanSecret = appSecret.trim();
  if (!cleanSecret) {
    return false;
  }

  // Meta signature format: "sha256=<64_hex_digits>"
  if (!signatureHeader.startsWith('sha256=')) {
    return false;
  }

  const providedHex = signatureHeader.slice('sha256='.length).trim();
  if (providedHex.length !== 64 || !/^[0-9a-fA-F]{64}$/.test(providedHex)) {
    return false;
  }

  const bodyBuffer = Buffer.isBuffer(rawBody) ? rawBody : Buffer.from(rawBody, 'utf8');
  if (bodyBuffer.length === 0) {
    return false;
  }

  const expectedHex = crypto.createHmac('sha256', cleanSecret).update(bodyBuffer).digest('hex');

  const providedBuf = Buffer.from(providedHex.toLowerCase(), 'hex');
  const expectedBuf = Buffer.from(expectedHex.toLowerCase(), 'hex');

  if (providedBuf.length !== expectedBuf.length) {
    return false;
  }

  return crypto.timingSafeEqual(providedBuf, expectedBuf);
}

/**
 * Validates verification token against configured secret using constant-time comparison.
 * Hashes both tokens with a fixed-length HMAC digest to ensure constant length and eliminate timing leakage.
 */
export function verifyTokenConstantTime(
  providedToken: string | undefined,
  expectedToken: string | undefined,
): boolean {
  if (
    typeof providedToken !== 'string' ||
    typeof expectedToken !== 'string' ||
    !providedToken ||
    !expectedToken.trim()
  ) {
    return false;
  }

  const cleanExpected = expectedToken.trim();
  const hmacKey = 'palnadu-verify-token-comparison';
  const providedHash = crypto.createHmac('sha256', hmacKey).update(providedToken).digest();
  const expectedHash = crypto.createHmac('sha256', hmacKey).update(cleanExpected).digest();

  return crypto.timingSafeEqual(providedHash, expectedHash);
}


