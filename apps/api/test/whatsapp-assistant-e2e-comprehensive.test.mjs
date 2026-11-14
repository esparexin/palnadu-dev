import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppConversationService } = require('../dist/whatsapp/whatsapp-conversation.service.js');
const { WhatsAppEnquiryService } = require('../dist/whatsapp/whatsapp-enquiry.service.js');
const { WhatsAppAssistantService } = require('../dist/whatsapp/whatsapp-assistant.service.js');
const { WhatsAppTakeoverService } = require('../dist/whatsapp/whatsapp-takeover.service.js');
const { PALNADU_SUPPORT_PHONE, APPROVED_MAIN_MENU } = require('../dist/whatsapp/whatsapp-menu.constants.js');

describe('WhatsApp Conversational Assistant - Comprehensive E2E Verification', () => {
  const createHarness = (assistantFlag = 'true') => {
    const leads = new Map();
    const notifications = [];
    const conversations = new Map();
    const messages = new Map();
    const outboundDispatches = [];

    const mockPrisma = {
      lead: {
        findUnique: async ({ where }) => (where.whatsappWamId ? leads.get(where.whatsappWamId) || null : null),
        create: async ({ data }) => {
          const rec = { id: `lead_${Date.now()}`, ...data };
          leads.set(data.whatsappWamId, rec);
          return rec;
        },
      },
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
          const rec = conversations.get(where.customerPhone) || Array.from(conversations.values()).find((c) => c.id === where.id);
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
          const rec = { id: `msg_${Date.now()}`, ...data };
          messages.set(data.wamId, rec);
          return rec;
        },
        update: async ({ where, data }) => {
          const rec = Array.from(messages.values()).find((m) => m.id === where.id || m.wamId === where.wamId);
          if (rec) Object.assign(rec, data);
          return rec;
        },
        delete: async () => null,
      },
    };

    const mockNotifications = {
      create: async (notif) => {
        notifications.push(notif);
        return { id: `notif_${Date.now()}`, ...notif };
      },
    };

    const mockConfig = {
      get: (k) => {
        if (k === 'WHATSAPP_ASSISTANT_ENABLED') return assistantFlag;
        return null;
      },
    };

    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async ({ to, text, replyToWamId }) => {
        outboundDispatches.push({ to, text, replyToWamId });
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: to, wa_id: to }],
          messages: [{ id: `wamid.OUT_${Date.now()}` }],
        };
      },
    };

    const enquiryService = new WhatsAppEnquiryService(mockPrisma, mockNotifications);
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
      enquiryService,
      conversationService,
      assistantService,
      takeoverService,
      leads,
      notifications,
      conversations,
      messages,
      outboundDispatches,
    };
  };

  it('verifies all 5 category submenus and direct contact support from each submenu', async () => {
    const { conversationService } = createHarness();

    // Verify each category from 1 to 5
    for (const cat of APPROVED_MAIN_MENU.slice(0, 5)) {
      // 1. Select category
      const step1 = await conversationService.processCustomerMessage(
        { body: cat.id, from: '919030787819', wamId: `wamid.cat_${cat.id}` },
        { state: 'AWAITING_CATEGORY', customerPhone: '919030787819' },
      );
      assert.equal(step1.nextState, 'AWAITING_SUBMENU');
      assert.equal(step1.selectedCategory, cat.id);

      // Verify each suboption
      for (const sub of cat.suboptions) {
        const step2 = await conversationService.processCustomerMessage(
          { body: sub.id, from: '919030787819', wamId: `wamid.sub_${cat.id}_${sub.id}` },
          { state: 'AWAITING_SUBMENU', selectedCategory: cat.id, customerPhone: '919030787819' },
        );

        if (sub.isSupport) {
          assert.equal(step2.nextState, 'IDLE');
          assert.match(step2.responseText, /\+91 90307 87819/);
          assert.match(step2.responseText, /Don't hesitate to reach out to us anytime!/);
        } else {
          assert.equal(step2.nextState, 'AWAITING_REQUIREMENT');
          assert.match(step2.responseText, /Please briefly describe what you need/);
        }
      }
    }
  });

  it('verifies Option 6 sends direct contact response immediately without submenu', async () => {
    const { conversationService } = createHarness();
    const res = await conversationService.processCustomerMessage(
      { body: '6', from: '919030787819', wamId: 'wamid.opt6' },
      { state: 'AWAITING_CATEGORY', customerPhone: '919030787819' },
    );
    assert.equal(res.nextState, 'IDLE');
    assert.match(res.responseText, /\+91 90307 87819/);
    assert.match(res.responseText, /Don't hesitate to reach out to us anytime!/);
  });

  it('verifies Telugu numerals and words work identically to ASCII digits', async () => {
    const { conversationService } = createHarness();

    // Telugu numeral ౧ for category 1
    const step1 = await conversationService.processCustomerMessage(
      { body: '౧', from: '919030787819', wamId: 'wamid.te_1' },
      { state: 'AWAITING_CATEGORY', customerPhone: '919030787819' },
    );
    assert.equal(step1.nextState, 'AWAITING_SUBMENU');
    assert.equal(step1.selectedCategory, '1');

    // Telugu numeral ౩ for option 3 (Contact Support)
    const step2 = await conversationService.processCustomerMessage(
      { body: '౩', from: '919030787819', wamId: 'wamid.te_sub3' },
      { state: 'AWAITING_SUBMENU', selectedCategory: '1', customerPhone: '919030787819' },
    );
    assert.equal(step2.nextState, 'IDLE');
    assert.match(step2.responseText, /\+91 90307 87819/);
  });

  it('verifies durable enquiry idempotency and notification dispatch', async () => {
    const { conversationService, leads, notifications } = createHarness();

    const conv = {
      state: 'AWAITING_REQUIREMENT',
      selectedCategory: '3',
      selectedSubmenu: '1',
      customerPhone: '919030787819',
      customerName: 'Narasimha Rao',
    };

    const msg = {
      body: 'Need WhatsApp automation for our diagnostic lab reports in Narasaraopet.',
      from: '919030787819',
      wamId: 'wamid.DURABLE_LEAD_001',
    };

    const first = await conversationService.processCustomerMessage(msg, conv);
    assert.equal(first.nextState, 'IDLE');
    assert.match(first.responseText, /Thank you! We have received your requirements/);
    assert.equal(leads.size, 1);
    assert.equal(notifications.length, 1);
    assert.equal(leads.get('wamid.DURABLE_LEAD_001').requiredHelp, 'AUTOMATION');

    // Duplicate webhook delivery with identical wamId
    const retry = await conversationService.processCustomerMessage(msg, conv);
    assert.equal(retry.nextState, 'IDLE');
    assert.equal(leads.size, 1, 'Durable idempotency: must not create duplicate lead');
    assert.equal(notifications.length, 1, 'Durable idempotency: must not fire duplicate notification');
  });

  it('verifies human takeover stops bot dispatch and resumption restores it', async () => {
    const { assistantService, takeoverService, outboundDispatches } = createHarness();

    // 1. Takeover enabled
    await takeoverService.setHumanTakeover('919030787819', true, { id: 'admin_1', name: 'Support' });

    // Inbound customer message arrives during takeover
    const botRes = await assistantService.handleInboundMessage({
      from: '919030787819',
      body: 'Need urgent help',
      wamId: 'wamid.takeover_msg_1',
    });
    assert.equal(botRes, null);
    assert.equal(outboundDispatches.length, 0);

    // 2. Manual agent reply
    await takeoverService.sendManualReply('919030787819', 'Hi! Human agent here.', { id: 'admin_1' });
    assert.equal(outboundDispatches.length, 1);
    assert.match(outboundDispatches[0].text, /Human agent here/);

    // 3. Resume bot
    await takeoverService.setHumanTakeover('919030787819', false, { id: 'admin_1' });
    const resumed = await assistantService.handleInboundMessage({
      from: '919030787819',
      body: '1',
      wamId: 'wamid.resumed_msg_2',
    });
    assert.ok(resumed);
    assert.equal(outboundDispatches.length, 2);
  });
});
