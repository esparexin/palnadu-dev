import * as crypto from 'crypto';

export interface EncryptedPayload {
  ciphertext: string;
  iv: string;
  authTag: string;
}

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12;
const DEFAULT_FALLBACK_SALT = 'palnadu-dev-gemini-secret-storage-salt-v1';
export const ENCRYPTION_KEY_HEX_REGEX = /^[0-9a-fA-F]{64}$/;
const MIN_PASSPHRASE_LENGTH = 32;

/**
 * Validates encryption configuration on application startup.
 * Production STRICTLY requires ENCRYPTION_KEY (min 32 chars or 64 hex chars).
 * JWT_SECRET is strictly forbidden as a production fallback.
 */
export function validateEncryptionConfig(): {
  keySource: 'ENCRYPTION_KEY' | 'DEV_JWT_FALLBACK' | 'DEV_FALLBACK_SALT';
  isDedicatedKey: boolean;
  isHex64: boolean;
} {
  const isProd = process.env.NODE_ENV === 'production';
  const encKey = process.env.ENCRYPTION_KEY?.trim();

  if (isProd) {
    if (!encKey || encKey.length === 0) {
      throw new Error(
        'Production startup aborted: ENCRYPTION_KEY is required. ' +
          'JWT_SECRET fallback is strictly disallowed in production.',
      );
    }
    if (!ENCRYPTION_KEY_HEX_REGEX.test(encKey)) {
      throw new Error(
        `Production startup aborted: ENCRYPTION_KEY must be exactly 64 hexadecimal characters (256-bit key). Received ${encKey.length} characters with invalid format.`,
      );
    }
    return {
      keySource: 'ENCRYPTION_KEY',
      isDedicatedKey: true,
      isHex64: true,
    };
  }

  // Isolated development/test fallback only
  if (encKey && encKey.length >= MIN_PASSPHRASE_LENGTH) {
    return {
      keySource: 'ENCRYPTION_KEY',
      isDedicatedKey: true,
      isHex64: ENCRYPTION_KEY_HEX_REGEX.test(encKey),
    };
  }
  const jwtKey = process.env.JWT_SECRET?.trim();
  if (jwtKey && jwtKey.length > 0) {
    return { keySource: 'DEV_JWT_FALLBACK', isDedicatedKey: false, isHex64: false };
  }
  return { keySource: 'DEV_FALLBACK_SALT', isDedicatedKey: false, isHex64: false };
}

/**
 * Converts a 64-hex string to 32 bytes directly, or hashes a passphrase via SHA-256.
 */
export function deriveKeyFromRaw(raw: string): Buffer {
  const trimmed = raw.trim();
  if (ENCRYPTION_KEY_HEX_REGEX.test(trimmed)) {
    return Buffer.from(trimmed, 'hex');
  }
  return crypto.createHash('sha256').update(trimmed, 'utf8').digest();
}

/**
 * Derives a 32-byte key for AES-256-GCM.
 * Production: strictly uses ENCRYPTION_KEY (rejects missing, empty, or short keys).
 * Dev/test: allows customKey, ENCRYPTION_KEY, or isolated dev fallbacks.
 */
export function deriveEncryptionKey(customKey?: string): Buffer {
  const custom = customKey?.trim();
  if (custom) {
    return deriveKeyFromRaw(custom);
  }

  const isProd = process.env.NODE_ENV === 'production';
  const encKey = process.env.ENCRYPTION_KEY?.trim();

  if (isProd) {
    if (!encKey || encKey.length === 0) {
      throw new Error(
        'Production requires dedicated ENCRYPTION_KEY: ENCRYPTION_KEY is required. JWT_SECRET fallback is strictly disallowed in production.',
      );
    }
    if (!ENCRYPTION_KEY_HEX_REGEX.test(encKey)) {
      throw new Error(
        `Invalid ENCRYPTION_KEY in production: must be exactly 64 hexadecimal characters (256-bit key). Received ${encKey.length} characters with invalid format.`,
      );
    }
    return Buffer.from(encKey, 'hex');
  }

  if (encKey) {
    return deriveKeyFromRaw(encKey);
  }
  const devKey = process.env.JWT_SECRET?.trim() || DEFAULT_FALLBACK_SALT;
  return crypto.createHash('sha256').update(devKey, 'utf8').digest();
}

/**
 * Encrypts a plaintext secret using AES-256-GCM authenticated encryption.
 */
export function encryptSecret(
  plaintext: string,
  secretKey?: string,
): EncryptedPayload {
  if (!plaintext || typeof plaintext !== 'string') {
    throw new Error('Plaintext secret must be a non-empty string');
  }

  const key = deriveEncryptionKey(secretKey);
  const iv = crypto.randomBytes(IV_LENGTH_BYTES);
  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);

  let ciphertext = cipher.update(plaintext, 'utf8', 'hex');
  ciphertext += cipher.final('hex');
  const authTag = cipher.getAuthTag().toString('hex');

  return {
    ciphertext,
    iv: iv.toString('hex'),
    authTag,
  };
}

/**
 * Decrypts and authenticates a secret payload using AES-256-GCM.
 * Preserves compatibility across 64-hex direct and sha256 representations.
 */
export function decryptSecret(
  payload: EncryptedPayload,
  secretKey?: string,
): string {
  if (!payload || !payload.ciphertext || !payload.iv || !payload.authTag) {
    throw new Error('Invalid encrypted payload: ciphertext, iv, and authTag are required');
  }

  const iv = Buffer.from(payload.iv, 'hex');
  const authTag = Buffer.from(payload.authTag, 'hex');
  const primaryKey = deriveEncryptionKey(secretKey);

  try {
    const decipher = crypto.createDecipheriv(ALGORITHM, primaryKey, iv);
    decipher.setAuthTag(authTag);
    let decrypted = decipher.update(payload.ciphertext, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
  } catch (primaryErr) {
    const raw = secretKey?.trim() || process.env.ENCRYPTION_KEY?.trim();
    if (raw && ENCRYPTION_KEY_HEX_REGEX.test(raw)) {
      try {
        const altKey = crypto.createHash('sha256').update(raw, 'utf8').digest();
        const altDecipher = crypto.createDecipheriv(ALGORITHM, altKey, iv);
        altDecipher.setAuthTag(authTag);
        let decrypted = altDecipher.update(payload.ciphertext, 'hex', 'utf8');
        decrypted += altDecipher.final('utf8');
        return decrypted;
      } catch {
        // rethrow primary error below
      }
    }
    throw primaryErr;
  }
}
