import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import { TELUGU_CURATED_TOPIC_QUEUE } from '../dist/automation/blog/telugu-seeds.js';
import { getAllInitialSeeds } from '../dist/automation/blog/blog-seeds.js';
import { toTopicKey } from '../dist/automation/topic-identity.js';
import { BlogQueueService } from '../dist/automation/blog/blog-queue.service.js';
import { BlogBilingualService } from '../dist/automation/blog/blog-bilingual.service.js';
import { TopicDiscoveryService } from '../dist/automation/topic-discovery.service.js';
import { BlogAutomationService } from '../dist/automation/blog-automation.service.js';
import {
  isPermanentFailureError,
  isTransientFailureError,
  recoverTransientFailedTopics,
} from '../dist/automation/blog/blog-queue-recovery.util.js';

function createBilingualQueuePrisma({ topics = [], posts = [], settings = [] } = {}) {
  let seq = 1;
  const match = (row, where = {}) =>
    (!where.status || row.status === where.status) &&
    (!where.language || row.language === where.language);
  return {
    topics,
    posts,
    blogTopic: {
      findMany: async ({ where = {} } = {}) => topics.filter((t) => match(t, where)),
      findFirst: async ({ where = {} } = {}) =>
        topics.find(
          (t) =>
            (!where.language || t.language === where.language) &&
            t.attempts < (where.attempts?.lt ?? 99) &&
            (t.status === TopicStatus.PENDING || t.status === TopicStatus.CLAIMED),
        ) ?? null,
      count: async ({ where = {} } = {}) =>
        topics.filter(
          (t) => match(t, where) && (where.attempts?.lt === undefined || t.attempts < where.attempts.lt),
        ).length,
      findUnique: async ({ where: { topicKey_language } }) =>
        topics.find(
          (t) => t.topicKey === topicKey_language.topicKey && t.language === topicKey_language.language,
        ) ?? null,
      async create({ data }) {
        if (topics.some((t) => t.topicKey === data.topicKey && t.language === data.language)) {
          const err = new Error('Unique constraint');
          err.code = 'P2002';
          throw err;
        }
        const row = {
          id: `topic-${seq++}`, status: TopicStatus.PENDING, attempts: 0, postId: null,
          lastError: null, nextRetryAt: null, claimedAt: null, claimedBy: null, updatedAt: new Date(),
          ...data,
        };
        topics.push(row);
        return row;
      },
      async updateMany({ where, data }) {
        let count = 0;
        for (const t of topics) {
          if (where.id && t.id !== where.id) continue;
          if (where.status && typeof where.status === 'string' && t.status !== where.status) continue;
          if (where.status?.in && !where.status.in.includes(t.status)) continue;
          Object.assign(t, data);
          count += 1;
        }
        return { count };
      },
    },
    blogPost: {
      findMany: async ({ where = {} } = {}) => posts.filter((p) => !where.language || p.language === where.language),
      findUnique: async ({ where: { topicKey_language } }) =>
        posts.find(
          (p) => p.topicKey === topicKey_language.topicKey && p.language === topicKey_language.language,
        ) ?? null,
    },
    siteSetting: {
      findMany: async ({ where } = {}) => {
        const keys = where?.key?.in ?? [];
        return settings.filter((s) => keys.length === 0 || keys.includes(s.key));
      },
    },
  };
}

describe('PR3 Bilingual Queue Replenishment, Per-Language Discovery & Transient Recovery', () => {
  it('defines distinct Telugu regional seeds covering all 5 canonical categories', () => {
    assert.ok(TELUGU_CURATED_TOPIC_QUEUE.length >= 15);
    const categories = new Set(TELUGU_CURATED_TOPIC_QUEUE.map((t) => t.categorySlug));
    for (const cat of ['website-development', 'app-development', 'school-websites', 'startups', 'local-seo-business']) {
      assert.ok(categories.has(cat), `missing Telugu category ${cat}`);
    }
    const keys = TELUGU_CURATED_TOPIC_QUEUE.map((t) => toTopicKey(t.topic));
    assert.equal(new Set(keys).size, keys.length, 'Telugu seed topicKeys must all be unique');
    assert.ok(TELUGU_CURATED_TOPIC_QUEUE.every((t) => t.language === BlogLanguage.te));

    const teSeeds = getAllInitialSeeds(new Set(), BlogLanguage.te);
    assert.equal(teSeeds[0].topic, TELUGU_CURATED_TOPIC_QUEUE[0].topic);
    assert.ok(teSeeds.length > TELUGU_CURATED_TOPIC_QUEUE.length);
  });

  it('replenishes Telugu queue independently even when English queue already meets minPending', async () => {
    const enTopics = Array.from({ length: 12 }, (_, i) => ({
      id: `en-${i}`, topicKey: `en-existing-${i}`, topic: `English Topic ${i}`,
      language: BlogLanguage.en, status: TopicStatus.PENDING, attempts: 0,
    }));
    const prisma = createBilingualQueuePrisma({ topics: enTopics });
    const queue = new BlogQueueService(prisma, { isLikelyDuplicateTopic: async () => false });

    const added = await queue.replenishQueueForLanguages(5, 10, [BlogLanguage.en, BlogLanguage.te]);
    assert.ok(added >= 5, `expected >= 5 Telugu seeds enqueued, got ${added}`);
    assert.equal(prisma.topics.filter((t) => t.language === BlogLanguage.en).length, 12);
    assert.ok(prisma.topics.filter((t) => t.language === BlogLanguage.te).length >= 5);
  });

  it('filters TopicDiscoveryService dedup strictly by language and queries external sources once', async () => {
    let sourceCalls = 0;
    const mockSource = {
      id: 'google_autocomplete',
      isConfigured: () => true,
      capabilities: [],
      confidence: 'verified_google',
      async discover() {
        sourceCalls += 1;
        return [
          {
            topicKey: 'billing-software-guntur', phrase: 'billing software in guntur',
            primaryKeyword: 'billing software guntur', secondaryKeywords: [], longTailKeywords: [],
            intent: 'COMMERCIAL_INVESTIGATION', confidence: 'verified_google', sources: ['google_autocomplete'],
          },
          {
            topicKey: 'school-portal-palnadu', phrase: 'school admission portal palnadu',
            primaryKeyword: 'school portal palnadu', secondaryKeywords: [], longTailKeywords: [],
            intent: 'LOCAL', confidence: 'verified_google', sources: ['google_autocomplete'],
          },
          {
            topicKey: 'noise-crack', phrase: 'billing software crack free download',
            primaryKeyword: 'billing software crack', secondaryKeywords: [], longTailKeywords: [],
            intent: 'INFORMATIONAL', confidence: 'ai_suggestion', sources: ['google_autocomplete'],
          },
        ];
      },
    };
    const prisma = createBilingualQueuePrisma({
      posts: [{ topicKey: 'billing-software-guntur', language: BlogLanguage.en }],
      topics: [{ topicKey: 'school-portal-palnadu', language: BlogLanguage.te, status: TopicStatus.PENDING, attempts: 0 }],
    });
    const discovery = new TopicDiscoveryService(prisma, [mockSource]);
    const batches = await discovery.discoverForLanguages(20, [BlogLanguage.en, BlogLanguage.te]);
    assert.equal(sourceCalls, 1);
    assert.deepEqual(batches.find((b) => b.language === BlogLanguage.en).topics.map((t) => t.topicKey), ['school-portal-palnadu']);
    assert.deepEqual(batches.find((b) => b.language === BlogLanguage.te).topics.map((t) => t.topicKey), ['billing-software-guntur']);
  });

  it('discovers and enqueues into both EN and TE when bilingual mode is enabled', async () => {
    const prisma = createBilingualQueuePrisma({
      settings: [{ key: 'bilingual_generation_enabled', value: true }],
    });
    const queue = new BlogQueueService(prisma, { isLikelyDuplicateTopic: async () => false });
    const discovery = new TopicDiscoveryService(prisma, [{
      id: 'google_autocomplete', isConfigured: () => true, capabilities: [], confidence: 'verified_google',
      discover: async () => [{
        topicKey: 'pos-software-narasaraopet', phrase: 'pos billing software in narasaraopet',
        primaryKeyword: 'pos billing software', secondaryKeywords: [], longTailKeywords: [],
        intent: 'LOCAL', confidence: 'verified_google', sources: ['google_autocomplete'],
      }],
    }]);
    const auto = new BlogAutomationService(prisma, queue, null, null, new BlogBilingualService(prisma), null, null, discovery);
    const out = await auto.discoverAndEnqueue(10);
    assert.equal(out.enqueued, 2);
    assert.equal(prisma.topics.filter((t) => t.language === BlogLanguage.en).length, 1);
    assert.equal(prisma.topics.filter((t) => t.language === BlogLanguage.te).length, 1);
  });

  it('recovers transient capacity FAILED topics after cooldown while leaving permanent validation failures FAILED', async () => {
    assert.equal(isTransientFailureError('All configured Gemini models failed [MODEL_OVERLOADED]'), true);
    assert.equal(isPermanentFailureError('validation: internal_links, content_originality'), true);
    assert.equal(isTransientFailureError('validation: internal_links'), false);

    const now = new Date('2026-11-12T10:00:00.000Z');
    const oldUpdate = new Date('2026-11-11T10:00:00.000Z');
    const recentUpdate = new Date('2026-11-12T08:00:00.000Z');
    const topics = [
      { id: 'f-transient-old', topicKey: 't1', language: BlogLanguage.te, status: TopicStatus.FAILED, attempts: 3, lastError: 'MODEL_OVERLOADED (503 high demand)', updatedAt: oldUpdate, postId: null },
      { id: 'f-transient-recent', topicKey: 't2', language: BlogLanguage.te, status: TopicStatus.FAILED, attempts: 3, lastError: 'TEMPORARY_PROVIDER_ERROR: HTTP 429', updatedAt: recentUpdate, postId: null },
      { id: 'f-validation', topicKey: 't3', language: BlogLanguage.te, status: TopicStatus.FAILED, attempts: 3, lastError: 'validation: internal_links', updatedAt: oldUpdate, postId: null },
      { id: 'f-invalid-key', topicKey: 't4', language: BlogLanguage.te, status: TopicStatus.FAILED, attempts: 3, lastError: 'INVALID_API_KEY', updatedAt: oldUpdate, postId: null },
    ];
    const prisma = createBilingualQueuePrisma({ topics });
    const recovered = await recoverTransientFailedTopics(prisma, { language: BlogLanguage.te, maxAttempts: 3, now });
    assert.equal(recovered, 1);
    assert.equal(topics.find((t) => t.id === 'f-transient-old').status, TopicStatus.PENDING);
    assert.equal(topics.find((t) => t.id === 'f-transient-old').attempts, 2);
    assert.equal(topics.find((t) => t.id === 'f-transient-recent').status, TopicStatus.FAILED);
    assert.equal(topics.find((t) => t.id === 'f-validation').status, TopicStatus.FAILED);
    assert.equal(topics.find((t) => t.id === 'f-invalid-key').status, TopicStatus.FAILED);
  });
});
