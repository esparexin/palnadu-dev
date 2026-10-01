import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Telugu / bilingual language foundation.
 *
 * These tests exist because the original normalizer was ASCII-only: every
 * Telugu topic produced an EMPTY topicKey and an EMPTY slug. ASCII-only tests
 * passed happily while every real Telugu case was broken, so the fixtures below
 * are all genuine Telugu script.
 */

let su; // script-utils
let ti; // topic-identity

before(() => {
  const outDir = mkdtempSync(join(tmpdir(), 'telugu-test-'));
  execFileSync(
    'npx',
    [
      'tsc',
      'src/automation/script-utils.ts',
      'src/automation/topic-identity.ts',
      'src/automation/seo-strategy.ts',
      '--outDir',
      outDir,
      '--module',
      'commonjs',
      '--target',
      'es2022',
      '--moduleResolution',
      'node',
      '--skipLibCheck',
    ],
    { cwd: process.cwd(), stdio: 'pipe' },
  );
  su = require(join(outDir, 'script-utils.js'));
  ti = require(join(outDir, 'topic-identity.js'));
});

// Genuine Telugu fixtures, paired with their English equivalents.
const PAIRS = [
  {
    en: 'Website Development Cost in Guntur',
    te: 'గుంటూర్‌లో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంతి?',
    label: 'website development cost, guntur',
  },
  {
    en: 'School Management Software Cost in Narasaraopet',
    te: 'నరసాపురంలో స్కూల్ మేనేజ్‌మెంట్ సాఫ్ట్‌వేర్ ఖర్చు',
    label: 'school management cost, narasaraopet',
  },
  {
    en: 'Mobile App Development Price in Vijayawada',
    te: 'విజయవాడలో మొబైల్ యాప్ డెవలప్మెంట్ ధర',
    label: 'mobile app price, vijayawada',
  },
  {
    en: 'Website Development vs WordPress',
    te: 'వెబ్ డెవలప్మెంట్ vs వర్డ్‌ప్రెస్',
    label: 'website vs wordpress',
  },
  {
    en: 'Local SEO for Clinics in Guntur',
    te: 'గుంటూర్‌లో క్లినిక్‌ల కోసం లోకల్ ఎస్‌ఇ‌ఓ',
    label: 'local seo for clinics, guntur',
  },
];

// ── Script detection ────────────────────────────────────────────────────────
describe('script detection', () => {
  it('detects Telugu, Latin and mixed script', () => {
    assert.equal(su.detectScript('గుంటూర్ వెబ్ సైట్'), 'telugu');
    assert.equal(su.detectScript('Website development'), 'latin');
    assert.equal(su.detectScript('Website డెవలప్మెంట్'), 'mixed');
  });

  it('resolves language by letter count, not mere presence', () => {
    // A single English brand name must not flip a Telugu article to English.
    assert.equal(su.detectLanguage('గుంటూర్‌లో Palnadu వెబ్ డెవలప్మెంట్ ఖర్చు'), 'te');
    assert.equal(su.detectLanguage('Website development cost in Guntur'), 'en');
  });
});

// ── Transliteration ─────────────────────────────────────────────────────────
describe('Telugu transliteration', () => {
  it('produces readable ASCII, not an empty string', () => {
    const out = su.teluguToAscii('గుంటూర్');
    assert.ok(out.length > 0, 'must not be empty');
    assert.match(out, /[a-z]/i);
  });

  it('handles the inherent vowel correctly (no doubled vowels)', () => {
    // గుంటూర్ is guntoor; a naive implementation yields "gutoorloo".
    const out = su.teluguToAscii('గుంటూర్').toLowerCase();
    assert.ok(!/aa|ee|oo{2,}/.test(out), `unexpected vowel doubling in "${out}"`);
  });

  it('respects the virama for bare consonants', () => {
    // ట్ is a bare "t", not "ta".
    assert.match(su.teluguToAscii('సైట్').toLowerCase(), /sait$/);
  });

  it('is deterministic: same input, same output', () => {
    const input = 'పాలనాడు ప్రాంతంలో ఇ-కామర్స్ వెబ్‌సైట్‌లు';
    assert.equal(su.teluguToAscii(input), su.teluguToAscii(input));
  });

  it('keeps Latin text intact in mixed phrases', () => {
    assert.match(su.teluguToAscii('Website డెవలప్మెంట్'), /Website/);
  });
});

// ── Slug generation ─────────────────────────────────────────────────────────
describe('Telugu slug generation', () => {
  it('never produces an empty slug for Telugu input', () => {
    for (const { te } of PAIRS) {
      const slug = su.toAsciiSlug(te);
      assert.ok(slug.length > 0, `empty slug for "${te}"`);
      assert.match(slug, /^[a-z0-9]+(?:-[a-z0-9]+)*$/, `slug not kebab-case: "${slug}"`);
    }
  });

  it('produces a slug for input that has no ASCII at all', () => {
    assert.equal(su.toAsciiSlug('!!!'), su.toAsciiSlug('!!!'), 'fallback must be deterministic');
    assert.ok(su.toAsciiSlug('!!!').startsWith('topic-'));
  });

  it('leaves English slugs unchanged in shape', () => {
    assert.equal(su.toAsciiSlug('Website Development Cost'), 'website-development-cost');
  });
});

// ── Cross-language topic identity ───────────────────────────────────────────
describe('cross-language topic identity', () => {
  it('gives an English and a Telugu topic the SAME key', () => {
    for (const { en, te, label } of PAIRS) {
      const a = ti.canonicalizeTopic(en);
      const b = ti.canonicalizeTopic(te);
      assert.equal(
        a.topicKey,
        b.topicKey,
        `keys differ for "${label}":\n  en -> ${a.topicKey}\n  te -> ${b.topicKey}`,
      );
    }
  });

  it('records the source language and script', () => {
    const te = ti.canonicalizeTopic(PAIRS[0].te);
    assert.equal(te.language, 'te');
    assert.equal(te.script, 'telugu');

    const en = ti.canonicalizeTopic(PAIRS[0].en);
    assert.equal(en.language, 'en');
    assert.equal(en.script, 'latin');
  });

  it('extracts the same concepts in both languages', () => {
    for (const { en, te, label } of PAIRS) {
      const a = ti.canonicalizeTopic(en);
      const b = ti.canonicalizeTopic(te);
      assert.deepEqual(
        a.concepts,
        b.concepts,
        `concepts differ for "${label}": ${a.concepts} vs ${b.concepts}`,
      );
    }
  });

  it('detects the same location in both languages', () => {
    assert.equal(ti.canonicalizeTopic('Website Cost in Guntur').location, 'guntur');
    assert.equal(
      ti.canonicalizeTopic('గుంటూర్‌లో వెబ్ ఖర్చు').location,
      'guntur',
      'Telugu location must resolve to the same canonical value',
    );
  });
});

// ── Language-aware intent ───────────────────────────────────────────────────
describe('language-aware intent detection', () => {
  it('classifies Telugu queries instead of defaulting them', () => {
    const cases = [
      ['వెబ్ డెవలప్మెంట్ vs వర్డ్‌ప్రెస్', 'COMPARISON'],
      ['వెబ్ సైట్ ఎలా చేయాలి', 'HOW_TO'],
      ['వెబ్ సైట్ ఖర్చు ఎంతి', 'COMMERCIAL_INVESTIGATION'],
      ['బిల్లింగ్ సాఫ్ట్‌వేర్ సమస్య పరిష్కారం', 'PROBLEM_SOLING'],
    ];
    for (const [te, expected] of cases) {
      assert.equal(
        su.detectIntentMultilingual(te, 'te'),
        expected,
        `"${te}" should be ${expected}`,
      );
    }
  });

  it('still classifies English correctly', () => {
    assert.equal(su.detectIntentMultilingual('website vs wordpress', 'en'), 'COMPARISON');
    assert.equal(su.detectIntentMultilingual('how to build a system', 'en'), 'HOW_TO');
  });

  it('falls back to informational for an unclassifiable phrase', () => {
    assert.equal(su.detectIntentMultilingual('ఒక సాధారణ వాక్యం', 'te'), 'INFORMATIONAL');
  });
});

// ── Distinctness must survive ───────────────────────────────────────────────
describe('bilingual identity keeps distinct topics distinct', () => {
  it('separates different subjects in the same location', () => {
    const keys = new Set([
      ti.toTopicKey('Website Development Cost in Guntur'),
      ti.toTopicKey('Mobile App Development Cost in Guntur'),
      ti.toTopicKey('School Management Software Cost in Guntur'),
    ]);
    assert.equal(keys.size, 3, 'different subjects must not collapse');
  });

  it('separates the same subject in different locations', () => {
    const keys = new Set([
      ti.toTopicKey('Website Development Cost in Guntur'),
      ti.toTopicKey('Website Development Cost in Vijayawada'),
      ti.toTopicKey('Website Development Cost in Palnadu'),
    ]);
    assert.equal(keys.size, 3, 'different locations must not collapse');
  });

  it('keeps commercial facets distinct', () => {
    // A cost question and a "best provider" question are different searches.
    const cost = ti.toTopicKey('Website Development Cost in Guntur');
    const compare = ti.toTopicKey('Website Development vs WordPress');
    assert.notEqual(cost, compare);
  });

  it('collapses phrasing variants of one topic in a single language', () => {
    const variants = [
      'How Much Does Website Development Cost in Guntur?',
      'Website Development Pricing in Guntur: Complete Guide',
      'Guntur website development cost',
      'The Ultimate Guide to Website Development Costs in Guntur',
    ];
    assert.equal(new Set(variants.map(ti.toTopicKey)).size, 1);
  });

  it('never returns an empty key, in any language', () => {
    for (const { te } of PAIRS) {
      assert.ok(ti.toTopicKey(te).length > 0);
    }
    assert.ok(ti.toTopicKey('!!!').length > 0, 'degenerate input still yields a key');
  });
});

// ── Mixed-language duplicate detection ──────────────────────────────────────
describe('mixed English/Telugu duplicate detection', () => {
  it('catches a Telugu restatement of an existing English topic', () => {
    // Same subject, one in English (already published) and one in Telugu.
    const publishedKey = ti.toTopicKey('Website Development Cost in Guntur');
    const teluguCandidate = ti.toTopicKey('గుంటూర్‌లో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంతి?');
    assert.equal(
      teluguCandidate,
      publishedKey,
      'a Telugu duplicate must resolve to the English post key and be refused',
    );
  });

  it('does not confuse genuinely different Telugu topics', () => {
    const a = ti.toTopicKey('గుంటూర్‌లో వెబ్ డెవలప్మెంట్ ఖర్చు');
    const b = ti.toTopicKey('గుంటూర్‌లో మొబైల్ యాప్ డెవలప్మెంట్ ఖర్చు');
    assert.notEqual(a, b);
  });

  it('handles a code-switched topic phrase', () => {
    const key = ti.canonicalizeTopic('Website డెవలప్మెంట్ ఖర్చు గుంటూర్');
    assert.ok(key.topicKey.length > 0);
    assert.equal(key.script, 'mixed');
  });
});