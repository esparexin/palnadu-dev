import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { CampaignStatus, ContactOptInStatus } from '@prisma/client';

const require = createRequire(import.meta.url);
const { WhatsAppCampaignService } = require('../dist/whatsapp/whatsapp-campaign.service.js');

describe('WhatsApp Paced Campaign Dispatcher', () => {
  it('dispatches template messages with suppression and records metrics', async () => {
    const campaign = {
      id: 'camp_001',
      name: 'Narasaraopet Retailers Outreach',
      templateName: 'b2b_website_outreach_v1',
      languageCode: 'te',
      targetAudience: 'NO_WEBSITE',
      status: CampaignStatus.DRAFT,
      sentCount: 0,
      failedCount: 0,
      batchSize: 10,
      delayMs: 1, // fast for testing
    };

    const contacts = [
      {
        id: 'c1',
        businessName: 'Sri Lakshmi Textiles',
        phone: '919876543210',
        hasWebsite: false,
        optInStatus: ContactOptInStatus.UNVERIFIED,
      },
      {
        id: 'c2',
        businessName: 'Kaveri Seeds & Pesticides',
        phone: '919876543211',
        hasWebsite: false,
        optInStatus: ContactOptInStatus.OPTED_OUT, // suppressed!
      },
      {
        id: 'c3',
        businessName: 'Venkateswara Rice Mill',
        phone: '919876543212',
        hasWebsite: false,
        optInStatus: ContactOptInStatus.UNVERIFIED,
      },
    ];

    const messagesStore = [];
    const mockPrisma = {
      marketingCampaign: {
        findUnique: async ({ where }) => (where.id === campaign.id ? campaign : null),
        update: async ({ where, data }) => {
          if (where.id === campaign.id) {
            if (data.status) campaign.status = data.status;
            if (data.sentCount?.increment) campaign.sentCount += data.sentCount.increment;
            if (data.failedCount?.increment) campaign.failedCount += data.failedCount.increment;
          }
          return campaign;
        },
      },
      marketingContact: {
        findMany: async () => contacts.filter((c) => c.optInStatus !== ContactOptInStatus.OPTED_OUT),
      },
      whatsAppMessage: {
        findMany: async () => messagesStore.filter((m) => m.campaignId === campaign.id),
        create: async ({ data }) => {
          const record = { id: `msg_${messagesStore.length + 1}`, ...data };
          messagesStore.push(record);
          return record;
        },
      },
    };

    const sentPayloads = [];
    const mockApiClient = {
      sendTemplateMessage: async (payload) => {
        sentPayloads.push(payload);
        return {
          messaging_product: 'whatsapp',
          contacts: [{ input: payload.to, wa_id: payload.to }],
          messages: [{ id: `wamid_${payload.to}` }],
        };
      },
    };

    const mockConfig = {
      get: (key) => (key === 'WHATSAPP_PHONE_NUMBER_ID' ? 'test_phone_id' : null),
    };

    const service = new WhatsAppCampaignService(mockPrisma, mockConfig, mockApiClient);
    const result = await service.dispatchCampaign('camp_001');

    assert.equal(result.sentCount, 2);
    assert.equal(result.failedCount, 0);
    assert.equal(result.skippedCount, 0);
    assert.equal(result.status, CampaignStatus.COMPLETED);
    assert.equal(campaign.sentCount, 2);

    // Verify sent payloads
    assert.equal(sentPayloads.length, 2);
    assert.equal(sentPayloads[0].to, '919876543210');
    assert.equal(sentPayloads[0].templateName, 'b2b_website_outreach_v1');
    assert.equal(sentPayloads[0].languageCode, 'te');
    assert.equal(sentPayloads[0].components[0].parameters[0].text, 'Sri Lakshmi Textiles');

    // Verify messages saved
    assert.equal(messagesStore.length, 2);
    assert.equal(messagesStore[0].campaignId, 'camp_001');
    assert.equal(messagesStore[0].to, '919876543210');
    assert.equal(messagesStore[0].type, 'template');
  });

  it('skips contacts that already received messages for the campaign', async () => {
    const campaign = {
      id: 'camp_002',
      name: 'Duplicate Guard Campaign',
      templateName: 'b2b_promo_v1',
      languageCode: 'en_US',
      status: CampaignStatus.DRAFT,
      sentCount: 1,
      failedCount: 0,
    };

    const contacts = [
      {
        id: 'c1',
        businessName: 'Already Messaged Biz',
        phone: '919876543210',
        optInStatus: ContactOptInStatus.UNVERIFIED,
      },
      {
        id: 'c2',
        businessName: 'Fresh Biz',
        phone: '919876543211',
        optInStatus: ContactOptInStatus.UNVERIFIED,
      },
    ];

    const messagesStore = [{ to: '919876543210', campaignId: 'camp_002' }];
    const sent = [];

    const mockPrisma = {
      marketingCampaign: {
        findUnique: async () => campaign,
        update: async ({ data }) => Object.assign(campaign, data),
      },
      marketingContact: {
        findMany: async () => contacts,
      },
      whatsAppMessage: {
        findMany: async () => messagesStore,
        create: async ({ data }) => {
          messagesStore.push(data);
          return data;
        },
      },
    };

    const mockApiClient = {
      sendTemplateMessage: async (payload) => {
        sent.push(payload);
        return { messages: [{ id: `wamid_${payload.to}` }] };
      },
    };

    const mockConfig = { get: () => 'test_id' };
    const service = new WhatsAppCampaignService(mockPrisma, mockConfig, mockApiClient);
    const result = await service.dispatchCampaign('camp_002');

    assert.equal(result.sentCount, 1);
    assert.equal(result.skippedCount, 1);
    assert.equal(sent.length, 1);
    assert.equal(sent[0].to, '919876543211');
  });

  it('rejects dispatching an already running or completed campaign', async () => {
    const campaign = { id: 'camp_003', status: CampaignStatus.COMPLETED };
    const mockPrisma = {
      marketingCampaign: { findUnique: async () => campaign },
    };

    const service = new WhatsAppCampaignService(mockPrisma, {}, {});
    await assert.rejects(
      () => service.dispatchCampaign('camp_003'),
      /cannot be dispatched in status COMPLETED/,
    );
  });

  it('fails dispatch cleanly without stripping parameters on Meta 132000 error', async () => {
    const campaign = {
      id: 'camp_004',
      name: 'Parameter Test',
      templateName: 'b2b_website_outreach_v1',
      languageCode: 'en_US',
      status: CampaignStatus.DRAFT,
      sentCount: 0,
      failedCount: 0,
      delayMs: 1,
    };
    const contacts = [
      { id: 'c1', businessName: 'Test Business', phone: '919876543210', optInStatus: ContactOptInStatus.UNVERIFIED },
    ];
    let callCount = 0;
    const mockApiClient = {
      sendTemplateMessage: async () => {
        callCount++;
        const { WhatsAppApiException } = require('../dist/whatsapp/whatsapp-api.util.js');
        throw new WhatsAppApiException('Parameter mismatch', 400, { code: 132000, message: 'Param mismatch' });
      },
    };
    const mockPrisma = {
      marketingCampaign: {
        findUnique: async () => campaign,
        update: async ({ data }) => Object.assign(campaign, data),
      },
      marketingContact: { findMany: async () => contacts },
      whatsAppMessage: { findMany: async () => [], create: async () => ({}) },
    };
    const service = new WhatsAppCampaignService(mockPrisma, { get: () => 'test_id' }, mockApiClient);
    const result = await service.dispatchCampaign('camp_004');

    assert.equal(result.failedCount, 1);
    assert.equal(result.sentCount, 0);
    assert.equal(callCount, 1, 'Must not retry by stripping parameters');
  });
});
