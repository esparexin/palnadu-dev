import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppAssistantService } = require('../dist/whatsapp/whatsapp-assistant.service.js');
const { WhatsAppTakeoverService } = require('../dist/whatsapp/whatsapp-takeover.service.js');
const { WhatsAppAutoReplyService } = require('../dist/whatsapp/whatsapp-auto-reply.service.js');
const { WhatsAppConversationService } = require('../dist/whatsapp/whatsapp-conversation.service.js');
const { WhatsAppEnquiryService } = require('../dist/whatsapp/whatsapp-enquiry.service.js');

describe('WhatsApp Takeover & Dispatch Concurrency Serialization E2E', () => {
  const createMockCluster = () => {
    const conversations = new Map();
    const messages = new Map();
    const dispatched = [];

    const mockPrisma = {
      whatsAppConversation: {
        findUnique: async ({ where }) =>
          (where.customerPhone ? conversations.get(where.customerPhone) : null) ||
          Array.from(conversations.values()).find((c) => c.id === where.id) || null,
        create: async ({ data }) => {
          const rec = {
            id: `c_${Date.now()}`,
            humanTakeover: false,
            dispatchLockOwner: null,
            dispatchLockExpiresAt: null,
            ...data,
          };
          conversations.set(data.customerPhone, rec);
          return rec;
        },
        update: async ({ where, data }) => {
          const rec =
            (where.customerPhone ? conversations.get(where.customerPhone) : null) ||
            Array.from(conversations.values()).find((c) => c.id === where.id);
          if (rec) Object.assign(rec, data);
          return rec || null;
        },
        upsert: async ({ where, create, update }) => {
          let rec = conversations.get(where.customerPhone);
          if (!rec) {
            rec = { id: `c_${Date.now()}`, ...create };
            conversations.set(where.customerPhone, rec);
          } else {
            Object.assign(rec, update);
          }
          return rec;
        },
        updateMany: async ({ where, data }) => {
          const rec = conversations.get(where.customerPhone);
          if (!rec) return { count: 0 };
          if (where.humanTakeover !== undefined && rec.humanTakeover !== where.humanTakeover) {
            return { count: 0 };
          }
          if (where.dispatchLockOwner && rec.dispatchLockOwner !== where.dispatchLockOwner) {
            return { count: 0 };
          }
          if (where.OR) {
            const now = new Date();
            const isNull = !rec.dispatchLockExpiresAt;
            const isExpired = rec.dispatchLockExpiresAt && rec.dispatchLockExpiresAt < now;
            if (!isNull && !isExpired) return { count: 0 };
          }
          Object.assign(rec, data);
          return { count: 1 };
        },
      },
      whatsAppMessage: {
        findFirst: async () => null,
        create: async ({ data }) => {
          const rec = { id: `msg_${Date.now()}_${Math.random()}`, ...data };
          messages.set(data.wamId, rec);
          return rec;
        },
        update: async ({ where, data }) => {
          const rec = Array.from(messages.values()).find((m) => m.id === where.id || m.wamId === where.wamId);
          if (rec) Object.assign(rec, data);
          return rec;
        },
        delete: async ({ where }) => {
          for (const [k, m] of messages.entries()) {
            if (m.id === where.id || m.wamId === where.wamId) {
              messages.delete(k);
              return m;
            }
          }
          return null;
        },
      },
      lead: { findUnique: async () => null, create: async ({ data }) => ({ id: 'lead_1', ...data }) },
    };

    const mockConfig = {
      get: (k) => (k === 'WHATSAPP_ASSISTANT_ENABLED' || k === 'WHATSAPP_AUTO_REPLY_ENABLED' ? 'true' : null),
    };

    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async ({ to, text, replyToWamId }) => {
        dispatched.push({ to, text, replyToWamId });
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: `wamid.OUT_${Date.now()}` }],
        };
      },
    };

    const enquiryService = new WhatsAppEnquiryService(mockPrisma, { create: async () => ({}) });
    const convService = new WhatsAppConversationService(enquiryService);
    const assistant = new WhatsAppAssistantService(mockPrisma, mockConfig, mockApiClient, convService);
    const takeover = new WhatsAppTakeoverService(mockPrisma, mockApiClient);
    const autoReply = new WhatsAppAutoReplyService(mockPrisma, mockConfig, mockApiClient);

    return { mockPrisma, assistant, takeover, autoReply, mockApiClient, conversations, messages, dispatched };
  };

  it('1. takeover waits for active in-flight Meta API dispatch to finish before confirming', async () => {
    const cluster = createMockCluster();
    let dispatchInProgress = false;
    let dispatchEnteredResolve;
    const dispatchEnteredPromise = new Promise((r) => { dispatchEnteredResolve = r; });

    // Simulate delayed external network call to Meta (takes 50ms)
    cluster.mockApiClient.sendTextMessage = async (args) => {
      dispatchInProgress = true;
      dispatchEnteredResolve();
      await new Promise((resolve) => setTimeout(resolve, 50));
      dispatchInProgress = false;
      cluster.dispatched.push(args);
      return { messages: [{ id: 'wamid.inflight_001' }] };
    };

    // Worker 1 starts automated dispatch
    const dispatchPromise = cluster.assistant.handleInboundMessage({
      from: '919030787819',
      body: '1',
      wamId: 'wamid.customer_msg_1',
      createdAt: new Date(),
    });

    // Deterministically wait until worker 1 has acquired lease and entered external send
    await dispatchEnteredPromise;
    assert.equal(dispatchInProgress, true, 'Dispatch must be in progress');

    // Admin simultaneously triggers takeover on another worker
    const takeoverPromise = cluster.takeover.setHumanTakeover('919030787819', true, {
      id: 'admin_1',
      name: 'Agent Support',
    });

    // Await both promises concurrently
    const [dispatchResult, takeoverResult] = await Promise.all([dispatchPromise, takeoverPromise]);

    assert.ok(dispatchResult, 'In-flight dispatch completed gracefully');
    assert.ok(takeoverResult, 'Takeover completed after drain');
    assert.equal(takeoverResult.humanTakeover, true);
    assert.equal(cluster.dispatched.length, 1);

    // Subsequent inbound message from customer must be immediately silenced
    const postTakeoverResult = await cluster.assistant.handleInboundMessage({
      from: '919030787819',
      body: '2',
      wamId: 'wamid.customer_msg_2',
      createdAt: new Date(),
    });
    assert.equal(postTakeoverResult, null, 'Future automated messages must be blocked');
    assert.equal(cluster.dispatched.length, 1);
  });

  it('2. queued automated messages are immediately suppressed once takeover activates', async () => {
    const cluster = createMockCluster();

    // Takeover active
    await cluster.takeover.setHumanTakeover('919030787819', true, { id: 'admin_1' });

    // Simulate 3 messages queued in background
    const results = await Promise.all([
      cluster.assistant.handleInboundMessage({ from: '919030787819', body: 'Hi 1', wamId: 'wamid.q1', createdAt: new Date() }),
      cluster.assistant.handleInboundMessage({ from: '919030787819', body: 'Hi 2', wamId: 'wamid.q2', createdAt: new Date() }),
      cluster.assistant.handleInboundMessage({ from: '919030787819', body: 'Hi 3', wamId: 'wamid.q3', createdAt: new Date() }),
    ]);

    assert.deepEqual(results, [null, null, null], 'All queued messages must be dropped');
    assert.equal(cluster.dispatched.length, 0);
  });

  it('3. releases dispatch lease in finally block when Meta API throws an error', async () => {
    const cluster = createMockCluster();

    // Mock API client throwing network 500 error
    cluster.mockApiClient.sendTextMessage = async () => {
      throw new Error('Meta API 500 Network Timeout');
    };

    const res = await cluster.assistant.handleInboundMessage({
      from: '919030787819',
      body: '1',
      wamId: 'wamid.err_msg_1',
      createdAt: new Date(),
    });
    assert.equal(res, null);

    // Verify dispatch lease was cleaned up and not leaked
    const conv = cluster.conversations.get('919030787819');
    assert.equal(conv.dispatchLockOwner, null, 'Lease must be released in finally block');

    // Admin can immediately take over without waiting for drain timeout
    const takeoverRes = await cluster.takeover.setHumanTakeover('919030787819', true, { id: 'admin_1' });
    assert.equal(takeoverRes.humanTakeover, true);
  });

  it('4. legacy auto-reply respects dispatch lock and cannot send when takeover is active', async () => {
    const cluster = createMockCluster();

    // Human takeover enabled
    await cluster.takeover.setHumanTakeover('919030787819', true, { id: 'admin_1' });

    // Inbound message arrives when assistant is disabled
    const reply = await cluster.autoReply.handleAutoReply({
      from: '919030787819',
      body: 'Inquiry',
      wamId: 'wamid.inbound_ar_1',
      direction: 'INBOUND',
      createdAt: new Date(),
    });

    assert.equal(reply, null, 'Legacy auto-reply must respect takeover lock');
    assert.equal(cluster.dispatched.length, 0);
  });
});
