import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppWebhookService } = require('../dist/whatsapp/whatsapp-webhook.service.js');
const { WhatsAppWebhookController } = require('../dist/whatsapp/whatsapp-webhook.controller.js');

describe('WhatsApp Webhook Handshake & Ingestion Controller', () => {
  const secret = 'app_secret_test_2026';
  const verifyToken = 'palnadu_verify_token_2026';

  const mockConfig = {
    get: (key) => {
      if (key === 'WHATSAPP_WEBHOOK_VERIFY_TOKEN') return ` ${verifyToken} \n`;
      if (key === 'META_APP_SECRET') return ` ${secret} `;
      return null;
    },
  };

  const mockMessageService = {
    saveInboundMessage: async (params) => ({ id: 'msg_1', ...params }),
    updateMessageStatus: async (params) => ({ id: 'msg_1', ...params }),
  };

  const mockPrisma = {
    whatsAppWebhookLog: {
      create: async () => ({ id: 'log_1' }),
      update: async () => ({ id: 'log_1', processed: true }),
    },
  };

  const service = new WhatsAppWebhookService(mockConfig, mockMessageService, mockPrisma);
  const controller = new WhatsAppWebhookController(service);

  it('verifies GET challenge handshake successfully and sets text/plain header', () => {
    const query = {
      'hub.mode': 'subscribe',
      'hub.verify_token': verifyToken,
      'hub.challenge': 'challenge_code_987654321',
    };

    const headers = {};
    const mockRes = {
      setHeader: (key, value) => {
        headers[key.toLowerCase()] = value;
      },
    };

    const challenge = controller.verifyWebhook(query, mockRes);
    assert.equal(challenge, 'challenge_code_987654321');
    assert.equal(headers['content-type'], 'text/plain');
  });

  it('supports nested dotted query parameters seamlessly', () => {
    const nestedQuery = {
      hub: {
        mode: 'subscribe',
        verify_token: verifyToken,
        challenge: 'nested_challenge_12345',
      },
    };

    const headers = {};
    const mockRes = { setHeader: (k, v) => { headers[k.toLowerCase()] = v; } };
    const challenge = controller.verifyWebhook(nestedQuery, mockRes);
    assert.equal(challenge, 'nested_challenge_12345');
    assert.equal(headers['content-type'], 'text/plain');
  });

  it('coerces numeric hub.challenge to exact plain-text string', () => {
    const query = {
      'hub.mode': 'subscribe',
      'hub.verify_token': verifyToken,
      'hub.challenge': 1158201444,
    };

    const challenge = controller.verifyWebhook(query);
    assert.equal(challenge, '1158201444');
    assert.equal(typeof challenge, 'string');
  });

  it('prevents ExpressAdapter warning by not setting text/plain on failed verification', () => {
    const invalidQuery = {
      'hub.mode': 'subscribe',
      'hub.verify_token': 'wrong_token',
      'hub.challenge': 'challenge_code_987654321',
    };

    const headers = {};
    const mockRes = { setHeader: (k, v) => { headers[k.toLowerCase()] = v; } };

    assert.throws(() => controller.verifyWebhook(invalidQuery, mockRes), {
      name: 'ForbiddenException',
    });
    // Crucial: setHeader('Content-Type', 'text/plain') was NOT called
    assert.equal(headers['content-type'], undefined);
  });

  it('rejects GET verification with invalid mode (403 Forbidden)', () => {
    const query = {
      'hub.mode': 'unsubscribe',
      'hub.verify_token': verifyToken,
      'hub.challenge': 'challenge_code_987654321',
    };

    assert.throws(() => controller.verifyWebhook(query), {
      name: 'ForbiddenException',
    });
  });

  it('rejects GET verification with missing required fields (403 Forbidden)', () => {
    assert.throws(() => controller.verifyWebhook({}), {
      name: 'ForbiddenException',
    });
    assert.throws(
      () =>
        controller.verifyWebhook({
          'hub.mode': 'subscribe',
          'hub.verify_token': verifyToken,
        }),
      { name: 'ForbiddenException' },
    );
  });

  it('processes POST notification with valid HMAC signature and rawBuffer (200 OK)', async () => {
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'biz_account_1',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: {
                  display_phone_number: '919030787819',
                  phone_number_id: 'phone_id_123',
                },
                contacts: [{ profile: { name: 'Ravi Kumar' }, wa_id: '919876543210' }],
                messages: [
                  {
                    from: '919876543210',
                    id: 'wamid.HBgLMTEwMDAwMDAwMA==',
                    timestamp: '1731100000',
                    type: 'text',
                    text: { body: 'Hello Palnadu team, need a consultation.' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const signature = `sha256=${hash}`;

    const req = { body: payload, rawBody };
    const result = await controller.handleIncomingWebhook(req, signature);
    assert.deepEqual(result, { status: 'success' });
  });

  it('rejects POST notification with tampered raw body (401 Unauthorized)', async () => {
    const payload = { object: 'whatsapp_business_account', entry: [] };
    const originalBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const hash = crypto.createHmac('sha256', secret).update(originalBody).digest('hex');
    const signature = `sha256=${hash}`;

    const tamperedBody = Buffer.from(JSON.stringify({ object: 'whatsapp_business_account', injected: true }), 'utf8');
    const req = { body: payload, rawBody: tamperedBody };

    await assert.rejects(async () => controller.handleIncomingWebhook(req, signature), {
      name: 'UnauthorizedException',
    });
  });

  it('rejects POST notification with missing rawBody buffer (never re-serializes JSON)', async () => {
    const payload = { object: 'whatsapp_business_account', entry: [] };
    const req = { body: payload, rawBody: undefined };

    await assert.rejects(async () => controller.handleIncomingWebhook(req, 'sha256=1234'), {
      name: 'UnauthorizedException',
    });
  });

  it('rejects POST notification with invalid HMAC signature (401 Unauthorized)', async () => {
    const payload = { object: 'whatsapp_business_account', entry: [] };
    const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const invalidSignature = 'sha256=' + '0'.repeat(64);

    const req = { body: payload, rawBody };
    await assert.rejects(async () => controller.handleIncomingWebhook(req, invalidSignature), {
      name: 'UnauthorizedException',
    });
  });

  it('rejects POST notification with missing signature header (401 Unauthorized)', async () => {
    const payload = { object: 'whatsapp_business_account', entry: [] };
    const req = { body: payload, rawBody: Buffer.from(JSON.stringify(payload)) };

    await assert.rejects(async () => controller.handleIncomingWebhook(req, undefined), {
      name: 'UnauthorizedException',
    });
  });
});


