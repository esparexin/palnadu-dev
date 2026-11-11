import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { CampaignStatus, ContactOptInStatus, WhatsAppDeliveryStatus, WhatsAppMessageDirection } from '@prisma/client';

const require = createRequire(import.meta.url);
const { WhatsAppCampaignService } = require('../dist/whatsapp/whatsapp-campaign.service.js');
const { WhatsAppApiException } = require('../dist/whatsapp/whatsapp-api.util.js');

function createConcurrentMockPrisma({ campaign, contacts = [], messagesStore = new Map() }) {
  return {
    marketingCampaign: {
      findUnique: async ({ where } = {}) => (!where?.id || where.id === campaign.id ? campaign : null),
      updateMany: async ({ where, data }) => {
        if (!where?.status?.in || where.status.in.includes(campaign.status)) {
          Object.assign(campaign, data);
          return { count: 1 };
        }
        return { count: 0 };
      },
      update: async ({ data }) => {
        if (data.status) campaign.status = data.status;
        if (data.sentCount?.increment) campaign.sentCount += data.sentCount.increment;
        if (data.failedCount?.increment) campaign.failedCount += data.failedCount.increment;
        return campaign;
      },
    },
    marketingContact: {
      findMany: async () => contacts.filter((c) => c.optInStatus === ContactOptInStatus.OPTED_IN),
    },
    whatsAppMessage: {
      findMany: async () => Array.from(messagesStore.values()).filter((m) => !m.campaignId || m.campaignId === campaign.id),
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
      update: async ({ where, data }) => {
        const record = messagesStore.get(where.wamId);
        if (record) {
          messagesStore.delete(where.wamId);
          Object.assign(record, data);
          messagesStore.set(data.wamId || where.wamId, record);
          return record;
        }
        return null;
      },
      delete: async ({ where } = {}) => {
        messagesStore.delete(where.wamId);
        return {};
      },
    },
  };
}

describe('WhatsApp Campaign Concurrency & Durable Reservation Lifecycle', () => {
  it('guarantees exactly one worker claims a campaign under simultaneous dispatch requests', async () => {
    const campaign = { id: 'camp_race_1', status: CampaignStatus.DRAFT, templateName: 't1', languageCode: 'en_US' };
    const contacts = [{ id: 'c1', businessName: 'Biz 1', phone: '919876543201', optInStatus: ContactOptInStatus.OPTED_IN }];
    const messagesStore = new Map();
    const mockPrisma = createConcurrentMockPrisma({ campaign, contacts, messagesStore });
    const mockApiClient = {
      sendTemplateMessage: async () => ({ messages: [{ id: 'wamid_race_1' }] }),
    };

    const mockConfig = { get: (k) => (k === 'WHATSAPP_CAMPAIGN_DELAY_MS' ? 1 : '919030787819') };
    const service1 = new WhatsAppCampaignService(mockPrisma, mockConfig, mockApiClient);
    const service2 = new WhatsAppCampaignService(mockPrisma, mockConfig, mockApiClient);

    const [res1, res2] = await Promise.allSettled([
      service1.dispatchCampaign('camp_race_1'),
      service2.dispatchCampaign('camp_race_1'),
    ]);

    const successes = [res1, res2].filter((r) => r.status === 'fulfilled');
    const rejected = [res1, res2].filter((r) => r.status === 'rejected');

    assert.equal(successes.length, 1, 'Exactly one worker must succeed');
    assert.equal(rejected.length, 1, 'The concurrent worker must be rejected');
    assert.match(rejected[0].reason?.message, /already running or cannot be claimed/);
  });

  it('prevents duplicate recipient dispatch through durable pre-dispatch reservation', async () => {
    const campaign = { id: 'camp_resv_1', status: CampaignStatus.DRAFT, templateName: 't1', languageCode: 'en_US' };
    const contacts = [{ id: 'c1', businessName: 'Biz 1', phone: '919876543202', optInStatus: ContactOptInStatus.OPTED_IN }];
    const messagesStore = new Map();
    // Simulate pre-existing reservation from another concurrent worker or thread
    messagesStore.set('resv:cmp:camp_resv_1:919876543202', {
      wamId: 'resv:cmp:camp_resv_1:919876543202',
      direction: WhatsAppMessageDirection.OUTBOUND,
      from: 'system_campaign_resv',
      to: '919876543202',
      campaignId: 'camp_resv_1',
    });

    let metaCalls = 0;
    const mockApiClient = {
      sendTemplateMessage: async () => {
        metaCalls++;
        return { messages: [{ id: 'wamid_should_not_happen' }] };
      },
    };
    const mockConfig = { get: (k) => (k === 'WHATSAPP_CAMPAIGN_DELAY_MS' ? 1 : '919030787819') };
    const mockPrisma = createConcurrentMockPrisma({ campaign, contacts, messagesStore });
    const service = new WhatsAppCampaignService(mockPrisma, mockConfig, mockApiClient);

    const result = await service.dispatchCampaign('camp_resv_1');
    assert.equal(metaCalls, 0, 'Meta API must not be called when reservation is already held');
    assert.equal(result.skippedCount, 1, 'Recipient must be safely skipped');
  });

  it('safely recovers from crash/restart without sending duplicate customer messages', async () => {
    const campaign = { id: 'camp_crash_1', status: CampaignStatus.PAUSED, templateName: 't1', languageCode: 'en_US' };
    const contacts = [
      { id: 'c1', businessName: 'Biz 1', phone: '919876543203', optInStatus: ContactOptInStatus.OPTED_IN },
      { id: 'c2', businessName: 'Biz 2', phone: '919876543204', optInStatus: ContactOptInStatus.OPTED_IN },
    ];
    const messagesStore = new Map();
    // c1 was already successfully sent before crash
    messagesStore.set('wamid.SUCCESS_01', {
      wamId: 'wamid.SUCCESS_01',
      to: '919876543203',
      campaignId: 'camp_crash_1',
      status: WhatsAppDeliveryStatus.SENT,
    });

    const sentNumbers = [];
    const mockApiClient = {
      sendTemplateMessage: async (payload) => {
        sentNumbers.push(payload.to);
        return { messages: [{ id: `wamid_${payload.to}` }] };
      },
    };
    const mockConfig = { get: (k) => (k === 'WHATSAPP_CAMPAIGN_DELAY_MS' ? 1 : '919030787819') };
    const mockPrisma = createConcurrentMockPrisma({ campaign, contacts, messagesStore });
    const service = new WhatsAppCampaignService(mockPrisma, mockConfig, mockApiClient);

    const result = await service.dispatchCampaign('camp_crash_1');
    assert.equal(result.sentCount, 1);
    assert.equal(result.skippedCount, 1);
    assert.deepEqual(sentNumbers, ['919876543204'], 'Only unmessaged recipient c2 is dispatched on resume');
  });

  it('records ambiguous Meta response as RECONCILIATION_PENDING and never resends', async () => {
    const campaign = { id: 'camp_ambig_1', status: CampaignStatus.DRAFT, templateName: 't1', languageCode: 'en_US' };
    const contacts = [{ id: 'c1', businessName: 'Biz 1', phone: '919876543205', optInStatus: ContactOptInStatus.OPTED_IN }];
    const messagesStore = new Map();

    const mockApiClient = {
      sendTemplateMessage: async () => {
        throw new WhatsAppApiException('Meta Gateway Timeout', 504, undefined, true);
      },
    };
    const mockConfig = { get: (k) => (k === 'WHATSAPP_CAMPAIGN_DELAY_MS' ? 1 : '919030787819') };
    const mockPrisma = createConcurrentMockPrisma({ campaign, contacts, messagesStore });
    const service = new WhatsAppCampaignService(mockPrisma, mockConfig, mockApiClient);

    const result = await service.dispatchCampaign('camp_ambig_1');
    assert.equal(result.failedCount, 1);

    const ambiguousMsg = messagesStore.get('ambiguous:cmp:camp_ambig_1:919876543205');
    assert.ok(ambiguousMsg, 'Ambiguous message record must be persisted with ambiguous: prefix');
    assert.equal(ambiguousMsg.status, WhatsAppDeliveryStatus.RECEIVED);
    assert.equal(ambiguousMsg.rawPayload.requiresReconciliation, true);

    // Second run should skip the ambiguous recipient and never re-dispatch
    let secondRunCalls = 0;
    mockApiClient.sendTemplateMessage = async () => {
      secondRunCalls++;
      return { messages: [{ id: 'wamid_bad' }] };
    };
    campaign.status = CampaignStatus.PAUSED;
    const secondResult = await service.dispatchCampaign('camp_ambig_1');
    assert.equal(secondRunCalls, 0, 'Must never re-dispatch ambiguous recipient');
    assert.equal(secondResult.skippedCount, 1);
  });
});

