import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogLanguage, PublishStatus, TopicStatus } from '@prisma/client';
import { BlogAutomationService } from '../dist/automation/blog-automation.service.js';
import { BlogQueueService } from '../dist/automation/blog/blog-queue.service.js';
import { BlogComposerService } from '../dist/automation/blog/blog-composer.service.js';
import { BlogPublisherService } from '../dist/automation/blog/blog-publisher.service.js';
import { BlogBilingualService } from '../dist/automation/blog/blog-bilingual.service.js';
import { BlogStatusService } from '../dist/automation/blog/blog-status.service.js';
import { BlogBatchService } from '../dist/automation/blog/blog-batch.service.js';
import { ContentResearchService } from '../dist/automation/content-research.service.js';
import { ContentSimilarityService } from '../dist/automation/content-similarity.service.js';
import { SeoValidationService } from '../dist/automation/seo-validation.service.js';
import { createFullLifecyclePrisma, validLlmDraftPayload } from './autoblog-e2e-mocks.mjs';

function setupAutomationEnvironment(prisma, submittedUrls = []) {
  const config = { get: (k) => (k === 'GEMINI_API_KEY' ? 'AIzaSyTestKey1234567890abcdef' : undefined) };
  const research = new ContentResearchService(config);
  research.fetchGoogleSuggestions = async () => ['palnadu web software'];
  research.performAiSourceAnalysis = async () => 'Regional architectural and engineering analysis';

  const similarity = new ContentSimilarityService(prisma);
  const validation = new SeoValidationService(prisma);
  const imageService = {
    async sourceImagesForArticle() {
      return [{ url: 'https://images.unsplash.com/photo-1', alt: 'Test', credit: 'Unsplash' }];
    },
  };
  const mockIndexNow = {
    async submitUrls(host, urls) { submittedUrls.push(...urls); return { success: true }; },
  };

  const discovery = {
    async discover() { return []; },
    async discoverTrendingTopics() { return []; },
    async coverageReport() { return { topicsCovered: [], keywordsCovered: [], intentsCovered: 0 }; },
    async sourceStatuses() { return []; },
  };

  const composer = new BlogComposerService(research, imageService, similarity, validation);
  const publisher = new BlogPublisherService(prisma, mockIndexNow);
  const queue = new BlogQueueService(prisma, similarity);
  const bilingual = new BlogBilingualService(prisma);
  const status = new BlogStatusService(prisma, discovery);
  const batch = new BlogBatchService(prisma, queue);

  const automation = new BlogAutomationService(
    prisma, queue, composer, publisher, bilingual, status, batch, discovery,
  );
  return { automation, research, queue, bilingual, status, composer, publisher };
}

describe('Phase 5 Autonomous Publishing Lifecycle End-to-End Gate', () => {
  it('1. executes complete autonomous cron: lock -> bilingual replenish -> claim -> generate -> publish -> index -> telemetry', async () => {
    const prisma = createFullLifecyclePrisma();
    const submittedUrls = [];
    const { automation, research, bilingual } = setupAutomationEnvironment(prisma, submittedUrls);

    await bilingual.setBilingualConfig({ enabled: true, te: 2, en: 3 });

    const origCall = research.generateArticle.bind(research);
    research.generateArticle = async (topic, cat, loc, strat, lang, opts) => {
      return origCall(topic, cat, loc, strat, lang, {
        ...opts,
        fetchFn: async () => ({
          ok: true, status: 200, headers: new Headers(),
          json: async () => ({ candidates: [{ content: { parts: [{ text: validLlmDraftPayload(lang) }] } }] }),
        }),
      });
    };

    const result = await automation.runDailyAutomation('cron', false);

    assert.equal(result.skipped, false);
    assert.equal(result.status, 'COMPLETED');
    assert.equal(result.generatedCount, 5);
    assert.equal(result.rejectedCount, 0);

    const posts = Array.from(prisma.store.posts.values());
    assert.equal(posts.length, 5);
    assert.equal(posts.filter((p) => p.language === BlogLanguage.te).length, 2);
    assert.equal(posts.filter((p) => p.language === BlogLanguage.en).length, 3);
    assert.ok(posts.every((p) => p.status === PublishStatus.PUBLISHED));
    assert.ok(submittedUrls.length >= 5);

    for (const post of posts) {
      const topic = prisma.store.topics.get(`${post.topicKey}:${post.language}`);
      assert.ok(topic);
      assert.equal(topic.status, TopicStatus.COMPLETED);
      assert.equal(topic.postId, post.id);
      assert.equal(topic.claimedAt, null);
      assert.equal(topic.claimedBy, null);
    }

    assert.equal(prisma.store.logs.length, 5);
    assert.equal(prisma.store.notifications.length, 5);

    const status = await automation.getStatus();
    assert.equal(status.statistics.totalPosts, 5);
    assert.equal(status.queueHealth.staleInFlight.total, 0);
  });

  it('2. guarantees mutual exclusion: active claim (< 5m) cannot be stolen; expired claim (> 5m) reclaims safely', async () => {
    const prisma = createFullLifecyclePrisma();
    const { queue } = setupAutomationEnvironment(prisma);

    const topic = await prisma.blogTopic.create({
      data: {
        topicKey: 'active-lease-topic',
        topic: 'Active Lease Topic',
        language: BlogLanguage.en,
        categorySlug: 'website-development',
        status: TopicStatus.PENDING,
      },
    });

    const claimed1 = await queue.claimTopicById('worker-alpha', topic, 5);
    assert.ok(claimed1);
    assert.equal(claimed1.status, TopicStatus.CLAIMED);
    assert.equal(prisma.store.topics.get('active-lease-topic:en').claimedBy, 'worker-alpha');

    // Worker beta attempts to steal active lease (< 5 min)
    const claimedByBeta = await queue.claimTopicById('worker-beta', topic, 5);
    assert.equal(claimedByBeta, null);

    // Simulate worker-alpha crashing and claim becoming stale (> 5 min)
    const storeTopic = prisma.store.topics.get('active-lease-topic:en');
    storeTopic.claimedAt = new Date(Date.now() - 6 * 60 * 1000);

    const reclaimedByBeta = await queue.claimTopicById('worker-beta', storeTopic, 5);
    assert.ok(reclaimedByBeta);
    assert.equal(reclaimedByBeta.status, TopicStatus.CLAIMED);
    assert.equal(prisma.store.topics.get('active-lease-topic:en').claimedBy, 'worker-beta');
  });

  it('3. handles model 503 fallback and sets honest retry cooldown on transient failure', async () => {
    const prisma = createFullLifecyclePrisma();
    const { automation, research } = setupAutomationEnvironment(prisma);

    await prisma.blogTopic.create({
      data: {
        topicKey: 'failing-topic',
        topic: 'Failing Topic',
        language: BlogLanguage.en,
        categorySlug: 'website-development',
        status: TopicStatus.PENDING,
      },
    });

    // Mock research to fail with temporary provider error
    research.generateArticle = async () => {
      throw new Error('LLM generation failed [MODEL_OVERLOADED]: 503 high demand; topic remains retryable.');
    };

    const batchRes = await automation.generateBatch(1, false, 'test-worker');
    assert.equal(batchRes.results.length, 0);
    assert.equal(batchRes.rejected.length, 1);
    assert.equal(batchRes.rejected[0].reason, 'generation_failed');

    const failedTopic = prisma.store.topics.get('failing-topic:en');
    assert.equal(failedTopic.status, TopicStatus.PENDING);
    assert.equal(failedTopic.attempts, 1);
    assert.ok(failedTopic.nextRetryAt !== null);
    assert.match(failedTopic.lastError, /MODEL_OVERLOADED/);
    assert.equal(failedTopic.claimedAt, null);
    assert.equal(failedTopic.claimedBy, null);
  });

  it('4. refuses cross-table semantic near-duplicates but accepts legitimate regional variants', async () => {
    const prisma = createFullLifecyclePrisma();
    const { queue } = setupAutomationEnvironment(prisma);

    await queue.enqueueTopic({
      topic: 'Custom Enterprise Web Platforms in Guntur',
      categorySlug: 'website-development',
      language: BlogLanguage.en,
    });

    // Semantic near-duplicate in same location with same intent
    const nearDup = await queue.enqueueTopic({
      topic: 'Custom Enterprise Web Software in Guntur',
      categorySlug: 'website-development',
      language: BlogLanguage.en,
    });
    assert.equal(nearDup.enqueued, false);
    assert.match(nearDup.reason, /already queued/);

    // Legitimate regional variant in Narasaraopet must be allowed
    const regionalVariant = await queue.enqueueTopic({
      topic: 'Custom Enterprise Web Platforms in Narasaraopet',
      categorySlug: 'website-development',
      language: BlogLanguage.en,
    });
    assert.equal(regionalVariant.enqueued, true);
  });
});
