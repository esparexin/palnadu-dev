import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('AI-Powered SEO Research Sources', () => {
  let mod;

  before(() => {
    const outDir = join(process.cwd(), 'node_modules', '.cache', 'ai-seo-sources-test');
    mkdirSync(outDir, { recursive: true });
    try {
      execFileSync(
        'npx',
        [
          'tsc',
          'src/automation/topic-identity.ts',
          'src/automation/script-utils.ts',
          'src/automation/seo-sources.ts',
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
      sources: req('seo-sources.js'),
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
});
