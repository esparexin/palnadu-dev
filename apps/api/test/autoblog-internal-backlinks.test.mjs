import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  CANONICAL_CATEGORY_INTERNAL_LINKS,
  getCategoryInternalLinks,
} from '../dist/automation/blog/blog-seeds.js';
import { defaultStrategy } from '../dist/automation/seo-strategy.js';
import { validate } from '../dist/automation/seo-validation-rules.js';
import { BlogComposerService } from '../dist/automation/blog/blog-composer.service.js';
import { BlogPublisherService } from '../dist/automation/blog/blog-publisher.service.js';
import {
  validateArticleBacklinks,
  VALID_INTERNAL_DESTINATIONS,
  GENERIC_ANCHOR_REGEX,
} from '../dist/automation/blog/backlink-policy.js';
import { BlogLanguage, PublishStatus } from '@prisma/client';

describe('Mandatory Internal Backlink Policy & Publishing Gate', () => {
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
      assert.ok(teLinks.some((l) => /[\u0C00-\u0C7F]/.test(l.anchor)));
    });

    it('all mapped internal URLs are valid canonical site-relative paths', () => {
      for (const [category, locales] of Object.entries(CANONICAL_CATEGORY_INTERNAL_LINKS)) {
        for (const [locale, links] of Object.entries(locales)) {
          assert.ok(links.length >= 2, `${category} (${locale}) should have at least 2 links`);
          for (const link of links) {
            assert.ok(link.url.startsWith('/'), `URL "${link.url}" must be site-relative`);
            assert.ok(VALID_INTERNAL_DESTINATIONS.has(link.url), `URL "${link.url}" must be in destination whitelist`);
            assert.ok(link.anchor.trim().length > 0, 'Anchor text must not be empty');
            assert.ok(!GENERIC_ANCHOR_REGEX.test(link.anchor), `Anchor "${link.anchor}" must not be generic`);
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
        content: 'Enterprise systems guide with [Web Applications Services](/services/web-development) and [Custom Software Solutions](/services/custom-software). ' + 'word '.repeat(700),
        metaTitle: 'Enterprise Architecture in Guntur | Palnadu.dev',
        metaDescription: 'A complete guide to enterprise architecture, cloud systems, and database scaling.',
        seoTitle: 'Enterprise Architecture in Guntur | Palnadu.dev',
        seoDescription: 'A complete guide to enterprise architecture and cloud systems.',
        canonicalUrl: '/blog/enterprise-architecture-cloud-systems-guntur',
        primaryKeyword: 'enterprise architecture',
        secondaryKeywords: ['cloud systems'],
        searchIntent: 'INFORMATIONAL',
        h2Headings: ['Architecture Overview', 'Implementation Steps'],
        internalLinks: [
          { anchor: 'Web Applications Services', url: '/services/web-development' },
          { anchor: 'Custom Software Solutions', url: '/services/custom-software' },
        ],
        faq: [],
        ...overrides,
      };
    }

    it('rejects article when no internal links exist in body content', () => {
      const draft = baseDraft({ content: 'No links here. ' + 'word '.repeat(700), internalLinks: [] });
      const outcome = validate({
        topicKey: 'test-topic', topic: 'Test Topic', draft,
        categorySlug: 'website-development', categoryExists: true,
        similarity: { nearest: null, isDuplicate: false, matches: [] },
        topicKeyTaken: false, existingSlugs: new Set(), existingTitles: new Set(),
        wordCount: 720, language: 'en',
      });
      assert.equal(outcome.passed, false);
      assert.ok(outcome.failures.some((f) => f.name === 'internal_links'));
    });

    it('rejects self-referencing internal links', () => {
      const draft = baseDraft({ content: 'Read [Self Guide](/blog/enterprise-architecture-cloud-systems-guntur). ' + 'word '.repeat(700) });
      const outcome = validate({
        topicKey: 'test-topic', topic: 'Test Topic', draft,
        categorySlug: 'website-development', categoryExists: true,
        similarity: { nearest: null, isDuplicate: false, matches: [] },
        topicKeyTaken: false, existingSlugs: new Set(), existingTitles: new Set(),
        wordCount: 720, language: 'en',
      });
      assert.equal(outcome.passed, false);
      assert.ok(outcome.failures.some((f) => f.name === 'internal_links'));
    });

    it('rejects generic anchor text like "Click Here"', () => {
      const draft = baseDraft({ content: 'For services [Click Here](/services/web-development). ' + 'word '.repeat(700) });
      const outcome = validate({
        topicKey: 'test-topic', topic: 'Test Topic', draft,
        categorySlug: 'website-development', categoryExists: true,
        similarity: { nearest: null, isDuplicate: false, matches: [] },
        topicKeyTaken: false, existingSlugs: new Set(), existingTitles: new Set(),
        wordCount: 720, language: 'en',
      });
      assert.equal(outcome.passed, false);
      assert.ok(outcome.failures.some((f) => f.name === 'internal_links'));
    });

    it('passes with valid, site-relative in-body internal links', () => {
      const draft = baseDraft();
      const outcome = validate({
        topicKey: 'test-topic', topic: 'Test Topic', draft,
        categorySlug: 'website-development', categoryExists: true,
        similarity: { nearest: null, isDuplicate: false, matches: [] },
        topicKeyTaken: false, existingSlugs: new Set(), existingTitles: new Set(),
        wordCount: 720, language: 'en',
      });
      assert.equal(outcome.passed, true);
    });
  });

  describe('Content Enrichment Contextual Linking', () => {
    it('embeds missing internal links naturally into markdown prose', () => {
      const composer = new BlogComposerService(null, null, null, null);
      const raw = '## 1. Intro\n\nIntroductory content.\n\n## 2. Details\n\nOperational details.\n\n## 3. Architecture\n\nArchitecture details.';
      const links = [
        { anchor: 'Custom Software Solutions', url: '/services/custom-software' },
        { anchor: 'Contact Us', url: '/contact' },
      ];

      const enriched = composer.enrichContent(raw, [], links, BlogLanguage.en, 'test-slug', 'website-development');
      assert.ok(enriched.includes('/services/custom-software'));
      assert.ok(enriched.includes('/contact'));
      const validation = validateArticleBacklinks(enriched, 'test-slug', 'en');
      assert.ok(validation.passed);
      assert.ok(validation.count >= 2);
    });

    it('does not duplicate links if already present in content', () => {
      const composer = new BlogComposerService(null, null, null, null);
      const raw = 'Visit our [Custom Software Solutions](/services/custom-software) page and [Contact Us](/contact).';
      const links = [
        { anchor: 'Custom Software Solutions', url: '/services/custom-software' },
        { anchor: 'Contact Us', url: '/contact' },
      ];

      const enriched = composer.enrichContent(raw, [], links, BlogLanguage.en, 'test-slug', 'website-development');
      assert.equal((enriched.match(/\/services\/custom-software/g) || []).length, 1);
    });

    it('uses Telugu prose for Telugu drafts', () => {
      const composer = new BlogComposerService(null, null, null, null);
      const raw = '## 1. పరిచయం\n\nవివరాలు ఇక్కడ ఉన్నాయి.\n\n## 2. సాంకేతిక విధానం\n\nమరిన్ని వివరాలు.';
      const links = [{ anchor: 'మొబైల్ యాప్ సేవలు', url: '/services/mobile-app-development' }];

      const enriched = composer.enrichContent(raw, [], links, BlogLanguage.te, 'test-te-slug', 'app-development');
      assert.ok(enriched.includes('/services/'));
      assert.ok(/[\u0C00-\u0C7F]/.test(enriched));
    });
  });

  describe('Publishing Gate Strict Enforcement', () => {
    it('forces DRAFT status when internal backlink validation fails', async () => {
      const fakePrisma = {
        siteSetting: {
          findUnique: async () => ({ value: true }),
        },
      };
      const publisher = new BlogPublisherService(fakePrisma);
      const status = await publisher.decidePublishStatus(false, {
        forceDraft: false,
        failures: [{ name: 'internal_links' }],
      });
      assert.equal(status, PublishStatus.DRAFT);
    });

    it('allows PUBLISHED status when all validation checks pass and auto-publish is on', async () => {
      const fakePrisma = {
        siteSetting: {
          findUnique: async () => ({ value: true }),
        },
      };
      const publisher = new BlogPublisherService(fakePrisma);
      const status = await publisher.decidePublishStatus(false, {
        forceDraft: false,
        failures: [],
      });
      assert.equal(status, PublishStatus.PUBLISHED);
    });
  });
});
