import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import { toTopicKey } from '../dist/automation/topic-identity.js';
import { getAllTeluguSeeds, EXTENDED_TELUGU_SEEDS } from '../dist/automation/blog/telugu-matrix.js';
import { getAllEnglishSeeds, EXTENDED_ENGLISH_SEEDS } from '../dist/automation/blog/english-matrix.js';
import { detectLanguage } from '../dist/automation/scripts/transliteration.js';
import { BlogQueueService } from '../dist/automation/blog/blog-queue.service.js';
import { BlogBatchService } from '../dist/automation/blog/blog-batch.service.js';
import { BlogStatusService } from '../dist/automation/blog/blog-status.service.js';
import { BlogAutomationService } from '../dist/automation/blog-automation.service.js';

function createMockPrisma({ topics = [], posts = [], settings = [] } = {}) {
  let seq = 1;
  return {
    blogTopic: {
      findMany: async ({ where = {} } = {}) =>
        topics.filter((t) => {
          if (where.language && t.language !== where.language) return false;
          if (where.status) {
            if (Array.isArray(where.status?.in) && !where.status.in.includes(t.status)) return false;
            if (typeof where.status === 'string' && t.status !== where.status) return false;
          }
          if (where.attempts?.lt !== undefined && t.attempts >= where.attempts.lt) return false;
          return true;
        }),
      findFirst: async ({ where = {} } = {}) =>
        topics.find((t) => (!where.language || t.language === where.language) && (where.attempts?.lt === undefined || t.attempts < where.attempts.lt)) ?? null,
      findUnique: async ({ where: { topicKey_language } }) =>
        topics.find((t) => t.topicKey === topicKey_language.topicKey && t.language === topicKey_language.language) ?? null,
      count: async ({ where = {} } = {}) =>
        topics.filter((t) => {
          if (where.language && t.language !== where.language) return false;
          if (where.status && t.status !== where.status) return false;
          if (where.attempts?.lt !== undefined && t.attempts >= where.attempts.lt) return false;
          return true;
        }).length,
      create: async ({ data }) => {
        if (topics.some((t) => t.topicKey === data.topicKey && t.language === data.language)) {
          const err = new Error('Unique constraint');
          err.code = 'P2002';
          throw err;
        }
        const row = { id: `topic-${seq++}`, status: TopicStatus.PENDING, attempts: 0, lastError: null, nextRetryAt: null, claimedAt: null, ...data };
        topics.push(row);
        return row;
      },
      update: async ({ where, data }) => {
        const item = topics.find((t) => t.topicKey === where.topicKey_language.topicKey && t.language === where.topicKey_language.language);
        if (item) Object.assign(item, data);
        return item;
      },
      updateMany: async ({ where = {}, data }) => {
        let count = 0;
        for (const item of topics) {
          const idMatch = !where.id || item.id === where.id;
          const statusMatch = !where.status ||
            (Array.isArray(where.status?.in) ? where.status.in.includes(item.status) : item.status === where.status);
          const attemptsMatch = where.attempts?.lt === undefined || item.attempts < where.attempts.lt;
          if (idMatch && statusMatch && attemptsMatch) {
            Object.assign(item, data);
            count++;
          }
        }
        return { count };
      },
    },
    blogPost: {
      count: async ({ where = {} } = {}) =>
        posts.filter((p) => !where.status || p.status === where.status).length,
      findMany: async ({ where = {} } = {}) =>
        posts.filter((p) => !where.language || p.language === where.language),
      findUnique: async ({ where: { topicKey_language } }) =>
        posts.find((p) => p.topicKey === topicKey_language.topicKey && p.language === topicKey_language.language) ?? null,
    },
    siteSetting: {
      findUnique: async ({ where: { key } }) => settings.find((s) => s.key === key) ?? null,
      findMany: async () => settings,
    },
  };
}

describe('Phase 4: Sustainable Bilingual Topic Supply & Queue Health', () => {
  it('sustainable topic supply: provides 40+ unique regional Telugu seeds across 5 categories', () => {
    const teSeeds = getAllTeluguSeeds();
    assert.ok(teSeeds.length >= 40, `Expected >= 40 Telugu seeds, got ${teSeeds.length}`);
    const categories = new Set(teSeeds.map((t) => t.categorySlug));
    for (const cat of ['website-development', 'app-development', 'school-websites', 'startups', 'local-seo-business']) {
      assert.ok(categories.has(cat), `Missing Telugu category: ${cat}`);
    }
    // Verify script purity: all Telugu seeds must detect as Telugu
    assert.ok(teSeeds.every((s) => detectLanguage(s.topic) === 'te'), 'All Telugu seeds must be genuine Telugu script');
  });

  it('sustainable topic supply: provides 35+ unique regional English seeds across 5 categories', () => {
    const enSeeds = getAllEnglishSeeds();
    assert.ok(enSeeds.length >= 35, `Expected >= 35 English seeds, got ${enSeeds.length}`);
    const categories = new Set(enSeeds.map((t) => t.categorySlug));
    for (const cat of ['website-development', 'app-development', 'school-websites', 'startups', 'local-seo-business']) {
      assert.ok(categories.has(cat), `Missing English category: ${cat}`);
    }
    assert.ok(enSeeds.every((s) => detectLanguage(s.topic) === 'en'), 'All English seeds must be genuine English');
  });

  it('deduplication: prevents repeated topics across pending, failed, draft, and published states', async () => {
    const testTopic = 'గుంటూరులో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?';
    const testKey = toTopicKey(testTopic);
    const topics = [
      { topicKey: testKey, topic: testTopic, language: BlogLanguage.te, status: TopicStatus.PENDING, attempts: 0 },
    ];
    const posts = [];
    const prisma = createMockPrisma({ topics, posts });
    const queueService = new BlogQueueService(prisma, { isLikelyDuplicateTopic: async () => false });

    // 1. Refuses pending topic duplicate
    const p1 = await queueService.enqueueTopic({ topic: testTopic, categorySlug: 'website-development', language: BlogLanguage.te, source: 'discovery' });
    assert.equal(p1.enqueued, false);
    assert.equal(p1.reason, 'already queued');

    // 2. Refuses failed topic duplicate
    topics[0].status = TopicStatus.FAILED;
    const pFailed = await queueService.enqueueTopic({ topic: testTopic, categorySlug: 'website-development', language: BlogLanguage.te, source: 'discovery' });
    assert.equal(pFailed.enqueued, false);
    assert.equal(pFailed.reason, 'already queued');

    // 3. Refuses published post duplicate
    const publishedTopic = 'How to Build a SaaS in Guntur';
    const publishedKey = toTopicKey(publishedTopic);
    posts.push({ topicKey: publishedKey, language: BlogLanguage.en, status: 'PUBLISHED' });
    const pPub = await queueService.enqueueTopic({ topic: publishedTopic, categorySlug: 'startups', language: BlogLanguage.en, source: 'discovery' });
    assert.equal(pPub.enqueued, false);
    assert.equal(pPub.reason, 'already generated');
  });

  it('provider failure resilience: external discovery error does not stop curated seed replenishment', async () => {
    const prisma = createMockPrisma();
    const queueService = new BlogQueueService(prisma, { isLikelyDuplicateTopic: async () => false });
    const failingDiscovery = {
      discoverForLanguages: async () => { throw new Error('Google network timeout 503'); },
      discover: async () => { throw new Error('Provider crash'); },
    };
    const mockBilingual = {
      readBilingualSwitch: async () => ({ enabled: true, quota: { te: 2, en: 3 } }),
    };

    const auto = new BlogAutomationService(
      prisma, queueService, {}, {}, mockBilingual, {}, {}, failingDiscovery,
    );

    const out = await auto.discoverAndEnqueue(40);
    assert.ok(out.rejected.some((r) => r.includes('discovery_provider_error')), 'Discovery error must be logged in rejected');

    // Curated replenishment must still succeed independently
    const pendingTe = await prisma.blogTopic.count({ where: { language: BlogLanguage.te } });
    const pendingEn = await prisma.blogTopic.count({ where: { language: BlogLanguage.en } });
    assert.ok(pendingTe >= 10, `Telugu queue must be replenished despite discovery error, got ${pendingTe}`);
    assert.ok(pendingEn >= 10, `English queue must be replenished despite discovery error, got ${pendingEn}`);
  });

  it('observable queue health: getStatus serializes language health and replenishment flags accurately', async () => {
    const topics = [
      { id: '1', topicKey: 'te-1', language: BlogLanguage.te, status: TopicStatus.PENDING, attempts: 0 },
      { id: '2', topicKey: 'te-2', language: BlogLanguage.te, status: TopicStatus.PENDING, attempts: 0 },
      { id: '3', topicKey: 'en-1', language: BlogLanguage.en, status: TopicStatus.PENDING, attempts: 0 },
      { id: '4', topicKey: 'en-fail', language: BlogLanguage.en, status: TopicStatus.FAILED, attempts: 3 },
    ];
    const prisma = createMockPrisma({ topics });
    const mockDiscovery = {
      sourceStatuses: async () => [],
      coverageReport: async () => ({ topicsCovered: [], keywordsCovered: [], intentsCovered: {} }),
    };
    const statusService = new BlogStatusService(prisma, mockDiscovery);

    const status = await statusService.getStatus();
    assert.ok(status.queueHealth, 'queueHealth must be present in getStatus');
    assert.equal(status.queueHealth.pending.te, 2);
    assert.equal(status.queueHealth.pending.en, 1);
    assert.equal(status.queueHealth.failed.en, 1);
    assert.equal(status.queueHealth.failed.te, 0);
    assert.equal(status.queueHealth.healthy, false, 'healthy should be false when pending < 10');
    assert.equal(status.queueHealth.replenishmentNeeded.te, true);
    assert.equal(status.queueHealth.replenishmentNeeded.en, true);
  });

  it('proactive batch replenishment: replenishes queue before claims if backlog is low', async () => {
    // Start with 1 Telugu topic and 1 English topic (critically low)
    const topics = [
      { id: '1', topicKey: 'te-1', topic: 'గుంటూరులో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?', language: BlogLanguage.te, status: TopicStatus.PENDING, attempts: 0, categorySlug: 'web', targetLocation: null, referenceSources: [] },
      { id: '2', topicKey: 'en-1', topic: 'How to Build a SaaS in Guntur', language: BlogLanguage.en, status: TopicStatus.PENDING, attempts: 0, categorySlug: 'web', targetLocation: null, referenceSources: [] },
    ];
    const prisma = createMockPrisma({ topics });
    const queueService = new BlogQueueService(prisma, { isLikelyDuplicateTopic: async () => false });
    const batchService = new BlogBatchService(prisma, queueService);

    const mockGenerate = async (t) => ({
      id: `p-${t.id}`, title: t.topic, slug: t.topicKey, category: t.categorySlug,
      status: 'PUBLISHED', wordCount: 1200, imagesCount: 1, url: `/${t.topicKey}`, topicKey: t.topicKey,
    });

    const out = await batchService.generateBilingualBatch({ te: 2, en: 3 }, false, 'test-worker', mockGenerate);

    // Because proactive replenishment fired before claims, the full quota of 2 TE + 3 EN was generated!
    assert.equal(out.results.length, 5, 'Should generate full batch of 5');
    assert.equal(out.results.filter((r) => detectLanguage(r.title) === 'te').length, 2, '2 Telugu generated');
    assert.equal(out.results.filter((r) => detectLanguage(r.title) === 'en').length, 3, '3 English generated');
    assert.equal(out.rejected.length, 0, 'Zero deficits due to proactive replenishment');
  });
});
