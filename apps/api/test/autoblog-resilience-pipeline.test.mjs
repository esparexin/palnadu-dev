import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Logger } from '@nestjs/common';
import { BlogLanguage, PublishStatus, TopicStatus } from '@prisma/client';
import { ContentResearchService } from '../dist/automation/content-research.service.js';
import { GeminiKeyStoreService } from '../dist/automation/gemini-verification/gemini-key-store.service.js';
import { GeminiKeyVerificationService } from '../dist/automation/gemini-verification/gemini-verification.service.js';
import { BlogBatchService } from '../dist/automation/blog/blog-batch.service.js';
import { BlogQueueService } from '../dist/automation/blog/blog-queue.service.js';
import { BlogComposerService } from '../dist/automation/blog/blog-composer.service.js';
import { BlogPublisherService } from '../dist/automation/blog/blog-publisher.service.js';
import { BlogAutomationService } from '../dist/automation/blog-automation.service.js';
import { validate } from '../dist/automation/seo-validation-rules.js';
import { createMockPrisma } from './gemini-test-mocks.mjs';

const noopSleep = async () => {};

function validLlmDraftPayload(language = 'en') {
  const isTe = language === 'te';
  const body = isTe
    ? Array.from({ length: 16 }, () => 'గుంటూర్ మరియు పల్నాడు వ్యాపారాల కోసం వెబ్ మరియు మొబైల్ సాఫ్ట్‌వేర్ నిర్మాణం గురించి సమగ్ర వివరాలు. ').join('') +
      '\n\n## 1. సాంకేతిక నిర్మాణం\n\nమా [మొబైల్ యాప్ సేవలు](/services/mobile-app-development) చూడండి.\n\n## 2. అమలు విధానం\n\nసంప్రదించండి [సంప్రదింపు పేజీ](/contact).'
    : Array.from({ length: 58 }, () => 'Modern enterprise web engineering in Guntur and Palnadu removes manual operational bottlenecks across teams. ').join('') +
      '\n\n## Architecture Blueprint\n\nExplore our [Website Development](/services/website-development) engineering practice.\n\n## Regional Rollout\n\nReach out via [Contact Us](/contact).';
  return JSON.stringify({
    title: isTe
      ? 'గుంటూర్ వ్యాపారాల కోసం ఆధునిక వెబ్ సాఫ్ట్‌వేర్ గైడ్'
      : 'Custom Enterprise Web Platforms for Growing Guntur Businesses',
    slug: isTe ? 'guntur-business-web-software-guide-te' : 'custom-enterprise-web-platforms-guntur',
    h1: isTe ? 'గుంటూర్ వ్యాపారాల వెబ్ సాఫ్ట్‌వేర్ గైడ్' : 'Custom Enterprise Web Platforms in Guntur',
    excerpt: 'Engineering blueprint for fast regional software delivery.',
    content: body,
    metaTitle: 'Enterprise Web Platforms | Palnadu.dev',
    metaDescription: 'Practical engineering guide on building custom web platforms in Guntur and Palnadu.',
    primaryKeyword: isTe ? 'వెబ్ సాఫ్ట్‌వేర్' : 'enterprise web platforms',
    secondaryKeywords: [isTe ? 'గుంటూర్ టెక్నాలజీ' : 'guntur software'],
    h2Headings: isTe ? ['సాంకేతిక నిర్మాణం', 'అమలు విధానం'] : ['Architecture Blueprint', 'Regional Rollout'],
    internalLinks: [
      { anchor: isTe ? 'మొబైల్ యాప్ సేవలు' : 'Website Development', url: isTe ? '/services/mobile-app-development' : '/services/website-development' },
      { anchor: isTe ? 'సంప్రదింపు పేజీ' : 'Contact Us', url: '/contact' },
    ],
    faq: [{ q: 'How long does MVP delivery take?', a: 'Typically 4 to 6 weeks.' }],
  });
}

describe('Phase 6 Auto-Blogging Protection, Key Priority & Backlink Gate', () => {
  it('7 & 8. prioritizes verified DB key over env key and falls back to env when no DB key active', async () => {
    const prisma = createMockPrisma();
    const verifier = new GeminiKeyVerificationService();
    const keyStore = new GeminiKeyStoreService(prisma, {
      verifyKey: (k, o) =>
        verifier.verifyKey(k, {
          ...o,
          fetchFn: async (u) => ({
            ok: true,
            status: 200,
            headers: new Headers(),
            json: async () =>
              u.includes('/models?')
                ? { models: [{ name: 'models/gemini-3.8-flash', supportedGenerationMethods: ['generateContent'] }] }
                : { candidates: [{ content: { parts: [{ text: 'OK' }] } }] },
          }),
          retry: { maxRetries: 0, sleepFn: noopSleep },
        }),
    });

    const prevEnvKey = process.env.GEMINI_API_KEY;
    const envFallbackKey = 'AIzaSyEnvFallbackKey1234567890abcd';
    process.env.GEMINI_API_KEY = envFallbackKey;
    try {
      const configSvc = { get: (k) => (k === 'GEMINI_API_KEY' ? envFallbackKey : undefined) };
      const research = new ContentResearchService(configSvc, keyStore);

      // Case 8: no active DB key -> falls back to env key
      assert.equal(await research.resolveGeminiKey(), envFallbackKey);

      // Case 7: activated DB key overrides env key immediately
      const dbKey = 'AIzaSyDatabasePriorityKey9876543210';
      await keyStore.activateKey(dbKey, 'admin@palnadu.dev', 'gemini-3.8-flash');
      assert.equal(await research.resolveGeminiKey(), dbKey);
    } finally {
      if (prevEnvKey === undefined) delete process.env.GEMINI_API_KEY;
      else process.env.GEMINI_API_KEY = prevEnvKey;
    }
  });

  it('2 & 12 & 14. generates EN and TE articles with 503 fallback, rejects static template on total failure, and redacts secrets', async () => {
    const secretKey = 'AIzaSyLiveBlogGenerationKey123456789';
    const research = new ContentResearchService({ get: (k) => (k === 'GEMINI_API_KEY' ? secretKey : undefined) });
    research.fetchGoogleSuggestions = async () => ['guntur software cost'];

    // EN succeeds on fallback gemini-3.6-flash after primary 503
    const enDraft = await research.generateArticle('Enterprise Web Platforms in Guntur', 'website-development', 'Guntur', undefined, BlogLanguage.en, {
      retry: { maxRetries: 0, sleepFn: noopSleep },
      fetchFn: async (url) => {
        if (url.includes('gemini-3.8-flash')) {
          return { ok: false, status: 503, headers: new Headers(), json: async () => ({ error: { status: 'UNAVAILABLE', message: `High demand for key=${secretKey}` } }) };
        }
        return { ok: true, status: 200, headers: new Headers(), json: async () => ({ candidates: [{ content: { parts: [{ text: validLlmDraftPayload('en') }] } }] }) };
      },
    });
    assert.equal(enDraft.isTemplateFallback, false);
    assert.equal(enDraft.llmProvider, 'gemini:gemini-3.6-flash');

    // TE succeeds via live Gemini
    const teDraft = await research.generateArticle('గుంటూర్ వెబ్ సాఫ్ట్‌వేర్', 'app-development', 'Guntur', undefined, BlogLanguage.te, {
      retry: { maxRetries: 0, sleepFn: noopSleep },
      fetchFn: async () => ({ ok: true, status: 200, headers: new Headers(), json: async () => ({ candidates: [{ content: { parts: [{ text: validLlmDraftPayload('te') }] } }] }) }),
    });
    assert.equal(teDraft.isTemplateFallback, false);

    // Total failure throws safe error without silent template fallback or leaked secret
    await assert.rejects(
      () =>
        research.generateArticle('Failing Topic', 'website-development', 'Guntur', undefined, BlogLanguage.en, {
          retry: { maxRetries: 0, sleepFn: noopSleep },
          fetchFn: async () => ({ ok: false, status: 503, headers: new Headers(), json: async () => ({ error: { status: 'UNAVAILABLE', message: `overload with key=${secretKey}` } }) }),
        }),
      (err) => {
        assert.match(err.message, /LLM generation failed \[MODEL_OVERLOADED\]/);
        assert.equal(err.message.includes(secretKey), false);
        return true;
      },
    );
  });

  it('10. batch scheduler continues processing next topic when first topic fails generation', async () => {
    const topics = [
      { id: 't1', topicKey: 'topic-fail', topic: 'Fail First', language: BlogLanguage.en, categorySlug: 'website-development', status: TopicStatus.PENDING, attempts: 0, nextRetryAt: null, claimedAt: null },
      { id: 't2', topicKey: 'topic-ok', topic: 'Succeed Second', language: BlogLanguage.en, categorySlug: 'website-development', status: TopicStatus.PENDING, attempts: 0, nextRetryAt: null, claimedAt: null },
    ];
    let claimIdx = 0;
    const mockPrisma = {
      blogTopic: {
        async update({ where: { topicKey_language: { topicKey } }, data }) {
          const t = topics.find((x) => x.topicKey === topicKey);
          t.attempts += 1;
          t.status = data.status;
          t.nextRetryAt = data.nextRetryAt;
          t.claimedAt = data.claimedAt;
          t.lastError = data.lastError;
          return t;
        },
      },
    };
    const mockQueue = {
      maxAttempts: 5,
      retryDelayMs: 60000,
      async claimNextTopic() {
        const next = topics[claimIdx++];
        return next ? { ...next, status: TopicStatus.CLAIMED } : null;
      },
    };
    const batch = new BlogBatchService(mockPrisma, mockQueue);
    const out = await batch.generateBatch(2, false, 'worker-test', async (topic) => {
      if (topic.topicKey === 'topic-fail') throw new Error('LLM generation failed [MODEL_OVERLOADED]: High demand');
      topic.status = TopicStatus.COMPLETED;
      return { id: 'p2', title: topic.topic, slug: 'succeed-second', category: 'Web', status: PublishStatus.PUBLISHED, wordCount: 900, imagesCount: 1, url: '/blog/succeed-second', topicKey: topic.topicKey };
    });

    assert.equal(out.results.length, 1);
    assert.equal(out.results[0].topicKey, 'topic-ok');
    assert.equal(out.rejected.length, 1);
    assert.equal(out.rejected[0].topicKey, 'topic-fail');
    assert.equal(topics[0].status, TopicStatus.PENDING);
    assert.equal(topics[0].attempts, 1);
    assert.ok(topics[0].nextRetryAt instanceof Date);
    assert.equal(topics[0].claimedAt, null);
  });

  it('11 & 13. retry stays idempotent without duplicates and enforces mandatory internal backlinks', async () => {
    const existingPost = {
      id: 'post-101',
      title: 'Already Created Article',
      slug: 'already-created',
      content: 'Words '.repeat(400),
      status: PublishStatus.PUBLISHED,
      language: BlogLanguage.en,
      topicKey: 'idempotent-topic',
      imageMetadata: [],
    };
    let composeCalled = false;
    let topicStatusAfter = null;
    const mockPrisma = {
      blogCategory: { findUnique: async () => ({ id: 'cat-1', name: 'Web', slug: 'website-development' }) },
      user: { findFirst: async () => ({ id: 'admin-1', role: 'ADMIN' }) },
      blogPost: { findUnique: async () => existingPost, findMany: async () => [] },
      blogTopic: {
        update: async ({ data }) => {
          topicStatusAfter = data.status;
          return data;
        },
      },
    };
    const composer = {
      composeArticle: async () => {
        composeCalled = true;
        return null;
      },
    };
    const autoSvc = new BlogAutomationService(mockPrisma, new BlogQueueService(mockPrisma), composer, new BlogPublisherService(mockPrisma), null, null, null, null);
    const res = await autoSvc.generateForTopic({
      id: 'top-1',
      topicKey: 'idempotent-topic',
      topic: 'Already Created',
      categorySlug: 'website-development',
      targetLocation: null,
      referenceSources: [],
      status: TopicStatus.CLAIMED,
      language: BlogLanguage.en,
    });
    assert.equal(composeCalled, false);
    assert.equal(res.id, 'post-101');
    assert.equal(topicStatusAfter, TopicStatus.COMPLETED);

    // Backlink enrichment & mandatory publishing gate check
    const rawDraft = JSON.parse(validLlmDraftPayload('en'));
    const realComposer = new BlogComposerService(null, null, null, null);
    const enriched = realComposer.enrichContent(rawDraft.content, [], rawDraft.internalLinks, BlogLanguage.en, rawDraft.slug, 'website-development');
    const baseCheck = {
      topic: rawDraft.title,
      categorySlug: 'website-development',
      categoryExists: true,
      similarity: { isDuplicate: false },
      topicKeyTaken: false,
      existingSlugs: new Set(),
      existingTitles: new Set(),
      language: 'en',
    };
    const draftBase = { ...rawDraft, searchIntent: 'INFORMATIONAL', isTemplateFallback: false, canonicalUrl: `https://www.palnadu.dev/blog/${rawDraft.slug}`, seoTitle: rawDraft.metaTitle, seoDescription: rawDraft.metaDescription };
    const validation = validate({ ...baseCheck, topicKey: 'backlink-check', draft: { ...draftBase, content: enriched }, wordCount: enriched.split(/\s+/).length });
    assert.equal(validation.passed, true, validation.summary);

    const noLinksContent = enriched.replace(/\[[^\]]+\]\(\/[^)]+\)/g, 'plain text');
    const failedValidation = validate({ ...baseCheck, topicKey: 'backlink-check-missing', draft: { ...draftBase, content: noLinksContent, internalLinks: [] }, wordCount: noLinksContent.split(/\s+/).length });
    assert.equal(failedValidation.passed, false);
    assert.equal(failedValidation.failures.some((f) => f.name === 'internal_links'), true);
  });
});
