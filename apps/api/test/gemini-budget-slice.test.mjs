import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { computeModelProbeDeadline } from '../dist/automation/gemini-verification/gemini-retry.util.js';
import { GeminiKeyVerificationService } from '../dist/automation/gemini-verification/gemini-verification.service.js';

describe('Gemini Interactive Per-Model Budget Slicing', () => {
  it('slices wall-clock budget fairly across remaining fallback models', () => {
    const deadlineAt = 27000;
    const nowMs = 1000;
    const firstSliceDeadline = computeModelProbeDeadline({ deadlineAt, nowMs, remainingModels: 4 });
    assert.equal(firstSliceDeadline, 7500);

    const lastSliceDeadline = computeModelProbeDeadline({ deadlineAt, nowMs: 20500, remainingModels: 1 });
    assert.equal(lastSliceDeadline, deadlineAt);
  });

  it('reaches the 4th fallback model even when first models time out under interactive budget', async () => {
    const verifier = new GeminiKeyVerificationService();
    let fakeNow = 1000;
    const probed = [];

    const fetchFn = async (url, init) => {
      if (url.includes('/models?')) {
        fakeNow += 400;
        return {
          ok: true,
          status: 200,
          headers: new Headers({ 'x-goog-project-id': 'palnadu-prod-99' }),
          json: async () => ({
            models: [{ name: 'models/gemini-3.1-flash-lite', supportedGenerationMethods: ['generateContent'] }],
          }),
        };
      }

      const model = url.split('/models/')[1].split(':')[0];
      probed.push(model);

      if (model !== 'gemini-3.1-flash-lite') {
        // Simulate a hung model that hits its sliced timeout budget
        assert.ok(init?.signal);
        fakeNow += 6400;
        const abortErr = new Error('The operation was aborted');
        abortErr.name = 'AbortError';
        throw abortErr;
      }

      fakeNow += 540;
      return {
        ok: true,
        status: 200,
        headers: new Headers({ 'x-goog-project-id': 'palnadu-prod-99' }),
        json: async () => ({ candidates: [{ content: { parts: [{ text: 'OK' }] } }] }),
      };
    };

    const result = await verifier.verifyKey('AIzaSyBudgetFairnessTestKey123456', {
      overallTimeoutMs: 26000,
      fetchFn,
      retry: { timeoutMs: 7000, maxRetries: 1, baseDelayMs: 300, sleepFn: async () => {}, nowFn: () => fakeNow },
    });

    assert.deepEqual(probed, [
      'gemini-3.8-flash',
      'gemini-3.6-flash',
      'gemini-3.5-flash',
      'gemini-3.1-flash-lite',
    ]);
    assert.equal(result.isValid, true);
    assert.equal(result.isUsableForGeneration, true);
    assert.equal(result.fallbackUsed, true);
    assert.equal(result.activeUsableModel, 'gemini-3.1-flash-lite');
    assert.equal(result.verificationCode, 'VERIFIED');
  });
});

