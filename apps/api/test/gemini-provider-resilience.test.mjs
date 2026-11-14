import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import {
  DEFAULT_GEMINI_MODELS,
  getGeminiModelsToTry,
} from '../dist/automation/content-research/llm-provider.js';
import { buildOrderedGeminiModels } from '../dist/automation/gemini-verification/gemini-retry.util.js';
import { GeminiKeyVerificationService } from '../dist/automation/gemini-verification/gemini-verification.service.js';
import { classifyGoogleError } from '../dist/automation/gemini-verification/gemini-error-classifier.util.js';
import {
  isPermanentFailureError,
  isTransientFailureError,
  recoverTransientFailedTopics,
} from '../dist/automation/blog/blog-queue-recovery.util.js';
import { BlogQueueService } from '../dist/automation/blog/blog-queue.service.js';

describe('Gemini Provider Resilience and Queue Recovery', () => {
  describe('Model Selection SSOT and Fallback Ordering', () => {
    it('places gemini-3.1-flash-lite as first workhorse model', () => {
      assert.equal(DEFAULT_GEMINI_MODELS[0], 'gemini-3.1-flash-lite');
      const ordered = buildOrderedGeminiModels();
      assert.equal(ordered[0], 'gemini-3.1-flash-lite');
      assert.ok(ordered.includes('gemini-3.6-flash'));
      assert.ok(ordered.includes('gemini-3.5-flash'));
      assert.ok(ordered.includes('gemini-3.8-flash'));
    });

    it('places explicit preferred model first while preserving fallbacks', () => {
      const preferred = 'gemini-3.8-flash';
      const ordered = buildOrderedGeminiModels(preferred);
      assert.equal(ordered[0], 'gemini-3.8-flash');
      assert.equal(ordered[1], 'gemini-3.1-flash-lite');
      assert.equal(new Set(ordered).size, ordered.length);
    });
  });

  describe('Verification Probe Headroom and Reasoning Model Support', () => {
    it('configures probe with 120 output tokens and accepts candidate text parts', async () => {
      const capturedRequests = [];
      const mockFetch = async (url, init) => {
        capturedRequests.push({ url, init });
        if (url.includes('/models?')) {
          return {
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () => ({ models: [{ name: 'models/gemini-3.1-flash-lite', supportedGenerationMethods: ['generateContent'] }] }),
          };
        }
        const body = JSON.parse(init.body);
        assert.equal(body.generationConfig.maxOutputTokens, 120);
        return {
          ok: true,
          status: 200,
          headers: new Headers(),
          json: async () => ({
            candidates: [{
              finishReason: 'STOP',
              content: { parts: [{ thought: 'thinking...' }, { text: 'OK' }] },
            }],
          }),
        };
      };

      const service = new GeminiKeyVerificationService();
      const res = await service.verifyKey('AIzaSyTestValidKeyMock1234567890', { fetchFn: mockFetch });
      assert.equal(res.isValid, true);
      assert.equal(res.isUsableForGeneration, true);
      assert.equal(res.activeUsableModel, 'gemini-3.1-flash-lite');
    });
  });

  describe('Google Error Classification', () => {
    it('classifies 503 high demand as temporary, retryable MODEL_OVERLOADED', () => {
      const failure = classifyGoogleError(503, {
        error: { status: 'UNAVAILABLE', message: 'This model is currently experiencing high demand.' },
      });
      assert.equal(failure.code, 'MODEL_OVERLOADED');
      assert.equal(failure.isTemporary, true);
      assert.equal(failure.retryable, true);
      assert.equal(failure.modelSpecific, true);
      assert.equal(failure.stopAllModels, false);
    });

    it('classifies 404 model not found as model-specific MODEL_ACCESS_DENIED without stopping other models', () => {
      const failure = classifyGoogleError(404, {
        error: { status: 'NOT_FOUND', message: 'models/gemini-2.0-flash is not found for API version v1beta' },
      });
      assert.equal(failure.code, 'MODEL_ACCESS_DENIED');
      assert.equal(failure.isTemporary, false);
      assert.equal(failure.modelSpecific, true);
      assert.equal(failure.stopAllModels, false);
    });

    it('classifies 401 invalid key as fatal and stops all models', () => {
      const failure = classifyGoogleError(400, {
        error: { status: 'INVALID_ARGUMENT', message: 'API key not valid. Please pass a valid API key.' },
      });
      assert.equal(failure.code, 'INVALID_API_KEY');
      assert.equal(failure.stopAllModels, true);
    });
  });

  describe('Transient Queue Recovery and Replenishment', () => {
    it('recognizes 503, timeout, and model configuration errors as transient', () => {
      assert.ok(isTransientFailureError('MODEL_OVERLOADED: 503 Service Unavailable'));
      assert.ok(isTransientFailureError('Model unavailable or unsupported: 404'));
      assert.ok(isTransientFailureError('Fetch failed: connection timeout'));
      assert.equal(isTransientFailureError('validation: internal_links'), false);
      assert.equal(isTransientFailureError('INVALID_API_KEY: Google rejected'), false);
      assert.equal(isPermanentFailureError('validation: content_originality'), true);
      assert.equal(isPermanentFailureError('permission_denied'), true);
    });

    it('recovers transient FAILED topics resetting attempts safely', async () => {
      const now = new Date('2026-11-14T12:00:00Z');
      const pastTime = new Date('2026-11-13T12:00:00Z');
      const topics = [
        { id: '1', language: BlogLanguage.en, status: TopicStatus.FAILED, attempts: 3, lastError: 'MODEL_OVERLOADED: 503', updatedAt: pastTime, postId: null },
        { id: '2', language: BlogLanguage.en, status: TopicStatus.FAILED, attempts: 3, lastError: 'Model unavailable: 404', updatedAt: pastTime, postId: null },
        { id: '3', language: BlogLanguage.en, status: TopicStatus.FAILED, attempts: 3, lastError: 'validation: internal_links', updatedAt: pastTime, postId: null },
      ];
      const prismaMock = {
        blogTopic: {
          findMany: async () => topics.filter((t) => t.status === TopicStatus.FAILED),
          updateMany: async ({ where, data }) => {
            const target = topics.find((t) => t.id === where.id && t.status === where.status);
            if (!target) return { count: 0 };
            Object.assign(target, data);
            return { count: 1 };
          },
        },
      };

      const recovered = await recoverTransientFailedTopics(prismaMock, {
        language: BlogLanguage.en,
        maxAttempts: 3,
        now,
      });

      assert.equal(recovered, 2);
      assert.equal(topics[0].status, TopicStatus.PENDING);
      assert.equal(topics[0].attempts, 2);
      assert.equal(topics[1].status, TopicStatus.PENDING);
      assert.equal(topics[1].attempts, 2);
      assert.equal(topics[2].status, TopicStatus.FAILED);
    });

    it('replenishQueueIfLow does not enqueue seeds when pendingCount reaches minPending', async () => {
      const enTopics = Array.from({ length: 10 }, (_, i) => ({
        id: `en-${i}`, topicKey: `en-${i}`, topic: `English Topic ${i}`,
        language: BlogLanguage.en, status: TopicStatus.PENDING, attempts: 0,
      }));
      const prismaMock = {
        blogTopic: {
          count: async () => enTopics.filter((t) => t.status === TopicStatus.PENDING).length,
          findMany: async () => [],
        },
      };
      const queue = new BlogQueueService(prismaMock, { isLikelyDuplicateTopic: async () => false });
      const added = await queue.replenishQueueIfLow(10, 15, BlogLanguage.en);
      assert.equal(added, 0);
    });
  });
});
