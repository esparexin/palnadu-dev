import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppConversationService } = require('../dist/whatsapp/whatsapp-conversation.service.js');
const { WhatsAppEnquiryService } = require('../dist/whatsapp/whatsapp-enquiry.service.js');
const { PALNADU_SUPPORT_PHONE } = require('../dist/whatsapp/whatsapp-menu.constants.js');

describe('WhatsApp Conversational Assistant State Machine & Idempotency', () => {
  const createMockDb = () => {
    const leads = new Map();
    const notifications = [];

    const mockPrisma = {
      lead: {
        findUnique: async ({ where }) => {
          if (where.whatsappWamId) return leads.get(where.whatsappWamId) || null;
          return null;
        },
        create: async ({ data }) => {
          const rec = { id: `lead_${Date.now()}`, ...data };
          leads.set(data.whatsappWamId, rec);
          return rec;
        },
      },
    };

    const mockNotifications = {
      create: async (notif) => {
        notifications.push(notif);
        return { id: `notif_${Date.now()}`, ...notif };
      },
    };

    return { mockPrisma, mockNotifications, leads, notifications };
  };

  it('1. sends Main Menu for unknown greeting in IDLE state', async () => {
    const { mockPrisma, mockNotifications } = createMockDb();
    const enquiryService = new WhatsAppEnquiryService(mockPrisma, mockNotifications);
    const conversationService = new WhatsAppConversationService(enquiryService);

    const result = await conversationService.processCustomerMessage(
      { body: 'Hello', from: '919030787819', wamId: 'wamid.1' },
      { state: 'IDLE', customerPhone: '919030787819' },
    );

    assert.equal(result.nextState, 'AWAITING_CATEGORY');
    assert.match(result.responseText, /Welcome to Palnadu\.dev/);
    assert.match(result.responseText, /1\. Website & Web Applications/);
  });

  it('2. selects Category 1 and transitions to AWAITING_SUBMENU', async () => {
    const { mockPrisma, mockNotifications } = createMockDb();
    const enquiryService = new WhatsAppEnquiryService(mockPrisma, mockNotifications);
    const conversationService = new WhatsAppConversationService(enquiryService);

    const result = await conversationService.processCustomerMessage(
      { body: '1', from: '919030787819', wamId: 'wamid.2' },
      { state: 'AWAITING_CATEGORY', customerPhone: '919030787819' },
    );

    assert.equal(result.nextState, 'AWAITING_SUBMENU');
    assert.equal(result.selectedCategory, '1');
    assert.match(result.responseText, /Business \/ Corporate Website/);
    assert.match(result.responseText, /E-commerce \/ Web Application/);
    assert.match(result.responseText, /Contact Support/);
  });

  it('3. selecting Option 6 in main menu immediately sends Direct Contact Support without submenu', async () => {
    const { mockPrisma, mockNotifications } = createMockDb();
    const enquiryService = new WhatsAppEnquiryService(mockPrisma, mockNotifications);
    const conversationService = new WhatsAppConversationService(enquiryService);

    const result = await conversationService.processCustomerMessage(
      { body: '6', from: '919030787819', wamId: 'wamid.3' },
      { state: 'AWAITING_CATEGORY', customerPhone: '919030787819' },
    );

    assert.equal(result.nextState, 'IDLE');
    assert.match(result.responseText, /Don't hesitate to reach out to us anytime!/);
    assert.match(result.responseText, /\+91 90307 87819/);
    assert.doesNotMatch(result.responseText, /Please choose a specific service/);
  });

  it('4. selecting Contact Support in Category 2 submenu immediately sends Direct Contact Support', async () => {
    const { mockPrisma, mockNotifications } = createMockDb();
    const enquiryService = new WhatsAppEnquiryService(mockPrisma, mockNotifications);
    const conversationService = new WhatsAppConversationService(enquiryService);

    // Category 2: 1 is Android/iOS, 2 is Contact Support
    const result = await conversationService.processCustomerMessage(
      { body: '2', from: '919030787819', wamId: 'wamid.4' },
      { state: 'AWAITING_SUBMENU', selectedCategory: '2', customerPhone: '919030787819' },
    );

    assert.equal(result.nextState, 'IDLE');
    assert.match(result.responseText, /Don't hesitate to reach out to us anytime!/);
    assert.match(result.responseText, /\+91 90307 87819/);
  });

  it('5. selecting non-support submenu option prompts for brief requirements', async () => {
    const { mockPrisma, mockNotifications } = createMockDb();
    const enquiryService = new WhatsAppEnquiryService(mockPrisma, mockNotifications);
    const conversationService = new WhatsAppConversationService(enquiryService);

    const result = await conversationService.processCustomerMessage(
      { body: '1', from: '919030787819', wamId: 'wamid.5' },
      { state: 'AWAITING_SUBMENU', selectedCategory: '1', customerPhone: '919030787819' },
    );

    assert.equal(result.nextState, 'AWAITING_REQUIREMENT');
    assert.equal(result.selectedCategory, '1');
    assert.equal(result.selectedSubmenu, '1');
    assert.match(result.responseText, /Please briefly describe what you need/);
  });

  it('6. saves free-text enquiry with durable wamId idempotency and dispatches notification', async () => {
    const { mockPrisma, mockNotifications, leads, notifications } = createMockDb();
    const enquiryService = new WhatsAppEnquiryService(mockPrisma, mockNotifications);
    const conversationService = new WhatsAppConversationService(enquiryService);

    const conv = {
      state: 'AWAITING_REQUIREMENT',
      selectedCategory: '1',
      selectedSubmenu: '1',
      customerPhone: '919030787819',
      customerName: 'Suresh Kumar',
    };

    const result = await conversationService.processCustomerMessage(
      {
        body: 'We need an e-commerce website for our spices business in Chilakaluripet.',
        from: '919030787819',
        profileName: 'Suresh Kumar',
        wamId: 'wamid.INBOUND_UNIQUE_999',
      },
      conv,
    );

    assert.equal(result.nextState, 'IDLE');
    assert.match(result.responseText, /Thank you! We have received your requirements/);
    assert.match(result.responseText, /\+91 90307 87819/);

    // Verify lead created
    assert.equal(leads.size, 1);
    const createdLead = leads.get('wamid.INBOUND_UNIQUE_999');
    assert.ok(createdLead);
    assert.equal(createdLead.phone, '919030787819');
    assert.equal(createdLead.name, 'Suresh Kumar');
    assert.equal(createdLead.whatsappWamId, 'wamid.INBOUND_UNIQUE_999');
    assert.equal(createdLead.requiredHelp, 'WEB_APPLICATION');

    // Verify notification created
    assert.equal(notifications.length, 1);
    assert.match(notifications[0].title, /New WhatsApp Enquiry/);

    // Retrying with same wamId returns existing lead without duplicate creation or notification
    await conversationService.processCustomerMessage(
      {
        body: 'We need an e-commerce website for our spices business in Chilakaluripet.',
        from: '919030787819',
        profileName: 'Suresh Kumar',
        wamId: 'wamid.INBOUND_UNIQUE_999',
      },
      conv,
    );

    assert.equal(leads.size, 1, 'Must not create duplicate lead on retry');
    assert.equal(notifications.length, 1, 'Must not fire duplicate notification on retry');
  });

  it('7. supports BACK and HOME navigation across states', async () => {
    const { mockPrisma, mockNotifications } = createMockDb();
    const enquiryService = new WhatsAppEnquiryService(mockPrisma, mockNotifications);
    const conversationService = new WhatsAppConversationService(enquiryService);

    // BACK from Submenu returns to Main Menu
    const backFromSub = await conversationService.processCustomerMessage(
      { body: 'BACK', from: '919030787819', wamId: 'wamid.back1' },
      { state: 'AWAITING_SUBMENU', selectedCategory: '1', customerPhone: '919030787819' },
    );
    assert.equal(backFromSub.nextState, 'AWAITING_CATEGORY');
    assert.match(backFromSub.responseText, /Welcome to Palnadu\.dev/);

    // BACK from Requirement returns to Submenu of Category 1
    const backFromReq = await conversationService.processCustomerMessage(
      { body: 'BACK', from: '919030787819', wamId: 'wamid.back2' },
      { state: 'AWAITING_REQUIREMENT', selectedCategory: '1', selectedSubmenu: '2', customerPhone: '919030787819' },
    );
    assert.equal(backFromReq.nextState, 'AWAITING_SUBMENU');
    assert.equal(backFromReq.selectedCategory, '1');
    assert.match(backFromReq.responseText, /Business \/ Corporate Website/);

    // HOME from Requirement returns directly to Main Menu
    const homeFromReq = await conversationService.processCustomerMessage(
      { body: 'HOME', from: '919030787819', wamId: 'wamid.home1' },
      { state: 'AWAITING_REQUIREMENT', selectedCategory: '1', selectedSubmenu: '2', customerPhone: '919030787819' },
    );
    assert.equal(homeFromReq.nextState, 'AWAITING_CATEGORY');
    assert.match(homeFromReq.responseText, /Welcome to Palnadu\.dev/);
  });
});
