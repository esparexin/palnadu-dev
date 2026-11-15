import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import { toTopicKey } from '../dist/automation/topic-identity.js';
import { ContentSimilarityService } from '../dist/automation/content-similarity.service.js';
import { BlogQueueService } from '../dist/automation/blog/blog-queue.service.js';

function createMockPrisma({ topics = [], posts = [] } = {}) {
  let seq = 1;
  return {
    blogTopic: {
      findMany: async ({ where = {} } = {}) =>
        topics.filter((t) => {
          if (where.language && t.language !== where.language) return false;
          if (where.status?.in && !where.status.in.includes(t.status)) return false;
          return true;
        }),
      findUnique: async ({ where: { topicKey_language } }) =>
        topics.find((t) => t.topicKey === topicKey_language.topicKey && t.language === topicKey_language.language) ?? null,
      create: async ({ data }) => {
        if (topics.some((t) => t.topicKey === data.topicKey && t.language === data.language)) {
          const err = new Error('Unique constraint');
          err.code = 'P2002';
          throw err;
        }
        const row = { id: `topic-${seq++}`, status: TopicStatus.PENDING, attempts: 0, ...data };
        topics.push(row);
        return row;
      },
    },
    blogPost: {
      findMany: async ({ where = {} } = {}) =>
        posts.filter((p) => !where.language || p.language === where.language),
      findUnique: async ({ where: { topicKey_language } }) =>
        posts.find((p) => p.topicKey === topicKey_language.topicKey && p.language === topicKey_language.language) ?? null,
    },
  };
}

describe('Phase 4: Semantic Duplicate Prevention & Replenishment Safety', () => {
  it('detects near-duplicate English topics with different wording in the same location', async () => {
    const posts = [
      {
        id: 'p1',
        topicKey: toTopicKey('Website Development Cost in Guntur'),
        topic: 'Website Development Cost in Guntur',
        title: 'Website Development Cost in Guntur',
        language: BlogLanguage.en,
      },
    ];
    const prisma = createMockPrisma({ posts });
    const similarity = new ContentSimilarityService(prisma);

    // Rephrased wording, same core concepts (web-dev + cost), same location (Guntur)
    const isDup = await similarity.isLikelyDuplicateTopic(
      'Best Website Development Pricing in Guntur',
      new Set(),
      BlogLanguage.en,
    );
    assert.equal(isDup, true, 'Must detect reworded pricing/cost near-duplicate in Guntur');
  });

  it('detects near-duplicate Telugu topics with different wording in the same location', async () => {
    const topics = [
      {
        id: 't1',
        topicKey: toTopicKey('చిలకలూరిపేటలో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?'),
        topic: 'చిలకలూరిపేటలో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?',
        language: BlogLanguage.te,
        status: TopicStatus.PENDING,
      },
    ];
    const prisma = createMockPrisma({ topics });
    const similarity = new ContentSimilarityService(prisma);

    // Rephrased Telugu phrasing: "ధరలు" (prices) vs "ఖర్చు" (cost) in Chilakaluripet
    const isDup = await similarity.isLikelyDuplicateTopic(
      'చిలకలూరిపేట వ్యాపారాలకు వెబ్‌సైట్ డిజైన్ ధరలు',
      new Set(),
      BlogLanguage.te,
    );
    assert.equal(isDup, true, 'Must detect reworded Telugu near-duplicate in Chilakaluripet');
  });

  it('detects near-duplicates against pending blogTopic rows before article is published', async () => {
    const pendingTitle = 'School Admission Portal Software in Narasaraopet';
    const topics = [
      {
        id: 't-pending',
        topicKey: toTopicKey(pendingTitle),
        topic: pendingTitle,
        language: BlogLanguage.en,
        status: TopicStatus.PENDING,
      },
    ];
    // No published posts yet
    const prisma = createMockPrisma({ topics, posts: [] });
    const similarity = new ContentSimilarityService(prisma);

    const isDup = await similarity.isLikelyDuplicateTopic(
      'School Admission and Student Management Software in Narasaraopet',
      new Set(),
      BlogLanguage.en,
    );
    assert.equal(isDup, true, 'Must detect near-duplicate against pending queue row');
  });

  it('strictly preserves legitimate regional variations across different towns', async () => {
    const posts = [
      {
        id: 'p1',
        topicKey: toTopicKey('Website Development Cost in Guntur'),
        topic: 'Website Development Cost in Guntur',
        title: 'Website Development Cost in Guntur',
        language: BlogLanguage.en,
      },
    ];
    const prisma = createMockPrisma({ posts });
    const similarity = new ContentSimilarityService(prisma);

    // Same service, same intent, but in Narasaraopet (distinct geographic landing page)
    const isDup = await similarity.isLikelyDuplicateTopic(
      'Website Development Cost in Narasaraopet',
      new Set(),
      BlogLanguage.en,
    );
    assert.equal(isDup, false, 'Regional variations in different towns must never be rejected');

    // Telugu regional variation: Vinukonda vs Chilakaluripet
    const teDup = await similarity.isLikelyDuplicateTopic(
      'వినుకొండలో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?',
      new Set(),
      BlogLanguage.te,
    );
    assert.equal(teDup, false, 'Telugu regional variations across towns must never be rejected');
  });

  it('strictly preserves distinct niche topics in the same location', async () => {
    const posts = [
      {
        id: 'p1',
        topicKey: toTopicKey('Website Development Cost in Guntur'),
        topic: 'Website Development Cost in Guntur',
        title: 'Website Development Cost in Guntur',
        language: BlogLanguage.en,
      },
    ];
    const prisma = createMockPrisma({ posts });
    const similarity = new ContentSimilarityService(prisma);

    // In Guntur, but completely distinct subject (Cold storage stock management)
    const isDup = await similarity.isLikelyDuplicateTopic(
      'Cold Storage Stock and Commodity Dispatch Systems in Guntur',
      new Set(),
      BlogLanguage.en,
    );
    assert.equal(isDup, false, 'Distinct services in the same location must be preserved');
  });

  it('replenishment safety: concurrent enqueueTopic handles P2002 race condition gracefully', async () => {
    const prisma = createMockPrisma();
    const queueService = new BlogQueueService(prisma, { isLikelyDuplicateTopic: async () => false });

    const candidate = {
      topic: 'Concurrent Generation Topic in Palnadu',
      categorySlug: 'website-development',
      language: BlogLanguage.en,
      source: 'discovery',
    };

    // Simulate two workers attempting to enqueue the exact same candidate concurrently
    const [res1, res2] = await Promise.all([
      queueService.enqueueTopic(candidate),
      queueService.enqueueTopic(candidate),
    ]);

    // Exactly one must succeed, and the other must report duplicate topicKey without throwing
    const enqueuedCount = (res1.enqueued ? 1 : 0) + (res2.enqueued ? 1 : 0);
    assert.equal(enqueuedCount, 1, 'Only one worker must succeed in enqueueing');
    const failedRes = res1.enqueued ? res2 : res1;
    assert.equal(failedRes.enqueued, false);
    assert.ok(failedRes.reason?.includes('duplicate topicKey'), 'Race must be safely caught by unique index');
  });

  it('lease safety: active in-flight jobs (< 5m) cannot be stolen, while expired leases (> 5m) can be reclaimed', async () => {
    const now = new Date();
    const activeClaimTime = new Date(now.getTime() - 2 * 60 * 1000); // 2 minutes ago (actively processing)
    const expiredClaimTime = new Date(now.getTime() - 7 * 60 * 1000); // 7 minutes ago (exceeded 5m threshold)

    const topics = [
      { id: 't-active', topicKey: 'active-key', topic: 'Active In-Flight Job', language: BlogLanguage.en, status: TopicStatus.CLAIMED, attempts: 1, claimedAt: activeClaimTime, claimedBy: 'worker-1' },
      { id: 't-expired', topicKey: 'expired-key', topic: 'Abandoned In-Flight Job', language: BlogLanguage.en, status: TopicStatus.CLAIMED, attempts: 1, claimedAt: expiredClaimTime, claimedBy: 'worker-dead' },
    ];
    const prisma = createMockPrisma({ topics });
    // Add updateMany to mock prisma
    prisma.blogTopic.updateMany = async ({ where = {}, data }) => {
      let count = 0;
      for (const t of topics) {
        if (where.id && t.id !== where.id) continue;
        if (where.status?.in && !where.status.in.includes(t.status)) continue;
        const staleCond = where.OR?.find((c) => c.claimedAt?.lt)?.claimedAt?.lt;
        const canClaim = !t.claimedAt || (staleCond && t.claimedAt < staleCond);
        if (where.OR && !canClaim) continue;
        Object.assign(t, data);
        count++;
      }
      return { count };
    };

    const queueService = new BlogQueueService(prisma, { isLikelyDuplicateTopic: async () => false });

    // Worker 2 attempts to claim the active job: MUST BE REJECTED (lease still valid)
    const activeClaim = await queueService.claimTopicById('worker-2', { topicKey: 'active-key', language: BlogLanguage.en }, 3);
    assert.equal(activeClaim, null, 'Active in-flight job must not be released or claimed prematurely');
    assert.equal(topics[0].claimedBy, 'worker-1');

    // Worker 2 attempts to claim the expired job: MUST SUCCEED (reclaimed atomically)
    const expiredClaim = await queueService.claimTopicById('worker-2', { topicKey: 'expired-key', language: BlogLanguage.en }, 3);
    assert.ok(expiredClaim, 'Abandoned job past lease must be reclaimable');
    assert.equal(topics[1].claimedBy, 'worker-2');
  });
});
