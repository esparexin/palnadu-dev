import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { WhatsAppApiClient, WhatsAppApiException } = require('../dist/whatsapp/whatsapp-api.client.js');

describe('WhatsAppApiClient - Meta Cloud API Outbound Client', () => {
  const validToken = 'EAABtest_token_secret_12345';
  const validPhoneId = '109876543210987';
  const defaultVersion = 'v22.0';

  const createMockConfig = (overrides = {}) => ({
    get: (key) => {
      if (key in overrides) return overrides[key];
      if (key === 'WHATSAPP_ACCESS_TOKEN') return validToken;
      if (key === 'WHATSAPP_PHONE_NUMBER_ID') return validPhoneId;
      if (key === 'WHATSAPP_GRAPH_API_VERSION') return defaultVersion;
      return null;
    },
  });

  it('reports configuration status accurately', () => {
    const configuredClient = new WhatsAppApiClient(createMockConfig());
    assert.equal(configuredClient.isConfigured(), true);

    const unconfiguredClient = new WhatsAppApiClient(
      createMockConfig({ WHATSAPP_ACCESS_TOKEN: '', WHATSAPP_PHONE_NUMBER_ID: '' }),
    );
    assert.equal(unconfiguredClient.isConfigured(), false);
  });

  it('fails fast when credentials are not configured', async () => {
    const client = new WhatsAppApiClient(
      createMockConfig({ WHATSAPP_ACCESS_TOKEN: null }),
    );

    await assert.rejects(
      async () => client.sendTextMessage({ to: '919876543210', text: 'Hello' }),
      (err) => {
        assert(err instanceof WhatsAppApiException);
        assert.match(err.message, /credentials are not configured/);
        return true;
      },
    );
  });

  it('rejects invalid recipient phone numbers', async () => {
    const client = new WhatsAppApiClient(createMockConfig());

    await assert.rejects(
      async () => client.sendTextMessage({ to: 'invalid-phone', text: 'Hello' }),
      /Invalid recipient phone number/,
    );
  });

  it('formats payload, headers and url accurately and succeeds on 200 OK', async () => {
    let capturedUrl = '';
    let capturedHeaders = null;
    let capturedBody = null;

    const mockFetch = async (url, init) => {
      capturedUrl = url;
      capturedHeaders = init.headers;
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: 'whatsapp',
          contacts: [{ input: '919876543210', wa_id: '919876543210' }],
          messages: [{ id: 'wamid.HBgL_OUTBOUND_001' }],
        }),
      };
    };

    const client = new WhatsAppApiClient(createMockConfig(), { fetchFn: mockFetch });
    const response = await client.sendTextMessage({
      to: '+91 (98765) 43210',
      text: 'Thanks for contacting Palnadu!',
      replyToWamId: 'wamid.INBOUND_001',
    });

    assert.equal(capturedUrl, `https://graph.facebook.com/${defaultVersion}/${validPhoneId}/messages`);
    assert.equal(capturedHeaders.Authorization, `Bearer ${validToken}`);
    assert.equal(capturedHeaders['Content-Type'], 'application/json');
    assert.equal(capturedBody.to, '919876543210');
    assert.equal(capturedBody.type, 'text');
    assert.equal(capturedBody.text.body, 'Thanks for contacting Palnadu!');
    assert.equal(capturedBody.context.message_id, 'wamid.INBOUND_001');

    assert.equal(response.messaging_product, 'whatsapp');
    assert.equal(response.messages[0].id, 'wamid.HBgL_OUTBOUND_001');
  });

  it('does not retry on non-retryable 4xx client errors (e.g. 401 Unauthorized)', async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      return {
        ok: false,
        status: 401,
        statusText: 'Unauthorized',
        json: async () => ({
          error: {
            message: 'Invalid OAuth access token.',
            type: 'OAuthException',
            code: 190,
            fbtrace_id: 'trace_abc_123',
          },
        }),
      };
    };

    const client = new WhatsAppApiClient(createMockConfig(), {
      fetchFn: mockFetch,
      maxRetries: 2,
      retryDelayMs: 5,
    });

    await assert.rejects(
      async () => client.sendTextMessage({ to: '919876543210', text: 'Hello' }),
      (err) => {
        assert(err instanceof WhatsAppApiException);
        assert.equal(err.statusCode, 401);
        assert.equal(err.metaError.code, 190);
        return true;
      },
    );

    assert.equal(callCount, 1);
  });

  it('retries on 500 server error and succeeds on subsequent attempt', async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      if (callCount === 1) {
        return {
          ok: false,
          status: 500,
          statusText: 'Internal Server Error',
          json: async () => ({ error: { message: 'Temporary Meta server error', code: 2 } }),
        };
      }
      return {
        ok: true,
        status: 200,
        json: async () => ({
          messaging_product: 'whatsapp',
          contacts: [{ input: '919876543210', wa_id: '919876543210' }],
          messages: [{ id: 'wamid.RECOVERED_002' }],
        }),
      };
    };

    const client = new WhatsAppApiClient(createMockConfig(), {
      fetchFn: mockFetch,
      maxRetries: 2,
      retryDelayMs: 5,
    });

    const response = await client.sendTextMessage({ to: '919876543210', text: 'Retry test' });
    assert.equal(callCount, 2);
    assert.equal(response.messages[0].id, 'wamid.RECOVERED_002');
  });

  it('aborts and throws when fetch exceeds timeout with ambiguous flag', async () => {
    const mockFetch = async (_url, init) => {
      return new Promise((resolve, reject) => {
        init.signal.addEventListener('abort', () => {
          reject(new Error('The operation was aborted due to timeout'));
        });
      });
    };
    const client = new WhatsAppApiClient(createMockConfig(), { fetchFn: mockFetch, timeoutMs: 15, maxRetries: 0 });
    await assert.rejects(
      async () => client.sendTextMessage({ to: '919876543210', text: 'Timeout test' }),
      (err) => err instanceof WhatsAppApiException && err.isAmbiguous === true && err.statusCode === 504,
    );
  });

  it('fails immediately without retrying on ambiguous 504 Gateway Timeout', async () => {
    let callCount = 0;
    const mockFetch = async () => {
      callCount++;
      return { ok: false, status: 504, statusText: 'Gateway Timeout', json: async () => ({}) };
    };
    const client = new WhatsAppApiClient(createMockConfig(), { fetchFn: mockFetch, maxRetries: 3, retryDelayMs: 5 });
    await assert.rejects(
      async () => client.sendTextMessage({ to: '919876543210', text: '504 test' }),
      (err) => err instanceof WhatsAppApiException && err.isAmbiguous === true,
    );
    assert.equal(callCount, 1, 'Ambiguous 504 must never be retried automatically');
  });

  it('formats template message payload with parameters and succeeds on 200 OK', async () => {
    let capturedBody = null;
    const mockFetch = async (_url, init) => {
      capturedBody = JSON.parse(init.body);
      return {
        ok: true, status: 200,
        json: async () => ({
          messaging_product: 'whatsapp',
          contacts: [{ input: '919876543210', wa_id: '919876543210' }],
          messages: [{ id: 'wamid.TEMPLATE_001' }],
        }),
      };
    };
    const client = new WhatsAppApiClient(createMockConfig(), { fetchFn: mockFetch });
    const response = await client.sendTemplateMessage({
      to: '+91 (98765) 43210',
      templateName: 'b2b_website_outreach_v1',
      languageCode: 'en_US',
      components: [{ type: 'body', parameters: [{ type: 'text', text: 'Sri Lakshmi Rice Mill' }] }],
    });
    assert.equal(capturedBody.to, '919876543210');
    assert.equal(capturedBody.type, 'template');
    assert.equal(capturedBody.template.name, 'b2b_website_outreach_v1');
    assert.equal(capturedBody.template.language.code, 'en_US');
    assert.equal(capturedBody.template.components[0].parameters[0].text, 'Sri Lakshmi Rice Mill');
    assert.equal(response.messages[0].id, 'wamid.TEMPLATE_001');
  });

  it('rejects template message when template name or language is missing', async () => {
    const client = new WhatsAppApiClient(createMockConfig());
    await assert.rejects(
      async () => client.sendTemplateMessage({ to: '919876543210', templateName: '', languageCode: 'en' }),
      /Template name is required/,
    );
    await assert.rejects(
      async () => client.sendTemplateMessage({ to: '919876543210', templateName: 'valid', languageCode: '' }),
      /Template language code is required/,
    );
  });
});
