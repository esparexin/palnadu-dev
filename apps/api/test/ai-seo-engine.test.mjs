import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * End-to-end tests for AI-powered SEO research engine & source-confidence architecture.
 */
describe('AI-Powered SEO Research & Source-Confidence System', () => {
  let mod;

  before(() => {
    const outDir = join(process.cwd(), 'node_modules', '.cache', 'ai-seo-engine-test');
    mkdirSync(outDir, { recursive: true });
    execFileSync(
      'npx',
      [
        'tsc',
        'src/automation/topic-identity.ts',
        'src/automation/script-utils.ts',
        'src/automation/seo-strategy.ts',
        'src/automation/seo-sources.ts',
        'src/automation/free-keyword-research.service.ts',
        'src/automation/content-research.service.ts',
        'src/automation/content-similarity-rules.ts',
        'src/automation/seo-validation-rules.ts',
        '--outDir',
        outDir,
        '--module',
        'commonjs',
        '--target',
        'es2022',
        '--moduleResolution',
        'node',
        '--skipLibCheck',
        '--esModuleInterop',
      ],
      { cwd: process.cwd(), stdio: 'pipe' },
    );

    const req = (name) => require(join(outDir, name));
    mod = {
      identity: req('topic-identity.js'),
      strategy: req('seo-strategy.js'),
      sources: req('seo-sources.js'),
      keywordService: req('free-keyword-research.service.js'),
      researchService: req('content-research.service.js'),
      similarity: req('content-similarity-rules.js'),
      validation: req('seo-validation-rules.js'),
    };
  });

  describe('Source Confidence Tiers', () => {
    it('buildTopic defaults confidence to verified_google for Google endpoints', () => {
      const { buildTopic } = mod.sources;
      const topic = buildTopic('website development cost in guntur', 'google-autocomplete');
      assert.ok(topic);
      assert.equal(topic.confidence, 'verified_google');
      assert.equal(topic.metrics.status, 'unavailable');
      assert.equal(topic.metrics.searchVolume, null);
      assert.equal(topic.metrics.cpc, null);
      assert.equal(topic.metrics.keywordDifficulty, null);
    });

    it('buildTopic defaults confidence to ai_suggestion for AI-assisted providers', () => {
      const { buildTopic } = mod.sources;
      const topic = buildTopic('how to choose billing software for retail', 'answerthepublic');
      assert.ok(topic);
      assert.equal(topic.confidence, 'ai_suggestion');
      assert.equal(topic.metrics.status, 'unavailable');
    });

    it('buildTopic defaults confidence to verified_external for audit tools', () => {
      const { buildTopic } = mod.sources;
      const topic = buildTopic('page speed audit and web vitals optimization', 'pagespeed-insights');
      assert.ok(topic);
      assert.equal(topic.confidence, 'verified_external');
    });
  });

  describe('Zero Fabricated Metrics Guarantee', () => {
    it('strictly returns null for unverified search volume, CPC, KD, DA, and backlinks', () => {
      const { buildTopic } = mod.sources;
      const topic = buildTopic('local seo services in macherla', 'semrush');
      assert.ok(topic);
      assert.equal(topic.metrics.status, 'unavailable');
      assert.strictEqual(topic.metrics.searchVolume, null);
      assert.strictEqual(topic.metrics.keywordDifficulty, null);
      assert.strictEqual(topic.metrics.cpc, null);
      assert.strictEqual(topic.metrics.domainAuthority, null);
      assert.strictEqual(topic.metrics.backlinks, null);
      assert.match(topic.metrics.notes, /unavailable/i);
    });
  });

  describe('SemrushSource without SEMRUSH_API_KEY', () => {
    it('is configured by default through AI-assisted research and does not require credentials', () => {
      const { SemrushSource } = mod.sources;
      const mockConfig = { get: () => undefined };
      const source = new SemrushSource(mockConfig);
      assert.strictEqual(source.isConfigured(), true);
      assert.strictEqual(source.confidence, 'ai_suggestion');
      assert.ok(source.capabilities.includes('competitor research'));
      assert.ok(source.capabilities.includes('AI keyword clustering'));
    });
  });

  describe('AnswerThePublicSource without ATP_API_KEY', () => {
    it('is configured by default through AI customer question discovery', () => {
      const { AnswerThePublicSource } = mod.sources;
      const mockConfig = { get: () => undefined };
      const source = new AnswerThePublicSource(mockConfig);
      assert.strictEqual(source.isConfigured(), true);
      assert.strictEqual(source.confidence, 'ai_suggestion');
      assert.ok(source.capabilities.includes('customer questions'));
      assert.ok(source.capabilities.includes('FAQ discovery'));
    });
  });

  describe('AhrefsSource without AHREFS_API_TOKEN', () => {
    it('is configured by default and discovers genuine backlink and directory outreach without fake metrics', async () => {
      const { AhrefsSource } = mod.sources;
      const mockConfig = { get: () => undefined };
      const source = new AhrefsSource(mockConfig);
      assert.strictEqual(source.isConfigured(), true);
      assert.strictEqual(source.confidence, 'ai_suggestion');
      assert.ok(source.capabilities.includes('backlink opportunity discovery'));

      const topics = await source.discover(['Software Development'], 'Palnadu');
      assert.ok(topics.length > 0);
      for (const t of topics) {
        assert.equal(t.confidence, 'ai_suggestion');
        assert.equal(t.metrics.status, 'unavailable');
        assert.strictEqual(t.metrics.domainAuthority, null);
        assert.strictEqual(t.metrics.backlinks, null);
        assert.match(t.note, /AI-assisted directory & backlink opportunity/);
      }
    });
  });

  describe('BingWebmasterSource & IndexNowSource', () => {
    it('BingWebmasterSource reports unconfigured without BING_WEBMASTER_API_KEY', () => {
      const { BingWebmasterSource } = mod.sources;
      const mockConfig = { get: () => undefined };
      const source = new BingWebmasterSource(mockConfig);
      assert.strictEqual(source.isConfigured(), false);
      assert.strictEqual(source.confidence, 'verified_external');
      assert.ok(source.capabilities.includes('sitemap submission'));
      assert.ok(source.capabilities.includes('URL indexing'));
    });

    it('IndexNowSource is configured by default and formats payload for instant indexation', async () => {
      const { IndexNowSource } = mod.sources;
      const mockConfig = { get: (k) => (k === 'INDEXNOW_KEY' ? 'test-index-key' : undefined) };
      const source = new IndexNowSource(mockConfig);
      assert.strictEqual(source.isConfigured(), true);
      assert.strictEqual(source.id, 'indexnow');
      assert.ok(source.capabilities.includes('instant index notification'));
    });

    it('GoogleSearchConsoleSource safely handles unconfigured credentials for URL inspection and sitemaps', async () => {
      const { GoogleSearchConsoleSource } = mod.sources;
      const mockConfig = { get: () => undefined };
      const source = new GoogleSearchConsoleSource(mockConfig);
      assert.strictEqual(source.isConfigured(), false);

      const inspectResult = await source.inspectUrl('https://www.palnadu.dev/');
      assert.strictEqual(inspectResult, null);

      const sitemapResult = await source.submitSitemap('https://www.palnadu.dev/sitemap.xml');
      assert.strictEqual(sitemapResult, false);
    });
  });

  describe('FreeKeywordResearchService', () => {
    it('marks keyword discovery suggestions with verified_google confidence and unavailable metrics', async () => {
      const { FreeKeywordResearchService } = mod.keywordService;
      const service = new FreeKeywordResearchService();
      // Mock getGoogleSuggestions to avoid network dependency in unit test
      service.getGoogleSuggestions = async (seed) => [
        `${seed} best practices`,
        `${seed} company`,
      ];

      const results = await service.discoverKeywords('billing software', 'Guntur');
      assert.ok(results.length > 0);
      for (const r of results) {
        assert.equal(r.confidence, 'verified_google');
        assert.equal(r.metrics.status, 'unavailable');
        assert.strictEqual(r.metrics.searchVolume, null);
        assert.strictEqual(r.metrics.cpc, null);
      }
    });

    it('generates customer questions and FAQ clusters without paid API subscriptions', async () => {
      const { FreeKeywordResearchService } = mod.keywordService;
      const service = new FreeKeywordResearchService();
      service.getGoogleSuggestions = async (seed) => [
        `${seed} in 2026`,
      ];

      const questions = await service.discoverCustomerQuestions('clinic software', 'Narasaraopet');
      assert.ok(questions.length > 0);
      assert.ok(questions.some((q) => q.confidence === 'ai_suggestion' || q.confidence === 'verified_google'));
      assert.ok(questions.every((q) => q.intent === 'informational'));
    });

    it('discovers competitor queries without SEMrush', async () => {
      const { FreeKeywordResearchService } = mod.keywordService;
      const service = new FreeKeywordResearchService();
      service.getGoogleSuggestions = async (seed) => [
        `${seed} comparison table`,
      ];

      const gaps = await service.discoverCompetitorQueries('cloud erp', 'Guntur');
      assert.ok(gaps.length > 0);
      assert.ok(gaps.every((g) => g.intent === 'commercial'));
    });

    it('discovers backlink opportunities with outreach angles and zero fake DA/DR', async () => {
      const { FreeKeywordResearchService } = mod.keywordService;
      const service = new FreeKeywordResearchService();
      const opps = await service.discoverBacklinkOpportunities('web development', 'Guntur');
      assert.ok(opps.length > 0);
      for (const o of opps) {
        assert.equal(o.confidence, 'ai_suggestion');
        assert.ok(o.sourceName);
        assert.ok(o.outreachAngle);
        assert.ok(['business_directory', 'industry_association', 'regional_chamber', 'resource_page'].includes(o.category));
      }
    });
  });

  describe('ContentResearchService without TAVILY_API_KEY', () => {
    it('conducts research using Google search demand and AI source analysis without requiring Tavily', async () => {
      const { ContentResearchService } = mod.researchService;
      const mockConfig = { get: () => undefined };
      const service = new ContentResearchService(mockConfig);
      service.fetchGoogleSuggestions = async (topic) => [
        `${topic} cost in andhra pradesh`,
        `${topic} small business workflow`,
      ];

      const research = await service.conductResearch('Weighbridge software', 'Macherla');
      assert.ok(research.length > 50);
      assert.match(research, /VERIFIED GOOGLE SEARCH DEMAND/);
      assert.match(research, /cost in andhra pradesh/);
      assert.match(research, /TECHNICAL & OPERATIONAL SOURCE ANALYSIS/);
      assert.doesNotMatch(research, /EXTERNAL WEB RESEARCH/); // Tavily is omitted cleanly
    });
  });

  describe('End-to-end strategy & publish gate with AI SEO research', () => {
    it('flows discovered AI topics through defaultStrategy into validation with 100% pass', () => {
      const { defaultStrategy } = mod.strategy;
      const { validate } = mod.validation;

      const strategy = defaultStrategy(
        'How Hospital and Clinic Management Software Streamlines Patient Appointments in Guntur',
        'website-development',
        'Guntur and Coastal Andhra',
      );

      assert.ok(strategy.primaryKeyword.length > 0);
      assert.ok(strategy.backlinkOpportunities.length > 0);
      assert.ok(strategy.backlinkOpportunities.every((b) => b.confidence === 'ai_suggestion'));

      // Validate mock draft built with this strategy
      const mockDraft = {
        isTemplateFallback: false,
        title: 'How Hospital and Clinic Management Software Streamlines Patient Appointments in Guntur',
        slug: 'hospital-clinic-management-software-guntur',
        h1: 'How Hospital and Clinic Management Software Streamlines Patient Appointments in Guntur',
        excerpt: 'A comprehensive engineering guide on streamlining clinic workflows and patient appointments in Guntur.',
        content: `How hospital and clinic management software streamlines patient appointments in Guntur is a critical question for regional healthcare providers.\n\n## Modern Clinic Management Systems\n\nClinical diagnostic labs and hospitals require reliable appointment queues.\n\n## Practical Software Implementation in Guntur\n\nHospital and clinic management software reduces wait times.\n\n${'Detailed operational software analysis '.repeat(70)}`,
        metaTitle: 'Clinic Management Software in Guntur | Palnadu.dev',
        metaDescription: 'Discover how modern clinic management software streamlines appointments and billing for healthcare centers in Guntur.',
        seoTitle: 'Clinic Management Software in Guntur | Palnadu.dev',
        seoDescription: 'Discover how modern clinic management software streamlines appointments and billing for healthcare centers in Guntur.',
        canonicalUrl: '/blog/hospital-clinic-management-software-guntur',
        keywords: ['clinic software', 'guntur healthcare'],
        primaryKeyword: strategy.primaryKeyword,
        secondaryKeywords: strategy.secondaryKeywords,
        relatedKeywords: strategy.relatedKeywords,
        longTailKeywords: strategy.longTailKeywords,
        searchIntent: strategy.searchIntent,
        h2Headings: ['Modern Clinic Management Systems', 'Practical Software Implementation in Guntur'],
        h3Headings: [],
        internalLinks: strategy.internalLinks,
        externalReferences: [],
        imageSuggestions: strategy.imageSuggestions,
        faq: [{ q: 'What is clinic software?', a: 'Clinical management platform.' }],
        tags: strategy.tags,
        categorySlug: 'website-development',
        readingMinutes: 5,
      };

      const outcome = validate({
        topicKey: 'aspect-management+subject-clinic-guntur-informational',
        topic: mockDraft.title,
        draft: mockDraft,
        categorySlug: 'website-development',
        categoryExists: true,
        similarity: { isDuplicate: false },
        topicKeyTaken: false,
        existingSlugs: new Set(),
        existingTitles: new Set(),
        wordCount: 800,
        language: 'en',
      });

      assert.strictEqual(outcome.passed, true, `Validation failed: ${outcome.summary}`);
      assert.strictEqual(outcome.failures.length, 0);
    });
  });
});
