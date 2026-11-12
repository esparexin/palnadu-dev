import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GeminiKeyVerificationService } from '../dist/automation/gemini-verification/gemini-verification.service.js';
import {
  maskApiKey,
  sanitizeErrorMessage,
  parseGoogleError,
  extractProjectIdentity,
  extractAccountIdentity,
} from '../dist/automation/gemini-verification/gemini-verification.util.js';

describe('Phase 1 Gemini Key & Project Verification Engine', () => {
  const service = new GeminiKeyVerificationService();

  describe('Key Masking and Credential Sanitization', () => {
    it('masks API keys safely preserving only short prefix and suffix', () => {
      assert.equal(maskApiKey('AIzaSyAbcd123456789xyz'), 'AIzaSyA...9xyz');
      assert.equal(maskApiKey('AQ.SyntheticDummyTestKeyForMaskingVerification123456789'), 'AQ.Synt...6789');
      assert.equal(maskApiKey('short'), '****');
      assert.equal(maskApiKey(''), '');
    });

    it('sanitizes error messages removing raw keys and query parameters', () => {
      const secret = 'AIzaSySecretKey1234567890';
      const raw = `Error connecting to https://generativelanguage.googleapis.com?key=${secret}: refused`;
      const clean = sanitizeErrorMessage(raw, secret);
      assert.ok(!clean.includes(secret));
      assert.ok(clean.includes('AIzaSyS...7890') || clean.includes('[REDACTED]'));
    });
  });

  describe('Account Identity Integrity', () => {
    it('never infers personal Google account email from key string or project ID', () => {
      const account = extractAccountIdentity('AIzaSyFakeKey123');
      assert.equal(account.email, null);
      assert.equal(account.status, 'Account Identity Unavailable');
    });
  });

  describe('Error Parsing & Status Classification', () => {
    it('identifies invalid API key status from HTTP 400', () => {
      const parsed = parseGoogleError(400, {
        error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.' },
      });
      assert.equal(parsed.status, 'Invalid Key');
      assert.equal(parsed.permissionStatus, 'Denied');
    });

    it('identifies permission denied and IP/API restrictions from HTTP 403', () => {
      const parsed = parseGoogleError(403, {
        error: { status: 'PERMISSION_DENIED', message: 'Requests to this API are blocked by API restriction.' },
      });
      assert.equal(parsed.status, 'Permission Denied');
      assert.equal(parsed.permissionStatus, 'Denied');
    });

    it('identifies billing restrictions from HTTP 403 billing message', () => {
      const parsed = parseGoogleError(403, {
        error: { status: 'PERMISSION_DENIED', message: 'Cloud billing is not enabled. Please enable billing.' },
      });
      assert.equal(parsed.status, 'Permission Denied');
      assert.equal(parsed.quotaStatus, 'Billing Restricted');
    });

    it('identifies quota exhaustion from HTTP 429', () => {
      const parsed = parseGoogleError(429, {
        error: { status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded for quota metric GenerateContent.' },
      });
      assert.equal(parsed.status, 'Quota Exceeded');
      assert.equal(parsed.quotaStatus, 'Quota Exceeded');
    });
  });

  describe('Project Identity Extraction', () => {
    it('extracts verified project ID from response headers when present', () => {
      const headers = new Headers({ 'x-goog-project-id': 'palnadu-prod-123' });
      const project = extractProjectIdentity(headers);
      assert.equal(project.id, 'palnadu-prod-123');
      assert.equal(project.status, 'Verified');
    });

    it('extracts inferred consumer project ID from structured error details', () => {
      const body = {
        error: {
          details: [{ metadata: { consumer: 'projects/9876543210' } }],
        },
      };
      const project = extractProjectIdentity(new Headers(), body);
      assert.equal(project.id, '9876543210');
      assert.equal(project.status, 'Inferred');
    });

    it('returns Project Not Identified when no project metadata is exposed', () => {
      const project = extractProjectIdentity(new Headers(), {});
      assert.equal(project.id, null);
      assert.equal(project.status, 'Project Not Identified');
    });
  });

  describe('End-to-End Key Verification Scenarios (Mocked Fetch)', () => {
    it('handles empty API key with Invalid Key status', async () => {
      const res = await service.verifyKey('');
      assert.equal(res.isValid, false);
      assert.equal(res.verificationStatus, 'Invalid Key');
      assert.equal(res.isUsableForGeneration, false);
    });

    it('verifies valid key with identifiable project and active generation capability', async () => {
      const mockFetch = async (url, opts) => {
        if (url.includes('/models?')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers({ 'x-goog-project-id': 'gcp-palnadu-live' }),
            json: async () => ({
              models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }],
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'x-goog-project-id': 'gcp-palnadu-live' }),
          json: async () => ({ candidates: [{ content: { parts: [{ text: 'pong' }] } }] }),
        };
      };

      const result = await service.verifyKey('AIzaSyValidKeyWithProject123456', { fetchFn: mockFetch });
      assert.equal(result.isValid, true);
      assert.equal(result.isUsableForGeneration, true);
      assert.equal(result.verificationStatus, 'Verified');
      assert.equal(result.project.id, 'gcp-palnadu-live');
      assert.equal(result.project.status, 'Verified');
      assert.equal(result.account.email, null);
      assert.equal(result.account.status, 'Account Identity Unavailable');
      assert.equal(result.quota.status, 'Active');
      assert.ok(result.models.tested.some((m) => m.accessible));
    });

    it('returns Partially Verified when key is valid for generation but project is not identified', async () => {
      const mockFetch = async (url) => {
        if (url.includes('/models?')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => ({
              models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }],
            }),
          };
        }
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({ candidates: [{ content: { parts: [{ text: 'pong' }] } }] }),
        };
      };

      const result = await service.verifyKey('AIzaSyValidNoProjectMeta123456', { fetchFn: mockFetch });
      assert.equal(result.isValid, true);
      assert.equal(result.isUsableForGeneration, true);
      assert.equal(result.verificationStatus, 'Partially Verified');
      assert.equal(result.project.status, 'Project Not Identified');
    });

    it('detects model access denial and marks key unusable for generation', async () => {
      const mockFetch = async (url) => {
        if (url.includes('/models?')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => ({ models: [] }),
          };
        }
        return {
          ok: false,
          status: 403,
          headers: new Headers(),
          json: async () => ({ error: { status: 'PERMISSION_DENIED', message: 'Model access denied.' } }),
        };
      };

      const result = await service.verifyKey('AIzaSyKeyModelDenied123456', { fetchFn: mockFetch });
      assert.equal(result.isValid, true);
      assert.equal(result.isUsableForGeneration, false);
      assert.equal(result.verificationCode, 'MODEL_ACCESS_DENIED');
      assert.equal(result.verificationStatus, 'Model Access Denied');
      assert.ok(result.errorMessage?.includes('Model access denied'));
    });

    it('detects quota exhaustion during verification', async () => {
      const mockFetch = async (url) => {
        if (url.includes('/models?')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => ({ models: [] }),
          };
        }
        return {
          ok: false,
          status: 429,
          headers: new Headers(),
          json: async () => ({ error: { status: 'RESOURCE_EXHAUSTED', message: 'Quota exceeded for project.' } }),
        };
      };

      const result = await service.verifyKey('AIzaSyKeyQuotaExhausted123456', { fetchFn: mockFetch });
      assert.equal(result.isValid, true);
      assert.equal(result.isUsableForGeneration, false);
      assert.equal(result.verificationStatus, 'Quota Exceeded');
      assert.equal(result.quota.status, 'Quota Exceeded');
    });
  });
});
