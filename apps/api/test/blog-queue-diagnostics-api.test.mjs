import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import { BlogQueueService } from '../dist/automation/blog/blog-queue.service.js';

describe('Blog Queue Diagnostics Backend Serialization', () => {
  it('exposes full diagnostic fields (lastError, nextRetryAt, claimedAt, id) in getPendingQueueItems', async () => {
    const createdAt = new Date('2026-11-14T05:00:00.000Z');
    const updatedAt = new Date('2026-11-14T05:05:00.000Z');
    const nextRetryAt = new Date('2026-11-14T06:05:00.000Z');
    const claimedAt = new Date('2026-11-14T05:01:00.000Z');

    const mockRows = [
      {
        id: 'row-1',
        topicKey: 'enterprise-web-guntur',
        topic: 'Enterprise Web Solutions in Guntur',
        language: BlogLanguage.en,
        categorySlug: 'website-development',
        targetLocation: 'Guntur, Andhra Pradesh',
        searchIntent: 'COMMERCIAL_INVESTIGATION',
        primaryKeyword: 'enterprise web solutions guntur',
        referenceSources: ['google_autocomplete'],
        status: TopicStatus.PENDING,
        attempts: 1,
        lastError: 'LLM generation failed [MODEL_OVERLOADED]: High demand',
        nextRetryAt,
        claimedAt: null,
        claimedBy: null,
        createdAt,
        updatedAt,
      },
      {
        id: 'row-2',
        topicKey: 'mobile-app-narasaraopet',
        topic: 'Mobile Field Sales Apps in Narasaraopet',
        language: BlogLanguage.en,
        categorySlug: 'app-development',
        targetLocation: 'Narasaraopet, Palnadu, Andhra Pradesh',
        searchIntent: 'LOCAL',
        primaryKeyword: 'mobile field sales apps narasaraopet',
        referenceSources: [],
        status: TopicStatus.CLAIMED,
        attempts: 1,
        lastError: null,
        nextRetryAt: null,
        claimedAt,
        claimedBy: 'worker-pid-1234',
        createdAt,
        updatedAt,
      },
      {
        id: 'row-3',
        topicKey: 'cold-storage-tenali',
        topic: 'Cold Storage Stock Systems in Tenali',
        language: BlogLanguage.en,
        categorySlug: 'website-development',
        targetLocation: 'Tenali, Guntur, Andhra Pradesh',
        searchIntent: 'COMMERCIAL_INVESTIGATION',
        primaryKeyword: 'cold storage tenali',
        referenceSources: [],
        status: TopicStatus.FAILED,
        attempts: 3,
        lastError: 'validation: internal_links',
        nextRetryAt: null,
        claimedAt: null,
        claimedBy: null,
        createdAt,
        updatedAt,
      },
    ];

    const mockPrisma = {
      blogPost: {
        findMany: async () => [{ topicKey: 'done-topic', language: BlogLanguage.en }],
      },
      blogTopic: {
        findMany: async () => mockRows,
      },
    };

    const queueService = new BlogQueueService(mockPrisma, { isLikelyDuplicateTopic: async () => false });
    const items = await queueService.getPendingQueueItems();

    assert.equal(items.length, 3);

    const first = items[0];
    assert.equal(first.id, 'row-1');
    assert.equal(first.topicKey, 'enterprise-web-guntur');
    assert.equal(first.status, 'PENDING');
    assert.equal(first.attempts, 1);
    assert.equal(first.lastError, 'LLM generation failed [MODEL_OVERLOADED]: High demand');
    assert.equal(first.nextRetryAt, nextRetryAt.toISOString());
    assert.equal(first.claimedAt, null);
    assert.equal(first.createdAt, createdAt.toISOString());
    assert.equal(first.updatedAt, updatedAt.toISOString());

    const second = items[1];
    assert.equal(second.id, 'row-2');
    assert.equal(second.status, 'CLAIMED');
    assert.equal(second.claimedBy, 'worker-pid-1234');
    assert.equal(second.claimedAt, claimedAt.toISOString());

    const third = items[2];
    assert.equal(third.id, 'row-3');
    assert.equal(third.status, 'FAILED');
    assert.equal(third.attempts, 3);
    assert.equal(third.lastError, 'validation: internal_links');
  });
});
