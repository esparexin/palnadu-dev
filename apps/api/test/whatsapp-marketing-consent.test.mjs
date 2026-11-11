import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { ContactOptInStatus } from '@prisma/client';

const require = createRequire(import.meta.url);
const { arePhoneNumbersEquivalent, buildPhoneVariants } = require('../dist/whatsapp/whatsapp-api.util.js');
const { verifyConsentEvidence } = require('../dist/whatsapp/whatsapp-outreach-consent.util.js');
const { upsertOutreachContact } = require('../dist/whatsapp/whatsapp-outreach-persistence.util.js');
const { WhatsAppOptOutService } = require('../dist/whatsapp/whatsapp-opt-out.service.js');
const { WhatsAppAutoReplyService } = require('../dist/whatsapp/whatsapp-auto-reply.service.js');
const { WhatsAppWebhookService } = require('../dist/whatsapp/whatsapp-webhook.service.js');
const { WhatsAppMessageService } = require('../dist/whatsapp/whatsapp-message.service.js');

describe('WhatsApp Marketing Consent, Strict Phone Match & Opt-Out Safety', () => {
  it('enforces strict phone equivalence without unsafe substring matches', () => {
    assert.equal(arePhoneNumbersEquivalent('+91 98765 43210', '9876543210'), true);
    assert.equal(arePhoneNumbersEquivalent('09876543210', '919876543210'), true);
    assert.equal(arePhoneNumbersEquivalent('3210', '919876543210'), false);
    assert.equal(arePhoneNumbersEquivalent('19876543210', '919876543210'), false);
    const variants = buildPhoneVariants('+91 9876543210');
    assert.ok(variants.includes('9876543210') && variants.includes('919876543210'));
  });

  it('rejects ordinary website and CRM leads lacking explicit whatsappMarketingConsent', async () => {
    const prisma = {
      lead: {
        findUnique: async ({ where }) => ({
          id: where.id,
          phone: '919876543210',
          whatsappMarketingConsent: false,
          createdAt: new Date(),
        }),
      },
    };
    const baseEvidence = {
      consentType: 'WEBSITE_LEAD_FORM',
      consentEvidenceRef: 'lead_no_optin',
      consentTimestamp: new Date().toISOString(),
      recipientPhone: '+919876543210',
    };
    await assert.rejects(() => verifyConsentEvidence(prisma, '919876543210', baseEvidence, 'MARKETING'), /explicitly opted in/);
    await assert.rejects(() => verifyConsentEvidence(prisma, '919876543210', { ...baseEvidence, consentType: 'VERIFIED_CRM_LEAD' }, 'UTILITY'), /explicitly opted in/);
  });

  it('requires phone-bound SIGNED_AGREEMENT evidence and rejects weak substring lead phone matches', async () => {
    const prisma = {
      media: {
        findFirst: async () => ({ id: 'doc_no_phone', filename: 'agr.pdf', metadata: { authorizesWhatsAppMarketing: true } }),
      },
      lead: {
        findUnique: async () => ({ id: 'lead_short', phone: '3210', whatsappMarketingConsent: true, createdAt: new Date() }),
      },
    };
    await assert.rejects(
      () => verifyConsentEvidence(prisma, '919876543210', {
        consentType: 'SIGNED_AGREEMENT',
        consentEvidenceRef: 'agr.pdf',
        consentTimestamp: new Date().toISOString(),
        recipientPhone: '+919876543210',
      }, 'MARKETING'),
      /valid recipient phone number/,
    );
    await assert.rejects(
      () => verifyConsentEvidence(prisma, '919876543210', {
        consentType: 'WEBSITE_LEAD_FORM',
        consentEvidenceRef: 'lead_short',
        consentTimestamp: new Date().toISOString(),
        recipientPhone: '+919876543210',
      }, 'MARKETING'),
      /valid phone number/,
    );
  });

  it('prevents unauthorized OPTED_IN promotion and persists consent evidence only when verified', async () => {
    const contacts = new Map([
      ['9876543210', { id: 'ct_unv', phone: '9876543210', businessName: 'Existing Biz', optInStatus: ContactOptInStatus.UNVERIFIED, createdAt: new Date() }],
    ]);
    const mockPrisma = {
      marketingContact: {
        findFirst: async ({ where }) => Array.from(contacts.values()).find((c) => where.phone.in.includes(c.phone)) || null,
        findUnique: async ({ where }) => contacts.get(where.phone) || null,
        update: async ({ where, data }) => Object.assign(contacts.get(where.phone), data),
        create: async ({ data }) => {
          const rec = { id: `ct_${contacts.size + 1}`, ...data };
          contacts.set(data.phone, rec);
          return rec;
        },
      },
    };

    await upsertOutreachContact(mockPrisma, '919876543210', 'Existing Biz', 'Rao', true);
    assert.equal(contacts.get('9876543210').optInStatus, ContactOptInStatus.UNVERIFIED);

    await upsertOutreachContact(mockPrisma, '919876500099', 'Unverified Brand', undefined, true);
    assert.equal(contacts.get('919876500099').optInStatus, ContactOptInStatus.UNVERIFIED);

    const verifiedTs = new Date();
    await upsertOutreachContact(mockPrisma, '919876500088', 'Consented Brand', 'Kalyan', true, {
      consentType: 'WEBSITE_LEAD_FORM',
      consentEvidenceRef: 'lead_ok_1',
      consentTimestamp: verifiedTs,
      consentSource: 'WEBSITE_LEAD_FORM',
      consentVersion: 'whatsapp_marketing_v1_2026_11',
    });
    const created = contacts.get('919876500088');
    assert.equal(created.optInStatus, ContactOptInStatus.OPTED_IN);
    assert.equal(created.consentSource, 'WEBSITE_LEAD_FORM');
    assert.equal(created.consentVersion, 'whatsapp_marketing_v1_2026_11');
    assert.equal(created.consentTimestamp, verifiedTs);
  });

  it('handles punctuation opt-out keywords, creates suppression row for unknown sender, and normalizes variants', async () => {
    const contacts = new Map();
    const mockPrisma = {
      marketingContact: {
        findMany: async ({ where }) => Array.from(contacts.values()).filter((c) => where.phone.in.includes(c.phone)),
        findFirst: async ({ where }) => Array.from(contacts.values()).find((c) => where.phone.in.includes(c.phone) && c.optInStatus === where.optInStatus) || null,
        create: async ({ data }) => {
          const rec = { id: `ct_optout_${contacts.size + 1}`, ...data };
          contacts.set(data.phone, rec);
          return rec;
        },
        updateMany: async ({ where, data }) => {
          let count = 0;
          for (const c of contacts.values()) {
            if (where.id.in.includes(c.id)) {
              Object.assign(c, data);
              count++;
            }
          }
          return { count };
        },
      },
    };
    const service = new WhatsAppOptOutService(mockPrisma);
    assert.equal(service.isOptOutKeyword('STOP.'), true);
    assert.equal(service.isOptOutKeyword('unsubscribe!'), true);
    assert.equal(service.isOptOutKeyword('వద్దు.'), true);
    assert.equal(service.isOptOutKeyword('opt out'), true);

    assert.equal(await service.handleInboundOptOut('+919876511111', 'STOP.'), true);
    assert.equal(contacts.get('919876511111')?.optInStatus, ContactOptInStatus.OPTED_OUT);
    assert.equal(await service.isSuppressed('9876511111'), true);
    assert.equal(await service.isSuppressed('+919876511111'), true);
  });

  it('prevents auto-reply after opt-out keyword or when sender is already suppressed', async () => {
    let sendCalls = 0;
    const dbMsgs = new Map();
    const optedOutContacts = new Map([
      ['919876522222', { id: 'ct_sup', phone: '919876522222', optInStatus: ContactOptInStatus.OPTED_OUT }],
    ]);
    const mockPrisma = {
      whatsAppWebhookLog: { create: async ({ data }) => ({ id: 'log_1', ...data }), update: async () => ({}) },
      whatsAppMessage: {
        findUnique: async ({ where }) => dbMsgs.get(where.wamId) || null,
        findFirst: async () => null,
        create: async ({ data }) => { const r = { id: `m_${dbMsgs.size + 1}`, createdAt: new Date(), ...data }; dbMsgs.set(data.wamId, r); return r; },
        update: async ({ data }) => data,
      },
      marketingContact: {
        findMany: async ({ where }) => Array.from(optedOutContacts.values()).filter((c) => where.phone.in.includes(c.phone)),
        findFirst: async ({ where }) => Array.from(optedOutContacts.values()).find((c) => where.phone.in.includes(c.phone) && c.optInStatus === where.optInStatus) || null,
        create: async ({ data }) => { const r = { id: `ct_${optedOutContacts.size + 1}`, ...data }; optedOutContacts.set(data.phone, r); return r; },
        updateMany: async () => ({ count: 1 }),
      },
    };
    const mockApiClient = { isConfigured: () => true, sendTextMessage: async () => { sendCalls++; return { messages: [{ id: 'wamid.SHOULD_NOT_SEND' }] }; } };
    const optOutService = new WhatsAppOptOutService(mockPrisma);
    const autoReplyService = new WhatsAppAutoReplyService(mockPrisma, { get: () => null }, mockApiClient, optOutService);
    const webhookService = new WhatsAppWebhookService({ get: () => null }, new WhatsAppMessageService(mockPrisma, { create: async () => ({}) }), mockPrisma, autoReplyService, optOutService);

    assert.equal(await autoReplyService.handleAutoReply({ id: 'm1', wamId: 'w1', direction: 'INBOUND', from: '919876522222', body: 'Hello?', createdAt: new Date() }), null);
    assert.equal(await autoReplyService.handleAutoReply({ id: 'm2', wamId: 'w2', direction: 'INBOUND', from: '919876533333', body: 'STOP.', createdAt: new Date() }), null);

    const res = await webhookService.processIncomingPayload({
      object: 'whatsapp_business_account',
      entry: [{
        changes: [{
          field: 'messages',
          value: {
            metadata: { display_phone_number: '919030787819' },
            messages: [{ from: '919876544444', id: 'wamid.INB_STOP', timestamp: `${Math.floor(Date.now() / 1000)}`, type: 'text', text: { body: 'STOP!' } }],
          },
        }],
      }],
    });
    assert.equal(res.messages, 1);
    await new Promise((r) => setTimeout(r, 30));
    assert.equal(sendCalls, 0);
    assert.equal(optedOutContacts.get('919876544444')?.optInStatus, ContactOptInStatus.OPTED_OUT);
  });
});
