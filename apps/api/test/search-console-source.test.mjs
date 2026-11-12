import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { existsSync, mkdirSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);

describe('Google Search Console Integration', () => {
  let mod;

  before(() => {
    const outDir = join(process.cwd(), 'node_modules', '.cache', 'gsc-source-test');
    mkdirSync(outDir, { recursive: true });
    execFileSync(
      'npx',
      [
        'tsc',
        'src/automation/topic-identity.ts',
        'src/automation/script-utils.ts',
        'src/automation/seo-sources.ts',
        'src/automation/topic-discovery.service.ts',
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
    const req = (name) => {
      const nested = join(outDir, 'automation', name);
      return require(existsSync(nested) ? nested : join(outDir, name));
    };
    mod = {
      sources: req('seo-sources.js'),
      discovery: req('topic-discovery.service.js'),
    };
  });

  function createConfig(values) {
    return { get: (k) => values[k] };
  }

  it('requires both GSC_ACCESS_TOKEN and GSC_SITE_URL in isConfigured()', () => {
    const { GoogleSearchConsoleSource } = mod.sources;
    assert.strictEqual(new GoogleSearchConsoleSource(createConfig({})).isConfigured(), false);
    assert.strictEqual(
      new GoogleSearchConsoleSource(createConfig({ GSC_ACCESS_TOKEN: 'tok' })).isConfigured(),
      false,
    );
    assert.strictEqual(
      new GoogleSearchConsoleSource(createConfig({ GSC_SITE_URL: 'https://www.palnadu.dev/' })).isConfigured(),
      false,
    );
    assert.strictEqual(
      new GoogleSearchConsoleSource(createConfig({ GSC_ACCESS_TOKEN: '  ', GSC_SITE_URL: 'https://www.palnadu.dev/' })).isConfigured(),
      false,
    );
    assert.strictEqual(
      new GoogleSearchConsoleSource(createConfig({ GSC_ACCESS_TOKEN: 'tok', GSC_SITE_URL: 'https://www.palnadu.dev/' })).isConfigured(),
      true,
    );
  });

  it('sends dimensions, rowLimit, startDate, and endDate in the POST JSON body', async () => {
    const { GoogleSearchConsoleSource } = mod.sources;
    const source = new GoogleSearchConsoleSource(
      createConfig({ GSC_ACCESS_TOKEN: 'gsc-token', GSC_SITE_URL: 'https://www.palnadu.dev/' }),
    );
    const calls = [];
    const origFetch = globalThis.fetch;
    globalThis.fetch = async (url, init) => {
      calls.push({ url: String(url), init });
      return { ok: true, json: async () => ({ rows: [] }) };
    };
    try {
      await source.fetchTopics(['website development guntur'], 'IN');
      assert.equal(calls.length, 1);
      const parsedUrl = new URL(calls[0].url);
      assert.equal(
        parsedUrl.pathname,
        `/webmasters/v3/sites/${encodeURIComponent('https://www.palnadu.dev/')}/searchAnalytics/query`,
      );
      assert.equal(parsedUrl.searchParams.has('dimensions'), false);
      assert.equal(parsedUrl.searchParams.has('rowLimit'), false);
      assert.equal(calls[0].init.method, 'POST');
      assert.equal(calls[0].init.headers.Authorization, 'Bearer gsc-token');

      const body = JSON.parse(calls[0].init.body);
      assert.deepStrictEqual(body.dimensions, ['query']);
      assert.equal(body.rowLimit, 100);
      assert.match(body.startDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.match(body.endDate, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(body.startDate < body.endDate);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('parses query rows, ignores missing keys or low/invalid impressions, and preserves GSC metrics without fabricating volume', async () => {
    const { GoogleSearchConsoleSource } = mod.sources;
    const source = new GoogleSearchConsoleSource(
      createConfig({ GSC_ACCESS_TOKEN: 'gsc-token', GSC_SITE_URL: 'https://www.palnadu.dev/' }),
    );
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => ({
      ok: true,
      json: async () => ({
        rows: [
          { keys: ['website development cost in guntur'], impressions: 42, clicks: 5, ctr: 0.119047, position: 8.4 },
          { keys: ['school management software narasaraopet'], impressions: 7 },
          { keys: ['low impression query'], impressions: 2, clicks: 0, ctr: 0, position: 30 },
          { impressions: 50, clicks: 4, ctr: 0.08, position: 4.1 },
          { keys: ['   '], impressions: 25 },
          { keys: ['unknown impressions query'] },
          { keys: ['billing software free download crack'], impressions: 100 },
        ],
      }),
    });
    try {
      const topics = await source.fetchTopics([], 'IN');
      assert.equal(topics.length, 2);

      const first = topics[0];
      assert.equal(first.phrase, 'website development cost in guntur');
      assert.equal(first.confidence, 'verified_google');
      assert.equal(first.metrics.status, 'verified');
      assert.equal(first.metrics.impressions, 42);
      assert.equal(first.metrics.clicks, 5);
      assert.equal(first.metrics.ctr, 0.119047);
      assert.equal(first.metrics.position, 8.4);
      assert.strictEqual(first.metrics.searchVolume, null);
      assert.strictEqual(first.metrics.keywordDifficulty, null);
      assert.strictEqual(first.metrics.cpc, null);
      assert.strictEqual(first.metrics.domainAuthority, null);
      assert.strictEqual(first.metrics.backlinks, null);
      assert.match(first.note, /impressions=42 clicks=5 ctr=0\.119 position=8\.4/);

      const second = topics[1];
      assert.equal(second.phrase, 'school management software narasaraopet');
      assert.equal(second.metrics.status, 'verified');
      assert.equal(second.metrics.impressions, 7);
      assert.strictEqual(second.metrics.clicks, null);
      assert.strictEqual(second.metrics.ctr, null);
      assert.strictEqual(second.metrics.position, null);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('returns empty topics on HTTP error responses without throwing', async () => {
    const { GoogleSearchConsoleSource } = mod.sources;
    const source = new GoogleSearchConsoleSource(
      createConfig({ GSC_ACCESS_TOKEN: 'gsc-token', GSC_SITE_URL: 'https://www.palnadu.dev/' }),
    );
    const origFetch = globalThis.fetch;
    globalThis.fetch = async () => ({ ok: false, status: 401 });
    try {
      const topics = await source.discover([], 'IN');
      assert.deepStrictEqual(topics, []);
    } finally {
      globalThis.fetch = origFetch;
    }
  });

  it('preserves verified GSC metrics when TopicDiscoveryService merges duplicate topics across sources', async () => {
    const { buildTopic } = mod.sources;
    const { TopicDiscoveryService } = mod.discovery;
    const phrase = 'website development cost in guntur';
    const autocompleteTopic = buildTopic(phrase, 'google-autocomplete');
    const gscTopic = buildTopic(phrase, 'google-search-console', {
      confidence: 'verified_google',
      metrics: {
        searchVolume: null,
        keywordDifficulty: null,
        cpc: null,
        domainAuthority: null,
        backlinks: null,
        impressions: 64,
        clicks: 9,
        ctr: 0.1406,
        position: 6.2,
        status: 'verified',
        notes: 'Verified via Google Search Console (90d)',
      },
      note: 'gsc impressions=64 clicks=9 ctr=0.1406 position=6.2',
    });

    const prisma = {
      blogPost: { findMany: async () => [] },
      blogTopic: { findMany: async () => [] },
    };
    const service = new TopicDiscoveryService(prisma, [
      { id: 'google-autocomplete', isConfigured: () => true, capabilities: [], discover: async () => [autocompleteTopic] },
      { id: 'google-search-console', isConfigured: () => true, capabilities: [], discover: async () => [gscTopic] },
    ]);

    const discovered = await service.discover(10);
    assert.equal(discovered.length, 1);
    assert.deepStrictEqual(discovered[0].sources, ['google-autocomplete', 'google-search-console']);
    assert.equal(discovered[0].metrics.status, 'verified');
    assert.equal(discovered[0].metrics.impressions, 64);
    assert.equal(discovered[0].metrics.clicks, 9);
    assert.equal(discovered[0].metrics.ctr, 0.1406);
    assert.equal(discovered[0].metrics.position, 6.2);
    assert.equal(discovered[0].note, 'gsc impressions=64 clicks=9 ctr=0.1406 position=6.2');
  });
});

