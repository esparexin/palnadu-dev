import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppAssistantService } = require('../dist/whatsapp/whatsapp-assistant.service.js');
const { WhatsAppTakeoverService } = require('../dist/whatsapp/whatsapp-takeover.service.js');
const { WhatsAppAutoReplyService } = require('../dist/whatsapp/whatsapp-auto-reply.service.js');
const { WhatsAppConversationService } = require('../dist/whatsapp/whatsapp-conversation.service.js');
const { WhatsAppEnquiryService } = require('../dist/whatsapp/whatsapp-enquiry.service.js');

describe('WhatsApp Compliance, Concurrency & Takeover Guarantees', () => {
  const setupEnv = (assistantEnabled = 'true') => {
    const conversations = new Map();
    const messages = new Map();
    const dispatched = [];
    const leads = new Map();

    const mockPrisma = {
      whatsAppConversation: {
        findUnique: async ({ where }) =>
          (where.customerPhone ? conversations.get(where.customerPhone) : null) ||
          Array.from(conversations.values()).find((c) => c.id === where.id) || null,
        create: async ({ data }) => {
          const rec = { id: `conv_${Date.now()}`, humanTakeover: false, state: 'IDLE', ...data };
          conversations.set(data.customerPhone, rec);
          return rec;
        },
        update: async ({ where, data }) => {
          const rec = (where.customerPhone ? conversations.get(where.customerPhone) : null) ||
            Array.from(conversations.values()).find((c) => c.id === where.id);
          if (rec) Object.assign(rec, data);
          return rec;
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
      lead: {
        findUnique: async ({ where }) => (where.whatsappWamId ? leads.get(where.whatsappWamId) || null : null),
        create: async ({ data }) => {
          const rec = { id: `lead_${Date.now()}`, ...data };
          leads.set(data.whatsappWamId, rec);
          return rec;
        },
      },
    };

    const mockConfig = {
      get: (k) => {
        if (k === 'WHATSAPP_ASSISTANT_ENABLED') return assistantEnabled;
        if (k === 'WHATSAPP_AUTO_REPLY_ENABLED') return 'true';
        return null;
      },
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

    return { mockPrisma, assistant, takeover, autoReply, conversations, messages, dispatched };
  };

  it('1. suppresses assistant reply when inbound message exceeds 24-hour service window', async () => {
    const env = setupEnv('true');
    const oldTimestamp = new Date(Date.now() - 25 * 60 * 60 * 1000); // 25 hours old

    const res = await env.assistant.handleInboundMessage({
      from: '919030787819',
      body: '1',
      wamId: 'wamid.stale_001',
      createdAt: oldTimestamp,
      statusTimestamp: oldTimestamp,
    });

    assert.equal(res, null, 'Must not respond to messages outside 24h window');
    assert.equal(env.dispatched.length, 0);
  });

  it('2. suppresses assistant reply on inbound opt-out keyword (STOP / ఆపండి)', async () => {
    const env = setupEnv('true');

    const res1 = await env.assistant.handleInboundMessage({
      from: '919030787819',
      body: 'STOP',
      wamId: 'wamid.optout_en_001',
      createdAt: new Date(),
    });
    assert.equal(res1, null, 'Must suppress on English STOP');

    const res2 = await env.assistant.handleInboundMessage({
      from: '919030787819',
      body: 'ఆపండి',
      wamId: 'wamid.optout_te_001',
      createdAt: new Date(),
    });
    assert.equal(res2, null, 'Must suppress on Telugu opt-out keyword');
    assert.equal(env.dispatched.length, 0);
  });

  it('3. activates human takeover BEFORE external API dispatch in sendManualReply', async () => {
    const env = setupEnv('true');
    let takeoverStateAtSendTime = null;

    // Intercept sendTextMessage to inspect database state at the exact moment dispatch occurs
    const origSend = env.takeover['apiClient'].sendTextMessage;
    env.takeover['apiClient'].sendTextMessage = async (args) => {
      const conv = env.conversations.get('919030787819');
      takeoverStateAtSendTime = conv?.humanTakeover;
      return origSend.call(env.takeover['apiClient'], args);
    };

    await env.takeover.sendManualReply(
      '919030787819',
      'Team here, assisting directly.',
      { id: 'admin_1', name: 'Support Rep' },
    );

    assert.equal(takeoverStateAtSendTime, true, 'Takeover must be active BEFORE sendTextMessage executes');
  });

  it('4. suppresses legacy auto-reply when human takeover is active in conversation', async () => {
    const env = setupEnv('false'); // Assistant disabled -> auto-reply path

    // Put conversation into takeover
    await env.takeover.setHumanTakeover('919030787819', true, { id: 'admin_1' });

    const reply = await env.autoReply.handleAutoReply({
      from: '919030787819',
      body: 'Hello',
      wamId: 'wamid.auto_suppressed_001',
      direction: 'INBOUND',
      createdAt: new Date(),
    });

    assert.equal(reply, null, 'Legacy auto-reply must be suppressed when human takeover is active');
    assert.equal(env.dispatched.length, 0);
  });

  it('5. atomic claim guard deletes in-flight claim if takeover flipped right before send', async () => {
    const env = setupEnv('true');

    // Simulate takeover toggled concurrently right before external dispatch
    let findUniqueCalls = 0;
    const origFindUnique = env.mockPrisma.whatsAppConversation.findUnique;
    env.mockPrisma.whatsAppConversation.findUnique = async (args) => {
      findUniqueCalls++;
      const res = await origFindUnique(args);
      // On second check (pre-dispatch verification), simulate another thread toggled takeover
      if (findUniqueCalls >= 2 && res) {
        res.humanTakeover = true;
      }
      return res;
    };

    const res = await env.assistant.handleInboundMessage({
      from: '919030787819',
      body: '1',
      wamId: 'wamid.claim_cleanup_001',
      createdAt: new Date(),
    });

    assert.equal(res, null, 'Must abort send');
    assert.equal(env.dispatched.length, 0);
    // Verify claim record was cleaned up so no orphan bot_claim remains in DB
    const claim = env.messages.get('bot_claim:wamid.claim_cleanup_001');
    assert.equal(claim, undefined, 'Claim record must be cleaned up on aborted takeover');
  });
});
