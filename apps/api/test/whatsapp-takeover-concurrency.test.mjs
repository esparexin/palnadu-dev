import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppAssistantService } = require('../dist/whatsapp/whatsapp-assistant.service.js');
const { WhatsAppTakeoverService } = require('../dist/whatsapp/whatsapp-takeover.service.js');
const { WhatsAppConversationService } = require('../dist/whatsapp/whatsapp-conversation.service.js');
const { WhatsAppEnquiryService } = require('../dist/whatsapp/whatsapp-enquiry.service.js');

describe('WhatsApp Human Takeover, Concurrency & Feature Flags', () => {
  const createMockEnvironment = (initialAssistantEnabled = 'true') => {
    const conversations = new Map();
    const messages = new Map();
    const dispatchedTexts = [];

    const mockPrisma = {
      whatsAppConversation: {
        findUnique: async ({ where }) => {
          if (where.customerPhone) return conversations.get(where.customerPhone) || null;
          if (where.id) {
            for (const c of conversations.values()) {
              if (c.id === where.id) return c;
            }
          }
          return null;
        },
        create: async ({ data }) => {
          const rec = { id: `conv_${Date.now()}`, humanTakeover: false, ...data };
          conversations.set(data.customerPhone, rec);
          return rec;
        },
        update: async ({ where, data }) => {
          let rec = null;
          if (where.id) {
            for (const c of conversations.values()) {
              if (c.id === where.id) { rec = c; break; }
            }
          } else if (where.customerPhone) {
            rec = conversations.get(where.customerPhone);
          }
          if (rec) {
            Object.assign(rec, data);
            return rec;
          }
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
        findMany: async () => Array.from(conversations.values()),
        count: async () => conversations.size,
      },
      whatsAppMessage: {
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
        findMany: async () => Array.from(messages.values()),
      },
      lead: { findUnique: async () => null, create: async ({ data }) => ({ id: 'lead_1', ...data }) },
    };

    let assistantFlag = initialAssistantEnabled;
    const mockConfig = {
      get: (key) => {
        if (key === 'WHATSAPP_ASSISTANT_ENABLED') return assistantFlag;
        return null;
      },
      setAssistantFlag: (val) => { assistantFlag = val; },
    };

    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async ({ to, text }) => {
        dispatchedTexts.push({ to, text });
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: `wamid.OUT_${Date.now()}` }],
        };
      },
    };

    const enquiryService = new WhatsAppEnquiryService(mockPrisma, { create: async () => ({}) });
    const conversationService = new WhatsAppConversationService(enquiryService);
    const assistantService = new WhatsAppAssistantService(
      mockPrisma,
      mockConfig,
      mockApiClient,
      conversationService,
    );
    const takeoverService = new WhatsAppTakeoverService(mockPrisma, mockApiClient);

    return {
      mockPrisma,
      mockConfig,
      mockApiClient,
      assistantService,
      takeoverService,
      conversations,
      messages,
      dispatchedTexts,
    };
  };

  it('1. WHATSAPP_ASSISTANT_ENABLED defaults to false and does not send messages unless true', async () => {
    // Config unset or 'false'
    const envDisabled = createMockEnvironment('false');
    assert.equal(envDisabled.assistantService.isEnabled(), false);

    const result = await envDisabled.assistantService.handleInboundMessage({
      from: '919030787819',
      body: 'Hello',
      wamId: 'wamid.disabled_001',
    });
    assert.equal(result, null);
    assert.equal(envDisabled.dispatchedTexts.length, 0);

    // Explicitly set to 'true'
    const envEnabled = createMockEnvironment('true');
    assert.equal(envEnabled.assistantService.isEnabled(), true);
  });

  it('2. suppresses bot reply completely when human takeover is active', async () => {
    const env = createMockEnvironment('true');

    // Enable takeover for 919030787819
    await env.takeoverService.setHumanTakeover('919030787819', true, {
      id: 'admin_1',
      name: 'Agent Support',
    });

    const result = await env.assistantService.handleInboundMessage({
      from: '919030787819',
      body: 'Hello, need help',
      wamId: 'wamid.takeover_inbound_001',
    });

    assert.equal(result, null);
    assert.equal(env.dispatchedTexts.length, 0, 'No bot messages should be sent during takeover');
  });

  it('3. aborts outbound dispatch if human takeover is activated concurrently right before send', async () => {
    const env = createMockEnvironment('true');

    // Create initial conversation record
    env.conversations.set('919030787819', {
      id: 'conv_123',
      customerPhone: '919030787819',
      humanTakeover: false,
      state: 'IDLE',
    });

    // Simulate takeover happening during processing
    const origFindUnique = env.mockPrisma.whatsAppConversation.findUnique;
    let checkCount = 0;
    env.mockPrisma.whatsAppConversation.findUnique = async (args) => {
      checkCount++;
      const res = await origFindUnique(args);
      // On second lookup (atomic pre-dispatch check), simulate another thread toggled takeover
      if (checkCount >= 2 && res) {
        res.humanTakeover = true;
      }
      return res;
    };

    const result = await env.assistantService.handleInboundMessage({
      from: '919030787819',
      body: 'Hello',
      wamId: 'wamid.race_check_001',
    });

    assert.equal(result, null);
    assert.equal(env.dispatchedTexts.length, 0, 'Outbound bot dispatch must be aborted if takeover flipped');
  });

  it('4. allows human agent to send manual replies and keeps takeover active', async () => {
    const env = createMockEnvironment('true');

    const reply = await env.takeoverService.sendManualReply(
      '919030787819',
      'Hello from Palnadu team! How can we help you directly?',
      { id: 'admin_1', name: 'Agent Support' },
    );

    assert.ok(reply);
    assert.equal(env.dispatchedTexts.length, 1);
    assert.equal(env.dispatchedTexts[0].to, '919030787819');
    assert.match(env.dispatchedTexts[0].text, /Hello from Palnadu team/);

    const conv = env.conversations.get('919030787819');
    assert.ok(conv);
    assert.equal(conv.humanTakeover, true);
  });

  it('5. resumes bot replies when explicit resume action is performed', async () => {
    const env = createMockEnvironment('true');

    // Takeover active
    await env.takeoverService.setHumanTakeover('919030787819', true, { id: 'admin_1' });

    // Explicit resume
    await env.takeoverService.setHumanTakeover('919030787819', false, { id: 'admin_1' });

    const result = await env.assistantService.handleInboundMessage({
      from: '919030787819',
      body: 'Hello again',
      wamId: 'wamid.resumed_001',
    });

    assert.ok(result);
    assert.equal(env.dispatchedTexts.length, 1);
    assert.match(env.dispatchedTexts[0].text, /Welcome to Palnadu\.dev/);
  });
});
