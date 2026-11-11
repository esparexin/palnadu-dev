import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { WhatsAppDeliveryStatus, WhatsAppMessageDirection } from '@prisma/client';

const require = createRequire(import.meta.url);
const { WhatsAppOutreachService } = require('../dist/whatsapp/whatsapp-outreach.service.js');
const { cleanExpiredReservations } = require('../dist/whatsapp/whatsapp-outreach-reservation.util.js');

describe('WhatsApp Outreach - Stored Document Consent, Safe Reconciliation & Cleanup', () => {
  let messagesStore;
  let mediaStore;
  let mockPrisma;
  let mockApiClient;
  let metaDispatchCalls;
  let service;

  beforeEach(() => {
    messagesStore = new Map();
    mediaStore = new Map();
    metaDispatchCalls = 0;

    mockPrisma = {
      whatsAppMessage: {
        create: async ({ data }) => {
          const record = { id: `msg_${messagesStore.size + 1}`, createdAt: data.createdAt || new Date(), ...data };
          messagesStore.set(data.wamId, record);
          return record;
        },
        findUnique: async ({ where }) => {
          if (where.id) {
            for (const m of messagesStore.values()) {
              if (m.id === where.id) return m;
            }
          }
          return messagesStore.get(where.wamId) || null;
        },
        update: async ({ where, data }) => {
          let target = null;
          for (const msg of messagesStore.values()) {
            if (msg.id === where.id || msg.wamId === where.wamId) {
              target = msg;
              break;
            }
          }
          if (target) {
            Object.assign(target, data);
            if (data.rawPayload) target.rawPayload = { ...target.rawPayload, ...data.rawPayload };
          }
          return target;
        },
        deleteMany: async ({ where }) => {
          let count = 0;
          for (const [key, msg] of Array.from(messagesStore.entries())) {
            const matchesPrefix = where.wamId?.startsWith ? msg.wamId.startsWith(where.wamId.startsWith) : true;
            const matchesCutoff = where.createdAt?.lt ? msg.createdAt < where.createdAt.lt : true;
            if (matchesPrefix && matchesCutoff) {
              messagesStore.delete(key);
              count++;
            }
          }
          return { count };
        },
        findMany: async () => Array.from(messagesStore.values()),
        count: async () => messagesStore.size,
      },
      media: {
        findUnique: async ({ where }) => mediaStore.get(where.id) || null,
        findFirst: async ({ where }) => {
          for (const item of mediaStore.values()) {
            if (where.id && item.id === where.id) return item;
            if (where.filename && item.filename === where.filename) return item;
            if (where.OR) {
              for (const orCond of where.OR) {
                if (orCond.filename && item.filename === orCond.filename) return item;
                if (orCond.originalName && item.originalName === orCond.originalName) return item;
              }
            }
          }
          return null;
        },
      },
      marketingContact: {
        findUnique: async () => null,
        create: async ({ data }) => ({ id: 'c1', ...data }),
        update: async ({ data }) => ({ id: 'c1', ...data }),
      },
      lead: { findUnique: async () => null },
    };

    mockApiClient = {
      fetchApprovedTemplates: async () => [
        { name: 'b2b_website_outreach_v1', language: 'en_US', status: 'APPROVED', components: [] },
      ],
      sendTemplateMessage: async (payload) => {
        metaDispatchCalls++;
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: payload.to, wa_id: payload.to }],
          messages: [{ id: `wamid.META_${Date.now()}` }],
        };
      },
    };

    const mockOptOut = { isSuppressed: async () => false };
    const mockConfig = { get: () => '919030787819' };
    service = new WhatsAppOutreachService(mockPrisma, mockConfig, mockApiClient, mockOptOut);
  });

  const baseInput = {
    phone: '+919876500099',
    businessName: 'Palnadu Agro Corp',
    templateName: 'b2b_website_outreach_v1',
    languageCode: 'en_US',
    consentEvidence: {
      consentType: 'SIGNED_AGREEMENT',
      consentEvidenceRef: '507f1f77bcf86cd799439011',
      consentTimestamp: new Date().toISOString(),
      recipientPhone: '+919876500099',
    },
    idempotencyKey: 'idemp-doc-test-1',
  };

  it('rejects SIGNED_AGREEMENT when referenced document is not found in media store', async () => {
    await assert.rejects(
      () => service.sendOutreach(baseInput, { id: 'admin1' }),
      /not found in stored documents/,
    );
  });

  it('rejects SIGNED_AGREEMENT when stored document lacks explicit WhatsApp marketing authorization', async () => {
    mediaStore.set('507f1f77bcf86cd799439011', {
      id: '507f1f77bcf86cd799439011',
      filename: 'agreement_without_consent.pdf',
      metadata: { billingPlan: 'annual' }, // lacks marketing authorization
    });
    await assert.rejects(
      () => service.sendOutreach(baseInput, { id: 'admin1' }),
      /does not explicitly authorize WhatsApp marketing communication/,
    );
  });

  it('rejects SIGNED_AGREEMENT when stored document phone does not match recipient phone', async () => {
    mediaStore.set('507f1f77bcf86cd799439011', {
      id: '507f1f77bcf86cd799439011',
      filename: 'agreement_mismatched.pdf',
      metadata: { authorizesWhatsAppMarketing: true, recipientPhone: '+911111111111' },
    });
    await assert.rejects(
      () => service.sendOutreach(baseInput, { id: 'admin1' }),
      /phone authorization does not match recipient/,
    );
  });

  it('accepts SIGNED_AGREEMENT with stored document and explicit marketing consent', async () => {
    mediaStore.set('507f1f77bcf86cd799439011', {
      id: '507f1f77bcf86cd799439011',
      filename: 'signed_contract_palnadu.pdf',
      metadata: { authorizesWhatsAppMarketing: true, recipientPhone: '+919876500099' },
    });
    const res = await service.sendOutreach(baseInput, { id: 'admin1' });
    assert.equal(res.success, true);
    assert.ok(res.wamId.startsWith('wamid.META_'));
  });

  it('safely reconciles RECONCILIATION_PENDING message without duplicate Meta dispatch', async () => {
    const ambiguousMsg = {
      id: 'msg_ambiguous_1',
      wamId: 'ambiguous:resv_claim_1',
      direction: WhatsAppMessageDirection.OUTBOUND,
      status: WhatsAppDeliveryStatus.RECEIVED,
      rawPayload: { requiresReconciliation: true, to: '919876500099' },
      createdAt: new Date(),
    };
    messagesStore.set(ambiguousMsg.wamId, ambiguousMsg);

    const initialDispatchCount = metaDispatchCalls;
    const result = await service.reconcileOutreach(
      ambiguousMsg.id,
      { confirmedStatus: 'DELIVERED', metaWamId: 'wamid.HBgL_CONFIRMED_123', notes: 'Verified via Meta Business Suite' },
      { id: 'admin_audit' },
    );

    assert.equal(result.success, true);
    assert.equal(result.status, 'DELIVERED');
    assert.equal(result.reconciled, true);
    assert.equal(metaDispatchCalls, initialDispatchCount, 'Must never invoke Meta dispatch API during reconciliation');

    const updated = messagesStore.get('wamid.HBgL_CONFIRMED_123') || Array.from(messagesStore.values()).find(m => m.id === ambiguousMsg.id);
    assert.equal(updated.status, WhatsAppDeliveryStatus.DELIVERED);
    assert.equal(updated.rawPayload.requiresReconciliation, false);
    assert.equal(updated.rawPayload.reconciledBy, 'admin_audit');
  });

  it('reservation cleanup deletes ONLY expired resv: records and NEVER deletes real messages or active reservations', async () => {
    const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000);
    const tenSecondsAgo = new Date(Date.now() - 10 * 1000);

    // 1. Expired reservation (>1h old) -> should be deleted
    messagesStore.set('resv:rate:admin1:20261111:s1', {
      id: 'r_old',
      wamId: 'resv:rate:admin1:20261111:s1',
      createdAt: twoHoursAgo,
    });

    // 2. Active reservation (<1h old) -> MUST NOT be deleted
    messagesStore.set('resv:rate:admin1:20261111:s2', {
      id: 'r_active',
      wamId: 'resv:rate:admin1:20261111:s2',
      createdAt: tenSecondsAgo,
    });

    // 3. Real WhatsApp message created two hours ago -> MUST NEVER be deleted
    messagesStore.set('wamid.HBgL_REAL_MESSAGE_01', {
      id: 'msg_real',
      wamId: 'wamid.HBgL_REAL_MESSAGE_01',
      createdAt: twoHoursAgo,
      direction: WhatsAppMessageDirection.OUTBOUND,
      status: WhatsAppDeliveryStatus.DELIVERED,
    });

    const cleanupResult = await cleanExpiredReservations(mockPrisma, 3600000);
    assert.equal(cleanupResult.deletedCount, 1, 'Only the expired reservation should be deleted');
    assert.equal(messagesStore.has('resv:rate:admin1:20261111:s1'), false, 'Expired reservation deleted');
    assert.equal(messagesStore.has('resv:rate:admin1:20261111:s2'), true, 'Active reservation preserved');
    assert.equal(messagesStore.has('wamid.HBgL_REAL_MESSAGE_01'), true, 'Real WhatsApp message preserved');
  });
});
