import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import * as crypto from 'node:crypto';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppWebhookService } = require('../dist/whatsapp/whatsapp-webhook.service.js');
const { WhatsAppWebhookController } = require('../dist/whatsapp/whatsapp-webhook.controller.js');
const { WhatsAppMessageService } = require('../dist/whatsapp/whatsapp-message.service.js');
const { WhatsAppAutoReplyService } = require('../dist/whatsapp/whatsapp-auto-reply.service.js');
const { WhatsAppAssistantService } = require('../dist/whatsapp/whatsapp-assistant.service.js');
const { WhatsAppConversationService } = require('../dist/whatsapp/whatsapp-conversation.service.js');
const { WhatsAppEnquiryService } = require('../dist/whatsapp/whatsapp-enquiry.service.js');

describe('WhatsApp Webhook Assistant & Legacy Coordination', () => {
  const secret = 'meta_test_secret_12345';
  const verifyToken = 'test_verify_token_12345';

  const createHmacSignature = (rawBuffer) => {
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(rawBuffer);
    return `sha256=${hmac.digest('hex')}`;
  };

  const createTestHarness = ({ assistantEnabled = 'false', autoReplyEnabled = 'true' }) => {
    const messages = new Map();
    const conversations = new Map();
    const outboundCalls = [];

    const mockPrisma = {
      whatsAppWebhookLog: {
        create: async ({ data }) => ({ id: `log_${Date.now()}`, ...data }),
        update: async ({ where, data }) => ({ id: where.id, ...data }),
      },
      whatsAppMessage: {
        findUnique: async ({ where }) => messages.get(where.wamId) || null,
        findFirst: async () => null,
        create: async ({ data }) => {
          const rec = { id: `msg_${Date.now()}`, ...data };
          messages.set(data.wamId, rec);
          return rec;
        },
        update: async ({ where, data }) => {
          let rec = null;
          for (const m of messages.values()) {
            if (m.id === where.id || m.wamId === where.wamId) { rec = m; break; }
          }
          if (rec) Object.assign(rec, data);
          return rec;
        },
        delete: async () => null,
      },
      whatsAppConversation: {
        findUnique: async ({ where }) => conversations.get(where.customerPhone) || null,
        create: async ({ data }) => {
          const rec = { id: `conv_${Date.now()}`, humanTakeover: false, ...data };
          conversations.set(data.customerPhone, rec);
          return rec;
        },
        update: async ({ where, data }) => {
          const rec = conversations.get(where.customerPhone) || Array.from(conversations.values()).find(c => c.id === where.id);
          if (rec) Object.assign(rec, data);
          return rec;
        },
        delete: async () => null,
      },
      lead: { findUnique: async () => null, create: async ({ data }) => ({ id: 'lead_1', ...data }) },
    };

    const mockConfig = {
      get: (k) => {
        if (k === 'META_APP_SECRET') return secret;
        if (k === 'WHATSAPP_WEBHOOK_VERIFY_TOKEN') return verifyToken;
        if (k === 'WHATSAPP_ASSISTANT_ENABLED') return assistantEnabled;
        if (k === 'WHATSAPP_AUTO_REPLY_ENABLED') return autoReplyEnabled;
        if (k === 'WHATSAPP_ACCESS_TOKEN') return 'valid_token';
        if (k === 'WHATSAPP_PHONE_NUMBER_ID') return '1234567890';
        return null;
      },
    };

    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async ({ to, text, replyToWamId }) => {
        outboundCalls.push({ to, text, replyToWamId });
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: `wamid.OUT_${Date.now()}` }],
        };
      },
    };

    const notifications = { create: async () => ({}) };
    const messageService = new WhatsAppMessageService(mockPrisma, notifications);
    const enquiryService = new WhatsAppEnquiryService(mockPrisma, notifications);
    const conversationService = new WhatsAppConversationService(enquiryService);
    const assistantService = new WhatsAppAssistantService(
      mockPrisma,
      mockConfig,
      mockApiClient,
      conversationService,
    );
    const autoReplyService = new WhatsAppAutoReplyService(
      mockPrisma,
      mockConfig,
      mockApiClient,
    );
    const webhookService = new WhatsAppWebhookService(
      mockConfig,
      messageService,
      mockPrisma,
      autoReplyService,
      undefined,
      assistantService,
    );
    const controller = new WhatsAppWebhookController(webhookService);

    return { controller, outboundCalls, conversations, messages };
  };

  const createIncomingPayload = (from, text, wamId) => {
    return {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'biz_account_1',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '919030787819', phone_number_id: '1234567890' },
                contacts: [{ profile: { name: 'Gopi Krishna' }, wa_id: from }],
                messages: [
                  {
                    from,
                    id: wamId,
                    timestamp: Math.floor(Date.now() / 1000).toString(),
                    type: 'text',
                    text: { body: text },
                  },
                ],
              },
            },
          ],
        },
      ],
    };
  };

  it('1. delegates to conversational assistant when WHATSAPP_ASSISTANT_ENABLED is true', async () => {
    const { controller, outboundCalls } = createTestHarness({
      assistantEnabled: 'true',
      autoReplyEnabled: 'true',
    });

    const payload = createIncomingPayload('919876543210', 'Hi', 'wamid.IN_001');
    const rawBuffer = Buffer.from(JSON.stringify(payload));
    const signature = createHmacSignature(rawBuffer);

    const res = await controller.handleIncomingWebhook({ rawBody: rawBuffer, body: payload }, signature);
    assert.equal(res.status, 'success');

    // Wait for setImmediate microtasks to finish
    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(outboundCalls.length, 1);
    assert.match(outboundCalls[0].text, /Welcome to Palnadu\.dev/);
    assert.doesNotMatch(outboundCalls[0].text, /Thank you for reaching out to Palnadu! We have received/);
  });

  it('2. delegates to legacy auto-reply when WHATSAPP_ASSISTANT_ENABLED is false', async () => {
    const { controller, outboundCalls } = createTestHarness({
      assistantEnabled: 'false',
      autoReplyEnabled: 'true',
    });

    const payload = createIncomingPayload('919876543210', 'Hi', 'wamid.IN_002');
    const rawBuffer = Buffer.from(JSON.stringify(payload));
    const signature = createHmacSignature(rawBuffer);

    const res = await controller.handleIncomingWebhook({ rawBody: rawBuffer, body: payload }, signature);
    assert.equal(res.status, 'success');

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(outboundCalls.length, 1);
    assert.match(outboundCalls[0].text, /Thank you for reaching out to Palnadu! We have received/);
    assert.doesNotMatch(outboundCalls[0].text, /Welcome to Palnadu\.dev/);
  });

  it('3. does not dispatch any automated reply when customer sends STOP opt-out', async () => {
    const { controller, outboundCalls } = createTestHarness({
      assistantEnabled: 'true',
      autoReplyEnabled: 'true',
    });

    const payload = createIncomingPayload('919876543210', 'STOP', 'wamid.IN_OPT_OUT');
    const rawBuffer = Buffer.from(JSON.stringify(payload));
    const signature = createHmacSignature(rawBuffer);

    const res = await controller.handleIncomingWebhook({ rawBody: rawBuffer, body: payload }, signature);
    assert.equal(res.status, 'success');

    await new Promise((resolve) => setTimeout(resolve, 50));

    assert.equal(outboundCalls.length, 0, 'Opt-out must never receive automated message');
  });
});
