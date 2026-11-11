import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('AI-Powered SEO Research Services', () => {
  let mod;

  before(() => {
    const outDir = join(process.cwd(), 'node_modules', '.cache', 'ai-seo-services-test');
    mkdirSync(outDir, { recursive: true });
    try {
      execFileSync(
        'npx',
        [
          'tsc',
          'src/automation/topic-identity.ts',
          'src/automation/script-utils.ts',
          'src/automation/seo-strategy.ts',
          'src/automation/free-keyword-research.service.ts',
          'src/automation/content-research.service.ts',
          'src/automation/content-similarity-rules.ts',
          'src/automation/seo-validation-rules.ts',
          'src/automation/technical-seo-crawler.service.ts',
          '--outDir',
          outDir,
          '--module',
          'commonjs',
          '--target',
          'es2022',
          '--moduleResolution',
          'node',
          '--experimentalDecorators',
          '--emitDecoratorMetadata',
          '--skipLibCheck',
          '--esModuleInterop',
        ],
        { cwd: process.cwd(), stdio: 'pipe' },
      );
    } catch (err) {
      if (err.stdout) console.error('TSC STDOUT:', err.stdout.toString());
      if (err.stderr) console.error('TSC STDERR:', err.stderr.toString());
      throw err;
    }

    const req = (name) => {
      const nested = join(outDir, 'automation', name);
      if (existsSync(nested)) return require(nested);
      return require(join(outDir, name));
    };
    mod = {
      strategy: req('seo-strategy.js'),
      keywordService: req('free-keyword-research.service.js'),
      researchService: req('content-research.service.js'),
      validation: req('seo-validation-rules.js'),
      crawlerService: req('technical-seo-crawler.service.js'),
    };
  });

  describe('FreeKeywordResearchService', () => {
    it('marks keyword discovery suggestions with verified_google confidence and unavailable metrics', async () => {
      const { FreeKeywordResearchService } = mod.keywordService;
      const service = new FreeKeywordResearchService();
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
      assert.doesNotMatch(research, /EXTERNAL WEB RESEARCH/);
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

      const mockDraft = {
        isTemplateFallback: false,
        title: 'How Hospital and Clinic Management Software Streamlines Patient Appointments in Guntur',
        slug: 'hospital-clinic-management-software-guntur',
        h1: 'How Hospital and Clinic Management Software Streamlines Patient Appointments in Guntur',
        excerpt: 'A comprehensive engineering guide on streamlining clinic workflows and patient appointments in Guntur.',
        content: `How hospital and clinic management software streamlines patient appointments in Guntur is a critical question for regional healthcare providers.\n\n## Modern Clinic Management Systems\n\nClinical diagnostic labs and hospitals require reliable appointment queues. Explore our [Website Development](/services/website-development) services.\n\n## Practical Software Implementation in Guntur\n\nHospital and clinic management software reduces wait times.\n\n${'Detailed operational software analysis '.repeat(70)}`,
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

  describe('TechnicalSeoCrawlerService', () => {
    it('successfully crawls routes, detects Macherla focus opportunity, and computes composite scores', async () => {
      const { TechnicalSeoCrawlerService } = mod.crawlerService;

      const mockPrisma = {
        blogPost: {
          findMany: async () => [
            { slug: 'weighbridge-automation-software', language: 'en' },
            { slug: 'billing-software-shops', language: 'te' },
          ],
        },
        seoAuditResult: {
          create: async ({ data }) => ({ id: 'mock-audit-id', createdAt: new Date(), ...data }),
          findFirst: async () => null,
          findMany: async () => [],
        },
      };

      const crawler = new TechnicalSeoCrawlerService(mockPrisma);
      const report = await crawler.runAudit('https://www.palnadu.dev');

      assert.strictEqual(report.status, 'COMPLETED');
      assert.ok(report.pagesCrawled >= 18);
      assert.ok(report.seoScore > 80);
      assert.ok(report.performanceScore >= 90);
      assert.ok(report.issues.some((i) => i.url.includes('/locations/macherla')));
      assert.match(report.summary, /Audited \d+ URLs/);
    });
  });
});
