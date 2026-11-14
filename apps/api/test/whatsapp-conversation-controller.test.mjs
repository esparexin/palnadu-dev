import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppConversationController } = require('../dist/whatsapp/whatsapp-conversation.controller.js');
const { WhatsAppTakeoverService } = require('../dist/whatsapp/whatsapp-takeover.service.js');

describe('WhatsApp Admin Conversation Controller & Takeover API', () => {
  const createMockHarness = () => {
    const conversations = new Map();
    const messages = [];

    const mockPrisma = {
      whatsAppConversation: {
        findMany: async ({ skip = 0, take = 20, where = {} }) => {
          let list = Array.from(conversations.values());
          if (where.humanTakeover !== undefined) {
            list = list.filter((c) => c.humanTakeover === where.humanTakeover);
          }
          return list.slice(skip, skip + take);
        },
        count: async ({ where = {} }) => {
          let list = Array.from(conversations.values());
          if (where.humanTakeover !== undefined) {
            list = list.filter((c) => c.humanTakeover === where.humanTakeover);
          }
          return list.length;
        },
        findUnique: async ({ where }) => {
          if (where.customerPhone) return conversations.get(where.customerPhone) || null;
          return null;
        },
        upsert: async ({ where, create, update }) => {
          let rec = conversations.get(where.customerPhone);
          if (!rec) {
            rec = { id: `conv_${Date.now()}`, ...create };
            conversations.set(where.customerPhone, rec);
          } else {
            Object.assign(rec, update);
          }
          return rec;
        },
        update: async ({ where, data }) => {
          const rec = conversations.get(where.customerPhone);
          if (rec) Object.assign(rec, data);
          return rec;
        },
      },
      whatsAppMessage: {
        findMany: async ({ where }) => {
          return messages.filter(
            (m) =>
              (where.OR && where.OR.some((cond) => cond.from === m.from || cond.to === m.to)) ||
              m.from === where.from ||
              m.to === where.to,
          );
        },
        create: async ({ data }) => {
          const rec = { id: `msg_${Date.now()}`, createdAt: new Date(), ...data };
          messages.push(rec);
          return rec;
        },
      },
    };

    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async ({ to, text }) => ({
        messaging_product: 'whatsapp',
        contacts: [{ input: to, wa_id: to }],
        messages: [{ id: `wamid.OUT_${Date.now()}` }],
      }),
    };

    const takeoverService = new WhatsAppTakeoverService(mockPrisma, mockApiClient);
    const controller = new WhatsAppConversationController(takeoverService);

    return { controller, takeoverService, conversations, messages };
  };

  it('1. lists active conversations with pagination', async () => {
    const { controller, conversations } = createMockHarness();
    conversations.set('919030787819', {
      id: 'c1',
      customerPhone: '919030787819',
      customerName: 'Gopi Krishna',
      humanTakeover: false,
      state: 'AWAITING_SUBMENU',
    });

    const res = await controller.listConversations({ page: 1, limit: 10 });
    assert.equal(res.success, true);
    assert.equal(res.total, 1);
    assert.equal(res.data[0].customerPhone, '919030787819');
  });

  it('2. retrieves conversation details and message history', async () => {
    const { controller, conversations, messages } = createMockHarness();
    conversations.set('919030787819', {
      id: 'c1',
      customerPhone: '919030787819',
      humanTakeover: false,
      state: 'IDLE',
    });
    messages.push({
      id: 'm1',
      wamId: 'wamid.1',
      from: '919030787819',
      to: 'palnadu_business',
      body: 'Need help with app',
      direction: 'INBOUND',
      createdAt: new Date(),
    });

    const res = await controller.getConversation('919030787819');
    assert.equal(res.success, true);
    assert.ok(res.data.conversation);
    assert.equal(res.data.messages.length, 1);
    assert.equal(res.data.messages[0].body, 'Need help with app');
  });

  it('3. toggles human takeover via admin API', async () => {
    const { controller, conversations } = createMockHarness();
    conversations.set('919030787819', {
      id: 'c1',
      customerPhone: '919030787819',
      humanTakeover: false,
      state: 'IDLE',
    });

    const res = await controller.toggleTakeover(
      '919030787819',
      { enabled: true },
      { user: { id: 'admin_123', name: 'Ramesh Admin', email: 'ramesh@palnadu.dev' } },
    );

    assert.equal(res.success, true);
    assert.equal(res.data.humanTakeover, true);
    assert.equal(res.data.takenOverByName, 'Ramesh Admin');
  });

  it('4. sends manual reply and ensures human takeover is persisted', async () => {
    const { controller, conversations, messages } = createMockHarness();
    conversations.set('919030787819', {
      id: 'c1',
      customerPhone: '919030787819',
      humanTakeover: false,
      state: 'IDLE',
    });

    const res = await controller.sendManualReply(
      '919030787819',
      { text: 'Hello! I am Ramesh from Palnadu team, assisting you directly.' },
      { user: { id: 'admin_123', name: 'Ramesh Admin' } },
    );

    assert.equal(res.success, true);
    assert.equal(res.data.direction, 'OUTBOUND');
    assert.equal(res.data.body, 'Hello! I am Ramesh from Palnadu team, assisting you directly.');

    const conv = conversations.get('919030787819');
    assert.equal(conv.humanTakeover, true);
  });
});
