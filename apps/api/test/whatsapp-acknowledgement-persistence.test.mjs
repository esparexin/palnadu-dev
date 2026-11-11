import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { CampaignStatus, ContactOptInStatus, WhatsAppDeliveryStatus, WhatsAppMessageDirection } from '@prisma/client';

const require = createRequire(import.meta.url);
const { WhatsAppOutreachService } = require('../dist/whatsapp/whatsapp-outreach.service.js');
const { WhatsAppMessageService } = require('../dist/whatsapp/whatsapp-message.service.js');
const { WhatsAppCampaignService } = require('../dist/whatsapp/whatsapp-campaign.service.js');
const { WhatsAppApiException } = require('../dist/whatsapp/whatsapp-api.util.js');

function createPersistenceMockPrisma() {
  const messagesStore = new Map();
  const mediaStore = new Map([
    ['507f1f77bcf86cd799439011', { id: '507f1f77bcf86cd799439011', filename: 'agr.pdf', metadata: { authorizesWhatsAppMarketing: true, recipientPhone: '+919876543210' } }],
  ]);

  const mockPrisma = {
    media: { findUnique: async ({ where }) => mediaStore.get(where.id) || null, findFirst: async () => null },
    lead: { findUnique: async () => null },
    marketingContact: { findUnique: async () => null, findMany: async () => [] },
    whatsAppMessage: {
      create: async ({ data }) => {
        if (messagesStore.has(data.wamId)) { const err = new Error('P2002'); err.code = 'P2002'; throw err; }
        const rec = { id: `msg_${messagesStore.size + 1}`, createdAt: new Date(), ...data };
        messagesStore.set(data.wamId, rec);
        return rec;
      },
      findUnique: async ({ where }) => {
        if (where.id) return Array.from(messagesStore.values()).find((m) => m.id === where.id) || null;
        return messagesStore.get(where.wamId) || null;
      },
      update: async ({ where, data }) => {
        const target = Array.from(messagesStore.values()).find((m) => (where.id && m.id === where.id) || (where.wamId && m.wamId === where.wamId));
        if (!target) return null;
        if (data.wamId && data.wamId !== target.wamId) {
          if (messagesStore.has(data.wamId)) { const err = new Error('P2002'); err.code = 'P2002'; throw err; }
          messagesStore.delete(target.wamId);
        }
        Object.assign(target, data);
        messagesStore.set(target.wamId, target);
        return target;
      },
      delete: async ({ where }) => {
        const target = Array.from(messagesStore.values()).find((m) => (where.id && m.id === where.id) || (where.wamId && m.wamId === where.wamId));
        if (target) messagesStore.delete(target.wamId);
        return {};
      },
      findMany: async ({ where } = {}) => Array.from(messagesStore.values()).filter((m) => {
        if (where?.campaignId === null && m.campaignId) return false;
        if (where?.direction && m.direction !== where.direction) return false;
        if (where?.wamId?.not?.startsWith && m.wamId.startsWith(where.wamId.not.startsWith)) return false;
        return true;
      }),
      count: async ({ where } = {}) => (await mockPrisma.whatsAppMessage.findMany({ where })).length,
    },
  };
  return { messagesStore, mockPrisma };
}

describe('WhatsApp palnadu_customer_acknowledgement - Persistence, Webhook Race & Campaigns', () => {
  let stores;
  let sendCalls;
  let mockApiClient;
  let outreachService;
  let messageService;

  beforeEach(() => {
    stores = createPersistenceMockPrisma();
    sendCalls = 0;
    mockApiClient = {
      fetchApprovedTemplates: async () => [{
        name: 'palnadu_customer_acknowledgement',
        status: 'APPROVED',
        language: 'en_IN',
        category: 'MARKETING',
        parameter_format: 'NAMED',
        components: [{ type: 'BODY', text: 'Hello {{customer_name}}, welcome!' }],
      }],
      sendTemplateMessage: async (payload) => {
        sendCalls++;
        return { messaging_product: 'whatsapp', contacts: [{ input: payload.to, wa_id: payload.to }], messages: [{ id: 'wamid.ACK_META_991' }] };
      },
    };
    outreachService = new WhatsAppOutreachService(stores.mockPrisma, { get: () => '919030787819' }, mockApiClient, { isSuppressed: async () => false });
    messageService = new WhatsAppMessageService(stores.mockPrisma, { create: async () => ({}) });
  });

  const makeInput = (overrides = {}) => ({
    phone: '+919876543210',
    businessName: 'Sri Lakshmi Rice Mill',
    templateName: 'palnadu_customer_acknowledgement',
    languageCode: 'en_IN',
    parameters: { customer_name: 'Ramesh Kumar' },
    consentEvidence: { consentType: 'SIGNED_AGREEMENT', consentEvidenceRef: '507f1f77bcf86cd799439011', consentTimestamp: new Date().toISOString(), recipientPhone: '+919876543210' },
    idempotencyKey: 'ack-persist-001',
    saveContact: false,
    ...overrides,
  });

  it('10. persists Meta WAMID, accurate template name, language, consent and audit metadata without duplicates', async () => {
    const res = await outreachService.sendOutreach(makeInput(), { id: 'admin_42', email: 'ops@palnadu.dev' });
    assert.equal(res.wamId, 'wamid.ACK_META_991');

    const stored = stores.messagesStore.get('wamid.ACK_META_991');
    assert.equal(stored.direction, WhatsAppMessageDirection.OUTBOUND);
    assert.equal(stored.status, WhatsAppDeliveryStatus.SENT);
    assert.equal(stored.rawPayload.templateName, 'palnadu_customer_acknowledgement');
    assert.equal(stored.rawPayload.languageCode, 'en_IN');
    assert.equal(stored.rawPayload.consentEvidence.consentEvidenceRef, '507f1f77bcf86cd799439011');
    assert.equal(stored.rawPayload.adminId, 'admin_42');
    assert.deepEqual(stored.rawPayload.templateParameters, { customer_name: 'Ramesh Kumar' });

    const history = await outreachService.listIndividualOutreachMessages();
    assert.equal(history.total, 1);
    assert.equal(history.data[0].templateName, 'palnadu_customer_acknowledgement');
    assert.equal(history.data[0].languageCode, 'en_IN');
  });

  it('11. preserves ambiguous dispatch metadata and reconciles without duplicate Meta send', async () => {
    mockApiClient.sendTemplateMessage = async () => {
      sendCalls++;
      throw new WhatsAppApiException('Gateway Timeout', 504, undefined, true);
    };
    const pending = await outreachService.sendOutreach(makeInput(), { id: 'admin_42', email: 'ops@palnadu.dev' });
    assert.equal(pending.status, 'RECONCILIATION_PENDING');
    assert.equal(sendCalls, 1, 'Must never blindly retry ambiguous dispatch');

    const ambigRecord = stores.messagesStore.get(pending.wamId);
    assert.equal(ambigRecord.rawPayload.templateName, 'palnadu_customer_acknowledgement');
    assert.equal(ambigRecord.rawPayload.languageCode, 'en_IN');

    const reconciled = await outreachService.reconcileOutreach(ambigRecord.id, { confirmedStatus: 'DELIVERED', metaWamId: 'wamid.META_CONF_777', notes: 'Confirmed' }, { id: 'admin_audit' });
    assert.equal(reconciled.reconciled, true);
    assert.equal(sendCalls, 1);
    assert.equal(stores.messagesStore.get('wamid.META_CONF_777').status, WhatsAppDeliveryStatus.DELIVERED);
  });

  it('12. handles delivery webhook arriving before outbound persistence without P2002 or status regression', async () => {
    mockApiClient.sendTemplateMessage = async () => {
      await messageService.updateMessageStatus({
        wamId: 'wamid.RACE_ACK_001',
        recipientId: '919876543210',
        status: 'delivered',
        timestamp: String(Math.floor(Date.now() / 1000)),
      });
      return { messaging_product: 'whatsapp', contacts: [{ input: '919876543210', wa_id: '919876543210' }], messages: [{ id: 'wamid.RACE_ACK_001' }] };
    };

    const res = await outreachService.sendOutreach(makeInput(), { id: 'admin_42', email: 'ops@palnadu.dev' });
    assert.equal(res.success, true);

    const record = stores.messagesStore.get('wamid.RACE_ACK_001');
    assert.equal(record.status, WhatsAppDeliveryStatus.DELIVERED, 'Must preserve DELIVERED status instead of regressing to SENT');
    assert.equal(record.type, 'template');
    assert.equal(record.rawPayload.templateName, 'palnadu_customer_acknowledgement');
    assert.equal(record.rawPayload.languageCode, 'en_IN');
    assert.equal(record.rawPayload.consentEvidence.consentEvidenceRef, '507f1f77bcf86cd799439011');
    const history = await outreachService.listIndividualOutreachMessages();
    assert.equal(history.total, 1, 'No duplicate outbound message records');
  });

  it('13. uses contactName for palnadu_customer_acknowledgement in campaigns and fails missing contactName safely', async () => {
    const campaign = { id: 'camp_ack_1', templateName: 'palnadu_customer_acknowledgement', languageCode: 'en_IN', status: CampaignStatus.DRAFT, sentCount: 0, failedCount: 0 };
    const contacts = [
      { id: 'c1', businessName: 'Kaveri Mills', contactName: 'Sita Devi', phone: '919876543211', optInStatus: ContactOptInStatus.OPTED_IN },
      { id: 'c2', businessName: 'No Contact Name Biz', contactName: null, phone: '919876543212', optInStatus: ContactOptInStatus.OPTED_IN },
    ];
    const sent = [];
    const campaignPrisma = {
      ...stores.mockPrisma,
      marketingCampaign: {
        findUnique: async () => campaign,
        updateMany: async ({ data }) => { Object.assign(campaign, data); return { count: 1 }; },
        update: async ({ data }) => {
          if (data.status) campaign.status = data.status;
          if (data.sentCount?.increment) campaign.sentCount += data.sentCount.increment;
          if (data.failedCount?.increment) campaign.failedCount += data.failedCount.increment;
          return campaign;
        },
      },
      marketingContact: { findMany: async () => contacts },
    };
    const cmpService = new WhatsAppCampaignService(campaignPrisma, { get: (k) => (k === 'WHATSAPP_CAMPAIGN_DELAY_MS' ? 1 : '919030787819') }, {
      ...mockApiClient,
      sendTemplateMessage: async (p) => { sent.push(p); return { messages: [{ id: `wamid.CMP_${sent.length}` }] }; },
    });
    const out = await cmpService.dispatchCampaign('camp_ack_1');
    assert.equal(out.sentCount, 1);
    assert.equal(out.failedCount, 1);
    assert.equal(sent[0].components[0].parameters[0].text, 'Sita Devi');
    assert.equal(sent[0].components[0].parameters[0].parameter_name, 'customer_name');
  });
});

