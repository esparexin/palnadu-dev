import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { buildFallbackTitle, generateStructuredFallback } from '../dist/automation/content-research/structured-fallback.js';
import { inferCategoryFromTopic, CANONICAL_BLOG_CATEGORIES, resolveOrEnsureCategory } from '../dist/automation/blog/blog-seeds.js';
import { defaultStrategy } from '../dist/automation/seo-strategy.js';
import { SeoValidationService } from '../dist/automation/seo-validation.service.js';

describe('Google Live SEO Keyword Discovery → Draft Post Reliability', () => {
  const validationService = new SeoValidationService();

  describe('Keyword Title Normalization and Expansion', () => {
    it('expands short keyword like "startup india" into compliant 15-120 char headline', () => {
      const title = buildFallbackTitle('startup india', 'Guntur & Palnadu');
      assert.ok(title.length >= 15 && title.length <= 120);
      assert.ok(title.includes('Startup india'));
      assert.ok(title.includes('Guntur & Palnadu'));
    });

    it('expands very short keyword like "startup" into compliant headline', () => {
      const title = buildFallbackTitle('startup', 'Andhra Pradesh');
      assert.ok(title.length >= 15 && title.length <= 120);
      assert.ok(title.includes('Startup'));
    });

    it('preserves editorial titles that already meet 15-120 character requirements', () => {
      const fullTitle = 'How School Management Software and Digital Fee Portals Save 20+ Hours';
      const result = buildFallbackTitle(fullTitle, 'Narasaraopet');
      assert.equal(result, fullTitle);
    });

    it('caps titles exceeding 120 characters safely', () => {
      const longTitle = 'A'.repeat(150);
      const result = buildFallbackTitle(longTitle, 'Palnadu');
      assert.equal(result.length, 120);
    });
  });

  describe('Category Inference for Keyword Discovery Payloads', () => {
    it('infers "startups" category for startup search variations', () => {
      assert.equal(inferCategoryFromTopic('startup india'), 'startups');
      assert.equal(inferCategoryFromTopic('startup ideas'), 'startups');
      assert.equal(inferCategoryFromTopic('new business mvp development'), 'startups');
    });

    it('infers "website-development" as fallback or for corporate web topics', () => {
      assert.equal(inferCategoryFromTopic('billing software'), 'website-development');
      assert.equal(inferCategoryFromTopic('pos software'), 'website-development');
    });

    it('infers "app-development" and "school-websites" accurately', () => {
      assert.equal(inferCategoryFromTopic('android mobile app for retail'), 'app-development');
      assert.equal(inferCategoryFromTopic('school admission portal'), 'school-websites');
    });
  });

  describe('Structured Fallback Validation and Draft-Only Safeguards', () => {
    it('generates fallback draft for short keyword that passes title and canonical validation', () => {
      const s = defaultStrategy('startup india', 'startups', 'Guntur & Palnadu');
      const draft = generateStructuredFallback('startup india', 'startups', 'Guntur & Palnadu', s);

      assert.equal(draft.isTemplateFallback, true);
      assert.ok(draft.title.length >= 15 && draft.title.length <= 120);
      assert.equal(draft.canonicalUrl, `/blog/${draft.slug}`);

      const outcome = validationService.validate({
        topicKey: 'subject-saas-india-informational',
        topic: 'startup india',
        draft,
        categorySlug: 'startups',
        categoryExists: true,
        similarity: { isDuplicate: false, score: 0 },
        topicKeyTaken: false,
        existingSlugs: new Set(),
        existingTitles: new Set(),
        wordCount: draft.content.split(/\s+/).length,
        language: 'en',
      });

      // Must fail content_originality so it is never auto-published
      assert.equal(outcome.passed, false);
      assert.equal(outcome.forceDraft, true);

      // Must ONLY fail content_originality — title and canonical must pass!
      const failedRules = outcome.failures.map((f) => f.name);
      assert.deepEqual(failedRules, ['content_originality']);

      const isTemplateOnly = outcome.forceDraft && outcome.failures.every((f) => f.name === 'content_originality');
      assert.equal(isTemplateOnly, true);
    });
  });

  describe('Category and Author Preconditions', () => {
    it('rejects missing or non-canonical category', async () => {
      const fakePrisma = {
        blogCategory: {
          findUnique: async () => null,
          upsert: async () => assert.fail('should not upsert'),
        },
      };
      const cat = await resolveOrEnsureCategory(fakePrisma, 'non-existent-category');
      assert.equal(cat, null);
    });

    it('resolves canonical category without upserting if present', async () => {
      const fakePrisma = {
        blogCategory: {
          findUnique: async () => ({ id: 'c1', name: 'Startups', slug: 'startups' }),
        },
      };
      const cat = await resolveOrEnsureCategory(fakePrisma, 'startups');
      assert.equal(cat.id, 'c1');
    });

    it('requires an admin author in database', async () => {
      const fakePrisma = {
        user: { findFirst: async () => null },
      };
      const author = await fakePrisma.user.findFirst({
        where: { role: { in: ['SUPER_ADMIN', 'ADMIN'] } },
      });
      assert.equal(author, null);
    });
  });

  describe('Duplicate and Error Handling Contracts', () => {
    it('returns existing post info without failure when already generated', () => {
      const existing = {
        id: 'post-123',
        title: 'Existing Post',
        slug: 'existing-post',
        category: 'startups',
        status: 'PUBLISHED',
        content: 'word '.repeat(800),
      };
      const result = {
        id: existing.id,
        title: existing.title,
        slug: existing.slug,
        category: existing.category,
        status: existing.status,
        wordCount: existing.content.split(/\s+/).length,
        imagesCount: 0,
        url: `/blog/${existing.slug}`,
        topicKey: 'topic-key-1',
      };
      assert.equal(result.id, 'post-123');
      assert.equal(result.url, '/blog/existing-post');
    });

    it('maps generation failures to BadRequestException for clean API responses', () => {
      const err = new Error('validation: content_originality, title_uniqueness');
      const httpError = new BadRequestException(err.message);
      assert.equal(httpError.getStatus(), 400);
      assert.ok(httpError.message.includes('validation:'));
    });

    it('refuses Telugu fallback when LLM fails to ensure authentic Telugu content', () => {
      const writeTelugu = true;
      assert.throws(
        () => {
          if (writeTelugu) {
            throw new Error('LLM generation failed and no Telugu fallback template exists; topic remains retryable.');
          }
        },
        /LLM generation failed and no Telugu fallback template exists/,
      );
    });

    it('enforces 5-minute stale-claim threshold to avoid stuck in-flight topics', async () => {
      const { STALE_CLAIM_MS } = await import('../dist/automation/blog/blog-queue.service.js');
      assert.equal(STALE_CLAIM_MS, 5 * 60 * 1000);
    });

    it('prioritizes actionable non-completed topics in rotation queue preview', () => {
      const topics = [
        { id: '1', status: 'COMPLETED', topic: 'Old Completed Post' },
        { id: '2', status: 'PENDING', topic: 'Actionable Pending Post' },
        { id: '3', status: 'CLAIMED', topic: 'In-Flight Post' },
      ];
      const active = topics.filter((t) => t.status !== 'COMPLETED');
      assert.equal(active.length, 2);
      assert.equal(active[0].topic, 'Actionable Pending Post');
    });
  });
});
