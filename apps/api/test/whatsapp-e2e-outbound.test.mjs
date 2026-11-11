import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppApiClient, WhatsAppApiException } = require('../dist/whatsapp/whatsapp-api.client.js');
const { WhatsAppMessageService } = require('../dist/whatsapp/whatsapp-message.service.js');

describe('WhatsApp E2E Outbound API & Status Progressions', () => {
  const phoneNumberId = '109876543210987';
  const mockConfig = {
    get: (k) => {
      if (k === 'WHATSAPP_ACCESS_TOKEN') return 'valid_access_token_123';
      if (k === 'WHATSAPP_PHONE_NUMBER_ID') return phoneNumberId;
      return null;
    },
  };

  it('successfully dispatches outbound message accepted by Meta Cloud API', async () => {
    let requestedUrl = null;
    let requestedHeaders = null;
    const mockFetch = async (url, opts) => {
      requestedUrl = url;
      requestedHeaders = opts.headers;
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: 'whatsapp',
          contacts: [{ input: '919876543210', wa_id: '919876543210' }],
          messages: [{ id: 'wamid.DISPATCH_OK_001' }],
        }),
      };
    };

    const client = new WhatsAppApiClient(mockConfig, { fetchFn: mockFetch });
    const res = await client.sendTextMessage({ to: '+91 98765 43210', text: 'Official update from Palnadu.dev' });

    assert.equal(res.messages[0].id, 'wamid.DISPATCH_OK_001');
    assert.ok(requestedUrl.includes(`/${phoneNumberId}/messages`));
    assert.equal(requestedHeaders.Authorization, 'Bearer valid_access_token_123');
  });

  it('rejects dispatch when Meta access token is expired (HTTP 401 code 190)', async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 401,
      statusText: 'Unauthorized',
      json: async () => ({
        error: {
          message: 'Error validating access token: Session has expired.',
          type: 'OAuthException',
          code: 190,
          error_subcode: 463,
          fbtrace_id: 'trace_token_exp_999',
        },
      }),
    });

    const client = new WhatsAppApiClient(mockConfig, { fetchFn: mockFetch, maxRetries: 0 });
    await assert.rejects(
      async () => client.sendTextMessage({ to: '919876543210', text: 'Hello' }),
      (err) => err instanceof WhatsAppApiException && err.statusCode === 401 && err.metaError?.code === 190,
    );
  });

  it('fails fast on invalid recipient without calling network', async () => {
    let networkCalled = false;
    const mockFetch = async () => { networkCalled = true; };
    const client = new WhatsAppApiClient(mockConfig, { fetchFn: mockFetch });

    await assert.rejects(
      async () => client.sendTextMessage({ to: 'invalid-characters-only', text: 'Hello' }),
      /Invalid recipient phone number/,
    );
    assert.equal(networkCalled, false);
  });

  it('handles Meta 400 parameter mismatch error correctly', async () => {
    const mockFetch = async () => ({
      ok: false,
      status: 400,
      statusText: 'Bad Request',
      json: async () => ({
        error: {
          message: '(#132000) Number of parameters does not match the expected number of params',
          type: 'OAuthException',
          code: 132000,
          fbtrace_id: 'trace_param_err_001',
        },
      }),
    });

    const client = new WhatsAppApiClient(mockConfig, { fetchFn: mockFetch, maxRetries: 0 });
    await assert.rejects(
      async () => client.sendTemplateMessage({ to: '919876543210', templateName: 'static_notice', languageCode: 'en_US' }),
      (err) => err instanceof WhatsAppApiException && err.statusCode === 400 && err.metaError?.code === 132000,
    );
  });

  it('transitions outbound message delivery status from SENT -> DELIVERED -> READ', async () => {
    let stored = {
      id: 'msg_status_rec',
      wamId: 'wamid.LIFECYCLE_STATUS_001',
      direction: 'OUTBOUND',
      status: 'SENT',
      statusTimestamp: new Date(),
    };

    const mockPrisma = {
      whatsAppMessage: {
        findUnique: async () => stored,
        update: async ({ data }) => {
          stored = { ...stored, ...data };
          return stored;
        },
      },
    };

    const messageService = new WhatsAppMessageService(mockPrisma, { create: async () => ({}) });

    const delivered = await messageService.updateMessageStatus({
      wamId: 'wamid.LIFECYCLE_STATUS_001',
      recipientId: '919876543210',
      status: 'delivered',
    });
    assert.equal(delivered.status, 'DELIVERED');

    const read = await messageService.updateMessageStatus({
      wamId: 'wamid.LIFECYCLE_STATUS_001',
      recipientId: '919876543210',
      status: 'read',
    });
    assert.equal(read.status, 'READ');
  });
});

