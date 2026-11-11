import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { ContactOptInStatus, WhatsAppDeliveryStatus } from '@prisma/client';

const require = createRequire(import.meta.url);
const { WhatsAppOptOutService } = require('../dist/whatsapp/whatsapp-opt-out.service.js');
const { updateCampaignMetricsForStatus } = require('../dist/whatsapp/whatsapp-campaign-metrics.util.js');

describe('WhatsApp Opt-Out & Campaign Metrics', () => {
  it('detects English and Telugu opt-out keywords correctly', () => {
    const service = new WhatsAppOptOutService({});

    // Valid keywords
    assert.equal(service.isOptOutKeyword('STOP'), true);
    assert.equal(service.isOptOutKeyword('stop please'), true);
    assert.equal(service.isOptOutKeyword('Unsubscribe'), true);
    assert.equal(service.isOptOutKeyword('cancel'), true);
    assert.equal(service.isOptOutKeyword('optout'), true);
    assert.equal(service.isOptOutKeyword('OPT-OUT'), true);
    assert.equal(service.isOptOutKeyword('వద్దు'), true);
    assert.equal(service.isOptOutKeyword('ఆపండి'), true);

    // Non opt-out messages
    assert.equal(service.isOptOutKeyword('Hello, tell me about your web service'), false);
    assert.equal(service.isOptOutKeyword('What is the price?'), false);
    assert.equal(service.isOptOutKeyword(''), false);
    assert.equal(service.isOptOutKeyword(undefined), false);
  });

  it('normalizes phone numbers to digits only', () => {
    const service = new WhatsAppOptOutService({});
    assert.equal(service.normalizePhone('+91 98765-43210'), '919876543210');
    assert.equal(service.normalizePhone('919876543210'), '919876543210');
    assert.equal(service.normalizePhone('+91 (864) 123-456'), '91864123456');
  });

  it('records opt-out in database when keyword is matched', async () => {
    const contactsStore = [
      {
        id: 'c1',
        phone: '919876543210',
        optInStatus: ContactOptInStatus.UNVERIFIED,
      },
    ];

    const mockPrisma = {
      marketingContact: {
        findMany: async ({ where }) =>
          contactsStore.filter((c) => where.phone.in.includes(c.phone)),
        updateMany: async ({ where, data }) => {
          let count = 0;
          for (const c of contactsStore) {
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
    const optedOut = await service.handleInboundOptOut('+919876543210', 'STOP');

    assert.equal(optedOut, true);
    assert.equal(contactsStore[0].optInStatus, ContactOptInStatus.OPTED_OUT);
    assert.equal(contactsStore[0].optOutReason, 'INBOUND_KEYWORD_STOP');
    assert.ok(contactsStore[0].optOutTimestamp instanceof Date);
  });

  it('suppresses contacts that are marked as OPTED_OUT', async () => {
    const mockPrisma = {
      marketingContact: {
        findFirst: async ({ where }) => {
          if (where.phone.in.includes('919876543210') && where.optInStatus === ContactOptInStatus.OPTED_OUT) {
            return { id: 'c1' };
          }
          return null;
        },
      },
    };

    const service = new WhatsAppOptOutService(mockPrisma);
    const isSuppressed = await service.isSuppressed('+919876543210');
    const isOtherSuppressed = await service.isSuppressed('+919999999999');

    assert.equal(isSuppressed, true);
    assert.equal(isOtherSuppressed, false);
  });

  it('updates campaign metrics on delivery status transitions', async () => {
    const campaign = {
      id: 'camp_metrics_1',
      deliveredCount: 0,
      readCount: 0,
      failedCount: 0,
    };

    const mockPrisma = {
      marketingCampaign: {
        update: async ({ where, data }) => {
          if (where.id === campaign.id) {
            if (data.deliveredCount?.increment) campaign.deliveredCount += data.deliveredCount.increment;
            if (data.readCount?.increment) campaign.readCount += data.readCount.increment;
            if (data.failedCount?.increment) campaign.failedCount += data.failedCount.increment;
          }
          return campaign;
        },
      },
    };

    // Transition to DELIVERED
    await updateCampaignMetricsForStatus(
      mockPrisma,
      'camp_metrics_1',
      WhatsAppDeliveryStatus.DELIVERED,
      WhatsAppDeliveryStatus.SENT,
    );
    assert.equal(campaign.deliveredCount, 1);

    // Transition to READ
    await updateCampaignMetricsForStatus(
      mockPrisma,
      'camp_metrics_1',
      WhatsAppDeliveryStatus.READ,
      WhatsAppDeliveryStatus.DELIVERED,
    );
    assert.equal(campaign.readCount, 1);

    // Out of order duplicate should not increment again
    await updateCampaignMetricsForStatus(
      mockPrisma,
      'camp_metrics_1',
      WhatsAppDeliveryStatus.DELIVERED,
      WhatsAppDeliveryStatus.READ,
    );
    assert.equal(campaign.deliveredCount, 1);
  });
});
