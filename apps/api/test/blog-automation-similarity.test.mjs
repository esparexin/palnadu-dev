import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { getAutomationModules } from './blog-automation-helper.mjs';

let mod;

before(() => {
  mod = getAutomationModules();
});

describe('content similarity', () => {
  const existingPost = {
    id: 'p1',
    topicKey: 'aspect-cost+subject-web-dev-guntur-commercial-investigation',
    topic: 'Website Development Cost in Guntur',
    title: 'How Much Does a Website Cost in Guntur?',
    slug: 'how-much-does-a-website-cost-in-guntur',
    primaryKeyword: 'website development cost guntur',
    secondaryKeywords: ['website price guntur', 'web design cost andhra'],
    searchIntent: 'COMMERCIAL_INVESTIGATION',
    content: 'x'.repeat(500),
    language: 'en',
  };

  it('flags an identical topicKey as a hard duplicate', () => {
    const { scoreAgainstCorpus } = mod.similarity;
    const result = scoreAgainstCorpus(
      {
        topic: 'Website Development Pricing in Guntur: Complete Guide',
        primaryKeyword: 'website development cost guntur',
        searchIntent: 'COMMERCIAL_INVESTIGATION',
        language: 'en',
      },
      [existingPost],
    );
    assert.equal(result.isDuplicate, true);
    assert.match(result.nearest.reasons.join(' '), /identical topicKey/);
  });

  it('reports a same-topicKey match in another language as a translation candidate, not a duplicate', () => {
    const { scoreAgainstCorpus } = mod.similarity;
    const result = scoreAgainstCorpus(
      {
        topic: 'గుంటూర్‌లో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంతి?',
        primaryKeyword: 'వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు గుంటూర్',
        searchIntent: 'COMMERCIAL_INVESTIGATION',
        language: 'te',
      },
      [existingPost],
    );
    assert.equal(result.isDuplicate, false);
    assert.ok(
      result.matches.some((m) => m.reasons.join(' ').includes('translation candidate')),
      'expected a translation-candidate match, got: ' + JSON.stringify(result.matches),
    );
  });

  it('still flags a same-language rewording as a duplicate', () => {
    const { scoreAgainstCorpus } = mod.similarity;
    const otherEnPost = {
      ...existingPost,
      id: 'p2',
      topicKey: 'aspect-cost+subject-web-dev-guntur-how-to',
      topic: 'How to Build a Website in Guntur',
      title: 'How to Build a Website in Guntur',
      slug: 'how-to-build-a-website-in-guntur',
    };
    const result = scoreAgainstCorpus(
      {
        topic: 'Website Development Pricing in Guntur: Complete Guide',
        primaryKeyword: 'website development cost guntur',
        searchIntent: 'COMMERCIAL_INVESTIGATION',
        language: 'en',
      },
      [otherEnPost, existingPost],
    );
    assert.equal(result.isDuplicate, true);
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
