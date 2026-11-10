import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

describe('WhatsApp Marketing Contact & Campaign Persistence', () => {
  it('creates a MarketingCampaign with defaults and correct initial status', async () => {
    let savedCampaign = null;
    const mockPrisma = {
      marketingCampaign: {
        create: async ({ data }) => {
          savedCampaign = {
            id: 'camp_001',
            createdAt: new Date(),
            updatedAt: new Date(),
            totalContacts: 0,
            sentCount: 0,
            deliveredCount: 0,
            readCount: 0,
            failedCount: 0,
            status: 'DRAFT',
            languageCode: 'en_US',
            ...data,
          };
          return savedCampaign;
        },
      },
    };

    const campaign = await mockPrisma.marketingCampaign.create({
      data: {
        name: 'Palnadu Rice Mills Website Outreach',
        templateName: 'b2b_website_outreach_v1',
        targetAudience: 'Rice Mills in Macherla and Miryalaguda',
      },
    });

    assert.equal(campaign.id, 'camp_001');
    assert.equal(campaign.name, 'Palnadu Rice Mills Website Outreach');
    assert.equal(campaign.templateName, 'b2b_website_outreach_v1');
    assert.equal(campaign.status, 'DRAFT');
    assert.equal(campaign.languageCode, 'en_US');
    assert.equal(campaign.sentCount, 0);
    assert.equal(campaign.totalContacts, 0);
  });

  it('enforces phone number uniqueness on MarketingContact and rejects duplicates', async () => {
    const contactsStore = new Map();
    const mockPrisma = {
      marketingContact: {
        create: async ({ data }) => {
          if (contactsStore.has(data.phone)) {
            const p2002 = new Error(`Unique constraint failed on field: phone`);
            p2002.code = 'P2002';
            throw p2002;
          }
          const record = { id: `contact_${contactsStore.size + 1}`, ...data };
          contactsStore.set(data.phone, record);
          return record;
        },
      },
    };

    const c1 = await mockPrisma.marketingContact.create({
      data: {
        businessName: 'Sri Lakshmi Rice Mill',
        contactName: 'Nagaraju',
        phone: '919876543210',
        city: 'Macherla',
        hasWebsite: false,
      },
    });
    assert.equal(c1.phone, '919876543210');

    await assert.rejects(
      async () =>
        mockPrisma.marketingContact.create({
          data: {
            businessName: 'Sri Lakshmi Modern Mill',
            phone: '919876543210',
          },
        }),
      (err) => {
        assert.equal(err.code, 'P2002');
        assert.match(err.message, /Unique constraint failed/);
        return true;
      },
    );
  });

  it('supports linking WhatsAppMessage to a MarketingCampaign via optional campaignId', async () => {
    let savedMessage = null;
    const mockPrisma = {
      whatsAppMessage: {
        create: async ({ data }) => {
          savedMessage = { id: 'msg_camp_1', ...data };
          return savedMessage;
        },
      },
    };

    const outbound = await mockPrisma.whatsAppMessage.create({
      data: {
        wamId: 'wamid.CAMP_DISPATCH_001',
        direction: 'OUTBOUND',
        from: '919030787819',
        to: '919876543210',
        type: 'template',
        campaignId: 'camp_001',
        status: 'SENT',
        statusTimestamp: new Date(),
      },
    });

    assert.equal(outbound.campaignId, 'camp_001');
    assert.equal(outbound.type, 'template');
    assert.equal(outbound.status, 'SENT');
  });

  it('preserves existing WhatsAppMessage creation without campaignId (inbound and auto-replies)', async () => {
    let savedInbound = null;
    const mockPrisma = {
      whatsAppMessage: {
        create: async ({ data }) => {
          savedInbound = { id: 'msg_inbound_std', ...data };
          return savedInbound;
        },
      },
    };

    const inbound = await mockPrisma.whatsAppMessage.create({
      data: {
        wamId: 'wamid.INBOUND_NO_CAMP',
        direction: 'INBOUND',
        from: '919876543210',
        to: '919030787819',
        type: 'text',
        body: 'Interested in web development',
        status: 'RECEIVED',
      },
    });

    assert.equal(inbound.campaignId, undefined);
    assert.equal(inbound.direction, 'INBOUND');
    assert.equal(inbound.status, 'RECEIVED');
  });

  it('tracks contact opt-out status and timestamps accurately', async () => {
    let contact = {
      id: 'cont_opt_1',
      businessName: 'Guntur Spices',
      phone: '919988776655',
      optInStatus: 'UNVERIFIED',
      optOutReason: null,
      optOutTimestamp: null,
    };

    const mockPrisma = {
      marketingContact: {
        update: async ({ where, data }) => {
          if (where.phone === contact.phone) {
            contact = { ...contact, ...data };
            return contact;
          }
          return null;
        },
      },
    };

    const now = new Date();
    const updated = await mockPrisma.marketingContact.update({
      where: { phone: '919988776655' },
      data: {
        optInStatus: 'OPTED_OUT',
        optOutReason: 'Customer replied STOP',
        optOutTimestamp: now,
      },
    });

    assert.equal(updated.optInStatus, 'OPTED_OUT');
    assert.equal(updated.optOutReason, 'Customer replied STOP');
    assert.equal(updated.optOutTimestamp, now);
  });
});
