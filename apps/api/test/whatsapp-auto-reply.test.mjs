import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppAutoReplyService } = require('../dist/whatsapp/whatsapp-auto-reply.service.js');
const { WhatsAppMessageService } = require('../dist/whatsapp/whatsapp-message.service.js');

describe('WhatsAppAutoReplyService - Customer Auto-Acknowledgment', () => {
  const createMockConfig = (overrides = {}) => ({
    get: (key) => (key in overrides ? overrides[key] : null),
  });

  const createInboundMessage = (overrides = {}) => ({
    id: 'msg_inbound_1',
    wamId: 'wamid.INBOUND_123',
    direction: 'INBOUND',
    from: '919876543210',
    to: '919030787819',
    type: 'text',
    body: 'Hello team',
    status: 'RECEIVED',
    statusTimestamp: new Date(),
    createdAt: new Date(),
    ...overrides,
  });

  it('replies with default acknowledgment when eligible message arrives', async () => {
    let sentParams = null;
    let createdOutbound = null;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async (params) => {
        sentParams = params;
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: params.to, wa_id: params.to }],
          messages: [{ id: 'wamid.OUTBOUND_ACK_1' }],
        };
      },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async () => null,
        create: async ({ data }) => {
          createdOutbound = { id: 'out_1', ...data };
          return createdOutbound;
        },
      },
    };

    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());

    assert.notEqual(result, null);
    assert.equal(sentParams.to, '919876543210');
    assert.equal(sentParams.replyToWamId, 'wamid.INBOUND_123');
    assert.match(sentParams.text, /Thank you for reaching out to Palnadu!/);
    assert.equal(createdOutbound.wamId, 'wamid.OUTBOUND_ACK_1');
    assert.equal(createdOutbound.direction, 'OUTBOUND');
    assert.equal(createdOutbound.contextWamId, 'wamid.INBOUND_123');
    assert.equal(createdOutbound.status, 'SENT');
  });

  it('supports custom acknowledgment message from config', async () => {
    let sentText = '';
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async (params) => {
        sentText = params.text;
        return { messages: [{ id: 'wamid.OUTBOUND_CUSTOM' }] };
      },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async () => null,
        create: async ({ data }) => ({ id: 'out_2', ...data }),
      },
    };

    const service = new WhatsAppAutoReplyService(
      mockPrisma,
      createMockConfig({ WHATSAPP_AUTO_REPLY_MESSAGE: 'Custom hello from Palnadu team!' }),
      mockApiClient,
    );

    await service.handleAutoReply(createInboundMessage());
    assert.equal(sentText, 'Custom hello from Palnadu team!');
  });

  it('skips auto-reply when disabled in configuration', async () => {
    let sendAttempted = false;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => { sendAttempted = true; },
    };
    const service = new WhatsAppAutoReplyService(
      {},
      createMockConfig({ WHATSAPP_AUTO_REPLY_ENABLED: 'false' }),
      mockApiClient,
    );

    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
    assert.equal(sendAttempted, false);
  });

  it('skips auto-reply when outside 24-hour customer service window', async () => {
    let sendAttempted = false;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => { sendAttempted = true; },
    };
    const service = new WhatsAppAutoReplyService({}, createMockConfig(), mockApiClient);
    const staleInbound = createInboundMessage({
      statusTimestamp: new Date(Date.now() - 25 * 60 * 60 * 1000),
    });

    const result = await service.handleAutoReply(staleInbound);
    assert.equal(result, null);
    assert.equal(sendAttempted, false);
  });

  it('skips auto-reply if an outbound reply already exists for this exact wamId', async () => {
    let sendAttempted = false;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => { sendAttempted = true; },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async ({ where }) =>
          where.contextWamId === 'wamid.INBOUND_123' ? { id: 'out_prev' } : null,
      },
    };

    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
    assert.equal(sendAttempted, false);
  });

  it('skips auto-reply if customer received an outbound message within 24h cooldown', async () => {
    let sendAttempted = false;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => { sendAttempted = true; },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async ({ where }) =>
          where.to === '919876543210' && where.direction === 'OUTBOUND' ? { id: 'recent_1' } : null,
      },
    };

    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
    assert.equal(sendAttempted, false);
  });

  it('handles Meta API send failure gracefully without throwing', async () => {
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => {
        throw new Error('Meta API connection reset');
      },
    };
    const mockPrisma = { whatsAppMessage: { findFirst: async () => null } };

    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
  });

  it('updates auto-replied message status from SENT to DELIVERED to READ', async () => {
    let messageStore = {
      id: 'out_track_1',
      wamId: 'wamid.OUTBOUND_ACK_1',
      direction: 'OUTBOUND',
      status: 'SENT',
      statusTimestamp: new Date(),
    };
    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => messageStore,
        update: async ({ data }) => {
          messageStore = { ...messageStore, ...data };
          return messageStore;
        },
      },
    };

    const messageService = new WhatsAppMessageService(mockPrisma, { create: async () => ({}) });

    const delivered = await messageService.updateMessageStatus({
      wamId: 'wamid.OUTBOUND_ACK_1',
      recipientId: '919876543210',
      status: 'delivered',
    });
    assert.equal(delivered.status, 'DELIVERED');

    const read = await messageService.updateMessageStatus({
      wamId: 'wamid.OUTBOUND_ACK_1',
      recipientId: '919876543210',
      status: 'read',
    });
    assert.equal(read.status, 'READ');
  });
});
