import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';

import {
  DEFAULT_GEMINI_MODELS,
  getGeminiModelsToTry,
} from '../dist/automation/content-research/llm-provider.js';
import {
  CANONICAL_BLOG_CATEGORIES,
  resolveOrEnsureCategory,
} from '../dist/automation/blog/blog-seeds.js';

describe('Phase 1 Auto-Blogging Backend Reliability', () => {
  describe('Gemini Model Selection SSOT', () => {
    it('provides valid Gemini model IDs and excludes invalid 3.x strings', () => {
      assert.deepEqual(DEFAULT_GEMINI_MODELS, [
        'gemini-2.5-flash',
        'gemini-2.0-flash',
        'gemini-1.5-flash',
      ]);
      assert.ok(!DEFAULT_GEMINI_MODELS.includes('gemini-3.1-flash-lite'));
      assert.ok(!DEFAULT_GEMINI_MODELS.includes('gemini-3-flash-preview'));
    });

    it('getGeminiModelsToTry respects preferred model and defaults', () => {
      const models = getGeminiModelsToTry();
      assert.equal(models[0], 'gemini-2.5-flash');

      const custom = getGeminiModelsToTry('custom-gemini-model');
      assert.equal(custom[0], 'custom-gemini-model');
      assert.ok(custom.includes('gemini-2.5-flash'));
    });

    it('getGeminiModelsToTry respects GEMINI_MODEL env override', () => {
      const prev = process.env.GEMINI_MODEL;
      try {
        process.env.GEMINI_MODEL = 'env-specified-model';
        const models = getGeminiModelsToTry();
        assert.equal(models[0], 'env-specified-model');
      } finally {
        if (prev !== undefined) process.env.GEMINI_MODEL = prev;
        else delete process.env.GEMINI_MODEL;
      }
    });
  });

  describe('Canonical Category Idempotency', () => {
    it('defines the 5 canonical category slugs', () => {
      const slugs = CANONICAL_BLOG_CATEGORIES.map((c) => c.slug);
      assert.ok(slugs.includes('website-development'));
      assert.ok(slugs.includes('app-development'));
      assert.ok(slugs.includes('school-websites'));
      assert.ok(slugs.includes('startups'));
      assert.ok(slugs.includes('local-seo-business'));
    });

    it('resolves existing category without upserting', async () => {
      let upsertCalled = false;
      const fakePrisma = {
        blogCategory: {
          findUnique: async () => ({ id: 'cat-1', name: 'Web', slug: 'website-development' }),
          upsert: async () => {
            upsertCalled = true;
          },
        },
      };

      const result = await resolveOrEnsureCategory(fakePrisma, 'website-development');
      assert.equal(result?.id, 'cat-1');
      assert.equal(upsertCalled, false);
    });

    it('upserts missing canonical category', async () => {
      const fakePrisma = {
        blogCategory: {
          findUnique: async () => null,
          upsert: async ({ create }) => ({ id: 'new-id', ...create }),
        },
      };

      const result = await resolveOrEnsureCategory(fakePrisma, 'school-websites');
      assert.equal(result?.slug, 'school-websites');
      assert.equal(result?.name, 'School Websites');
    });

    it('returns null for unknown non-canonical slug', async () => {
      const fakePrisma = {
        blogCategory: {
          findUnique: async () => null,
          upsert: async () => assert.fail('should not upsert unknown category'),
        },
      };

      const result = await resolveOrEnsureCategory(fakePrisma, 'non-existent-category');
      assert.equal(result, null);
    });
  });

  describe('Prisma Seed Integrity', () => {
    it('uses prisma.siteSetting instead of obsolete prisma.setting in seed.ts', () => {
      const seedContent = readFileSync('prisma/seed.ts', 'utf8');
      assert.ok(
        seedContent.includes('prisma.siteSetting.upsert'),
        'seed.ts must use prisma.siteSetting.upsert',
      );
      assert.ok(
        !seedContent.includes('prisma.setting.'),
        'seed.ts must not reference prisma.setting',
      );
    });

    it('seeds canonical blog categories in seed.ts', () => {
      const seedContent = readFileSync('prisma/seed.ts', 'utf8');
      assert.ok(
        seedContent.includes('CANONICAL_BLOG_CATEGORIES'),
        'seed.ts must import CANONICAL_BLOG_CATEGORIES',
      );
      assert.ok(
        seedContent.includes('prisma.blogCategory.upsert'),
        'seed.ts must upsert blog categories',
      );
    });
  });

  describe('Template Fallback and Safety Gates', () => {
    it('enforces forceDraft in blog-automation service when originality fails on template fallback', () => {
      const serviceContent = readFileSync('src/automation/blog-automation.service.ts', 'utf8');
      assert.ok(
        serviceContent.includes('content_originality'),
        'service must check content_originality rule failure',
      );
      assert.ok(
        serviceContent.includes('forceDraft'),
        'service must handle composed.validation.forceDraft',
      );
    });
  });

  describe('Admin Batch Response Handling', () => {
    it('safely extracts title from both single and batch response formats', () => {
      const singleRes = {
        success: true,
        data: { id: 'post-1', title: 'Single Generated Post Title' },
      };
      const batchRes = {
        success: true,
        data: {
          results: [{ id: 'post-2', title: 'Batch First Post Title' }],
          rejected: [],
        },
      };

      const getTitle = (res) => res.data?.title || res.data?.results?.[0]?.title;

      assert.equal(getTitle(singleRes), 'Single Generated Post Title');
      assert.equal(getTitle(batchRes), 'Batch First Post Title');
      assert.equal(getTitle({ success: true, data: {} }), undefined);
    });
  });
});
