import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  verifyMetaWebhookSignature,
  verifyTokenConstantTime,
} = require('../dist/whatsapp/whatsapp-signature.util.js');

describe('WhatsApp Signature & Token Cryptographic Validation', () => {
  const secret = 'meta_test_app_secret_super_secure_2026';
  const payload = JSON.stringify({ object: 'whatsapp_business_account', entry: [] });
  const rawBody = Buffer.from(payload, 'utf8');

  it('validates signature successfully with matching secret and raw buffer', () => {
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const header = `sha256=${hash}`;

    const isValid = verifyMetaWebhookSignature(rawBody, header, secret);
    assert.equal(isValid, true);
  });

  it('validates signature successfully with raw string body', () => {
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const header = `sha256=${hash}`;

    const isValid = verifyMetaWebhookSignature(payload, header, secret);
    assert.equal(isValid, true);
  });

  it('rejects tampered payload body', () => {
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const header = `sha256=${hash}`;
    const tamperedBody = Buffer.from(
      JSON.stringify({ object: 'whatsapp_business_account', tampered: true }),
      'utf8',
    );

    const isValid = verifyMetaWebhookSignature(tamperedBody, header, secret);
    assert.equal(isValid, false);
  });

  it('rejects signature computed with wrong secret', () => {
    const wrongHash = crypto.createHmac('sha256', 'wrong_secret').update(rawBody).digest('hex');
    const header = `sha256=${wrongHash}`;

    const isValid = verifyMetaWebhookSignature(rawBody, header, secret);
    assert.equal(isValid, false);
  });

  it('rejects malformed signature headers without sha256= prefix', () => {
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');

    assert.equal(verifyMetaWebhookSignature(rawBody, hash, secret), false);
    assert.equal(verifyMetaWebhookSignature(rawBody, `sha1=${hash}`, secret), false);
    assert.equal(verifyMetaWebhookSignature(rawBody, '', secret), false);
    assert.equal(verifyMetaWebhookSignature(rawBody, undefined, secret), false);
  });

  it('rejects missing or empty secret', () => {
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const header = `sha256=${hash}`;

    assert.equal(verifyMetaWebhookSignature(rawBody, header, ''), false);
    assert.equal(verifyMetaWebhookSignature(rawBody, header, undefined), false);
  });

  it('rejects null or undefined raw body', () => {
    const header = 'sha256=abcdef1234567890';
    assert.equal(verifyMetaWebhookSignature(undefined, header, secret), false);
    assert.equal(verifyMetaWebhookSignature(null, header, secret), false);
  });

  it('validates verification token using constant-time check', () => {
    const token = 'palnadu_verify_token_2026';
    assert.equal(verifyTokenConstantTime(token, token), true);
    assert.equal(verifyTokenConstantTime('wrong_token', token), false);
    assert.equal(verifyTokenConstantTime(token, 'wrong_token'), false);
    assert.equal(verifyTokenConstantTime('', token), false);
    assert.equal(verifyTokenConstantTime(undefined, token), false);
    assert.equal(verifyTokenConstantTime(token, undefined), false);
  });
});
