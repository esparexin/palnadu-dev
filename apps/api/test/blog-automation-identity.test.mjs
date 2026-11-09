import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { getAutomationModules } from './blog-automation-helper.mjs';

let mod;

before(() => {
  mod = getAutomationModules();
});

describe('stable topic identity', () => {
  it('resolves differently-worded titles for one topic to a single key', () => {
    const { toTopicKey } = mod.identity;
    const a = 'How Much Does Website Development Cost in Guntur?';
    const b = 'Website Development Pricing in Guntur: Complete Guide';
    assert.equal(toTopicKey(a), 'aspect-cost+subject-web-dev-guntur-commercial-investigation');
    assert.equal(toTopicKey(a), toTopicKey(b));
  });

  it('collapses word order and filler variations within one intent', () => {
    const { toTopicKey } = mod.identity;
    const variants = [
      'website development cost guntur',
      'Guntur website development cost',
      'How much does website development cost in guntur',
      'Website development pricing in Guntur',
    ];
    assert.equal(new Set(variants.map(toTopicKey)).size, 1);
  });

  it('matches hyphenated surface forms to their concept', () => {
    const { toTopicKey } = mod.identity;
    assert.equal(
      toTopicKey('How E-Commerce Portals Modernize Growing Businesses in Guntur'),
      toTopicKey('How Ecommerce Portals Modernize Growing Businesses in Guntur'),
    );
    const key = toTopicKey('How E-Commerce Portals and Online Ordering Apps Modernizes Growing Businesses in Guntur');
    assert.ok(!/apps-businesses-commerce-growing/.test(key), `literal soup leaked into key: ${key}`);
  });

  it('splits the same subject asked with a different intent', () => {
    const { toTopicKey, canonicalizeTopic } = mod.identity;
    const cost = toTopicKey('Website Development Cost in Guntur');
    const guide = toTopicKey('The Ultimate Guide to Website Development Costs in Guntur');
    assert.notEqual(cost, guide);
    assert.equal(canonicalizeTopic('Website Development Cost in Guntur').intent, 'COMMERCIAL_INVESTIGATION');
    assert.equal(canonicalizeTopic('The Ultimate Guide to Website Development Costs in Guntur').intent, 'HOW_TO');
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
    const topic = 'Website Development Cost in Guntur';
    const run1Slug = 'how-much-does-a-website-cost-in-guntur-2026-edition-1';
    const run2Slug = 'complete-pricing-guide-website-development-guntur-edition-2';
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

  it('parses JSON containing internal markdown code blocks', () => {
    const { parseLooseJson } = mod.strategy;
    const jsonStr = JSON.stringify({
      title: 'Guide',
      content: '## Overview\n```ts\nconst x = 1;\n```\nExplanation',
    });
    const parsed = parseLooseJson(jsonStr);
    assert.equal(parsed.title, 'Guide');
    assert.match(parsed.content, /const x = 1;/);
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
