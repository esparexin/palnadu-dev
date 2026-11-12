import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BlogLanguage, PublishStatus, TopicStatus } from '@prisma/client';
import { createBlogPostSchema } from '@palnadu/validation';
import { siteConfig } from '../../../packages/config/dist/site-config.js';
import { BlogBatchService } from '../dist/automation/blog/blog-batch.service.js';
import { BlogQueueService } from '../dist/automation/blog/blog-queue.service.js';
import { BlogAutomationService } from '../dist/automation/blog-automation.service.js';
import { BlogComposerService } from '../dist/automation/blog/blog-composer.service.js';
import { BlogPublisherService } from '../dist/automation/blog/blog-publisher.service.js';
import { getAllInitialSeeds, CANONICAL_BLOG_CATEGORIES } from '../dist/automation/blog/blog-seeds.js';
import { TELUGU_CURATED_TOPIC_QUEUE } from '../dist/automation/blog/telugu-seeds.js';
import { AutomationController } from '../dist/automation/automation.controller.js';
import { mapLlmDraftToBlogDraft } from '../dist/automation/content-research/draft-mapper.util.js';
import { generateStructuredFallback } from '../dist/automation/content-research/structured-fallback.js';
import { defaultStrategy } from '../dist/automation/seo-strategy.js';
import { validate } from '../dist/automation/seo-validation-rules.js';
import { toTopicKey } from '../dist/automation/topic-identity.js';
import { ImageSourcingService } from '../dist/automation/image-sourcing.service.js';
import { FALLBACK_VAULT } from '../dist/automation/image-vault.js';

function createQueuePrisma(topics = [], posts = []) {
  return {
    blogTopic: {
      findMany: async () => topics,
      findUnique: async ({ where: { topicKey_language } }) =>
        topics.find(
          (t) => t.topicKey === topicKey_language.topicKey && t.language === topicKey_language.language,
        ) ?? null,
      updateMany: async ({ where, data }) => {
        let count = 0;
        for (const t of topics) {
          if (where.id && t.id !== where.id) continue;
          if (where.status?.in && !where.status.in.includes(t.status)) continue;
          if (where.attempts?.lt !== undefined && !(t.attempts < where.attempts.lt)) continue;
          const staleCond = where.OR?.find((c) => c.claimedAt?.lt)?.claimedAt?.lt;
          const leaseOk =
            !t.claimedAt || (staleCond && t.claimedAt < staleCond);
          if (where.OR && !leaseOk) continue;
          Object.assign(t, data);
          count += 1;
        }
        return { count };
      },
    },
    blogPost: {
      findUnique: async ({ where: { topicKey_language } }) =>
        posts.find(
          (p) => p.topicKey === topicKey_language.topicKey && p.language === topicKey_language.language,
        ) ?? null,
    },
  };
}

describe('Category A Blog Automation Regressions', () => {
  it('1. claims exact allocateQuota-selected non-clustered topics instead of oldest clustered FIFO head', async () => {
    const t1Title = 'Website Development Cost in Guntur';
    const t2Title = 'Website Development Guide in Guntur';
    const t3Title = 'School Admission Portal Software in Narasaraopet';
    const topics = [
      { id: 't1', topicKey: toTopicKey(t1Title), topic: t1Title, language: BlogLanguage.en, categorySlug: 'website-development', status: TopicStatus.PENDING, attempts: 0, createdAt: new Date('2026-11-01T01:00:00Z'), claimedAt: null, referenceSources: [] },
      { id: 't2', topicKey: 'website-dev-guide-alt', topic: t2Title, language: BlogLanguage.en, categorySlug: 'website-development', status: TopicStatus.PENDING, attempts: 0, createdAt: new Date('2026-11-01T02:00:00Z'), claimedAt: null, referenceSources: [] },
      { id: 't3', topicKey: toTopicKey(t3Title), topic: t3Title, language: BlogLanguage.en, categorySlug: 'school-websites', status: TopicStatus.PENDING, attempts: 0, createdAt: new Date('2026-11-01T03:00:00Z'), claimedAt: null, referenceSources: [] },
    ];
    const prisma = createQueuePrisma(topics);
    const queue = new BlogQueueService(prisma, { isLikelyDuplicateTopic: async () => false });
    const batch = new BlogBatchService(prisma, queue);
    const claimedIds = [];

    await batch.generateBilingualBatch(
      { te: 0, en: 2 },
      false,
      'worker-batch',
      async (topic) => {
        claimedIds.push(topic.id);
        return { id: `p-${topic.id}`, title: topic.topic, slug: topic.topicKey, category: topic.categorySlug, status: PublishStatus.DRAFT, wordCount: 800, imagesCount: 4, url: `/blog/${topic.topicKey}`, topicKey: topic.topicKey };
      },
    );

    assert.deepEqual(claimedIds, ['t1', 't3']);
    assert.equal(topics[1].status, TopicStatus.PENDING);
  });

  it('2. prevents triggerGenerate manual fallback from selecting wrong-language queued topics', async () => {
    const calls = [];
    const mockAutomation = {
      getPendingQueueItems: async () => [
        { topicKey: 'only-en', topic: 'English Queue Topic Only', categorySlug: 'website-development', targetLocation: 'Guntur', language: BlogLanguage.en, status: 'PENDING', isGenerated: false },
      ],
      generateSingleArticle: async (...args) => {
        calls.push(args);
        return { id: 'p1', wordCount: 800, imagesCount: 4 };
      },
    };
    const controller = new AutomationController(mockAutomation, {}, {});
    await controller.triggerGenerate({ language: 'te' });
    assert.equal(calls.length, 1);
    assert.equal(calls[0][0], TELUGU_CURATED_TOPIC_QUEUE[0].topic);
    assert.equal(calls[0][4], BlogLanguage.te);

    const enCalls = [];
    const teOnlyCtrl = new AutomationController(
      {
        getPendingQueueItems: async () => [
          { topicKey: 'only-te', topic: TELUGU_CURATED_TOPIC_QUEUE[0].topic, categorySlug: 'website-development', targetLocation: 'Guntur', language: BlogLanguage.te, status: 'PENDING', isGenerated: false },
        ],
        generateSingleArticle: async (...args) => (enCalls.push(args), { id: 'p2', wordCount: 800, imagesCount: 4 }),
      },
      {},
      {},
    );
    await teOnlyCtrl.triggerGenerate({});
    assert.equal(enCalls[0][4], BlogLanguage.en);
    assert.notEqual(enCalls[0][0], TELUGU_CURATED_TOPIC_QUEUE[0].topic);
  });

  it('3. enforces CLAIMED atomic lock on generateSingleArticle without clobbering active workers', async () => {
    const lockedTitle = 'Locked Topic Generation Check';
    const activeTopic = {
      id: 'active-1', topicKey: toTopicKey(lockedTitle), topic: lockedTitle, categorySlug: 'website-development',
      language: BlogLanguage.en, status: TopicStatus.CLAIMED, attempts: 0,
      claimedAt: new Date(), claimedBy: 'cron-worker', referenceSources: [], targetLocation: null,
    };
    const prisma = createQueuePrisma([activeTopic]);
    const queue = new BlogQueueService(prisma, { isLikelyDuplicateTopic: async () => false });
    const svc = new BlogAutomationService(prisma, queue, {}, {}, {}, {}, {}, {});

    await assert.rejects(
      () => svc.generateSingleArticle(lockedTitle, 'website-development', undefined, false, BlogLanguage.en),
      /already claimed/i,
    );
    assert.equal(activeTopic.status, TopicStatus.CLAIMED);
    assert.equal(activeTopic.claimedBy, 'cron-worker');
    assert.equal(activeTopic.attempts, 0);
  });

  it('4. emits only Telugu seeds for Telugu replenishment without English topic fallback strings', () => {
    const teSeeds = getAllInitialSeeds(new Set(), BlogLanguage.te);
    assert.equal(teSeeds.length, TELUGU_CURATED_TOPIC_QUEUE.length);
    assert.ok(teSeeds.every((s) => s.language === BlogLanguage.te && /[\u0C00-\u0C7F]/.test(s.topic)));
  });

  it('5 & 6 & 7. enforces language canonical URLs, <=160 seoDescription limit, and preserves Markdown', () => {
    const strategy = defaultStrategy('మెడికల్ క్లినిక్ సాఫ్ట్‌వేర్', 'website-development', 'Guntur', 'te');
    const longDesc = 'A'.repeat(210);
    const mdBody = `## సెక్షన్ 1\n\n**ముఖ్యమైన** అంశం మరియు *ఇటాలిక్* టెక్స్ట్ [Website Development](/services/website-development). ` + 'పదం '.repeat(450);

    const teDraft = mapLlmDraftToBlogDraft({
      llmDraft: {
        title: 'గుంటూర్ క్లినిక్ సాఫ్ట్‌వేర్ గైడ్ మరియు ధరలు',
        slug: 'guntur-clinic-software-guide',
        content: mdBody,
        metaDescription: longDesc,
        seoDescription: longDesc,
      },
      provider: 'gemini:test',
      topicTitle: 'గుంటూర్ క్లినిక్ సాఫ్ట్‌వేర్',
      categorySlug: 'website-development',
      locationContext: 'Guntur',
      strategy,
      writeTelugu: true,
    });

    assert.equal(teDraft.canonicalUrl, `${siteConfig.url}/te/blog/${teDraft.slug}`);
    assert.equal(teDraft.metaDescription.length, 160);
    assert.equal(teDraft.seoDescription.length, 160);
    assert.ok(teDraft.content.includes('**ముఖ్యమైన**'));
    assert.ok(teDraft.content.includes('*ఇటాలిక్*'));

    const zodRes = createBlogPostSchema.pick({ canonicalUrl: true, seoDescription: true }).safeParse({
      canonicalUrl: teDraft.canonicalUrl,
      seoDescription: teDraft.seoDescription,
    });
    assert.equal(zodRes.success, true);

    const composer = new BlogComposerService(null, null, null, null);
    const enriched = composer.enrichContent(teDraft.content, [], teDraft.internalLinks, BlogLanguage.te, teDraft.slug, 'website-development');
    assert.ok(enriched.includes('**ముఖ్యమైన**'));
    assert.ok(enriched.includes('*ఇటాలిక్*'));

    const overLimit = validate({
      topicKey: 'over-desc',
      topic: teDraft.title,
      draft: { ...teDraft, seoDescription: 'X'.repeat(165), metaDescription: 'X'.repeat(165) },
      categorySlug: 'website-development',
      categoryExists: true,
      similarity: { isDuplicate: false, matches: [], nearest: null },
      topicKeyTaken: false,
      existingSlugs: new Set(),
      existingTitles: new Set(),
      wordCount: 500,
      language: 'te',
    });
    assert.equal(overLimit.passed, false);
    assert.ok(overLimit.failures.some((f) => f.name === 'seo_metadata'));

    const fallbackTe = generateStructuredFallback('Custom Portal', 'website-development', 'Guntur', strategy, 'te');
    assert.equal(fallbackTe.canonicalUrl, `${siteConfig.url}/te/blog/${fallbackTe.slug}`);
  });

  it('8. uses authoritative @palnadu/config site origin for IndexNow & publishedUrl', async () => {
    const submitted = [];
    let logData = null;
    const mockPrisma = {
      blogPost: { create: async ({ data }) => ({ id: 'post-te-1', ...data }) },
      blogTopic: { update: async () => ({}) },
      blogGenerationLog: { create: async ({ data }) => (logData = data, {}) },
      notification: { create: async () => ({}) },
    };
    const publisher = new BlogPublisherService(mockPrisma, {
      submitUrls: async (host, urls) => submitted.push({ host, urls }),
    });
    await publisher.persistAndNotify(
      { id: 't', topicKey: 'te-key', topic: 'Telugu Topic', categorySlug: 'website-development', language: BlogLanguage.te, referenceSources: [] },
      { draft: { title: 'Title', slug: 'te-slug', excerpt: 'Ex', seoTitle: 'S', seoDescription: 'D', canonicalUrl: `${siteConfig.url}/te/blog/te-slug`, faq: [], primaryKeyword: 'k', secondaryKeywords: [], relatedKeywords: [], longTailKeywords: [], searchIntent: 'INFORMATIONAL', tags: [], internalLinks: [], externalReferences: [] }, enrichedContent: 'Body', images: [], coverImage: 'https://images.unsplash.com/photo-1', validation: { summary: 'PASS', passed: true, forceDraft: false, failures: [] }, similaritySummary: 'none', llmProvider: 'gemini' },
      'cat-1', 'Website Development', 'author-1', PublishStatus.PUBLISHED, Date.now(),
    );
    assert.equal(logData.publishedUrl, '/te/blog/te-slug');
    assert.equal(submitted[0].host, new URL(siteConfig.url).host);
    assert.deepEqual(submitted[0].urls, [`${siteConfig.url}/te/blog/te-slug`]);
  });

  it('9. provides 4 curated images for all 5 canonical categories including app-development and school-websites', async () => {
    const imgSvc = new ImageSourcingService({ get: () => undefined });
    for (const cat of CANONICAL_BLOG_CATEGORIES) {
      assert.ok(FALLBACK_VAULT[cat.slug]?.length >= 4, `${cat.slug} missing 4 curated images`);
      const imgs = await imgSvc.sourceImagesForArticle('test', cat.slug, 4);
      assert.equal(imgs.length, 4);
    }
    const unknownImgs = await imgSvc.sourceImagesForArticle('test', 'unknown-cat', 4);
    assert.equal(unknownImgs.length, 4);
  });
});
