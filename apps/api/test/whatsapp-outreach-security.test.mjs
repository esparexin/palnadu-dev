import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { sendIndividualOutreachSchema } from '@palnadu/validation';
import { createAssistantTestHarness } from './whatsapp-test-harness.util.mjs';

const require = createRequire(import.meta.url);
const { WhatsAppAdminController } = require('../dist/whatsapp/whatsapp-admin.controller.js');
const { WhatsAppOutreachService } = require('../dist/whatsapp/whatsapp-outreach.service.js');
const { isHumanSalesOutreach } = require('../dist/whatsapp/whatsapp-outreach-takeover.util.js');

function setupSecurityTest() {
  const harness = createAssistantTestHarness();
  const mediaStore = new Map();
  const templateDispatches = [];

  const registerAgreement = (ref, phone) => {
    mediaStore.set(ref, {
      id: `media_${ref}`,
      filename: ref,
      originalName: `${ref}.pdf`,
      createdAt: new Date(),
      metadata: { authorizesWhatsAppMarketing: true, phone },
    });
  };
  registerAgreement('AGR-SEC-2026', '+919876543210');
  registerAgreement('AGR-SEC-2026-1', '+919876543211');
  registerAgreement('AGR-SEC-2026-2', '+919876543212');
  registerAgreement('AGR-SEC-2026-3', '+919876543213');

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
    findUnique: async () => null,
    create: async ({ data }) => ({ id: `ct_sec`, ...data }),
  };

  harness.mockApiClient.fetchApprovedTemplates = async () => [
    { name: 'b2b_website_outreach_v1', category: 'MARKETING', language: 'en_US', status: 'APPROVED', components: [] },
  ];

  harness.mockApiClient.sendTemplateMessage = async (payload) => {
    const snap = harness.conversations.get(payload.to);
    templateDispatches.push({ payload, preTakeover: snap?.humanTakeover, preMode: snap?.mode });
    return {
      messaging_product: 'whatsapp',
      contacts: [{ input: payload.to, wa_id: payload.to }],
      messages: [{ id: `wamid.META_SEC_${Date.now()}` }],
    };
  };

  const outreachService = new WhatsAppOutreachService(
    harness.mockPrisma,
    { get: () => '919030787819' },
    harness.mockApiClient,
    harness.optOutService,
    harness.takeoverService,
  );

  const makeBaseInput = () => ({
    phone: '+919876543210',
    businessName: 'Secure Enterprises',
    templateName: 'b2b_website_outreach_v1',
    languageCode: 'en_US',
    consentEvidence: {
      consentType: 'SIGNED_AGREEMENT',
      consentEvidenceRef: 'AGR-SEC-2026',
      consentTimestamp: new Date().toISOString(),
      recipientPhone: '+919876543210',
    },
  });

  return { harness, outreachService, makeBaseInput, templateDispatches };
}

test('1. Client-supplied origin is stripped by validation contract', () => {
  const rawInput = {
    phone: '+919876543210',
    businessName: 'Secure Enterprises',
    templateName: 'b2b_website_outreach_v1',
    languageCode: 'en_US',
    consentEvidence: {
      consentType: 'SIGNED_AGREEMENT',
      consentEvidenceRef: 'AGR-SEC-2026',
      consentTimestamp: new Date().toISOString(),
      recipientPhone: '+919876543210',
    },
    origin: 'AUTOMATED_NOTIFICATION',
  };

  const parsed = sendIndividualOutreachSchema.parse(rawInput);
  assert.equal(parsed.origin, undefined);
  assert.equal('origin' in parsed, false);
});

test('2. Authenticated Admin Controller explicitly assigns origin: HUMAN_SALES', async () => {
  const { makeBaseInput } = setupSecurityTest();
  let capturedPayload = null;

  const mockOutreachService = {
    sendOutreach: async (payload) => {
      capturedPayload = payload;
      return { success: true, status: 'SENT' };
    },
  };

  const controller = new WhatsAppAdminController(null, null, mockOutreachService, null);
  const adminReq = { user: { id: 'admin_audit_1', email: 'audit@palnadu.dev', name: 'Auditor' } };

  await controller.sendIndividualOutreach(makeBaseInput(), adminReq);
  assert.ok(capturedPayload);
  assert.equal(capturedPayload.origin, 'HUMAN_SALES');
});

test('3. Admin cannot bypass takeover by manipulating outreachPurpose', async () => {
  const { harness, outreachService, makeBaseInput } = setupSecurityTest();
  const admin = { id: 'admin_malicious_attempt', email: 'admin@palnadu.dev', name: 'Admin User' };

  // Even if an admin specifies outreachPurpose: 'NOTIFICATION'
  const input = { ...makeBaseInput(), outreachPurpose: 'NOTIFICATION' };
  assert.equal(isHumanSalesOutreach(input, admin), true);

  await outreachService.sendOutreach(input, admin);
  const conv = harness.conversations.get('919876543210');
  assert.ok(conv);
  assert.equal(conv.humanTakeover, true);
  assert.equal(conv.mode, 'HUMAN_TAKEOVER');
});

test('4. Quotation, Proposal and Follow-up activate takeover before Meta dispatch', async () => {
  const { harness, outreachService, makeBaseInput, templateDispatches } = setupSecurityTest();
  const admin = { id: 'sales_rep_1', email: 'sales@palnadu.dev', name: 'Sales Rep' };

  const purposes = [
    { purpose: 'QUOTATION', phone: '+919876543211', ref: 'AGR-SEC-2026-1' },
    { purpose: 'PROPOSAL', phone: '+919876543212', ref: 'AGR-SEC-2026-2' },
    { purpose: 'FOLLOW_UP', phone: '+919876543213', ref: 'AGR-SEC-2026-3' },
  ];

  for (const item of purposes) {
    templateDispatches.length = 0;
    const input = {
      ...makeBaseInput(),
      phone: item.phone,
      outreachPurpose: item.purpose,
      consentEvidence: {
        consentType: 'SIGNED_AGREEMENT',
        consentEvidenceRef: item.ref,
        consentTimestamp: new Date().toISOString(),
        recipientPhone: item.phone,
      },
    };
    await outreachService.sendOutreach(input, admin);
    assert.equal(templateDispatches.length, 1);
    assert.equal(templateDispatches[0].preTakeover, true);
    assert.equal(templateDispatches[0].preMode, 'HUMAN_TAKEOVER');
  }
});

test('5. Trusted internal notifications retain isolated behavior', async () => {
  const { harness, outreachService, makeBaseInput } = setupSecurityTest();
  const systemAdmin = { id: 'system', email: 'system@palnadu.dev' };

  const input = { ...makeBaseInput(), outreachPurpose: 'NOTIFICATION', origin: 'AUTOMATED_NOTIFICATION' };
  assert.equal(isHumanSalesOutreach(input, systemAdmin), false);

  await outreachService.sendOutreach(input, systemAdmin);
  const conv = harness.conversations.get('919876543210');
  assert.equal(conv?.humanTakeover ?? false, false);
});

test('6. Bulk campaigns retain their existing isolated behavior', () => {
  const campaignMsg = { campaignId: 'cmp_security_1', origin: 'CAMPAIGN' };
  assert.ok(campaignMsg.campaignId);
  assert.equal(campaignMsg.origin, 'CAMPAIGN');
});

test('7. Existing manual replies, takeover and explicit resume remain functional', async () => {
  const { harness } = setupSecurityTest();
  const admin = { id: 'admin_ops', email: 'ops@palnadu.dev', name: 'Ops' };

  await harness.takeoverService.sendManualReply('+919876543210', 'Here is your custom proposal', admin);
  let conv = harness.conversations.get('919876543210');
  assert.equal(conv.humanTakeover, true);
  assert.equal(conv.mode, 'HUMAN_TAKEOVER');

  await harness.takeoverService.setHumanTakeover('+919876543210', false, admin);
  conv = harness.conversations.get('919876543210');
  assert.equal(conv.humanTakeover, false);
  assert.equal(conv.mode, 'AUTOMATED_ASSISTANCE');
});
