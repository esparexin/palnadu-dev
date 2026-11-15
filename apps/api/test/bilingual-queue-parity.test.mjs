import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import { inferCategoryFromTopic } from '../dist/automation/blog/blog-seeds.js';
import { detectLanguage, detectScript, teluguScriptRatio } from '../dist/automation/scripts/transliteration.js';
import { TopicDiscoveryService } from '../dist/automation/topic-discovery.service.js';
import { BlogQueueService } from '../dist/automation/blog/blog-queue.service.js';
import { BlogBatchService } from '../dist/automation/blog/blog-batch.service.js';
import { BlogAutomationService } from '../dist/automation/blog-automation.service.js';
import { allocateQuota } from '../dist/automation/bilingual-quota.js';

function createMockPrisma({ topics = [], posts = [], settings = [] } = {}) {
  let seq = 1;
  return {
    blogTopic: {
      findMany: async ({ where = {} } = {}) =>
        topics.filter((t) => (!where.language || t.language === where.language) && (!where.status || t.status === where.status)),
      findFirst: async ({ where = {} } = {}) =>
        topics.find((t) => (!where.language || t.language === where.language) && (where.attempts?.lt === undefined || t.attempts < where.attempts.lt)) ?? null,
      findUnique: async ({ where: { topicKey_language } }) =>
        topics.find((t) => t.topicKey === topicKey_language.topicKey && t.language === topicKey_language.language) ?? null,
      count: async ({ where = {} } = {}) =>
        topics.filter((t) => (!where.language || t.language === where.language) && (!where.status || t.status === where.status)).length,
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
    },
    blogPost: {
      findMany: async ({ where = {} } = {}) =>
        posts.filter((p) => (!where.language || p.language === where.language)),
      findUnique: async ({ where: { topicKey_language } }) =>
        posts.find((p) => p.topicKey === topicKey_language.topicKey && p.language === topicKey_language.language) ?? null,
    },
    siteSetting: {
      findMany: async () => settings,
    },
  };
}

describe('Bilingual Queue Reliability & Discovery Parity', () => {
  it('language detection: classifies authentic, mixed, short, punctuated, and transliterated phrases', () => {
    // 1. Authentic Telugu
    assert.equal(detectLanguage('గుంటూరులో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?'), 'te');
    // 2. English
    assert.equal(detectLanguage('How to Build a SaaS Product in Guntur'), 'en');
    // 3. Mixed Telugu-English with brand/tech terms
    assert.equal(detectLanguage('గుంటూర్‌లో Palnadu వెబ్ డెవలప్మెంట్ ఖర్చు'), 'te');
    assert.equal(detectLanguage('గుంటూరులో SEO సర్వీసెస్'), 'te');
    // 4. Short phrases
    assert.equal(detectLanguage('పల్నాడు'), 'te');
    assert.equal(detectLanguage('SEO'), 'en');
    // 5. Punctuation
    assert.equal(detectLanguage('వెబ్‌సైట్ డిజైన్! ఖర్చు ఎంత?'), 'te');
    // 6. Transliterated Telugu in Latin script (correctly classified as 'en' to prevent failing Telugu script ratio)
    assert.equal(detectLanguage('Guntur lo website design cost entha'), 'en');
    assert.equal(teluguScriptRatio('Guntur lo website design cost entha'), 0);
  });

  it('multilingual category inference: correctly maps regional Telugu tokens across 5 canonical categories', () => {
    assert.equal(inferCategoryFromTopic('వినుకొండ వ్యాపారాలు గూగుల్‌లో కనిపించేలా లోకల్ ఎస్‌ఇ‌ఓ గైడ్'), 'local-seo-business');
    assert.equal(inferCategoryFromTopic('విజయవాడ వ్యాపారాలకు మొబైల్ యాప్ డెవలప్మెంట్ ఖర్చు'), 'app-development');
    assert.equal(inferCategoryFromTopic('నరసారావుపేట పాఠశాలలకు డిజిటల్ అడ్మిషన్ పోర్టల్'), 'school-websites');
    assert.equal(inferCategoryFromTopic('ఆంధ్రప్రదేశ్‌లో కొత్త వ్యాపారం కోసం సాస్ మరియు ఎమ్‌వీ‌పీ స్టార్టప్'), 'startups');
    assert.equal(inferCategoryFromTopic('గుంటూరులో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?'), 'website-development');
  });

  it('external discovery language classification: never assigns English candidates to Telugu queue', async () => {
    const prisma = createMockPrisma();
    const service = new TopicDiscoveryService(prisma, []);
    const mixedCandidates = [
      { topicKey: 'how-to-build-saas', phrase: 'How to Build a SaaS in Guntur', sources: ['google_suggest'] },
      { topicKey: 'guntur-website-cost', phrase: 'గుంటూరులో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత?', sources: ['google_suggest'] },
    ];

    const teTopics = await service.filterFreshForLanguage(mixedCandidates, BlogLanguage.te, 10);
    const enTopics = await service.filterFreshForLanguage(mixedCandidates, BlogLanguage.en, 10);

    assert.equal(teTopics.length, 1);
    assert.equal(teTopics[0].topicKey, 'guntur-website-cost');
    assert.equal(enTopics.length, 1);
    assert.equal(enTopics[0].topicKey, 'how-to-build-saas');
  });

  it('Telugu seed replenishment: populates authentic Telugu queue up to minimum threshold', async () => {
    const prisma = createMockPrisma();
    const mockSimilarity = { isLikelyDuplicateTopic: async () => false };
    const queueService = new BlogQueueService(prisma, mockSimilarity);

    const enqueued = await queueService.replenishQueueIfLow(10, 15, BlogLanguage.te);
    assert.equal(enqueued, 15);

    const pendingTelugu = await prisma.blogTopic.count({ where: { language: BlogLanguage.te } });
    assert.equal(pendingTelugu, 15);

    // Independent replenishment: English queue remains unaffected
    const pendingEnglish = await prisma.blogTopic.count({ where: { language: BlogLanguage.en } });
    assert.equal(pendingEnglish, 0);

    // Idempotency: re-running does not duplicate
    const secondPass = await queueService.replenishQueueIfLow(10, 15, BlogLanguage.te);
    assert.equal(secondPass, 0);
  });

  it('discoverAndEnqueue: guarantees both languages are replenished even when external sources yield 0', async () => {
    const prisma = createMockPrisma();
    const mockSimilarity = { isLikelyDuplicateTopic: async () => false };
    const queueService = new BlogQueueService(prisma, mockSimilarity);
    const mockDiscovery = {
      discoverForLanguages: async () => [
        { language: BlogLanguage.en, topics: [] },
        { language: BlogLanguage.te, topics: [] },
      ],
      discover: async () => [],
    };
    const mockBilingual = {
      readBilingualSwitch: async () => ({ enabled: true, quota: { te: 2, en: 3 } }),
    };

    const automationService = new BlogAutomationService(
      prisma,
      queueService,
      {},
      {},
      mockBilingual,
      {},
      {},
      mockDiscovery,
    );

    await automationService.discoverAndEnqueue(40);

    const teCount = await prisma.blogTopic.count({ where: { language: BlogLanguage.te } });
    const enCount = await prisma.blogTopic.count({ where: { language: BlogLanguage.en } });

    assert.ok(teCount >= 10, `Telugu topics should be at least 10, got ${teCount}`);
    assert.ok(enCount >= 10, `English topics should be at least 10, got ${enCount}`);
  });

  it('allocateQuota: preserves English-only vs bilingual quotas without cross-language substitution', () => {
    const pending = [
      { topicKey: 'en-1', topic: 'EN Topic 1', language: 'en', createdAt: new Date(100) },
      { topicKey: 'en-2', topic: 'EN Topic 2', language: 'en', createdAt: new Date(200) },
      { topicKey: 'en-3', topic: 'EN Topic 3', language: 'en', createdAt: new Date(300) },
      { topicKey: 'en-4', topic: 'EN Topic 4', language: 'en', createdAt: new Date(400) },
      { topicKey: 'te-1', topic: 'TE Topic 1', language: 'te', createdAt: new Date(100) },
      { topicKey: 'te-2', topic: 'TE Topic 2', language: 'te', createdAt: new Date(200) },
    ];

    // Bilingual mode: 2 Telugu + 3 English
    const bilingualAllocated = allocateQuota(pending, { te: 2, en: 3 });
    assert.equal(bilingualAllocated.filter((t) => t.language === 'te').length, 2);
    assert.equal(bilingualAllocated.filter((t) => t.language === 'en').length, 3);

    // English-only mode: 0 Telugu + 3 English
    const enOnlyAllocated = allocateQuota(pending, { te: 0, en: 3 });
    assert.equal(enOnlyAllocated.filter((t) => t.language === 'te').length, 0);
    assert.equal(enOnlyAllocated.filter((t) => t.language === 'en').length, 3);
  });

  it('generateBilingualBatch: reports deficit without inflating database failures or triggering retries', async () => {
    // Queue with 3 English topics and 0 Telugu topics
    const topics = [
      { id: '1', topicKey: 'en-1', topic: 'Topic 1', language: BlogLanguage.en, attempts: 0, status: TopicStatus.PENDING, categorySlug: 'web', targetLocation: null, referenceSources: [], nextRetryAt: null },
      { id: '2', topicKey: 'en-2', topic: 'Topic 2', language: BlogLanguage.en, attempts: 0, status: TopicStatus.PENDING, categorySlug: 'web', targetLocation: null, referenceSources: [], nextRetryAt: null },
      { id: '3', topicKey: 'en-3', topic: 'Topic 3', language: BlogLanguage.en, attempts: 0, status: TopicStatus.PENDING, categorySlug: 'web', targetLocation: null, referenceSources: [], nextRetryAt: null },
    ];
    const prisma = createMockPrisma({ topics });
    const mockQueue = {
      maxAttempts: 3,
      retryDelayMs: 60000,
      claimTopicById: async (_w, row) => row,
    };
    const batchService = new BlogBatchService(prisma, mockQueue);

    const mockGenerate = async (t) => ({
      id: `post-${t.id}`, title: t.topic, slug: t.topicKey, category: t.categorySlug,
      status: 'PUBLISHED', wordCount: 1200, imagesCount: 1, url: `/${t.topicKey}`, topicKey: t.topicKey,
    });

    const result = await batchService.generateBilingualBatch({ te: 2, en: 3 }, false, 'test-worker', mockGenerate);

    assert.equal(result.results.length, 3, 'Should generate 3 English topics');
    const deficit = result.rejected.find((r) => r.topicKey === 'deficit:te');
    assert.ok(deficit, 'Telugu deficit must be explicitly reported in rejected list');
    assert.match(deficit.detail, /Insufficient pending Telugu topics/);

    // CRITICAL: Deficit telemetry must NOT touch blogTopic table or trigger retries
    const topicCountAfter = await prisma.blogTopic.count({});
    assert.equal(topicCountAfter, 3, 'Deficit must NOT insert phantom rows into blogTopic');
    const anyFailed = topics.some((t) => t.status === TopicStatus.FAILED || t.attempts > 0);
    assert.equal(anyFailed, false, 'Deficit must NOT mark topics failed or increment attempts');
    const anyRetries = topics.some((t) => t.nextRetryAt !== null);
    assert.equal(anyRetries, false, 'Deficit must NOT set nextRetryAt on database records');
  });

  it('duplicate prevention: duplicate topicKey across discovery sources is strictly refused', async () => {
    const prisma = createMockPrisma();
    const mockSimilarity = { isLikelyDuplicateTopic: async () => false };
    const queueService = new BlogQueueService(prisma, mockSimilarity);

    const first = await queueService.enqueueTopic({
      topic: 'గుంటూరులో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?',
      categorySlug: 'website-development',
      language: BlogLanguage.te,
      source: 'curated-rotation',
    });
    assert.equal(first.enqueued, true);

    const second = await queueService.enqueueTopic({
      topic: 'గుంటూరులో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంత అవుతుంది?',
      categorySlug: 'website-development',
      language: BlogLanguage.te,
      source: 'discovery',
    });
    assert.equal(second.enqueued, false);
    assert.equal(second.reason, 'already queued');
  });
});
