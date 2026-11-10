import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CANONICAL_CATEGORY_INTERNAL_LINKS,
  getCategoryInternalLinks,
} from '../dist/automation/blog/blog-seeds.js';
import { defaultStrategy } from '../dist/automation/seo-strategy.js';
import { validate } from '../dist/automation/seo-validation-rules.js';
import { BlogComposerService } from '../dist/automation/blog/blog-composer.service.js';
import { BlogLanguage } from '@prisma/client';

describe('Phase 2 Auto-Blogging Internal Backlinks Remediation', () => {
  describe('Canonical Category Link Mapping SSOT', () => {
    it('provides relevant canonical service links for each category', () => {
      const appLinks = getCategoryInternalLinks('app-development', 'en');
      assert.ok(appLinks.some((l) => l.url === '/services/android-app-development'));
      assert.ok(appLinks.some((l) => l.url === '/services/mobile-app-development'));

      const startupLinks = getCategoryInternalLinks('startups', 'en');
      assert.ok(startupLinks.some((l) => l.url === '/services/mvp-development'));
      assert.ok(startupLinks.some((l) => l.url === '/services/idea-validation'));

      const seoLinks = getCategoryInternalLinks('local-seo-business', 'en');
      assert.ok(seoLinks.some((l) => l.url === '/services/seo-aeo-geo'));
      assert.ok(seoLinks.some((l) => l.url === '/services/digital-marketing'));

      const schoolLinks = getCategoryInternalLinks('school-websites', 'en');
      assert.ok(schoolLinks.some((l) => l.url === '/services/website-development'));
      assert.ok(schoolLinks.some((l) => l.url === '/services/business-automation'));
    });

    it('enforces script discipline for Telugu internal link anchors', () => {
      const teLinks = getCategoryInternalLinks('app-development', 'te');
      assert.ok(teLinks.length > 0);
      assert.ok(teLinks.every((l) => l.url.startsWith('/')));
      // Telugu anchor should contain Telugu script characters
      assert.ok(teLinks.some((l) => /[\u0C00-\u0C7F]/.test(l.anchor)));
    });

    it('all mapped internal URLs are valid canonical site-relative paths', () => {
      for (const [category, locales] of Object.entries(CANONICAL_CATEGORY_INTERNAL_LINKS)) {
        for (const [locale, links] of Object.entries(locales)) {
          assert.ok(links.length >= 2, `${category} (${locale}) should have at least 2 links`);
          for (const link of links) {
            assert.ok(link.url.startsWith('/'), `URL "${link.url}" must be site-relative`);
            assert.ok(!link.url.includes('//'), `URL "${link.url}" must not contain double slashes`);
            assert.ok(link.anchor.trim().length > 0, 'Anchor text must not be empty');
          }
        }
      }
    });
  });

  describe('SEO Strategy Integration', () => {
    it('defaultStrategy attaches category-aligned internal links', () => {
      const strategyEn = defaultStrategy('Building SaaS MVPs', 'startups', 'Guntur', 'en');
      assert.ok(strategyEn.internalLinks.some((l) => l.url === '/services/mvp-development'));

      const strategyTe = defaultStrategy('మొబైల్ యాప్ డెవలప్‌మెంట్', 'app-development', 'Guntur', 'te');
      assert.ok(strategyTe.internalLinks.some((l) => l.url === '/services/android-app-development'));
      assert.ok(strategyTe.internalLinks.some((l) => /[\u0C00-\u0C7F]/.test(l.anchor)));
    });
  });

  describe('Validation Rule Safeguards', () => {
    function baseDraft(overrides = {}) {
      return {
        isTemplateFallback: false,
        title: 'Enterprise Architecture & Cloud Systems in Guntur',
        slug: 'enterprise-architecture-cloud-systems-guntur',
        h1: 'Enterprise Architecture & Cloud Systems',
        content: 'This guide covers enterprise systems. ' + 'word '.repeat(700),
        metaTitle: 'Enterprise Architecture in Guntur | Palnadu.dev',
        metaDescription: 'A complete guide to enterprise architecture, cloud systems, and database scaling.',
        seoTitle: 'Enterprise Architecture in Guntur | Palnadu.dev',
        seoDescription: 'A complete guide to enterprise architecture and cloud systems.',
        canonicalUrl: '/blog/enterprise-architecture-cloud-systems-guntur',
        primaryKeyword: 'enterprise architecture',
        secondaryKeywords: ['cloud systems'],
        searchIntent: 'INFORMATIONAL',
        h2Headings: ['Architecture Overview', 'Implementation Steps'],
        internalLinks: [{ anchor: 'Web Development', url: '/services/web-development' }],
        faq: [],
        ...overrides,
      };
    }

    it('rejects empty internal links array', () => {
      const outcome = validate({
        topicKey: 'test-topic',
        topic: 'Test Topic',
        draft: baseDraft({ internalLinks: [] }),
        categorySlug: 'website-development',
        categoryExists: true,
        similarity: { nearest: null, isDuplicate: false, matches: [] },
        topicKeyTaken: false,
        existingSlugs: new Set(),
        existingTitles: new Set(),
        wordCount: 720,
        language: 'en',
      });
      assert.equal(outcome.passed, false);
      assert.ok(outcome.failures.some((f) => f.name === 'internal_links'));
    });

    it('rejects self-referencing internal links', () => {
      const draft = baseDraft({
        internalLinks: [
          { anchor: 'Self', url: '/blog/enterprise-architecture-cloud-systems-guntur' },
        ],
      });
      const outcome = validate({
        topicKey: 'test-topic',
        topic: 'Test Topic',
        draft,
        categorySlug: 'website-development',
        categoryExists: true,
        similarity: { nearest: null, isDuplicate: false, matches: [] },
        topicKeyTaken: false,
        existingSlugs: new Set(),
        existingTitles: new Set(),
        wordCount: 720,
        language: 'en',
      });
      assert.equal(outcome.passed, false);
      assert.ok(outcome.failures.some((f) => f.name === 'internal_links'));
    });

    it('passes with valid, site-relative internal links', () => {
      const draft = baseDraft();
      const outcome = validate({
        topicKey: 'test-topic',
        topic: 'Test Topic',
        draft,
        categorySlug: 'website-development',
        categoryExists: true,
        similarity: { nearest: null, isDuplicate: false, matches: [] },
        topicKeyTaken: false,
        existingSlugs: new Set(),
        existingTitles: new Set(),
        wordCount: 720,
        language: 'en',
      });
      assert.equal(outcome.passed, true);
    });
  });

  describe('Content Enrichment Contextual Linking', () => {
    it('appends missing internal links naturally into markdown content', () => {
      const composer = new BlogComposerService(null, null, null, null);
      const raw = '## 1. Intro\n\nSome introductory content here.\n\n## 2. Details\n\nMore details.';
      const links = [
        { anchor: 'Custom Software', url: '/services/custom-software' },
        { anchor: 'Contact Us', url: '/contact' },
      ];

      const enriched = composer.enrichContent(raw, [], links, BlogLanguage.en);
      assert.ok(enriched.includes('/services/custom-software'));
      assert.ok(enriched.includes('/contact'));
      assert.ok(enriched.includes('## Related Solutions & Next Steps'));
    });

    it('does not duplicate links if already present in content', () => {
      const composer = new BlogComposerService(null, null, null, null);
      const raw = 'Visit our [Custom Software](/services/custom-software) page and [Contact Us](/contact).';
      const links = [
        { anchor: 'Custom Software', url: '/services/custom-software' },
        { anchor: 'Contact Us', url: '/contact' },
      ];

      const enriched = composer.enrichContent(raw, [], links, BlogLanguage.en);
      assert.ok(!enriched.includes('## Related Solutions & Next Steps'));
    });

    it('uses Telugu heading and intro for Telugu drafts', () => {
      const composer = new BlogComposerService(null, null, null, null);
      const raw = '## 1. పరిచయం\n\nవివరాలు ఇక్కడ ఉన్నాయి.';
      const links = [
        { anchor: 'మొబైల్ యాప్ సేవలు', url: '/services/mobile-app-development' },
      ];

      const enriched = composer.enrichContent(raw, [], links, BlogLanguage.te);
      assert.ok(enriched.includes('/services/mobile-app-development'));
      assert.ok(enriched.includes('సంబంధిత సాంకేతిక సేవలు'));
    });
  });
});
