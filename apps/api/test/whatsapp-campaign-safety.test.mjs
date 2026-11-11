import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { CampaignStatus, ContactOptInStatus } from '@prisma/client';

const require = createRequire(import.meta.url);
const { WhatsAppCampaignService } = require('../dist/whatsapp/whatsapp-campaign.service.js');
const { WhatsAppAdminController } = require('../dist/whatsapp/whatsapp-admin.controller.js');
const { WhatsAppApiException } = require('../dist/whatsapp/whatsapp-api.util.js');

const ACK_TEMPLATE = {
  name: 'palnadu_customer_acknowledgement',
  status: 'APPROVED',
  language: 'en_IN',
  category: 'MARKETING',
  parameter_format: 'NAMED',
  components: [
    {
      type: 'BODY',
      text: 'Hello {{customer_name}}, thank you for contacting Palnadu.dev.',
      example: { body_text_named_params: [{ param_name: 'customer_name', example: 'Kalyan' }] },
    },
  ],
};

function createCampaignHarness({ campaign, contacts = [], approvedTemplates = [ACK_TEMPLATE], fetchError = null }) {
  const createdCampaigns = [];
  const sentPayloads = [];
  const messagesStore = new Map();

  const prisma = {
    marketingCampaign: {
      create: async ({ data }) => {
        const saved = { id: `camp_${createdCampaigns.length + 1}`, ...data };
        createdCampaigns.push(saved);
        return saved;
      },
      findUnique: async ({ where } = {}) => (!where?.id || where.id === campaign?.id ? campaign : null),
      updateMany: async ({ where, data }) => {
        if (campaign && (!where?.status?.in || where.status.in.includes(campaign.status))) {
          Object.assign(campaign, data);
          return { count: 1 };
        }
        return { count: 0 };
      },
      update: async ({ data }) => {
        if (data.status) campaign.status = data.status;
        if (data.sentCount?.increment) campaign.sentCount = (campaign.sentCount || 0) + data.sentCount.increment;
        if (data.failedCount?.increment) campaign.failedCount = (campaign.failedCount || 0) + data.failedCount.increment;
        return campaign;
      },
    },
    marketingContact: {
      findMany: async () => contacts.filter((c) => c.optInStatus === ContactOptInStatus.OPTED_IN),
    },
    whatsAppMessage: {
      findMany: async () => [],
      create: async ({ data }) => {
        const rec = { id: `m_${messagesStore.size + 1}`, ...data };
        messagesStore.set(data.wamId, rec);
        return rec;
      },
      update: async ({ where, data }) => Object.assign(messagesStore.get(where.wamId) || {}, data),
      delete: async ({ where }) => { messagesStore.delete(where.wamId); return {}; },
    },
  };

  const apiClient = {
    fetchApprovedTemplates: async () => {
      if (fetchError) throw fetchError;
      return approvedTemplates;
    },
    sendTemplateMessage: async (payload) => {
      sentPayloads.push(payload);
      return { messages: [{ id: `wamid.CMP_${sentPayloads.length}` }] };
    },
  };

  const service = new WhatsAppCampaignService(prisma, { get: (k) => (k === 'WHATSAPP_CAMPAIGN_DELAY_MS' ? 1 : '919030787819') }, apiClient);
  return { service, prisma, apiClient, createdCampaigns, sentPayloads };
}

describe('WhatsApp Campaign Template Safety - Fail-Closed & Named Customer Parameters', () => {
  it('1. creates campaign with Meta-approved palnadu_customer_acknowledgement (en_IN) without en_US drift', async () => {
    const { service, createdCampaigns } = createCampaignHarness({});
    const created = await service.createCampaign({
      name: 'Customer Acknowledgement Batch',
      templateName: 'palnadu_customer_acknowledgement',
      languageCode: 'en_IN',
      targetAudience: 'ALL_OPTED_IN',
    });
    assert.equal(created.templateName, 'palnadu_customer_acknowledgement');
    assert.equal(created.languageCode, 'en_IN');
    assert.equal(createdCampaigns.length, 1);
  });

  it('2. rejects campaign creation with blank language, wrong language (en_US), or failed Meta verification', async () => {
    const h1 = createCampaignHarness({});
    await assert.rejects(() => h1.service.createCampaign({ name: 'Bad', templateName: 'palnadu_customer_acknowledgement', languageCode: '' }), /required/);
    await assert.rejects(() => h1.service.createCampaign({ name: 'Wrong Lang', templateName: 'palnadu_customer_acknowledgement', languageCode: 'en_US' }), /not currently approved/);
    assert.equal(h1.createdCampaigns.length, 0);

    const h2 = createCampaignHarness({ fetchError: new WhatsAppApiException('Meta Graph API 503 Unavailable', 503) });
    await assert.rejects(() => h2.service.createCampaign({ name: 'Outage', templateName: 'palnadu_customer_acknowledgement', languageCode: 'en_IN' }), /Meta Graph API 503/);
    assert.equal(h2.createdCampaigns.length, 0);
  });

  it('3. fails closed on dispatch when Meta verification errors (restores PAUSED, sends 0 messages)', async () => {
    const campaign = { id: 'camp_fail_1', templateName: 'palnadu_customer_acknowledgement', languageCode: 'en_IN', status: CampaignStatus.DRAFT };
    const contacts = [{ id: 'c1', businessName: 'Agro Mill', contactName: 'Kalyan', phone: '919876543210', optInStatus: ContactOptInStatus.OPTED_IN }];
    const { service, sentPayloads } = createCampaignHarness({
      campaign,
      contacts,
      fetchError: new WhatsAppApiException('Token expired', 401),
    });

    await assert.rejects(() => service.dispatchCampaign('camp_fail_1'), /Token expired/);
    assert.equal(sentPayloads.length, 0);
    assert.equal(campaign.status, CampaignStatus.PAUSED);
  });

  it('4. fails closed on dispatch when template or language is unapproved in Meta (marks FAILED, sends 0 messages)', async () => {
    const campaign = { id: 'camp_fail_2', templateName: 'palnadu_customer_acknowledgement', languageCode: 'en_US', status: CampaignStatus.DRAFT };
    const contacts = [{ id: 'c1', businessName: 'Agro Mill', contactName: 'Kalyan', phone: '919876543210', optInStatus: ContactOptInStatus.OPTED_IN }];
    const { service, sentPayloads } = createCampaignHarness({ campaign, contacts });

    await assert.rejects(() => service.dispatchCampaign('camp_fail_2'), /not currently approved/);
    assert.equal(sentPayloads.length, 0);
    assert.equal(campaign.status, CampaignStatus.FAILED);
  });

  it('5. dispatches palnadu_customer_acknowledgement with named customer_name parameter and rejects missing contactName', async () => {
    const campaign = { id: 'camp_ack_ok', templateName: 'palnadu_customer_acknowledgement', languageCode: 'en_IN', status: CampaignStatus.DRAFT, sentCount: 0, failedCount: 0 };
    const contacts = [
      { id: 'c1', businessName: 'Kaveri Mills', contactName: '  Kalyan Rao  ', phone: '919876543211', optInStatus: ContactOptInStatus.OPTED_IN },
      { id: 'c2', businessName: 'Unnamed Enterprise', contactName: null, phone: '919876543212', optInStatus: ContactOptInStatus.OPTED_IN },
    ];
    const { service, sentPayloads } = createCampaignHarness({ campaign, contacts });

    const result = await service.dispatchCampaign('camp_ack_ok');
    assert.equal(result.sentCount, 1);
    assert.equal(result.failedCount, 1);
    assert.equal(sentPayloads[0].languageCode, 'en_IN');
    assert.deepEqual(sentPayloads[0].components, [
      { type: 'body', parameters: [{ type: 'text', parameter_name: 'customer_name', text: 'Kalyan Rao' }] },
    ]);
  });

  it('6. controller getApprovedTemplates fails closed instead of falling back to static en_US catalog', async () => {
    const ctrlNoClient = new WhatsAppAdminController({}, {});
    await assert.rejects(() => ctrlNoClient.getApprovedTemplates(), /unavailable/);

    const ctrlMetaErr = new WhatsAppAdminController({}, {}, undefined, {
      fetchApprovedTemplates: async () => { throw new WhatsAppApiException('Meta unreachable', 502); },
    });
    await assert.rejects(() => ctrlMetaErr.getApprovedTemplates(), /Meta unreachable/);
  });
});

