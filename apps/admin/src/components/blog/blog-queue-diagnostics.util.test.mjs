import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  classifyQueueError,
  formatRetryCountdown,
  getQueueItemDiagnostic,
  sanitizeQueueErrorMessage,
} from './blog-queue-diagnostics.util.ts';

describe('Admin Blog Queue Diagnostics & Error Categorization', () => {
  describe('classifyQueueError', () => {
    it('classifies 503 high demand as recoverable Model Demand (503)', () => {
      const result = classifyQueueError('LLM generation failed [MODEL_OVERLOADED]: High demand');
      assert.ok(result);
      assert.equal(result.category, 'Model Demand (503)');
      assert.equal(result.isRecoverable, true);
    });

    it('classifies 404 model not found as recoverable Model Config (404)', () => {
      const result = classifyQueueError('Model unavailable or unsupported: models/gemini-2.0-flash 404');
      assert.ok(result);
      assert.equal(result.category, 'Model Config (404)');
      assert.equal(result.isRecoverable, true);
    });

    it('classifies 429 quota exhaustion as recoverable Rate Limit (429)', () => {
      const result = classifyQueueError('QUOTA_EXCEEDED: Rate limit reached for requests per minute');
      assert.ok(result);
      assert.equal(result.category, 'Rate Limit (429)');
      assert.equal(result.isRecoverable, true);
    });

    it('classifies connection timeout as recoverable Network / Timeout', () => {
      const result = classifyQueueError('Fetch failed: connection timed out after 45000ms');
      assert.ok(result);
      assert.equal(result.category, 'Network / Timeout');
      assert.equal(result.isRecoverable, true);
    });

    it('classifies validation failures as permanent Content Validation', () => {
      const result = classifyQueueError('validation: internal_links missing for target');
      assert.ok(result);
      assert.equal(result.category, 'Content Validation');
      assert.equal(result.isRecoverable, false);
    });

    it('classifies permission and key rejection as permanent Auth / Permission', () => {
      const result = classifyQueueError('PERMISSION_DENIED: Billing is disabled on project');
      assert.ok(result);
      assert.equal(result.category, 'Auth / Permission');
      assert.equal(result.isRecoverable, false);
    });

    it('redacts raw API keys from error messages', () => {
      const sanitized = sanitizeQueueErrorMessage('Failed with key=AIzaSyABC1234567890DEF1234567890123');
      assert.ok(!sanitized.includes('AIzaSyABC1234567890DEF1234567890123'));
      assert.ok(sanitized.includes('[REDACTED_KEY]'));
    });
  });

  describe('formatRetryCountdown', () => {
    const fixedNow = new Date('2026-11-14T12:00:00.000Z').getTime();

    it('returns null for missing, null, or invalid dates', () => {
      assert.equal(formatRetryCountdown(null, fixedNow), null);
      assert.equal(formatRetryCountdown(undefined, fixedNow), null);
      assert.equal(formatRetryCountdown('invalid-date', fixedNow), null);
    });

    it('returns ready indicator when nextRetryAt is in the past', () => {
      const past = new Date('2026-11-14T11:59:00.000Z').toISOString();
      const res = formatRetryCountdown(past, fixedNow);
      assert.ok(res);
      assert.equal(res.isPast, true);
      assert.equal(res.text, 'Retry ready for next cycle');
    });

    it('formats future retry in minutes when within 1 hour', () => {
      const future = new Date('2026-11-14T12:35:00.000Z').toISOString();
      const res = formatRetryCountdown(future, fixedNow);
      assert.ok(res);
      assert.equal(res.isPast, false);
      assert.equal(res.text, 'Retry in 35m');
    });

    it('formats future retry in hours and minutes when exceeding 1 hour', () => {
      const future = new Date('2026-11-14T13:45:00.000Z').toISOString();
      const res = formatRetryCountdown(future, fixedNow);
      assert.ok(res);
      assert.equal(res.isPast, false);
      assert.equal(res.text, 'Retry in 1h 45m');
    });
  });

  describe('getQueueItemDiagnostic', () => {
    const fixedNow = new Date('2026-11-14T12:00:00.000Z').getTime();

    it('returns correct state for a fresh unattempted PENDING topic', () => {
      const diag = getQueueItemDiagnostic(
        {
          id: '1', topicKey: 'fresh-topic', topic: 'Fresh Topic', language: 'en',
          categorySlug: 'website-development', keywords: [], referenceSources: [],
          status: 'PENDING', attempts: 0, createdAt: '', updatedAt: '',
        },
        fixedNow,
      );
      assert.equal(diag.badgeLabel, 'Pending');
      assert.equal(diag.badgeVariant, 'queued');
      assert.equal(diag.buttonLabel, 'Generate');
      assert.equal(diag.errorAnalysis, null);
      assert.equal(diag.retryTimingText, null);
    });

    it('identifies scheduled retry on PENDING topic with attempts and future nextRetryAt', () => {
      const future = new Date('2026-11-14T12:40:00.000Z').toISOString();
      const diag = getQueueItemDiagnostic(
        {
          id: '2', topicKey: 'retry-topic', topic: 'Retry Topic', language: 'en',
          categorySlug: 'website-development', keywords: [], referenceSources: [],
          status: 'PENDING', attempts: 1, nextRetryAt: future,
          lastError: 'MODEL_OVERLOADED (503 high demand)', createdAt: '', updatedAt: '',
        },
        fixedNow,
      );
      assert.equal(diag.badgeLabel, 'Retry Scheduled');
      assert.equal(diag.badgeVariant, 'retry_scheduled');
      assert.equal(diag.buttonLabel, 'Retry Now');
      assert.equal(diag.retryTimingText, 'Retry in 40m');
      assert.ok(diag.errorAnalysis);
      assert.equal(diag.errorAnalysis.category, 'Model Demand (503)');
    });

    it('identifies recoverable FAILED topic and distinguishes from permanent FAILED', () => {
      const recoverable = getQueueItemDiagnostic(
        {
          id: '3', topicKey: 'fail-rec', topic: 'Fail Rec', language: 'en',
          categorySlug: 'website-development', keywords: [], referenceSources: [],
          status: 'FAILED', attempts: 3, lastError: 'MODEL_OVERLOADED (503)',
          createdAt: '', updatedAt: '',
        },
        fixedNow,
      );
      assert.equal(recoverable.badgeLabel, 'Failed (Recoverable)');
      assert.equal(recoverable.badgeVariant, 'failed_recoverable');
      assert.equal(recoverable.canManuallyGenerate, true);

      const permanent = getQueueItemDiagnostic(
        {
          id: '4', topicKey: 'fail-perm', topic: 'Fail Perm', language: 'en',
          categorySlug: 'website-development', keywords: [], referenceSources: [],
          status: 'FAILED', attempts: 3, lastError: 'validation: content_originality',
          createdAt: '', updatedAt: '',
        },
        fixedNow,
      );
      assert.equal(permanent.badgeLabel, 'Failed (Permanent)');
      assert.equal(permanent.badgeVariant, 'failed_permanent');
    });

    it('identifies In-Flight CLAIMED and Published COMPLETED topics', () => {
      const claimed = getQueueItemDiagnostic({
        id: '5', topicKey: 'claimed-t', topic: 'In Flight', language: 'en',
        categorySlug: 'website-development', keywords: [], referenceSources: [],
        status: 'CLAIMED', attempts: 1, createdAt: '', updatedAt: '',
      });
      assert.equal(claimed.badgeLabel, 'In-Flight');
      assert.equal(claimed.canManuallyGenerate, false);

      const completed = getQueueItemDiagnostic({
        id: '6', topicKey: 'done-t', topic: 'Done', language: 'en',
        categorySlug: 'website-development', keywords: [], referenceSources: [],
        status: 'COMPLETED', attempts: 1, createdAt: '', updatedAt: '',
      });
      assert.equal(completed.badgeLabel, 'Published');
      assert.equal(completed.canManuallyGenerate, false);
    });
  });
});
