import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

// Emitted JS is CommonJS; createRequire lets ESM load it.
const require = createRequire(import.meta.url);

/**
 * Regression tests for the SEO content automation engine.
 *
 * These compile the framework-free rule modules once, then import the emitted
 * JS directly. That keeps the suite runnable with plain `node --test` while
 * still exercising the real shipped logic rather than a copy of it.
 */

const SOURCES = [
  'topic-identity.ts',
  'seo-strategy.ts',
  'content-similarity-rules.ts',
  'seo-validation-rules.ts',
];

let mod;

before(() => {
  const outDir = mkdtempSync(join(tmpdir(), 'seo-engine-test-'));
  execFileSync(
    'npx',
    [
      'tsc',
      ...SOURCES.map((s) => `src/automation/${s}`),
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

  // Emitted JS is CommonJS; require it by absolute path.
  const req = (name) => require(join(outDir, name));
  mod = {
    identity: req('topic-identity.js'),
    strategy: req('seo-strategy.js'),
    similarity: req('content-similarity-rules.js'),
    validation: req('seo-validation-rules.js'),
  };
});

// ═══════════════════════════════════════════════════════════════════════════
// Stable topic identity — the fix for duplicate generation
// ═══════════════════════════════════════════════════════════════════════════
describe('stable topic identity', () => {
  it('resolves differently-worded titles for one topic to a single key', () => {
    const { toTopicKey } = mod.identity;

    // The exact case from the design requirement.
    const a = 'How Much Does Website Development Cost in Guntur?';
    const b = 'Website Development Pricing in Guntur: Complete Guide';

    // Keys are concept-first, so the canonical form is
    // <commercial facets>+<subject>+<location>.
    assert.equal(toTopicKey(a), 'aspect-cost+subject-web-dev-guntur');
    assert.equal(toTopicKey(a), toTopicKey(b));
  });

  it('collapses word order and filler variations', () => {
    const { toTopicKey } = mod.identity;
    const variants = [
      'website development cost guntur',
      'Guntur website development cost',
      'The Ultimate Guide to Website Development Costs in Guntur',
      'How much does website development cost in guntur',
    ];
    assert.equal(new Set(variants.map(toTopicKey)).size, 1);
  });

  it('keeps genuinely different topics distinct', () => {
    const { toTopicKey } = mod.identity;
    const different = [
      'Website Development Cost in Guntur',
      'Mobile App Development Cost in Vijayawada',
      'School Admission Portal Software',
      'Local SEO for Clinics in Guntur',
    ];
    assert.equal(new Set(different.map(toTopicKey)).size, 4);
  });

  it('treats money synonyms as one commercial topic', () => {
    const { toTopicKey } = mod.identity;
    assert.equal(
      toTopicKey('Website Development Pricing in Guntur'),
      toTopicKey('Website Development Rates in Guntur'),
    );
    assert.equal(
      toTopicKey('Website Development Cost in Guntur'),
      toTopicKey('Website Development Fees in Guntur'),
    );
  });

  it('is independent of AI-authored title and slug text', () => {
    const { toTopicKey } = mod.identity;
    // Simulates two runs where the LLM produced different title/slug text.
    const topic = 'Website Development Cost in Guntur';
    const run1Slug = 'how-much-does-a-website-cost-in-guntur-2026-edition-1';
    const run2Slug = 'complete-pricing-guide-website-development-guntur-edition-2';
    // Slugs are irrelevant to identity: both runs resolve from the topic alone.
    assert.equal(toTopicKey(topic), toTopicKey(topic));
    assert.notEqual(run1Slug, run2Slug);
  });

  it('classifies search intent from the query phrasing', () => {
    const { detectIntent } = mod.identity;
    assert.equal(detectIntent('website development vs wordpress'), 'COMPARISON');
    assert.equal(detectIntent('how to build a billing system'), 'HOW_TO');
    assert.equal(detectIntent('best POS software for shops'), 'COMMERCIAL_INVESTIGATION');
    assert.equal(detectIntent('fix billing software errors'), 'PROBLEM_SOLING');
    assert.equal(detectIntent('what is an ERP system'), 'FAQ');
    assert.equal(detectIntent('a general topic'), 'INFORMATIONAL');
  });

  it('never returns an empty key', () => {
    const { toTopicKey } = mod.identity;
    for (const input of ['', '   ', '???', '!!!', '-']) {
      assert.doesNotThrow(() => toTopicKey(input));
    }
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Similarity check — reject re-phrasings of covered subjects
// ═══════════════════════════════════════════════════════════════════════════
describe('content similarity', () => {
  const existingPost = {
    id: 'p1',
    topicKey: 'aspect-cost+subject-web-dev-guntur',
    topic: 'Website Development Cost in Guntur',
    title: 'How Much Does a Website Cost in Guntur?',
    slug: 'how-much-does-a-website-cost-in-guntur',
    primaryKeyword: 'website development cost guntur',
    secondaryKeywords: ['website price guntur', 'web design cost andhra'],
    searchIntent: 'COMMERCIAL_INVESTIGATION',
    content: 'x'.repeat(500),
  };

  it('flags an identical topicKey as a hard duplicate', () => {
    const { scoreAgainstCorpus } = mod.similarity;
    const result = scoreAgainstCorpus(
      {
        topic: 'Website Development Pricing in Guntur: Complete Guide',
        primaryKeyword: 'website development cost guntur',
        searchIntent: 'COMMERCIAL_INVESTIGATION',
      },
      [existingPost],
    );
    assert.equal(result.isDuplicate, true);
    assert.match(result.nearest.reasons.join(' '), /identical topicKey/);
  });

  it('detects the same subject written differently', () => {
    const { scoreAgainstCorpus } = mod.similarity;
    const result = scoreAgainstCorpus(
      {
        topic: 'What Does it Cost to Build a Website in Guntur',
        primaryKeyword: 'website development cost guntur',
        secondaryKeywords: ['website price guntur', 'web design cost andhra'],
        searchIntent: 'COMMERCIAL_INVESTIGATION',
      },
      [existingPost],
    );
    assert.ok(result.matches.length > 0, 'should find at least one overlapping article');
    assert.ok(result.nearest.score > 0.4, `expected meaningful overlap, got ${result.nearest.score}`);
  });

  it('does not flag a genuinely different local topic', () => {
    const { scoreAgainstCorpus } = mod.similarity;
    const result = scoreAgainstCorpus(
      {
        topic: 'School Admission Portal Software for Narasaraopet',
        primaryKeyword: 'school admission portal',
        searchIntent: 'PRODUCT_SERVICE_RESEARCH',
      },
      [existingPost],
    );
    assert.equal(result.isDuplicate, false);
  });

  it('treats near-identical body text as duplicate content', () => {
    const { scoreAgainstCorpus, shingleSimilarity } = mod.similarity;
    const body = Array.from({ length: 300 }, (_, i) => `word${i}`).join(' ');
    const post = { ...existingPost, topicKey: 'other-topic', content: body };

    const result = scoreAgainstCorpus(
      {
        topic: 'A Completely Unrelated Subject About Rice Mills',
        content: body,
      },
      [post],
    );
    assert.ok(
      shingleSimilarity(body, body) > 0.9,
      'identical text must score near 1.0',
    );
    assert.ok(result.matches.some((m) => /content similarity/.test(m.reasons.join(' '))));
  });

  it('ranks the nearest neighbour first', () => {
    const { scoreAgainstCorpus } = mod.similarity;
    const result = scoreAgainstCorpus(
      { topic: 'Website Development Cost in Guntur', primaryKeyword: 'website development cost guntur' },
      [
        { ...existingPost, id: 'far', topicKey: 'zzz', topic: 'Rice Mill Software', title: 'Rice Mill Software', slug: 'rice-mill', primaryKeyword: 'rice mill' },
        existingPost,
      ],
    );
    assert.equal(result.nearest.postId, 'p1');
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Publishing validation gate
// ═══════════════════════════════════════════════════════════════════════════
describe('publishing validation', () => {
  function validDraft(overrides = {}) {
    const keyword = 'website development cost guntur';
    const content = [
      `If you are searching ${keyword} this guide covers it.`,
      Array.from({ length: 700 }, (_, i) => `filler${i}`).join(' '),
    ].join(' ');
    return {
      isTemplateFallback: false,
      title: 'Website Development Cost in Guntur: A Practical Breakdown',
      slug: 'website-development-cost-guntur',
      h1: 'Website Development Cost in Guntur',
      content,
      metaTitle: 'Website Development Cost in Guntur | Palnadu.dev',
      metaDescription: 'A practical breakdown of website development cost in Guntur, including what drives the price.',
      seoTitle: 'Website Development Cost in Guntur | Palnadu.dev',
      seoDescription: 'A practical breakdown of website development cost in Guntur.',
      canonicalUrl: '/blog/website-development-cost-guntur',
      primaryKeyword: keyword,
      secondaryKeywords: ['web design price guntur'],
      searchIntent: 'COMMERCIAL_INVESTIGATION',
      h2Headings: ['What drives cost', 'How to compare quotes'],
      internalLinks: [{ anchor: 'Services', url: '/services/web-development' }],
      faq: [],
      ...overrides,
    };
  }

  function run(overrides = {}, inputOverrides = {}) {
    const { validate } = mod.validation;
    const draft = validDraft(overrides);
    return validate({
      topicKey: 'website-development-cost-guntur',
      topic: 'Website Development Cost in Guntur',
      draft,
      categorySlug: 'website-development',
      categoryExists: true,
      similarity: { nearest: null, isDuplicate: false, matches: [] },
      topicKeyTaken: false,
      existingSlugs: new Set(),
      existingTitles: new Set(),
      wordCount: draft.content.split(/\s+/).length,
      ...inputOverrides,
    });
  }

  it('publishes a complete, valid article', () => {
    const outcome = run();
    assert.equal(outcome.passed, true, outcome.summary);
  });

  it('runs the full required check chain', () => {
    const outcome = run();
    const names = outcome.checks.map((c) => c.name);
    for (const required of [
      'topic_uniqueness',
      'search_intent',
      'keyword_relevance',
      'content_originality',
      'title_uniqueness',
      'slug_uniqueness',
      'content_similarity',
      'internal_links',
      'seo_metadata',
      'category',
      'canonical_url',
      'final_publishing_validation',
    ]) {
      assert.ok(names.includes(required), `missing check: ${required}`);
    }
  });

  it('blocks a topic whose topicKey is already generated', () => {
    const outcome = run({}, { topicKeyTaken: true });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'topic_uniqueness'));
  });

  it('blocks an article rejected by similarity', () => {
    const outcome = run(
      {},
      {
        similarity: {
          nearest: { postId: 'p1', title: 'Old post', slug: 'old', score: 0.91, reasons: ['topic overlap 0.85'] },
          isDuplicate: true,
          matches: [],
        },
      },
    );
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'content_similarity'));
  });

  it('blocks keyword stuffing', () => {
    const keyword = 'website development cost guntur';
    // 120 repeats x 4 words = 480 keyword words, plus 300 ordinary words so the
    // article clears the 600-word floor and isolates stuffing as the failure.
    const stuffed = [
      Array(120).fill(keyword).join(' '),
      Array.from({ length: 300 }, (_, i) => `ordinary${i}`).join(' '),
    ].join(' ');
    const outcome = run({ content: stuffed, primaryKeyword: keyword, searchIntent: 'COMMERCIAL_INVESTIGATION' });
    assert.equal(outcome.passed, false);
    const check = outcome.failures.find((f) => f.name === 'content_originality');
    assert.ok(check, 'originality check should fail');
    assert.match(check.detail, /stuffing/);
  });

  it('blocks a too-short article', () => {
    const outcome = run({ content: 'short article about websites' });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'content_originality'));
  });

  it('blocks a primary keyword that never appears in the body', () => {
    const outcome = run({ primaryKeyword: 'completely absent keyword phrase' });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'keyword_relevance'));
  });

  it('blocks a missing or unknown search intent', () => {
    const outcome = run({ searchIntent: 'NOT_A_REAL_INTENT' });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'search_intent'));
  });

  it('blocks a duplicate slug', () => {
    const outcome = run({}, { existingSlugs: new Set(['website-development-cost-guntur']) });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'slug_uniqueness'));
  });

  it('blocks a duplicate title', () => {
    const outcome = run({}, { existingTitles: new Set([validDraft().title.toLowerCase()]) });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'title_uniqueness'));
  });

  it('blocks a slug that is not clean kebab-case', () => {
    const outcome = run({ slug: 'Not A Clean Slug', canonicalUrl: '/blog/not-a-clean-slug' });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'slug_uniqueness'));
  });

  it('blocks a canonical URL that disagrees with the slug', () => {
    const outcome = run({ canonicalUrl: '/blog/some-other-page' });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'canonical_url'));
  });

  it('blocks a missing category', () => {
    const outcome = run({}, { categoryExists: false });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'category'));
  });

  it('blocks an article with no internal links', () => {
    const outcome = run({ internalLinks: [] });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'internal_links'));
  });

  it('blocks an over-long meta title', () => {
    const outcome = run({ metaTitle: 'x'.repeat(90) });
    assert.equal(outcome.passed, false);
    assert.ok(outcome.failures.some((f) => f.name === 'seo_metadata'));
  });

  it('reports every failure, not just the first', () => {
    const outcome = run({
      slug: 'Bad Slug',
      canonicalUrl: '/blog/mismatch',
      searchIntent: 'BOGUS',
      internalLinks: [],
    });
    assert.ok(outcome.failures.length >= 4, `expected multiple failures, got ${outcome.failures.length}`);
    assert.equal(outcome.passed, false);
  });

  it('produces a storable audit summary', () => {
    const outcome = run();
    assert.match(outcome.summary, /PASS topic_uniqueness/);
    assert.match(outcome.summary, /PASS final_publishing_validation/);
  });

  // ── Template fallback must never auto-publish ───────────────────────────
  it('blocks a template-fallback draft from being published', () => {
    const outcome = run({ isTemplateFallback: true });
    assert.equal(outcome.passed, false);
    const check = outcome.failures.find((f) => f.name === 'content_originality');
    assert.ok(check, 'originality check should fail for template output');
    assert.match(check.detail, /fallback template/);
  });

  it('signals forceDraft for template output', () => {
    const forced = run({ isTemplateFallback: true });
    assert.equal(forced.forceDraft, true, 'caller must be told to force DRAFT');

    const normal = run();
    assert.equal(normal.forceDraft, false);
  });

  it('records the template decision as a non-blocking advisory', () => {
    const outcome = run({ isTemplateFallback: true });
    const marker = outcome.checks.find((c) => c.name === 'template_fallback_marker');
    assert.ok(marker, 'marker check should be present');
    assert.equal(marker.blocking, false, 'marker is advisory, not a second gate');
    assert.equal(marker.passed, false);
  });

  it('an LLM draft passes originality even with identical structure', () => {
    // Same headings as the template but flagged as genuine LLM output.
    const outcome = run({ isTemplateFallback: false });
    assert.equal(outcome.passed, true, outcome.summary);
  });
});

// ═══════════════════════════════════════════════════════════════════════════
// Strategy + LLM-output parsing
// ═══════════════════════════════════════════════════════════════════════════
describe('SEO strategy', () => {
  it('derives a usable keyword set from a bare topic', () => {
    const { defaultStrategy } = mod.strategy;
    const s = defaultStrategy('How to Build a Billing System', 'website-development', 'Guntur, Andhra Pradesh');
    assert.ok(s.primaryKeyword.length > 0);
    assert.ok(s.secondaryKeywords.length >= 2);
    assert.ok(s.longTailKeywords.length >= 1);
    assert.ok(s.internalLinks.every((l) => l.url.startsWith('/')));
    assert.ok(s.faqOpportunities.length >= 3);
  });

  it('provides writing guidance for every intent', () => {
    const { INTENT_GUIDANCE, VALID_INTENTS } = mod.strategy;
    for (const intent of VALID_INTENTS) {
      assert.ok(INTENT_GUIDANCE[intent]?.length > 20, `no guidance for ${intent}`);
    }
  });

  it('parses JSON wrapped in a markdown fence', () => {
    const { parseLooseJson } = mod.strategy;
    const parsed = parseLooseJson('```json\n{"title":"Hello","slug":"hello"}\n```');
    assert.equal(parsed.title, 'Hello');
  });

  it('parses JSON with surrounding prose', () => {
    const { parseLooseJson } = mod.strategy;
    const parsed = parseLooseJson('Here is the article:\n{"title":"Hi"}\nHope that helps.');
    assert.equal(parsed.title, 'Hi');
  });

  it('throws rather than silently returning junk', () => {
    const { parseLooseJson } = mod.strategy;
    assert.throws(() => parseLooseJson('no json at all here'));
  });

  it('normalises malformed slugs from the model', () => {
    const { normaliseSlug } = mod.strategy;
    assert.equal(normaliseSlug('  My Great Post!! '), 'my-great-post');
    assert.equal(normaliseSlug('a--b__c'), 'a-b-c');
  });

  it('recovers headings when the model omits them', () => {
    const { extractHeadings } = mod.strategy;
    const md = '# Title\n\n## First\ntext\n\n### Nested\ntext\n\n## Second';
    assert.deepEqual(extractHeadings(md, 2), ['First', 'Second']);
    assert.deepEqual(extractHeadings(md, 3), ['Nested']);
  });
});