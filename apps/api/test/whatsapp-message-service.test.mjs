import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppMessageService } = require('../dist/whatsapp/whatsapp-message.service.js');

describe('WhatsAppMessageService - Idempotency & Status State Machine', () => {
  it('creates inbound message and triggers notification', async () => {
    let createdRecord = null;
    let notificationPayload = null;

    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => null,
        create: async ({ data }) => {
          createdRecord = { id: 'msg_db_1', ...data };
          return createdRecord;
        },
      },
    };

    const mockNotifications = {
      create: async (payload) => {
        notificationPayload = payload;
        return { id: 'notif_1' };
      },
    };

    const service = new WhatsAppMessageService(mockPrisma, mockNotifications);
    const result = await service.saveInboundMessage({
      wamId: 'wamid.HBgL1234567890==',
      from: '919030787819',
      to: 'palnadu_business',
      profileName: 'Kalyan',
      type: 'text',
      body: 'Need business automation consultation',
      timestamp: '1731100000',
    });

    assert.equal(result.id, 'msg_db_1');
    assert.equal(result.wamId, 'wamid.HBgL1234567890==');
    assert.equal(result.direction, 'INBOUND');
    assert.equal(result.status, 'RECEIVED');
    assert.equal(createdRecord.profileName, 'Kalyan');
    assert.equal(notificationPayload.type, 'WHATSAPP_MESSAGE');
    assert.equal(notificationPayload.data.wamId, 'wamid.HBgL1234567890==');
  });

  it('guarantees idempotency on duplicate inbound message', async () => {
    const existing = {
      id: 'msg_existing_1',
      wamId: 'wamid.HBgL1234567890==',
      from: '919030787819',
      body: 'Original message',
      status: 'RECEIVED',
    };

    let createCalled = false;
    let notifCalled = false;

    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => existing,
        create: async () => {
          createCalled = true;
          return {};
        },
      },
    };

    const mockNotifications = {
      create: async () => {
        notifCalled = true;
      },
    };

    const service = new WhatsAppMessageService(mockPrisma, mockNotifications);
    const result = await service.saveInboundMessage({
      wamId: 'wamid.HBgL1234567890==',
      from: '919030787819',
      to: 'palnadu_business',
      body: 'Duplicate payload',
    });

    assert.equal(result.id, 'msg_existing_1');
    assert.equal(createCalled, false);
    assert.equal(notifCalled, false);
  });

  it('progresses status sequentially from SENT to DELIVERED to READ', async () => {
    let currentRecord = {
      id: 'msg_out_1',
      wamId: 'wamid.OUTBOUND_1',
      status: 'SENT',
    };

    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => currentRecord,
        update: async ({ data }) => {
          currentRecord = { ...currentRecord, ...data };
          return currentRecord;
        },
      },
    };

    const service = new WhatsAppMessageService(mockPrisma, { create: async () => {} });

    // 1. Advance to DELIVERED
    const delivered = await service.updateMessageStatus({
      wamId: 'wamid.OUTBOUND_1',
      recipientId: '919030787819',
      status: 'delivered',
      timestamp: '1731100010',
    });
    assert.equal(delivered.status, 'DELIVERED');

    // 2. Advance to READ
    const read = await service.updateMessageStatus({
      wamId: 'wamid.OUTBOUND_1',
      recipientId: '919030787819',
      status: 'read',
      timestamp: '1731100020',
    });
    assert.equal(read.status, 'READ');
  });

  it('prevents regressing READ status if an out-of-order DELIVERED event arrives later', async () => {
    const readRecord = {
      id: 'msg_out_2',
      wamId: 'wamid.OUTBOUND_2',
      status: 'READ',
    };

    let updateCalled = false;
    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => readRecord,
        update: async () => {
          updateCalled = true;
        },
      },
    };

    const service = new WhatsAppMessageService(mockPrisma, { create: async () => {} });

    // Out-of-order DELIVERED arrived after READ
    const result = await service.updateMessageStatus({
      wamId: 'wamid.OUTBOUND_2',
      recipientId: '919030787819',
      status: 'delivered',
      timestamp: '1731100015',
    });

    assert.equal(result.status, 'READ');
    assert.equal(updateCalled, false);
  });

  it('records error code and error message on FAILED status', async () => {
    let currentRecord = {
      id: 'msg_out_3',
      wamId: 'wamid.OUTBOUND_3',
      status: 'SENT',
    };

    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => currentRecord,
        update: async ({ data }) => {
          currentRecord = { ...currentRecord, ...data };
          return currentRecord;
        },
      },
    };

    const service = new WhatsAppMessageService(mockPrisma, { create: async () => {} });

    const failed = await service.updateMessageStatus({
      wamId: 'wamid.OUTBOUND_3',
      recipientId: '919030787819',
      status: 'failed',
      errorCode: '131056',
      errorMessage: 'Recipient phone number is not registered on WhatsApp',
    });

    assert.equal(failed.status, 'FAILED');
    assert.equal(failed.errorCode, '131056');
    assert.equal(failed.errorMessage, 'Recipient phone number is not registered on WhatsApp');
  });

  it('preserves established DELIVERED or READ state when a failure event arrives', async () => {
    let currentRecord = {
      id: 'msg_out_delivered',
      wamId: 'wamid.OUTBOUND_DELIVERED',
      status: 'DELIVERED',
    };

    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => currentRecord,
        update: async ({ data }) => {
          currentRecord = { ...currentRecord, ...data };
          return currentRecord;
        },
      },
    };

    const service = new WhatsAppMessageService(mockPrisma, { create: async () => {} });

    const result = await service.updateMessageStatus({
      wamId: 'wamid.OUTBOUND_DELIVERED',
      recipientId: '919030787819',
      status: 'failed',
      errorCode: '131056',
      errorMessage: 'Spurious post-delivery provider error',
    });

    assert.equal(result.status, 'DELIVERED');
    assert.equal(result.errorCode, '131056');
    assert.equal(result.errorMessage, 'Spurious post-delivery provider error');
  });

  it('creates outbound record when status arrives for previously untracked message', async () => {
    let createdRecord = null;
    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => null,
        create: async ({ data }) => {
          createdRecord = { id: 'msg_new_out', ...data };
          return createdRecord;
        },
      },
    };

    const service = new WhatsAppMessageService(mockPrisma, { create: async () => {} });

    const result = await service.updateMessageStatus({
      wamId: 'wamid.EXTERNAL_1',
      recipientId: '919030787819',
      status: 'sent',
    });

    assert.equal(result.id, 'msg_new_out');
    assert.equal(result.direction, 'OUTBOUND');
    assert.equal(result.status, 'SENT');
  });
});

