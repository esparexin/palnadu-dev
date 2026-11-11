import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppAutoReplyService } = require('../dist/whatsapp/whatsapp-auto-reply.service.js');
const { WhatsAppMessageService } = require('../dist/whatsapp/whatsapp-message.service.js');

describe('WhatsApp Concurrency, Claims & Cooldown Reliability', () => {
  const mockConfig = {
    get: (key) => {
      if (key === 'WHATSAPP_AUTO_REPLY_ENABLED') return 'true';
      if (key === 'WHATSAPP_AUTO_REPLY_COOLDOWN_HOURS') return '24';
      return null;
    },
  };

  it('reconciles P2002 collision when status webhook races ahead of claim update', async () => {
    const assignedWamId = 'wamid.RACING_DELIVERY_001';
    const store = new Map();
    let deleteClaimCalled = false;

    // Simulate status webhook having already created the row
    store.set(assignedWamId, {
      id: 'existing_status_row',
      wamId: assignedWamId,
      direction: 'OUTBOUND',
      status: 'SENT',
    });

    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => ({ messages: [{ id: assignedWamId }] }),
    };

    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async () => null,
        create: async ({ data }) => {
          const rec = { id: 'claim_123', ...data };
          store.set(data.wamId, rec);
          return rec;
        },
        update: async ({ where, data }) => {
          if (where.id === 'claim_123') {
            const err = new Error('Unique constraint failed on the fields: (wam_id)');
            err.code = 'P2002';
            throw err;
          }
          if (where.wamId === assignedWamId) {
            const target = store.get(assignedWamId);
            const updated = { ...target, ...data };
            store.set(assignedWamId, updated);
            return updated;
          }
          return null;
        },
        delete: async ({ where }) => {
          if (where.id === 'claim_123') deleteClaimCalled = true;
          return {};
        },
      },
    };

    const service = new WhatsAppAutoReplyService(mockPrisma, mockConfig, mockApiClient);
    const inbound = {
      id: 'inbound_fast',
      wamId: 'wamid.INBOUND_FAST',
      direction: 'INBOUND',
      from: '919876543210',
      createdAt: new Date(),
    };

    const res = await service.handleAutoReply(inbound);
    assert.ok(res);
    assert.equal(res.wamId, assignedWamId);
    assert.equal(res.contextWamId, 'wamid.INBOUND_FAST');
    assert.equal(deleteClaimCalled, true);
  });

  it('does not suppress auto-reply when previous outbound was a marketing campaign', async () => {
    let sendAttempted = false;
    const mockApiClient = {
      isConfigured: () => true,
      sendTextMessage: async () => {
        sendAttempted = true;
        return { messages: [{ id: 'wamid.REPLY_TO_CAMPAIGN' }] };
      },
    };

    const mockPrisma = {
      whatsAppMessage: {
        findFirst: async ({ where }) => {
          if (where.contextWamId) return null;
          if (where.campaignId === null) return null;
          return { id: 'campaign_broadcast_msg', campaignId: 'c1' };
        },
        create: async ({ data }) => ({ id: 'out_ack', ...data }),
        update: async ({ data }) => ({ id: 'out_ack', ...data }),
      },
    };

    const service = new WhatsAppAutoReplyService(mockPrisma, mockConfig, mockApiClient);
    const inbound = {
      id: 'inbound_lead',
      wamId: 'wamid.INBOUND_LEAD_001',
      direction: 'INBOUND',
      from: '919876543210',
      createdAt: new Date(),
    };

    const result = await service.handleAutoReply(inbound);
    assert.ok(result);
    assert.equal(sendAttempted, true);
  });

  it('safely handles untracked status update when recipientId is undefined', async () => {
    let capturedTo = null;
    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => null,
        create: async ({ data }) => {
          capturedTo = data.to;
          return { id: 'new_msg', ...data };
        },
      },
    };

    const messageService = new WhatsAppMessageService(mockPrisma, { create: async () => ({}) });
    const result = await messageService.updateMessageStatus({
      wamId: 'wamid.NO_RECIPIENT_001',
      recipientId: undefined,
      status: 'failed',
      errorCode: '131056',
    });

    assert.ok(result);
    assert.equal(capturedTo, 'unknown_recipient');
  });
});
