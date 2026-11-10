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
      sendTextMessage: async (p) => {
        sentParams = p;
        return { contacts: [{ input: p.to, wa_id: p.to }], messages: [{ id: 'wamid.OUTBOUND_ACK_1' }] };
      },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async () => null,
        create: async ({ data }) => (createdOutbound = { id: 'out_1', ...data }),
        update: async ({ data }) => (createdOutbound = { ...createdOutbound, ...data }),
      },
    };

    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());

    assert.notEqual(result, null);
    assert.equal(sentParams.to, '919876543210');
    assert.equal(sentParams.replyToWamId, 'wamid.INBOUND_123');
    assert.match(sentParams.text, /Thank you for reaching out to Palnadu!/);
    assert.equal(createdOutbound.wamId, 'wamid.OUTBOUND_ACK_1');
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
        update: async ({ data }) => ({ id: 'out_2', ...data }),
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
    const service = new WhatsAppAutoReplyService({}, createMockConfig({ WHATSAPP_AUTO_REPLY_ENABLED: 'false' }), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
    assert.equal(sendAttempted, false);
  });

  it('skips auto-reply when outside 24-hour customer service window', async () => {
    let sendAttempted = false;
    const mockApiClient = { isConfigured: () => true, sendTextMessage: async () => { sendAttempted = true; } };
    const service = new WhatsAppAutoReplyService({}, createMockConfig(), mockApiClient);
    const staleInbound = createInboundMessage({ statusTimestamp: new Date(Date.now() - 25 * 60 * 60 * 1000) });
    const result = await service.handleAutoReply(staleInbound);
    assert.equal(result, null);
    assert.equal(sendAttempted, false);
  });

  it('skips auto-reply if an outbound reply already exists for this exact wamId', async () => {
    let sendAttempted = false;
    const mockApiClient = { isConfigured: () => true, sendTextMessage: async () => { sendAttempted = true; } };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async ({ where }) => (where.contextWamId === 'wamid.INBOUND_123' ? { id: 'out_prev' } : null),
      },
    };
    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
    assert.equal(sendAttempted, false);
  });

  it('skips auto-reply if customer received an outbound message within 24h cooldown', async () => {
    let sendAttempted = false;
    const mockApiClient = { isConfigured: () => true, sendTextMessage: async () => { sendAttempted = true; } };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async ({ where }) => (where.to === '919876543210' && where.direction === 'OUTBOUND' ? { id: 'recent_1' } : null),
      },
    };
    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
    assert.equal(sendAttempted, false);
  });

  it('intercepts multi-instance race when atomic claim encounters P2002 duplicate key', async () => {
    let sendAttempted = false;
    const mockApiClient = { isConfigured: () => true, sendTextMessage: async () => { sendAttempted = true; } };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async () => null,
        create: async () => {
          const p2002 = new Error('Unique constraint violation on wam_id');
          p2002.code = 'P2002';
          throw p2002;
        },
      },
    };
    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
    assert.equal(sendAttempted, false);
  });

  it('marks claim record FAILED when Meta API send fails without throwing unhandled error', async () => {
    let updatedStatus = null;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => { throw new Error('Meta API 500 server error'); },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async () => null,
        create: async ({ data }) => ({ id: 'claim_1', ...data }),
        update: async ({ data }) => { updatedStatus = data.status; },
      },
    };
    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(result, null);
    assert.equal(updatedStatus, 'FAILED');
  });

  it('prevents concurrent in-flight auto-reply dispatches for the same wamId in single process', async () => {
    let callCount = 0;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => {
        callCount++;
        await new Promise((r) => setTimeout(r, 20));
        return { messages: [{ id: 'wamid.CONCURRENT_ACK' }] };
      },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async () => null,
        create: async ({ data }) => ({ id: 'out_c', ...data }),
        update: async ({ data }) => ({ id: 'out_c', ...data }),
      },
    };
    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const inbound = createInboundMessage();
    const [res1, res2] = await Promise.all([service.handleAutoReply(inbound), service.handleAutoReply(inbound)]);
    assert.equal(callCount, 1);
    assert.notEqual(res1 || res2, null);
  });

  it('does not suppress auto-replies when prior outbound message failed', async () => {
    let sentAttempted = false;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => {
        sentAttempted = true;
        return { messages: [{ id: 'wamid.RETRY_SUCCESS' }] };
      },
    };
    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async ({ where }) => (where.status?.not === 'FAILED' ? null : { id: 'f', status: 'FAILED' }),
        create: async ({ data }) => ({ id: 'out_after_fail', ...data }),
        update: async ({ data }) => ({ id: 'out_after_fail', ...data }),
      },
    };
    const service = new WhatsAppAutoReplyService(mockPrisma, createMockConfig(), mockApiClient);
    const result = await service.handleAutoReply(createInboundMessage());
    assert.equal(sentAttempted, true);
    assert.notEqual(result, null);
  });

  it('updates auto-replied message status from SENT to DELIVERED to READ', async () => {
    let messageStore = { id: 'out_track_1', wamId: 'wamid.OUTBOUND_ACK_1', direction: 'OUTBOUND', status: 'SENT' };
    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => messageStore,
        update: async ({ data }) => (messageStore = { ...messageStore, ...data }),
      },
    };
    const messageService = new WhatsAppMessageService(mockPrisma, { create: async () => ({}) });
    const delivered = await messageService.updateMessageStatus({
      wamId: 'wamid.OUTBOUND_ACK_1', recipientId: '919876543210', status: 'delivered',
    });
    assert.equal(delivered.status, 'DELIVERED');
    const read = await messageService.updateMessageStatus({
      wamId: 'wamid.OUTBOUND_ACK_1', recipientId: '919876543210', status: 'read',
    });
    assert.equal(read.status, 'READ');
  });
});
