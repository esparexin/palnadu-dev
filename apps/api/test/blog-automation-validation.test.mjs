import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { validDraft, runValidation as run } from './blog-automation-validation-fixtures.mjs';

describe('publishing validation', () => {
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
});
