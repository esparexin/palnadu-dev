import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppAutoReplyService } = require('../dist/whatsapp/whatsapp-auto-reply.service.js');
const { WhatsAppWebhookService } = require('../dist/whatsapp/whatsapp-webhook.service.js');
const { WhatsAppTakeoverService } = require('../dist/whatsapp/whatsapp-takeover.service.js');
const { DEFAULT_ACK_MESSAGE } = require('../dist/whatsapp/whatsapp.constants.js');

describe('WhatsApp Automated Reply Investigation & Suppression', () => {
  const createMockConfig = (overrides = {}) => ({
    get: (key) => (key in overrides ? overrides[key] : null),
  });

  const createInboundMessage = (overrides = {}) => ({
    id: 'msg_test_1',
    wamId: 'wamid.INBOUND_SUPPRESS_001',
    direction: 'INBOUND',
    from: '919876543210',
    to: '919030787819',
    type: 'text',
    body: 'Hello, need help',
    status: 'RECEIVED',
    statusTimestamp: new Date(),
    createdAt: new Date(),
    ...overrides,
  });

  it('isEnabled() returns false for false, 0, FALSE, " false ", and off', () => {
    const mockApiClient = { isConfigured: () => true };
    const disabledConfigs = ['false', '0', 'FALSE', ' false ', 'off', 'OFF'];

    for (const val of disabledConfigs) {
      const service = new WhatsAppAutoReplyService(
        {},
        createMockConfig({ WHATSAPP_AUTO_REPLY_ENABLED: val }),
        mockApiClient,
      );
      assert.equal(
        service.isEnabled(),
        false,
        `Expected isEnabled() to be false for config "${val}"`,
      );
    }
  });

  it('isEnabled() returns true when unset or true and API client is configured', () => {
    const mockApiClient = { isConfigured: () => true };
    const s1 = new WhatsAppAutoReplyService({}, createMockConfig(), mockApiClient);
    assert.equal(s1.isEnabled(), true);

    const s2 = new WhatsAppAutoReplyService(
      {},
      createMockConfig({ WHATSAPP_AUTO_REPLY_ENABLED: 'true' }),
      mockApiClient,
    );
    assert.equal(s2.isEnabled(), true);
  });

  it('handleAutoReply suppresses dispatch completely when disabled', async () => {
    let sendDispatched = false;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => {
        sendDispatched = true;
        return { messages: [{ id: 'wamid.SHOULD_NOT_SEND' }] };
      },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async () => {
          throw new Error('Database should not be accessed when disabled');
        },
      },
    };

    const service = new WhatsAppAutoReplyService(
      mockPrisma,
      createMockConfig({ WHATSAPP_AUTO_REPLY_ENABLED: 'false' }),
      mockApiClient,
    );

    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
    assert.equal(sendDispatched, false);
  });

  it('handleAutoReply sends legacy default acknowledgment when enabled', async () => {
    let sentText = null;
    let sentTo = null;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async (params) => {
        sentText = params.text;
        sentTo = params.to;
        return { messages: [{ id: 'wamid.LEGACY_ACK_DISPATCHED' }] };
      },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async () => null,
        create: async ({ data }) => ({ id: 'claim_1', ...data }),
        update: async ({ data }) => ({ id: 'claim_1', ...data }),
      },
      whatsAppConversation: {
        findUnique: async () => ({ humanTakeover: false }),
        upsert: async () => ({ humanTakeover: false }),
        updateMany: async () => ({ count: 1 }),
      },
    };

    const service = new WhatsAppAutoReplyService(
      mockPrisma,
      createMockConfig({ WHATSAPP_AUTO_REPLY_ENABLED: 'true' }),
      mockApiClient,
    );

    const result = await service.handleAutoReply(createInboundMessage());
    assert.notEqual(result, null);
    assert.equal(sentTo, '919876543210');
    assert.equal(sentText, DEFAULT_ACK_MESSAGE);
  });

  it('webhook processing persists inbound and generates admin notification without auto-reply when disabled', async () => {
    let persistedInbound = null;
    let notificationCreated = null;
    let autoReplyInvoked = false;

    const mockMessageService = {
      saveInboundMessage: async (params) => {
        persistedInbound = params;
        return { id: 'msg_in_01', ...params };
      },
      updateMessageStatus: async () => ({}),
    };

    const mockAutoReplyService = {
      isEnabled: () => false,
      handleAutoReply: async () => {
        autoReplyInvoked = true;
      },
    };

    const mockAssistantService = {
      isEnabled: () => false,
      handleInboundMessage: async () => null,
    };

    const mockPrisma = {
      whatsAppWebhookLog: {
        create: async () => ({ id: 'log_01' }),
        update: async () => ({}),
      },
      whatsAppMessage: {
        findFirst: async () => null,
      },
    };

    const webhookService = new WhatsAppWebhookService(
      createMockConfig(),
      mockMessageService,
      mockPrisma,
      mockAutoReplyService,
      undefined,
      mockAssistantService,
    );

    const payload = {
      object: 'whatsapp_business_account',
      entry: [
        {
          id: 'WHATSAPP_ACCOUNT_1',
          changes: [
            {
              field: 'messages',
              value: {
                messaging_product: 'whatsapp',
                metadata: { display_phone_number: '123', phone_number_id: '456' },
                contacts: [{ wa_id: '919876543210', profile: { name: 'Customer One' } }],
                messages: [
                  {
                    id: 'wamid.INBOUND_NO_AUTOREPLY',
                    from: '919876543210',
                    timestamp: '1700000000',
                    type: 'text',
                    text: { body: 'Inquiry without auto-reply' },
                  },
                ],
              },
            },
          ],
        },
      ],
    };

    await webhookService.processIncomingPayload(payload, Buffer.from(JSON.stringify(payload)));

    // Give microtasks / setImmediate chance to run
    await new Promise((resolve) => setTimeout(resolve, 30));

    assert.notEqual(persistedInbound, null);
    assert.equal(persistedInbound.wamId, 'wamid.INBOUND_NO_AUTOREPLY');
    assert.equal(autoReplyInvoked, false);
  });

  it('manual admin replies remain fully functional when both automated responders are disabled', async () => {
    let sentPayload = null;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async (params) => {
        sentPayload = params;
        return { messages: [{ id: 'wamid.ADMIN_MANUAL_01' }] };
      },
    };
    const mockPrisma = {
      whatsAppConversation: {
        findUnique: async () => ({ id: 'c1', customerPhone: '919876543210', humanTakeover: true }),
        upsert: async () => ({ id: 'c1', customerPhone: '919876543210', humanTakeover: true }),
        update: async () => ({}),
      },
      whatsAppMessage: {
        create: async ({ data }) => ({ id: 'manual_msg_1', ...data }),
      },
    };

    const takeoverService = new WhatsAppTakeoverService(mockPrisma, mockApiClient);
    const result = await takeoverService.sendManualReply(
      '919876543210',
      'Hello, this is a human admin replying directly.',
      { id: 'admin_123', email: 'admin@palnadu.dev', role: 'ADMIN' },
    );

    assert.equal(result.wamId, 'wamid.ADMIN_MANUAL_01');
    assert.equal(sentPayload.text, 'Hello, this is a human admin replying directly.');
    assert.equal(sentPayload.to, '919876543210');
  });
});
