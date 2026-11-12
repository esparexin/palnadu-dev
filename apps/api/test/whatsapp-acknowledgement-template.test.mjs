import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { ContactOptInStatus, WhatsAppMessageDirection } from '@prisma/client';

const require = createRequire(import.meta.url);
const { WhatsAppOutreachService } = require('../dist/whatsapp/whatsapp-outreach.service.js');
const { WhatsAppApiClient } = require('../dist/whatsapp/whatsapp-api.client.js');
const { WhatsAppAdminController } = require('../dist/whatsapp/whatsapp-admin.controller.js');
const { resetTemplateCacheForTesting } = require('../dist/whatsapp/whatsapp-template.util.js');

function createStores() {
  const messagesStore = new Map();
  const contactsStore = new Map();
  const leadsStore = new Map();
  const mediaStore = new Map([
    ['507f1f77bcf86cd799439011', { id: '507f1f77bcf86cd799439011', filename: 'agr.pdf', metadata: { authorizesWhatsAppMarketing: true, recipientPhone: '+919876543210' } }],
  ]);
  const mockPrisma = {
    media: { findUnique: async ({ where }) => mediaStore.get(where.id) || null, findFirst: async () => null },
    lead: { findUnique: async ({ where }) => leadsStore.get(where.id) || null },
    whatsAppMessage: {
      create: async ({ data }) => {
        if (messagesStore.has(data.wamId)) { const err = new Error('P2002'); err.code = 'P2002'; throw err; }
        const rec = { id: `msg_${messagesStore.size + 1}`, createdAt: new Date(), ...data };
        messagesStore.set(data.wamId, rec);
        return rec;
      },
      findUnique: async ({ where }) => messagesStore.get(where.wamId) || null,
      update: async ({ where, data }) => {
        const target = Array.from(messagesStore.values()).find((m) => m.id === where.id || m.wamId === where.wamId);
        if (target) { Object.assign(target, data); if (data.rawPayload) target.rawPayload = { ...target.rawPayload, ...data.rawPayload }; }
        return target;
      },
      findMany: async () => Array.from(messagesStore.values()),
      count: async () => messagesStore.size,
    },
    marketingContact: {
      findUnique: async ({ where }) => contactsStore.get(where.phone) || null,
      create: async ({ data }) => { const rec = { id: `ct_${contactsStore.size + 1}`, ...data }; contactsStore.set(data.phone, rec); return rec; },
      update: async ({ where, data }) => { const rec = contactsStore.get(where.phone); if (rec) Object.assign(rec, data); return rec; },
    },
  };
  return { messagesStore, contactsStore, leadsStore, mockPrisma };
}

describe('WhatsApp palnadu_customer_acknowledgement - Mapping, Language & Consent', () => {
  let stores;
  let sentPayloads;
  let mockTemplates;
  let mockApiClient;
  let service;

  beforeEach(() => {
    resetTemplateCacheForTesting();
    stores = createStores();
    sentPayloads = [];
    mockTemplates = [
      {
        name: 'palnadu_customer_acknowledgement',
        status: 'APPROVED',
        language: 'en_IN',
        category: 'MARKETING',
        parameter_format: 'NAMED',
        components: [{ type: 'BODY', text: 'Hello {{customer_name}}, thank you for contacting Palnadu.dev.', example: { body_text_named_params: [{ param_name: 'customer_name', example: 'Ramesh' }] } }],
      },
      { name: 'b2b_website_outreach_v1', status: 'APPROVED', language: 'en_US', category: 'MARKETING', components: [{ type: 'BODY', text: 'Hello {{1}}, we noticed your business.' }] },
      { name: 'service_inquiry_reply_v1', status: 'APPROVED', language: 'en_US', category: 'UTILITY', components: [] },
      { name: 'unapproved_draft_v1', status: 'PENDING', language: 'en_IN', category: 'MARKETING', components: [] },
    ];
    mockApiClient = {
      fetchApprovedTemplates: async () => mockTemplates,
      sendTemplateMessage: async (payload) => {
        sentPayloads.push(payload);
        return { messaging_product: 'whatsapp', contacts: [{ input: payload.to, wa_id: payload.to }], messages: [{ id: `wamid.ACK_${sentPayloads.length}` }] };
      },
    };
    const mockOptOut = { isSuppressed: async (p) => p.includes('9999999999') };
    service = new WhatsAppOutreachService(stores.mockPrisma, { get: () => '919030787819' }, mockApiClient, mockOptOut);
  });

  const makeInput = (overrides = {}) => ({
    phone: '+919876543210',
    businessName: 'Sri Lakshmi Rice Mill',
    templateName: 'palnadu_customer_acknowledgement',
    languageCode: 'en_IN',
    parameters: { customer_name: '  Ramesh Kumar  ' },
    consentEvidence: { consentType: 'SIGNED_AGREEMENT', consentEvidenceRef: '507f1f77bcf86cd799439011', consentTimestamp: new Date().toISOString(), recipientPhone: '+919876543210' },
    idempotencyKey: `ack-key-${Date.now()}-${Math.random()}`,
    saveContact: false,
    ...overrides,
  });

  it('1. maps trimmed customer_name to first body parameter without businessName substitution', async () => {
    const res = await service.sendOutreach(makeInput(), { id: 'admin1', email: 'a@palnadu.dev' });
    assert.equal(res.success, true);
    assert.equal(sentPayloads[0].templateName, 'palnadu_customer_acknowledgement');
    assert.equal(sentPayloads[0].languageCode, 'en_IN');
    assert.deepEqual(sentPayloads[0].components, [
      { type: 'body', parameters: [{ type: 'text', parameter_name: 'customer_name', text: 'Ramesh Kumar' }] },
    ]);
  });

  it('1b. emits parameter_name when Meta omits parameter_format on named body text', async () => {
    mockTemplates[0] = { name: 'palnadu_customer_acknowledgement', status: 'APPROVED', language: 'en_IN', category: 'MARKETING', components: [{ type: 'BODY', text: 'Hello {{customer_name}}, thank you!' }] };
    await service.sendOutreach(makeInput(), { id: 'admin1', email: 'a@palnadu.dev' });
    assert.deepEqual(sentPayloads[0].components, [
      { type: 'body', parameters: [{ type: 'text', parameter_name: 'customer_name', text: 'Ramesh Kumar' }] },
    ]);
  });

  it('1c. maps positional body parameter cleanly when template definition is positional', async () => {
    mockTemplates[0] = { name: 'palnadu_customer_acknowledgement', status: 'APPROVED', language: 'en_IN', category: 'MARKETING', components: [{ type: 'BODY', text: 'Hello {{1}}, thank you!' }] };
    await service.sendOutreach(makeInput(), { id: 'admin1', email: 'a@palnadu.dev' });
    assert.deepEqual(sentPayloads[0].components, [{ type: 'body', parameters: [{ type: 'text', text: 'Ramesh Kumar' }] }]);
  });

  it('2. rejects missing or blank customer_name without substituting businessName', async () => {
    await assert.rejects(() => service.sendOutreach(makeInput({ parameters: {} }), { id: 'admin1', email: 'a@palnadu.dev' }), /customer_name/);
    await assert.rejects(() => service.sendOutreach(makeInput({ parameters: { customer_name: '   ' } }), { id: 'admin1', email: 'a@palnadu.dev' }), /customer_name/);
    assert.equal(sentPayloads.length, 0);
  });

  it('3. preserves existing business_name template compatibility', async () => {
    const res = await service.sendOutreach(makeInput({ templateName: 'b2b_website_outreach_v1', languageCode: 'en_US', parameters: undefined }), { id: 'admin1', email: 'a@palnadu.dev' });
    assert.equal(res.success, true);
    assert.deepEqual(sentPayloads[0].components, [{ type: 'body', parameters: [{ type: 'text', text: 'Sri Lakshmi Rice Mill' }] }]);
  });

  it('4. retrieves exact Meta template language via API client and admin controller', async () => {
    const config = { get: (k) => ({ WHATSAPP_ACCESS_TOKEN: 'tok', WHATSAPP_BUSINESS_ACCOUNT_ID: 'waba_1', WHATSAPP_GRAPH_API_VERSION: 'v22.0' }[k] || null) };
    const fetchMock = async () => ({ ok: true, status: 200, json: async () => ({ data: [{ name: 'palnadu_customer_acknowledgement', status: 'APPROVED', language: 'en_IN', category: 'MARKETING', parameter_format: 'NAMED', components: [{ type: 'BODY', text: 'Hi {{customer_name}}' }] }] }) });
    const client = new WhatsAppApiClient(config, { fetchFn: fetchMock });
    const controller = new WhatsAppAdminController({}, {}, service, client);
    const res = await controller.getApprovedTemplates();
    assert.equal(res.success, true);
    assert.equal(res.data[0].name, 'palnadu_customer_acknowledgement');
    assert.equal(res.data[0].languageCode, 'en_IN');
    assert.equal(res.data[0].requiredParameters[0].key, 'customer_name');
  });

  it('5. rejects unapproved templates (PENDING or missing)', async () => {
    await assert.rejects(() => service.sendOutreach(makeInput({ templateName: 'unapproved_draft_v1', languageCode: 'en_IN' }), { id: 'admin1', email: 'a@palnadu.dev' }), /not currently approved/);
  });

  it('6. rejects incorrect language code for palnadu_customer_acknowledgement', async () => {
    await assert.rejects(() => service.sendOutreach(makeInput({ languageCode: 'en_US' }), { id: 'admin1', email: 'a@palnadu.dev' }), /not currently approved/);
  });

  it('7. enforces marketing consent and rejects CUSTOMER_SERVICE purpose or phoneless lead', async () => {
    await assert.rejects(() => service.sendOutreach(makeInput({ consentEvidence: { ...makeInput().consentEvidence, consentPurpose: 'CUSTOMER_SERVICE' } }), { id: 'admin1', email: 'a@palnadu.dev' }), /Customer-service consent/);
    stores.leadsStore.set('lead_no_phone', { id: 'lead_no_phone', phone: '' });
    await assert.rejects(() => service.sendOutreach(makeInput({ consentEvidence: { consentType: 'WEBSITE_LEAD_FORM', consentEvidenceRef: 'lead_no_phone', consentTimestamp: new Date().toISOString(), recipientPhone: '+919876543210' } }), { id: 'admin1', email: 'a@palnadu.dev' }), /valid phone number/);
  });

  it('8. rejects INBOUND_WHATSAPP_INQUIRY for marketing template and keeps utility saveContact UNVERIFIED', async () => {
    stores.messagesStore.set('wamid.INB_1', { wamId: 'wamid.INB_1', direction: WhatsAppMessageDirection.INBOUND, from: '919876543210', createdAt: new Date() });
    await assert.rejects(() => service.sendOutreach(makeInput({ consentEvidence: { consentType: 'INBOUND_WHATSAPP_INQUIRY', consentEvidenceRef: 'wamid.INB_1', consentTimestamp: new Date().toISOString(), recipientPhone: '+919876543210' } }), { id: 'admin1', email: 'a@palnadu.dev' }), /customer service response only/);
    await service.sendOutreach(makeInput({ templateName: 'service_inquiry_reply_v1', languageCode: 'en_US', parameters: undefined, saveContact: true, consentEvidence: { consentType: 'INBOUND_WHATSAPP_INQUIRY', consentEvidenceRef: 'wamid.INB_1', consentTimestamp: new Date().toISOString(), recipientPhone: '+919876543210' } }), { id: 'admin1', email: 'a@palnadu.dev' });
    assert.equal(stores.contactsStore.get('919876543210').optInStatus, ContactOptInStatus.UNVERIFIED);
  });

  it('9. suppresses opted-out recipients for palnadu_customer_acknowledgement', async () => {
    await assert.rejects(() => service.sendOutreach(makeInput({ phone: '+919999999999', consentEvidence: { ...makeInput().consentEvidence, recipientPhone: '+919999999999' } }), { id: 'admin1', email: 'a@palnadu.dev' }), /suppression list/);
    assert.equal(sentPayloads.length, 0);
  });
});
