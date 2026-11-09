import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { apiClient, api } from './api.ts';

describe('Web API Client & Lead Submission Latency Safeguards', () => {
  it('exposes api.leads.create with configurable timeout', () => {
    assert.equal(typeof api.leads.create, 'function');
  });

  it('rejects with timeout message when fetch aborts or times out', async () => {
    // Override global fetch temporarily with an aborted signal simulator
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async (_url, _options) => {
      // Simulate timeout by triggering abort error
      const err = new Error('The operation was aborted due to timeout');
      err.name = 'TimeoutError';
      throw err;
    };

    try {
      await assert.rejects(
        async () => {
          await apiClient('/api/leads', { timeoutMs: 50 });
        },
        (err) => {
          assert.match(
            err.message,
            /Request timed out while connecting to Palnadu\.dev services/
          );
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles 400 bad request error properly', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 400,
      json: async () => ({ message: 'Invalid lead schema' }),
    });

    try {
      await assert.rejects(
        async () => {
          await apiClient('/api/leads');
        },
        (err) => {
          assert.equal(err.message, 'Invalid lead schema');
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('handles 500 server difficulty properly', async () => {
    const originalFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: false,
      status: 500,
      json: async () => ({}),
    });

    try {
      await assert.rejects(
        async () => {
          await apiClient('/api/leads');
        },
        (err) => {
          assert.match(err.message, /temporary server difficulties/);
          return true;
        }
      );
    } finally {
      globalThis.fetch = originalFetch;
    }
  });

  it('returns JSON response on 200/201 success', async () => {
    const originalFetch = globalThis.fetch;
    const expected = { success: true, data: { id: 'lead_abc123' } };
    globalThis.fetch = async () => ({
      ok: true,
      status: 201,
      json: async () => expected,
    });

    try {
      const res = await api.leads.create({ name: 'Test User' });
      assert.deepEqual(res, expected);
    } finally {
      globalThis.fetch = originalFetch;
    }
  });
});
