import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

const require = createRequire(import.meta.url);
const { WhatsAppOutreachService } = require('../dist/whatsapp/whatsapp-outreach.service.js');

function setupOutreachTest(options = {}) {
  const harness = createAssistantTestHarness(options);
  const contactsStore = new Map();
  const mediaStore = new Map();
  const templateDispatches = [];

  mediaStore.set('AGR-2026-SALES', {
    id: 'media_agr_1',
    filename: 'AGR-2026-SALES',
    originalName: 'AGR-2026-SALES.pdf',
    createdAt: new Date(),
    metadata: { authorizesWhatsAppMarketing: true, phone: '+919876543210' },
  });

  harness.mockPrisma.media = {
    findUnique: async ({ where }) => mediaStore.get(where.id) || null,
    findFirst: async ({ where }) => {
      for (const item of mediaStore.values()) {
        if (where.filename === item.filename || where.id === item.id) return item;
        if (where.OR?.some((o) => (o.filename && item.filename === o.filename) || (o.originalName && item.originalName === o.originalName))) {
          return item;
        }
      }
      return null;
    },
  };

  const origMsgCreate = harness.mockPrisma.whatsAppMessage.create;
  harness.mockPrisma.whatsAppMessage.create = async ({ data }) => {
    return origMsgCreate({ data: { createdAt: new Date(), ...data } });
  };

  harness.mockPrisma.whatsAppMessage.findUnique = async ({ where }) => {
    return harness.messages.get(where.wamId) || Array.from(harness.messages.values()).find((m) => m.id === where.id) || null;
  };

  harness.mockPrisma.marketingContact = {
    findUnique: async ({ where }) => contactsStore.get(where.phone) || null,
    create: async ({ data }) => {
      const rec = { id: `ct_${contactsStore.size + 1}`, ...data };
      contactsStore.set(data.phone, rec);
      return rec;
    },
    update: async ({ where, data }) => {
      const rec = contactsStore.get(where.phone);
      if (rec) Object.assign(rec, data);
      return rec;
    },
  };

  harness.mockApiClient.fetchApprovedTemplates = async () => [
    { name: 'b2b_website_outreach_v1', category: 'MARKETING', language: 'en_US', status: 'APPROVED', components: [] },
    { name: 'service_inquiry_reply_v1', category: 'UTILITY', language: 'en_US', status: 'APPROVED', components: [] },
  ];

  harness.mockApiClient.sendTemplateMessage = async (payload) => {
    if (options.simulateTemplateFailure) {
      throw new Error('Meta Cloud API dispatch failed: 500 Internal Error');
    }
    const snap = harness.conversations.get(payload.to);
    templateDispatches.push({ payload, preDispatchTakeover: snap?.humanTakeover, preDispatchMode: snap?.mode });
    return {
      messaging_product: 'whatsapp',
      contacts: [{ input: payload.to, wa_id: payload.to }],
      messages: [{ id: `wamid.META_TMPL_${Date.now()}` }],
    };
  };

  const outreachConfig = { get: () => '919030787819' };
  const outreachService = new WhatsAppOutreachService(
    harness.mockPrisma,
    outreachConfig,
    harness.mockApiClient,
    harness.optOutService,
    harness.takeoverService,
  );

  const makeInput = (overrides = {}) => ({
    phone: '+919876543210',
    businessName: 'Sri Lakshmi Enterprises',
    templateName: 'b2b_website_outreach_v1',
    languageCode: 'en_US',
    consentEvidence: {
      consentType: 'SIGNED_AGREEMENT',
      consentEvidenceRef: 'AGR-2026-SALES',
      consentTimestamp: new Date().toISOString(),
      recipientPhone: '+919876543210',
    },
    ...overrides,
  });

  return { harness, outreachService, makeInput, templateDispatches };
}

test('1. Human-initiated quotation template activates takeover before dispatch', async () => {
  const { harness, outreachService, makeInput, templateDispatches } = setupOutreachTest();
  const admin = { id: 'admin_sales_1', email: 'sales@palnadu.dev', name: 'Sales Director' };

  const res = await outreachService.sendOutreach(makeInput({ outreachPurpose: 'QUOTATION' }), admin);
  assert.equal(res.status, 'SENT');
  assert.equal(templateDispatches.length, 1);
  assert.equal(templateDispatches[0].preDispatchTakeover, true);
  assert.equal(templateDispatches[0].preDispatchMode, 'HUMAN_TAKEOVER');

  const conv = harness.conversations.get('919876543210');
  assert.ok(conv);
  assert.equal(conv.humanTakeover, true);
  assert.equal(conv.mode, 'HUMAN_TAKEOVER');
  assert.equal(conv.lastInitiatorId, 'admin_sales_1');
});

test('2. Customer replies after quotation receive no automated response', async () => {
  const { harness, outreachService, makeInput } = setupOutreachTest();
  const admin = { id: 'admin_sales_1', email: 'sales@palnadu.dev', name: 'Sales Director' };

  await outreachService.sendOutreach(makeInput({ outreachPurpose: 'QUOTATION' }), admin);

  const customerReply = {
    wamId: 'wamid.INB_QUOTE_REPLY',
    from: '919876543210',
    text: 'Hi, what are the payment terms for this quote?',
    timestamp: new Date().toISOString(),
  };

  const replyRes = await harness.assistantService.handleInboundMessage(customerReply);
  assert.equal(replyRes, null);
  assert.equal(harness.interactiveDispatches.length, 0);
  assert.equal(harness.textDispatches.length, 0);
});

test('3. Human-initiated sales follow-up activates takeover and stamps origin', async () => {
  const { harness, outreachService, makeInput } = setupOutreachTest();
  const admin = { id: 'rep_42', email: 'rep@palnadu.dev', name: 'Sales Rep' };

  await outreachService.sendOutreach(makeInput({ outreachPurpose: 'FOLLOW_UP' }), admin);
  const conv = harness.conversations.get('919876543210');
  assert.equal(conv.humanTakeover, true);
  assert.equal(conv.mode, 'HUMAN_TAKEOVER');

  const msg = Array.from(harness.messages.values()).find((m) => m.type === 'template');
  assert.ok(msg);
  assert.equal(msg.rawPayload?.origin, 'MANUAL_ADMIN_OUTREACH');
  assert.equal(msg.rawPayload?.outreachPurpose, 'FOLLOW_UP');
});

test('4. Failed outbound dispatch does not leave an inconsistent conversation state', async () => {
  const { harness, outreachService, makeInput } = setupOutreachTest({ simulateTemplateFailure: true });
  const admin = { id: 'admin_sales_1', email: 'sales@palnadu.dev' };

  await assert.rejects(
    () => outreachService.sendOutreach(makeInput({ outreachPurpose: 'QUOTATION' }), admin),
    /Meta WhatsApp dispatch failed/,
  );

  const conv = harness.conversations.get('919876543210');
  assert.ok(conv);
  assert.equal(conv.humanTakeover, true);
  assert.equal(conv.mode, 'HUMAN_TAKEOVER');
});

test('5. Duplicate outreach requests do not create inconsistent state', async () => {
  const { harness, outreachService, makeInput } = setupOutreachTest();
  const admin = { id: 'admin_sales_1', email: 'sales@palnadu.dev' };
  const input = makeInput({ idempotencyKey: 'idemp_unique_quote_999' });

  const first = await outreachService.sendOutreach(input, admin);
  assert.equal(first.status, 'SENT');

  const second = await outreachService.sendOutreach(input, admin);
  assert.equal(second.deduplicated, true);

  const conv = harness.conversations.get('919876543210');
  assert.equal(conv.humanTakeover, true);
  assert.equal(conv.mode, 'HUMAN_TAKEOVER');
});

test('6. Automated notification messages retain automation and do not activate takeover', async () => {
  const { harness, outreachService, makeInput } = setupOutreachTest();
  const admin = { id: 'system_cron', email: 'cron@palnadu.dev' };

  await outreachService.sendOutreach(
    makeInput({ outreachPurpose: 'NOTIFICATION', origin: 'AUTOMATED_NOTIFICATION' }),
    admin,
  );

  const conv = harness.conversations.get('919876543210');
  assert.equal(conv?.humanTakeover ?? false, false);
  assert.notEqual(conv?.mode, 'HUMAN_TAKEOVER');
});

test('7. Existing manual replies and explicit resume continue working', async () => {
  const { harness } = setupOutreachTest();
  const admin = { id: 'admin_1', email: 'ops@palnadu.dev', name: 'Ops Admin' };

  await harness.takeoverService.sendManualReply('+919876543210', 'Here is your estimate.', admin);
  let conv = harness.conversations.get('919876543210');
  assert.equal(conv.humanTakeover, true);
  assert.equal(conv.mode, 'HUMAN_TAKEOVER');

  await harness.takeoverService.setHumanTakeover('+919876543210', false, admin);
  conv = harness.conversations.get('919876543210');
  assert.equal(conv.humanTakeover, false);
  assert.equal(conv.mode, 'AUTOMATED_ASSISTANCE');
});

test('8. Legacy auto-reply and assistant cannot bypass takeover', async () => {
  const { harness } = setupOutreachTest();
  harness.conversations.set('919876543210', {
    customerPhone: '919876543210',
    humanTakeover: true,
    mode: 'HUMAN_TAKEOVER',
  });

  const resAssistant = await harness.assistantService.handleInboundMessage({
    wamId: 'wamid.INB_BYPASS_1',
    from: '919876543210',
    text: 'Need urgent help',
  });
  assert.equal(resAssistant, null);

  const resAutoReply = await harness.autoReplyService.handleAutoReply({
    id: 'msg_legacy_1',
    wamId: 'wamid.INB_BYPASS_2',
    direction: 'INBOUND',
    from: '919876543210',
    body: 'Hello',
    createdAt: new Date(),
  });
  assert.equal(resAutoReply, null);
});
