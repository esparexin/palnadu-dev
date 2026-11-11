import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppWebhookService } = require('../dist/whatsapp/whatsapp-webhook.service.js');
const { WhatsAppWebhookController } = require('../dist/whatsapp/whatsapp-webhook.controller.js');
const { WhatsAppMessageService } = require('../dist/whatsapp/whatsapp-message.service.js');
const { WhatsAppApiClient } = require('../dist/whatsapp/whatsapp-api.client.js');
const { WhatsAppAutoReplyService } = require('../dist/whatsapp/whatsapp-auto-reply.service.js');

describe('WhatsApp E2E Inbound Message Lifecycle & Retries', () => {
  const secret = 'meta_app_secret_test_2026';
  const verifyToken = 'verify_token_test_2026';
  const phoneNumberId = '109876543210987';

  it('verifies incoming text message flow and auto-reply dispatch', async () => {
    const db = new Map();
    let outboundSent = false;
    let outboundPayload = null;

    const mockPrisma = {
      whatsAppWebhookLog: {
        create: async ({ data }) => ({ id: 'log_1', ...data }),
        update: async ({ where, data }) => ({ id: where.id, ...data }),
      },
      whatsAppMessage: {
        findUnique: async ({ where }) => db.get(where.wamId) || null,
        findFirst: async () => null,
        create: async ({ data }) => {
          const rec = { id: `msg_${Date.now()}`, ...data };
          db.set(data.wamId, rec);
          return rec;
        },
        update: async ({ where, data }) => {
          let target = null;
          for (const m of db.values()) {
            if (m.id === where.id || m.wamId === where.wamId) { target = m; break; }
          }
          if (data.wamId && target) db.delete(target.wamId);
          const updated = { ...target, ...data };
          db.set(updated.wamId, updated);
          return updated;
        },
      },
      marketingContact: { findMany: async () => [] },
    };

    const mockConfig = {
      get: (k) => {
        if (k === 'META_APP_SECRET') return secret;
        if (k === 'WHATSAPP_WEBHOOK_VERIFY_TOKEN') return verifyToken;
        if (k === 'WHATSAPP_ACCESS_TOKEN') return 'valid_token';
        if (k === 'WHATSAPP_PHONE_NUMBER_ID') return phoneNumberId;
        return null;
      },
    };

    const mockFetch = async (url, opts) => {
      outboundSent = true;
      outboundPayload = JSON.parse(opts.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: 'whatsapp',
          contacts: [{ input: '919876543210', wa_id: '919876543210' }],
          messages: [{ id: 'wamid.AUTO_REPLY_001' }],
        }),
      };
    };

    const apiClient = new WhatsAppApiClient(mockConfig, { fetchFn: mockFetch });
    const messageService = new WhatsAppMessageService(mockPrisma, { create: async () => ({}) });
    const autoReplyService = new WhatsAppAutoReplyService(mockPrisma, mockConfig, apiClient);
    const webhookService = new WhatsAppWebhookService(mockConfig, messageService, mockPrisma, autoReplyService);
    const controller = new WhatsAppWebhookController(webhookService);

    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: { display_phone_number: '919030787819', phone_number_id: phoneNumberId },
            contacts: [{ profile: { name: 'Gopi Krishna' }, wa_id: '919876543210' }],
            messages: [{
              from: '919876543210',
              id: 'wamid.INBOUND_TEXT_001',
              timestamp: Math.floor(Date.now() / 1000).toString(),
              type: 'text',
              text: { body: 'Inquiry regarding software development in Palnadu' },
            }],
          },
        }],
      }],
    };

    const rawBody = Buffer.from(JSON.stringify(payload), 'utf8');
    const hash = crypto.createHmac('sha256', secret).update(rawBody).digest('hex');
    const signature = `sha256=${hash}`;

    const res = await controller.handleIncomingWebhook({ body: payload, rawBody }, signature);
    assert.equal(res.status, 'success');

    // Wait 20ms for asynchronous microtask auto-reply to complete
    await new Promise((resolve) => setTimeout(resolve, 20));

    assert.equal(outboundSent, true);
    assert.equal(outboundPayload.to, '919876543210');
    assert.equal(outboundPayload.context.message_id, 'wamid.INBOUND_TEXT_001');
    assert.ok(db.has('wamid.INBOUND_TEXT_001'));
  });

  it('safely handles unsupported message types without crashing', async () => {
    const db = new Map();
    const mockPrisma = {
      whatsAppWebhookLog: {
        create: async ({ data }) => ({ id: 'log_unsupported', ...data }),
        update: async () => ({}),
      },
      whatsAppMessage: {
        findUnique: async () => null,
        create: async ({ data }) => {
          db.set(data.wamId, data);
          return data;
        },
      },
    };

    const messageService = new WhatsAppMessageService(mockPrisma, { create: async () => ({}) });
    const webhookService = new WhatsAppWebhookService({ get: () => secret }, messageService, mockPrisma);

    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            metadata: { display_phone_number: '919030787819', phone_number_id: phoneNumberId },
            messages: [{
              from: '919876543210',
              id: 'wamid.UNSUPPORTED_TYPE_001',
              timestamp: '1731100000',
              type: 'unknown_interactive_flow',
            }],
          },
        }],
      }],
    };

    const result = await webhookService.processIncomingPayload(payload);
    assert.equal(result.messages, 1);
    const saved = db.get('wamid.UNSUPPORTED_TYPE_001');
    assert.equal(saved.body, undefined);
  });

  it('guarantees idempotency on duplicate webhook deliveries', async () => {
    let saveCount = 0;
    const store = new Map();
    const mockPrisma = {
      whatsAppWebhookLog: { create: async () => ({ id: 'log_dup' }), update: async () => ({}) },
      whatsAppMessage: {
        findUnique: async ({ where }) => store.get(where.wamId) || null,
        create: async ({ data }) => {
          saveCount++;
          store.set(data.wamId, data);
          return data;
        },
      },
    };

    const messageService = new WhatsAppMessageService(mockPrisma, { create: async () => ({}) });
    const webhookService = new WhatsAppWebhookService({ get: () => secret }, messageService, mockPrisma);

    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            metadata: { display_phone_number: '123' },
            messages: [{ from: '123', id: 'wamid.DUP_ID_001', type: 'text', text: { body: 'test' } }],
          },
        }],
      }],
    };

    await webhookService.processIncomingPayload(payload);
    await webhookService.processIncomingPayload(payload);

    assert.equal(saveCount, 1);
    assert.equal(store.size, 1);
  });

  it('propagates error on downstream failure allowing Meta retry', async () => {
    let attempt = 0;
    const store = new Map();
    const mockPrisma = {
      whatsAppWebhookLog: { create: async () => ({ id: 'log_err' }), update: async () => ({}) },
      whatsAppMessage: {
        findUnique: async ({ where }) => store.get(where.wamId) || null,
        create: async ({ data }) => {
          attempt++;
          if (attempt === 1) throw new Error('Database replica set disconnected');
          store.set(data.wamId, data);
          return data;
        },
      },
    };

    const messageService = new WhatsAppMessageService(mockPrisma, { create: async () => ({}) });
    const webhookService = new WhatsAppWebhookService({ get: () => secret }, messageService, mockPrisma);

    const payload = {
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            metadata: { display_phone_number: '123' },
            messages: [{ from: '123', id: 'wamid.RETRY_MSG_001', type: 'text', text: { body: 'retry' } }],
          },
        }],
      }],
    };

    // First attempt fails and throws to controller so Meta gets 500 and retries
    await assert.rejects(async () => webhookService.processIncomingPayload(payload), /Database replica set disconnected/);

    // Second attempt (Meta retry) succeeds
    const res = await webhookService.processIncomingPayload(payload);
    assert.equal(res.processed, true);
    assert.ok(store.get('wamid.RETRY_MSG_001'));
  });
});
