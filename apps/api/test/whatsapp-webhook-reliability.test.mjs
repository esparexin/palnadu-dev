import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppWebhookService } = require('../dist/whatsapp/whatsapp-webhook.service.js');
const { WhatsAppMessageService } = require('../dist/whatsapp/whatsapp-message.service.js');

describe('WhatsApp Webhook Reliability & Idempotency', () => {
  const secret = 'app_secret_test_2026';
  const verifyToken = 'palnadu_verify_token_2026';

  const mockConfig = {
    get: (key) => {
      if (key === 'WHATSAPP_WEBHOOK_VERIFY_TOKEN') return verifyToken;
      if (key === 'META_APP_SECRET') return secret;
      return null;
    },
  };

  it('durably persists webhook log before processing events', async () => {
    let logCreated = false;
    let logProcessed = false;

    const mockPrisma = {
      whatsAppWebhookLog: {
        create: async ({ data }) => {
          logCreated = true;
          return { id: 'log_abc_123', ...data };
        },
        update: async ({ where, data }) => {
          if (data.processed) logProcessed = true;
          return { id: where.id, ...data };
        },
      },
    };

    const mockMessageService = {
      saveInboundMessage: async () => ({ id: 'msg_1' }),
      updateMessageStatus: async () => ({ id: 'msg_1' }),
    };

    const service = new WhatsAppWebhookService(mockConfig, mockMessageService, mockPrisma);
    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'biz_1',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '123', phone_number_id: '456' },
                messages: [{ from: '123', id: 'wamid_1', type: 'text', text: { body: 'hi' } }],
              },
            },
          ],
        },
      ],
    };

    const result = await service.processIncomingPayload(payload, Buffer.from(JSON.stringify(payload)));
    assert.equal(result.processed, true);
    assert.equal(logCreated, true);
    assert.equal(logProcessed, true);
  });

  it('propagates error when webhook log persistence fails (prevents 200 OK acknowledgment)', async () => {
    const mockPrisma = {
      whatsAppWebhookLog: {
        create: async () => {
          throw new Error('Database connection failed: replica set unreachable');
        },
      },
    };

    const mockMessageService = {
      saveInboundMessage: async () => ({ id: 'msg_1' }),
      updateMessageStatus: async () => ({ id: 'msg_1' }),
    };

    const service = new WhatsAppWebhookService(mockConfig, mockMessageService, mockPrisma);
    const payload = { object: 'whatsapp_business_account', entry: [] };

    await assert.rejects(
      async () => service.processIncomingPayload(payload, Buffer.from(JSON.stringify(payload))),
      /Database connection failed/,
    );
  });

  it('guarantees idempotency on duplicate messages without duplicate notifications', async () => {
    let createdCount = 0;
    let notificationCount = 0;
    const store = new Map();

    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async ({ where }) => store.get(where.wamId) || null,
        create: async ({ data }) => {
          createdCount++;
          const record = { id: `msg_${createdCount}`, ...data };
          store.set(data.wamId, record);
          return record;
        },
      },
    };

    const mockNotifications = {
      create: async () => {
        notificationCount++;
      },
    };

    const messageService = new WhatsAppMessageService(mockPrisma, mockNotifications);

    const messageParams = {
      wamId: 'wamid.DUPLICATE_TEST_001',
      from: '919000000000',
      to: 'palnadu_biz',
      type: 'text',
      body: 'Testing duplicate delivery resilience',
    };

    // First delivery
    const firstResult = await messageService.saveInboundMessage(messageParams);
    assert.equal(firstResult.wamId, messageParams.wamId);
    assert.equal(createdCount, 1);
    assert.equal(notificationCount, 1);

    // Duplicate delivery
    const secondResult = await messageService.saveInboundMessage(messageParams);
    assert.equal(secondResult.wamId, messageParams.wamId);
    assert.equal(createdCount, 1, 'Must not create duplicate DB record');
    assert.equal(notificationCount, 1, 'Must not dispatch duplicate notification');
  });

  it('recovers gracefully from concurrent delivery race condition (P2002)', async () => {
    let notificationCount = 0;
    const existingRecord = {
      id: 'existing_id_99',
      wamId: 'wamid.RACE_TEST_001',
      from: '919000000000',
      to: 'palnadu_biz',
    };

    const mockPrisma = {
      whatsAppMessage: {
        // First check returns null (simulating concurrent read before write)
        findUnique: async () => existingRecord,
        create: async () => {
          const err = new Error('Unique constraint failed on the fields: (`wam_id`)');
          err.code = 'P2002';
          throw err;
        },
      },
    };

    const mockNotifications = {
      create: async () => { notificationCount++; },
    };

    const messageService = new WhatsAppMessageService(mockPrisma, mockNotifications);

    const result = await messageService.saveInboundMessage({
      wamId: 'wamid.RACE_TEST_001',
      from: '919000000000',
      to: 'palnadu_biz',
      type: 'text',
      body: 'Race condition test',
    });

    assert.equal(result.wamId, 'wamid.RACE_TEST_001');
    assert.equal(notificationCount, 0, 'No notification dispatched on race condition collision');
  });
});
