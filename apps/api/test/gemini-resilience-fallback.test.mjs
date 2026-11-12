import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { GeminiKeyVerificationService } from '../dist/automation/gemini-verification/gemini-verification.service.js';
import { GeminiKeyStoreService } from '../dist/automation/gemini-verification/gemini-key-store.service.js';
import { maskApiKey } from '../dist/automation/gemini-verification/gemini-verification.util.js';
import { computeBackoffDelayMs, INTERACTIVE_VERIFY_OVERALL_TIMEOUT_MS, INTERACTIVE_VERIFY_RETRY, resolveRetrySettings } from '../dist/automation/gemini-verification/gemini-retry.util.js';
import { createMockPrisma } from './gemini-test-mocks.mjs';

const noopSleep = async () => {};

function okModelsRes(models = ['gemini-3.8-flash', 'gemini-3.6-flash']) {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'x-goog-project-id': 'palnadu-prod-99' }),
    json: async () => ({
      models: models.map((m) => ({ name: `models/${m}`, supportedGenerationMethods: ['generateContent'] })),
    }),
  };
}

function okGenRes(text = 'OK') {
  return {
    ok: true,
    status: 200,
    headers: new Headers({ 'x-goog-project-id': 'palnadu-prod-99' }),
    json: async () => ({ candidates: [{ content: { parts: [{ text }] } }] }),
  };
}

function errRes(status, statusStr, message) {
  return {
    ok: false,
    status,
    headers: new Headers(),
    json: async () => ({ error: { code: status, status: statusStr, message } }),
  };
}

describe('Phase 6 Gemini Resilience, Classification & Pending Preservation', () => {
  const verifier = new GeminiKeyVerificationService();

  it('1. validates primary model on first attempt without redundant fallback probes', async () => {
    const calledModels = [];
    const fetchFn = async (url) => {
      if (url.includes('/models?')) return okModelsRes();
      calledModels.push(url.split('/models/')[1].split(':')[0]);
      return okGenRes();
    };

    const res = await verifier.verifyKey('AIzaSyPrimaryHealthyKey1234567890', {
      primaryModel: 'gemini-3.8-flash',
      fetchFn,
      retry: { sleepFn: noopSleep },
    });

    assert.equal(res.verificationCode, 'VERIFIED');
    assert.equal(res.authenticationStatus, 'AUTHENTICATED');
    assert.equal(res.isValid, true);
    assert.equal(res.isUsableForGeneration, true);
    assert.equal(res.fallbackUsed, false);
    assert.equal(res.activeUsableModel, 'gemini-3.8-flash');
    assert.deepEqual(calledModels, ['gemini-3.8-flash']);
    assert.ok(res.models.tested[0].latencyMs >= 0);
  });

  it('2. falls back automatically when primary model suffers HTTP 503 high demand', async () => {
    const attemptsByModel = new Map();
    const fetchFn = async (url) => {
      if (url.includes('/models?')) return okModelsRes();
      const model = url.split('/models/')[1].split(':')[0];
      attemptsByModel.set(model, (attemptsByModel.get(model) || 0) + 1);
      if (model === 'gemini-3.8-flash') {
        return errRes(503, 'UNAVAILABLE', 'This model is currently experiencing high demand. Spikes in demand are usually temporary.');
      }
      return okGenRes();
    };

    const res = await verifier.verifyKey('AIzaSyFallbackCandidate1234567890', {
      primaryModel: 'gemini-3.8-flash',
      fetchFn,
      retry: { maxRetries: 1, baseDelayMs: 10, sleepFn: noopSleep, randomFn: () => 0.5 },
    });

    assert.equal(res.isValid, true);
    assert.equal(res.isUsableForGeneration, true);
    assert.equal(res.verificationCode, 'VERIFIED');
    assert.equal(res.fallbackUsed, true);
    assert.equal(res.activeUsableModel, 'gemini-3.6-flash');
    assert.equal(attemptsByModel.get('gemini-3.8-flash'), 2);
    assert.equal(attemptsByModel.get('gemini-3.6-flash'), 1);
    assert.equal(res.models.tested[0].failureCategory, 'MODEL_OVERLOADED');
    assert.equal(res.models.tested[0].isTemporary, true);
    assert.equal(res.models.tested[1].accessible, true);
  });

  it('3. classifies total 503 overload as MODEL_OVERLOADED and preserves PENDING_VERIFICATION safely', async () => {
    const prisma = createMockPrisma();
    const candidate = 'AIzaSyAllOverloadedCandidate12345678';
    const existingActive = 'AIzaSyExistingActiveKey1234567890ab';

    const storeOk = new GeminiKeyStoreService(prisma, {
      async verifyKey(key) {
        return verifier.verifyKey(key, {
          fetchFn: async (u) => (u.includes('/models?') ? okModelsRes() : okGenRes()),
          retry: { maxRetries: 0, sleepFn: noopSleep },
        });
      },
    });
    await storeOk.activateKey(existingActive, 'admin@palnadu.dev', 'gemini-3.8-flash');

    let overloaded = true;
    const storeDynamic = new GeminiKeyStoreService(prisma, {
      async verifyKey(key, opts) {
        return verifier.verifyKey(key, {
          ...opts,
          fetchFn: async (u) => {
            if (u.includes('/models?')) return okModelsRes();
            return overloaded
              ? errRes(503, 'UNAVAILABLE', 'This model is currently experiencing high demand.')
              : okGenRes();
          },
          retry: { maxRetries: 1, baseDelayMs: 5, sleepFn: noopSleep },
        });
      },
    });

    const probe = await storeDynamic.verifyCandidateKey(candidate, 'admin@palnadu.dev', 'gemini-3.8-flash');
    assert.equal(probe.verificationCode, 'MODEL_OVERLOADED');
    assert.equal(probe.authenticationStatus, 'AUTHENTICATED');
    assert.equal(probe.isTemporary, true);
    assert.equal(probe.isUsableForGeneration, false);
    assert.equal(probe.pendingPreserved, true);

    await assert.rejects(
      () => storeDynamic.activateKey(candidate, 'admin@palnadu.dev', 'gemini-3.8-flash'),
      /MODEL_OVERLOADED.*PENDING_VERIFICATION.*Existing key preserved/,
    );
    assert.equal(await storeDynamic.getDecryptedActiveKey(), existingActive);

    const status = await storeDynamic.getActiveKeyStatus();
    assert.equal(status.maskedKey, maskApiKey(existingActive));
    assert.equal(status.pendingCandidate?.status, 'PENDING_VERIFICATION');
    assert.equal(status.pendingCandidate?.maskedKey, maskApiKey(candidate));

    // Plaintext candidate must NEVER appear in DB JSON or audits
    const serialized = JSON.stringify([...prisma.store.entries()]);
    assert.equal(serialized.includes(candidate), false);
    assert.equal(serialized.includes(existingActive), false);

    // Retry later succeeds & activates cleanly
    overloaded = false;
    const retried = await storeDynamic.retryPendingVerification('admin@palnadu.dev', undefined, true);
    assert.equal(retried.verification.verificationCode, 'VERIFIED');
    assert.equal(retried.activated?.maskedKey, maskApiKey(candidate));
    assert.equal(await storeDynamic.getDecryptedActiveKey(), candidate);
  });

  it('4. stops immediately with zero unnecessary retries on INVALID_API_KEY', async () => {
    let calls = 0;
    const invalidKey = 'AIzaSyInvalidKeyDoNotRetry123456789';
    const res = await verifier.verifyKey(invalidKey, {
      fetchFn: async () => {
        calls++;
        return errRes(400, 'INVALID_ARGUMENT', `API key not valid: ${invalidKey}`);
      },
      retry: { maxRetries: 3, baseDelayMs: 500, sleepFn: async () => assert.fail('must not backoff on invalid key') },
    });

    assert.equal(calls, 1);
    assert.equal(res.verificationCode, 'INVALID_API_KEY');
    assert.equal(res.authenticationStatus, 'INVALID_KEY');
    assert.equal(res.isTemporary, false);
    assert.equal(res.isValid, false);
    assert.equal(res.errorMessage?.includes(invalidKey), false);
  });

  it('5 & 6. distinguishes PERMISSION_DENIED vs MODEL_ACCESS_DENIED vs QUOTA_EXCEEDED', async () => {
    const permRes = await verifier.verifyKey('AIzaSyPermDeniedKey123456789012345', {
      fetchFn: async () => errRes(403, 'PERMISSION_DENIED', 'Requests are blocked by API restriction.'),
      retry: { maxRetries: 2, sleepFn: noopSleep },
    });
    assert.equal(permRes.verificationCode, 'PERMISSION_DENIED');
    assert.equal(permRes.isTemporary, false);

    const modelDeniedRes = await verifier.verifyKey('AIzaSyModelDeniedKey12345678901234', {
      fetchFn: async (u) => (u.includes('/models?') ? okModelsRes() : errRes(403, 'PERMISSION_DENIED', 'Model not allowed')),
      retry: { maxRetries: 1, sleepFn: noopSleep },
    });
    assert.equal(modelDeniedRes.verificationCode, 'MODEL_ACCESS_DENIED');
    assert.equal(modelDeniedRes.isTemporary, false);

    const quotaRes = await verifier.verifyKey('AIzaSyQuotaExceededKey123456789012', {
      fetchFn: async (u) =>
        u.includes('/models?') ? okModelsRes() : errRes(429, 'RESOURCE_EXHAUSTED', 'Exceeded your current quota.'),
      retry: { maxRetries: 1, sleepFn: noopSleep },
    });
    assert.equal(quotaRes.verificationCode, 'QUOTA_EXCEEDED');
    assert.equal(quotaRes.quota.status, 'Quota Exceeded');
  });

  it('9. failed permanent candidate activation preserves existing active key without overwriting', async () => {
    const prisma = createMockPrisma();
    const existingActive = 'AIzaSyHealthyPreservedKey1234567890';
    const invalidCandidate = 'AIzaSyBadCandidateShouldNotReplace12';
    const store = new GeminiKeyStoreService(prisma, {
      async verifyKey(key, o) {
        return verifier.verifyKey(key, {
          ...o,
          fetchFn: async (u) =>
            key === existingActive ? (u.includes('/models?') ? okModelsRes() : okGenRes()) : errRes(400, 'INVALID_ARGUMENT', 'API key not valid'),
          retry: { maxRetries: 0, sleepFn: noopSleep },
        });
      },
    });
    await store.activateKey(existingActive, 'admin@palnadu.dev', 'gemini-3.8-flash');
    await assert.rejects(() => store.activateKey(invalidCandidate, 'admin@palnadu.dev'), /INVALID_API_KEY|not valid/i);
    assert.equal(await store.getDecryptedActiveKey(), existingActive);
    assert.equal((await store.getActiveKeyStatus())?.maskedKey, maskApiKey(existingActive));
  });

  it('computes bounded exponential backoff with jitter within maxDelayMs', () => {
    const settings = resolveRetrySettings({ baseDelayMs: 500, maxDelayMs: 2000, jitterRatio: 0.25, randomFn: () => 1 });
    assert.equal(computeBackoffDelayMs(0, settings), 625);
    assert.equal(computeBackoffDelayMs(1, settings), 1250);
    assert.equal(computeBackoffDelayMs(5, settings), 2000);
  });

  it('caps interactive verifyKey probes within overallTimeoutMs wall-clock budget', async () => {
    let fakeNow = 1000;
    const probed = [];
    const res = await verifier.verifyKey('AIzaSyBudgetTestKey123456789012345', {
      overallTimeoutMs: 5000,
      fetchFn: async (url) => {
        if (url.includes('/models?')) { fakeNow += 1000; return okModelsRes(); }
        probed.push(url.split('/models/')[1].split(':')[0]);
        fakeNow += 4200;
        return errRes(503, 'UNAVAILABLE', 'High demand');
      },
      retry: { maxRetries: 2, baseDelayMs: 500, sleepFn: noopSleep, nowFn: () => fakeNow },
    });
    assert.deepEqual(probed, ['gemini-3.8-flash']);
    assert.equal(res.verificationCode, 'MODEL_OVERLOADED');
    assert.equal(res.isTemporary, true);
    assert.equal(INTERACTIVE_VERIFY_OVERALL_TIMEOUT_MS, 26000);
    assert.equal(INTERACTIVE_VERIFY_RETRY.timeoutMs, 7000);
    assert.equal(INTERACTIVE_VERIFY_RETRY.maxRetries, 1);
  });
});
