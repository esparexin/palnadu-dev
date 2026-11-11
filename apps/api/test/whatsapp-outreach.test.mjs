import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { ContactOptInStatus, WhatsAppDeliveryStatus, WhatsAppMessageDirection } from '@prisma/client';

const require = createRequire(import.meta.url);
const { WhatsAppOutreachService } = require('../dist/whatsapp/whatsapp-outreach.service.js');
const { WhatsAppApiException } = require('../dist/whatsapp/whatsapp-api.util.js');

describe('WhatsApp Outreach Service - Verifiable Consent, Idempotency & Rate Limits', () => {
  let messagesStore;
  let contactsStore;
  let leadsStore;
  let mockPrisma;
  let mockApiClient;
  let mockOptOutService;
  let mockConfig;
  let service;

  beforeEach(() => {
    messagesStore = new Map();
    contactsStore = new Map();
    leadsStore = new Map();
    const mediaStore = new Map();
    mediaStore.set('AGR-2026-RETAIL', {
      id: 'AGR-2026-RETAIL',
      filename: 'AGR-2026-RETAIL',
      metadata: { authorizesWhatsAppMarketing: true },
    });

    mockPrisma = {
      media: {
        findUnique: async ({ where }) => mediaStore.get(where.id) || null,
        findFirst: async ({ where }) => {
          for (const item of mediaStore.values()) {
            if (where.filename === item.filename || where.id === item.id) return item;
            if (where.OR?.some((o) => (o.filename && item.filename === o.filename) || (o.originalName && item.originalName === o.originalName))) return item;
          }
          return null;
        },
      },
      whatsAppMessage: {
        create: async ({ data }) => {
          if (messagesStore.has(data.wamId)) {
            const err = new Error('Unique constraint failed on wam_id');
            err.code = 'P2002';
            throw err;
          }
          const record = { id: `msg_${messagesStore.size + 1}`, createdAt: new Date(), ...data };
          messagesStore.set(data.wamId, record);
          return record;
        },
        findUnique: async ({ where }) => messagesStore.get(where.wamId) || null,
        update: async ({ where, data }) => {
          const target = Array.from(messagesStore.values()).find((m) => m.id === where.id || m.wamId === where.wamId);
          if (target) {
            Object.assign(target, data);
            if (data.rawPayload) target.rawPayload = { ...target.rawPayload, ...data.rawPayload };
          }
          return target;
        },
        findMany: async ({ where }) => {
          return Array.from(messagesStore.values()).filter((m) => {
            if (where.campaignId === null && m.campaignId !== null) return false;
            if (where.wamId?.not?.startsWith && m.wamId.startsWith(where.wamId.not.startsWith)) return false;
            return true;
          });
        },
        count: async () => messagesStore.size,
      },
      marketingContact: {
        findUnique: async ({ where }) => contactsStore.get(where.phone) || null,
        create: async ({ data }) => {
          const record = { id: `ct_${contactsStore.size + 1}`, ...data };
          contactsStore.set(data.phone, record);
          return record;
        },
        update: async ({ where, data }) => {
          const record = contactsStore.get(where.phone);
          if (record) Object.assign(record, data);
          return record;
        },
      },
      lead: {
        findUnique: async ({ where }) => leadsStore.get(where.id) || null,
      },
    };

    mockApiClient = {
      fetchApprovedTemplates: async () => [
        { name: 'b2b_website_outreach_v1', category: 'MARKETING', language: 'en_US', status: 'APPROVED', components: [] },
        { name: 'service_inquiry_reply_v1', category: 'UTILITY', language: 'en_US', status: 'APPROVED', components: [] },
      ],
      sendTemplateMessage: async (payload) => ({
        messaging_product: 'whatsapp',
        contacts: [{ input: payload.to, wa_id: payload.to }],
        messages: [{ id: `wamid.META_${Date.now()}` }],
      }),
    };

    mockOptOutService = {
      isSuppressed: async (phone) => phone.includes('9999999999'),
    };

    mockConfig = { get: () => '919030787819' };
    service = new WhatsAppOutreachService(mockPrisma, mockConfig, mockApiClient, mockOptOutService);
  });

  const baseInput = {
    phone: '+919876543210',
    businessName: 'Sri Lakshmi Rice Mill',
    templateName: 'b2b_website_outreach_v1',
    languageCode: 'en_US',
    consentEvidence: {
      consentType: 'SIGNED_AGREEMENT',
      consentEvidenceRef: 'AGR-2026-RETAIL',
      consentTimestamp: new Date().toISOString(),
      recipientPhone: '+919876543210',
    },
    idempotencyKey: 'test-idemp-001',
    saveContact: false,
  };

  it('successfully dispatches outreach with verifiable consent and idempotency', async () => {
    const result = await service.sendOutreach(baseInput, { id: 'admin1', email: 'admin@palnadu.dev' });
    assert.equal(result.success, true);
    assert.ok(result.wamId.startsWith('wamid.META_'));
    assert.equal(contactsStore.size, 0, 'No contact created when saveContact=false');
  });

  it('rejects outreach when recipient is on opt-out suppression list', async () => {
    const input = { ...baseInput, phone: '+919999999999', consentEvidence: { ...baseInput.consentEvidence, recipientPhone: '+919999999999' } };
    await assert.rejects(() => service.sendOutreach(input, { id: 'admin1' }), /suppression list/);
  });

  it('rejects consent evidence phone mismatch', async () => {
    const input = { ...baseInput, consentEvidence: { ...baseInput.consentEvidence, recipientPhone: '+919111111111' } };
    await assert.rejects(() => service.sendOutreach(input, { id: 'admin1' }), /does not match recipient/);
  });

  it('validates WEBSITE_LEAD_FORM against database lead record', async () => {
    leadsStore.set('lead_123', { id: 'lead_123', phone: '919876543210' });
    const input = {
      ...baseInput,
      consentEvidence: {
        consentType: 'WEBSITE_LEAD_FORM',
        consentEvidenceRef: 'lead_123',
        consentTimestamp: new Date().toISOString(),
        recipientPhone: '+919876543210',
      },
    };
    const res = await service.sendOutreach(input, { id: 'admin1' });
    assert.equal(res.success, true);
  });

  it('rejects WEBSITE_LEAD_FORM when lead record does not exist', async () => {
    const input = {
      ...baseInput,
      consentEvidence: {
        consentType: 'WEBSITE_LEAD_FORM',
        consentEvidenceRef: 'non_existent_lead',
        consentTimestamp: new Date().toISOString(),
        recipientPhone: '+919876543210',
      },
    };
    await assert.rejects(() => service.sendOutreach(input, { id: 'admin1' }), /lead record not found/);
  });

  it('deduplicates parallel requests with identical idempotencyKey', async () => {
    const res1 = await service.sendOutreach(baseInput, { id: 'admin1' });
    const res2 = await service.sendOutreach(baseInput, { id: 'admin1' });
    assert.equal(res2.deduplicated, true);
    assert.equal(res2.wamId, res1.wamId);
  });

  it('rejects subsequent outreach within 60s cooldown slot for same recipient', async () => {
    await service.sendOutreach(baseInput, { id: 'admin1' });
    const secondInput = { ...baseInput, idempotencyKey: 'different-key-same-phone' };
    await assert.rejects(() => service.sendOutreach(secondInput, { id: 'admin1' }), /cooldown active/);
  });

  it('creates marketing contact when saveContact is true', async () => {
    const input = { ...baseInput, saveContact: true, phone: '+919876500001', consentEvidence: { ...baseInput.consentEvidence, recipientPhone: '+919876500001' } };
    const res = await service.sendOutreach(input, { id: 'admin1' });
    assert.equal(res.contactSaved, true);
    assert.equal(contactsStore.has('919876500001'), true);
  });

  it('handles ambiguous Meta dispatch timeout with RECONCILIATION_PENDING', async () => {
    mockApiClient.sendTemplateMessage = async () => {
      throw new WhatsAppApiException('Gateway Timeout', 504, undefined, true);
    };
    const input = { ...baseInput, phone: '+919876500002', consentEvidence: { ...baseInput.consentEvidence, recipientPhone: '+919876500002' } };
    const res = await service.sendOutreach(input, { id: 'admin1' });
    assert.equal(res.status, 'RECONCILIATION_PENDING');
    assert.equal(res.requiresReconciliation, true);
  });

  const makeInboundInput = (wamId, templateName) => ({
    ...baseInput,
    phone: '+919876500003',
    templateName,
    consentEvidence: {
      consentType: 'INBOUND_WHATSAPP_INQUIRY',
      consentEvidenceRef: wamId,
      consentTimestamp: new Date().toISOString(),
      recipientPhone: '+919876500003',
    },
  });

  it('rejects INBOUND_WHATSAPP_INQUIRY for MARKETING templates', async () => {
    messagesStore.set('wamid.INBOUND_PROOF_1', { wamId: 'wamid.INBOUND_PROOF_1', direction: WhatsAppMessageDirection.INBOUND, from: '919876500003', createdAt: new Date() });
    await assert.rejects(() => service.sendOutreach(makeInboundInput('wamid.INBOUND_PROOF_1', 'b2b_website_outreach_v1'), { id: 'admin1' }), /authorizes customer service response only/);
  });

  it('validates INBOUND_WHATSAPP_INQUIRY for UTILITY template within 24h', async () => {
    messagesStore.set('wamid.INBOUND_PROOF_2', { wamId: 'wamid.INBOUND_PROOF_2', direction: WhatsAppMessageDirection.INBOUND, from: '919876500003', createdAt: new Date() });
    const res = await service.sendOutreach(makeInboundInput('wamid.INBOUND_PROOF_2', 'service_inquiry_reply_v1'), { id: 'admin1' });
    assert.equal(res.success, true);
  });

  it('rejects INBOUND_WHATSAPP_INQUIRY older than 24 hours', async () => {
    messagesStore.set('wamid.INBOUND_PROOF_3', { wamId: 'wamid.INBOUND_PROOF_3', direction: WhatsAppMessageDirection.INBOUND, from: '919876500003', createdAt: new Date(Date.now() - 25 * 60 * 60 * 1000) });
    await assert.rejects(() => service.sendOutreach(makeInboundInput('wamid.INBOUND_PROOF_3', 'service_inquiry_reply_v1'), { id: 'admin1' }), /outside Meta’s applicable 24-hour/);
  });

  it('rejects stale consent older than 180 days', async () => {
    const twoHundredDaysAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000).toISOString();
    const input = {
      ...baseInput,
      phone: '+919876500004',
      consentEvidence: { ...baseInput.consentEvidence, consentTimestamp: twoHundredDaysAgo, recipientPhone: '+919876500004' },
    };
    await assert.rejects(() => service.sendOutreach(input, { id: 'admin1' }), /older than 180 days/);
  });

  it('verifies reservations use isolated resv: prefix and do not pollute messages list', async () => {
    const input = { ...baseInput, phone: '+919876500005', consentEvidence: { ...baseInput.consentEvidence, recipientPhone: '+919876500005' } };
    await service.sendOutreach(input, { id: 'admin1' });
    const listRes = await service.listIndividualOutreachMessages();
    for (const msg of listRes.data) {
      assert.equal(msg.wamId.startsWith('resv:'), false, 'Reservation tokens must never appear in message history');
    }
  });
});
