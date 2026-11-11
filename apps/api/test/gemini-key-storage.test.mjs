import test from 'node:test';
import assert from 'node:assert/strict';
import {
  encryptSecret,
  decryptSecret,
  deriveEncryptionKey,
  validateEncryptionConfig,
} from '../dist/automation/gemini-verification/gemini-crypto.util.js';
import { GeminiKeyStoreService } from '../dist/automation/gemini-verification/gemini-key-store.service.js';
import { maskApiKey } from '../dist/automation/gemini-verification/gemini-verification.util.js';
import {
  createMockPrisma,
  createMockVerificationService,
} from './gemini-test-mocks.mjs';

test('AES-256-GCM encryption and decryption round-trip', () => {
  const secret = 'AIzaSyTestApiKeyForVerification1234567890';
  const customSalt = 'test-encryption-key-for-unit-test';
  const encrypted = encryptSecret(secret, customSalt);

  assert.ok(encrypted.ciphertext && encrypted.iv && encrypted.authTag);
  assert.notEqual(encrypted.ciphertext, secret);

  const decrypted = decryptSecret(encrypted, customSalt);
  assert.equal(decrypted, secret);
});

test('AES-256-GCM rejects tampered ciphertext or auth tag', () => {
  const secret = 'AIzaSyValidSecretForTesting1234567890';
  const encrypted = encryptSecret(secret);
  const tampered = { ...encrypted, ciphertext: 'deadbeef' + encrypted.ciphertext.slice(8) };

  assert.throws(() => decryptSecret(tampered), /unable to authenticate data|Unsupported state/i);
});

test('getActiveKeyStatus falls back cleanly when no DB record exists', async () => {
  const mockPrisma = createMockPrisma();
  const mockVerifier = createMockVerificationService('valid');
  const service = new GeminiKeyStoreService(mockPrisma, mockVerifier);

  const prevEnv = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;
  try {
    const status = await service.getActiveKeyStatus();
    assert.equal(status.configured, false);
    assert.equal(status.source, 'none');
    assert.equal(status.maskedKey, null);
    assert.equal(status.account.email, null);
    assert.equal(status.account.status, 'Account Identity Unavailable');
  } finally {
    if (prevEnv) process.env.GEMINI_API_KEY = prevEnv;
  }
});

test('verifyCandidateKey probes key and logs audit without altering active key', async () => {
  const mockPrisma = createMockPrisma();
  const mockVerifier = createMockVerificationService('valid');
  const service = new GeminiKeyStoreService(mockPrisma, mockVerifier);

  const candidateKey = 'AIzaSyCandidateProbeKey1234567890abcdef';
  const result = await service.verifyCandidateKey(candidateKey, 'admin@palnadu.dev');

  assert.equal(result.isValid, true);
  assert.equal(result.maskedKey, maskApiKey(candidateKey));
  assert.equal(result.account.email, null);
  assert.equal(result.account.status, 'Account Identity Unavailable');

  // Verify active key was NOT set
  const active = await service.getActiveKeyStatus();
  assert.equal(active.source, process.env.GEMINI_API_KEY ? 'environment' : 'none');

  // Verify audit record exists without raw key
  const audits = await service.getAuditLog();
  assert.equal(audits.length, 1);
  assert.equal(audits[0].action, 'VERIFICATION_PROBE');
  assert.equal(audits[0].actor, 'admin@palnadu.dev');
  assert.equal(audits[0].maskedKey, maskApiKey(candidateKey));
  assert.equal(JSON.stringify(audits).includes(candidateKey), false);
});

test('activateKey atomically stores encrypted key and preserves existing key on rejection', async () => {
  const mockPrisma = createMockPrisma();
  let verifierBehavior = 'valid';
  const mockVerifier = {
    async verifyKey(apiKey, opts) {
      return createMockVerificationService(verifierBehavior).verifyKey(apiKey, opts);
    },
  };
  const service = new GeminiKeyStoreService(mockPrisma, mockVerifier);

  // 1. Activate valid initial key
  const initialKey = 'AIzaSyInitialValidKey1234567890abcdefgh';
  const active1 = await service.activateKey(initialKey, 'superadmin@palnadu.dev');

  assert.equal(active1.configured, true);
  assert.equal(active1.source, 'database');
  assert.equal(active1.maskedKey, maskApiKey(initialKey));
  assert.equal(active1.project.id, 'gcp-project-4455');
  assert.equal(active1.account.email, null);

  // Verify internal decryption works
  const decrypted = await service.getDecryptedActiveKey();
  assert.equal(decrypted, initialKey);

  // Verify DB raw record has no plaintext key
  const dbRaw = mockPrisma.store.get('gemini_api_key_encrypted');
  assert.ok(dbRaw.value.ciphertext && dbRaw.value.iv && dbRaw.value.authTag);
  assert.equal(JSON.stringify(dbRaw).includes(initialKey), false);

  // 2. Attempt activation of an INVALID key -> must throw and preserve initial key
  verifierBehavior = 'invalid';
  const brokenKey = 'AIzaSyBrokenCandidateKey1234567890xyz';

  await assert.rejects(
    async () => service.activateKey(brokenKey, 'attacker@palnadu.dev'),
    /Gemini API key activation rejected: Invalid Key.*Existing key preserved/,
  );

  // Existing key must still be active and intact
  const activeAfterFailure = await service.getActiveKeyStatus();
  assert.equal(activeAfterFailure.maskedKey, maskApiKey(initialKey));
  const decryptedAfterFailure = await service.getDecryptedActiveKey();
  assert.equal(decryptedAfterFailure, initialKey);

  // Audit log records rejection without raw keys
  const audits = await service.getAuditLog();
  assert.equal(audits[0].action, 'KEY_ACTIVATION_REJECTED');
  assert.equal(audits[0].maskedKey, maskApiKey(brokenKey));
  assert.equal(JSON.stringify(audits).includes(brokenKey), false);
});

test('production strictly enforces dedicated ENCRYPTION_KEY and rejects JWT_SECRET fallback', () => {
  const prevNodeEnv = process.env.NODE_ENV;
  const prevEnc = process.env.ENCRYPTION_KEY;
  const prevJwt = process.env.JWT_SECRET;
  process.env.NODE_ENV = 'production';

  try {
    // 1. Missing ENCRYPTION_KEY
    delete process.env.ENCRYPTION_KEY;
    delete process.env.JWT_SECRET;
    assert.throws(() => validateEncryptionConfig(), /ENCRYPTION_KEY is required/i);
    assert.throws(() => deriveEncryptionKey(), /ENCRYPTION_KEY is required/i);

    // 2. Empty / whitespace ENCRYPTION_KEY
    process.env.ENCRYPTION_KEY = '   ';
    assert.throws(() => validateEncryptionConfig(), /ENCRYPTION_KEY is required/i);

    // 3. Malformed / too short or non-hex ENCRYPTION_KEY
    process.env.ENCRYPTION_KEY = 'short-key-1234';
    assert.throws(() => validateEncryptionConfig(), /must be exactly 64 hexadecimal characters/i);
    assert.throws(() => deriveEncryptionKey(), /must be exactly 64 hexadecimal characters/i);

    // 4. Exactly 64 chars but non-hex (contains 'z')
    process.env.ENCRYPTION_KEY = 'z'.repeat(64);
    assert.throws(() => validateEncryptionConfig(), /must be exactly 64 hexadecimal characters/i);
    assert.throws(() => deriveEncryptionKey(), /must be exactly 64 hexadecimal characters/i);

    // 5. JWT_SECRET-only in production -> MUST be rejected (never allowed as fallback)
    delete process.env.ENCRYPTION_KEY;
    process.env.JWT_SECRET = 'valid-jwt-secret-string-at-least-32-chars-long';
    assert.throws(() => validateEncryptionConfig(), /JWT_SECRET fallback is strictly disallowed in production/i);
    assert.throws(() => deriveEncryptionKey(), /JWT_SECRET fallback is strictly disallowed in production/i);

    // 6. Valid 64-hex dedicated key -> accepted with isHex64 flag
    const validHexKey = 'a1b2c3d4e5f60718293a4b5c6d7e8f90a1b2c3d4e5f60718293a4b5c6d7e8f90';
    process.env.ENCRYPTION_KEY = validHexKey;
    const cfg = validateEncryptionConfig();
    assert.equal(cfg.keySource, 'ENCRYPTION_KEY');
    assert.equal(cfg.isDedicatedKey, true);
    assert.equal(cfg.isHex64, true);

    const key = deriveEncryptionKey();
    assert.equal(key.length, 32);
    assert.deepEqual(key, Buffer.from(validHexKey, 'hex'));
  } finally {
    process.env.NODE_ENV = prevNodeEnv;
    if (prevEnc) process.env.ENCRYPTION_KEY = prevEnc;
    else delete process.env.ENCRYPTION_KEY;
    if (prevJwt) process.env.JWT_SECRET = prevJwt;
    else delete process.env.JWT_SECRET;
  }
});

test('64-character hex ENCRYPTION_KEY round-trip, tamper detection and dual-compatibility', () => {
  const hexKey = 'f0e1d2c3b4a5968778695a4b3c2d1e0ff0e1d2c3b4a5968778695a4b3c2d1e0f';
  const secret = 'AIzaSyTestSecretUsing64HexKey1234567890';

  // 1. Round-trip encryption and decryption with 64-hex key
  const encrypted = encryptSecret(secret, hexKey);
  assert.ok(encrypted.ciphertext && encrypted.iv && encrypted.authTag);
  assert.equal(decryptSecret(encrypted, hexKey), secret);

  // 2. Tamper detection on ciphertext and authTag
  const tamperedCipher = { ...encrypted, ciphertext: 'deadbeef' + encrypted.ciphertext.slice(8) };
  assert.throws(() => decryptSecret(tamperedCipher, hexKey), /unable to authenticate data|Unsupported state/i);

  const tamperedTag = { ...encrypted, authTag: '00000000000000000000000000000000' };
  assert.throws(() => decryptSecret(tamperedTag, hexKey), /unable to authenticate data|Unsupported state/i);
});

test('database key strictly overrides environment variable without restart', async () => {
  const mockPrisma = createMockPrisma();
  const mockVerifier = createMockVerificationService('valid');
  const service = new GeminiKeyStoreService(mockPrisma, mockVerifier);

  const prevEnvKey = process.env.GEMINI_API_KEY;
  process.env.GEMINI_API_KEY = 'AQ.LegacyOldEnvKey1234567890abcdefg';
  const newDbKey = 'AQ.NewActivatedDbKey9876543210zyxwvu';

  try {
    const statusBefore = await service.getActiveKeyStatus();
    assert.equal(statusBefore.source, 'environment');
    assert.equal(statusBefore.maskedKey, maskApiKey(process.env.GEMINI_API_KEY));

    await service.activateKey(newDbKey, 'admin@palnadu.dev', 'gemini-3.8-flash');

    const statusAfter = await service.getActiveKeyStatus();
    assert.equal(statusAfter.source, 'database');
    assert.equal(statusAfter.maskedKey, maskApiKey(newDbKey));
    assert.equal(statusAfter.primaryModel, 'gemini-3.8-flash');

    const activeKeyDecrypted = await service.getDecryptedActiveKey();
    assert.equal(activeKeyDecrypted, newDbKey);
    assert.notEqual(activeKeyDecrypted, process.env.GEMINI_API_KEY);

    const activeModel = await service.getActiveModel();
    assert.equal(activeModel, 'gemini-3.8-flash');
  } finally {
    if (prevEnvKey) process.env.GEMINI_API_KEY = prevEnvKey;
    else delete process.env.GEMINI_API_KEY;
  }
});

