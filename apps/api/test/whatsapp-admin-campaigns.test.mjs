import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppAdminController } = require('../dist/whatsapp/whatsapp-admin.controller.js');
const { WhatsAppContactService } = require('../dist/whatsapp/whatsapp-contact.service.js');

describe('WhatsApp Admin Campaigns & Contacts API', () => {
  it('creates campaign and retrieves campaign list', async () => {
    const campaignsStore = [];
    const mockCampaignService = {
      createCampaign: async (data) => {
        const item = { id: 'c_1', ...data, status: 'DRAFT', sentCount: 0 };
        campaignsStore.push(item);
        return item;
      },
      listCampaigns: async () => ({
        data: campaignsStore,
        total: campaignsStore.length,
        page: 1,
        totalPages: 1,
      }),
      getCampaign: async (id) => campaignsStore.find((c) => c.id === id) || null,
      dispatchCampaign: async (id) => ({
        campaignId: id,
        sentCount: 5,
        failedCount: 0,
        skippedCount: 0,
        status: 'COMPLETED',
      }),
      pauseCampaign: async (id) => {
        const item = campaignsStore.find((c) => c.id === id);
        if (item) item.status = 'PAUSED';
        return item;
      },
    };

    const mockContactService = {
      getStats: async () => ({ totalContacts: 10, withoutWebsite: 8, optedIn: 2, optedOut: 0 }),
    };

    const controller = new WhatsAppAdminController(mockCampaignService, mockContactService);

    // 1. Create
    const createRes = await controller.createCampaign({
      name: 'Macherla Agro Outreach',
      templateName: 'b2b_intro_v1',
      languageCode: 'te',
    });
    assert.equal(createRes.success, true);
    assert.equal(createRes.data.name, 'Macherla Agro Outreach');

    // 2. List
    const listRes = await controller.listCampaigns();
    assert.equal(listRes.success, true);
    assert.equal(listRes.total, 1);

    // 3. Dispatch
    const dispatchRes = await controller.dispatchCampaign('c_1');
    assert.equal(dispatchRes.success, true);
    assert.equal(dispatchRes.data.sentCount, 5);

    // 4. Pause
    const pauseRes = await controller.pauseCampaign('c_1');
    assert.equal(pauseRes.success, true);
    assert.equal(pauseRes.data.status, 'PAUSED');
  });

  it('imports contacts and rejects duplicates', async () => {
    const contactsStore = new Map();
    const mockPrisma = {
      marketingContact: {
        findUnique: async ({ where }) => contactsStore.get(where.phone) || null,
        create: async ({ data }) => {
          contactsStore.set(data.phone, { id: `ct_${contactsStore.size + 1}`, ...data });
          return contactsStore.get(data.phone);
        },
        findMany: async () => Array.from(contactsStore.values()),
        count: async () => contactsStore.size,
      },
    };

    const contactService = new WhatsAppContactService(mockPrisma);
    const controller = new WhatsAppAdminController({}, contactService);

    const importRes = await controller.importContacts({
      contacts: [
        { businessName: 'Macherla Rice Mill', phone: '+919876543210', hasWebsite: false },
        { businessName: 'Duplicate Rice Mill', phone: '919876543210', hasWebsite: false }, // Duplicate
        { businessName: 'Guntur Spices', phone: '919876543211', hasWebsite: true },
      ],
    });

    assert.equal(importRes.success, true);
    assert.equal(importRes.data.imported, 2);
    assert.equal(importRes.data.duplicates, 1);
    assert.equal(importRes.data.total, 3);

    // List contacts
    const listRes = await controller.listContacts();
    assert.equal(listRes.success, true);
    assert.equal(listRes.total, 2);
  });
});
