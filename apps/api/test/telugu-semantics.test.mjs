import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

let su;
let ti;
let st;

before(() => {
  const outDir = mkdtempSync(join(tmpdir(), 'telugu-semantics-test-'));
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
  st = require(join(outDir, 'seo-strategy.js'));
});

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
    const cost = ti.toTopicKey('Website Development Cost in Guntur');
    const compare = ti.toTopicKey('Website Development vs WordPress');
    assert.notEqual(cost, compare);
  });

  it('collapses phrasing variants of one topic in a single language', () => {
    const variants = [
      'How Much Does Website Development Cost in Guntur?',
      'Website Development Pricing in Guntur: Complete Guide',
      'Guntur website development cost',
      'Website development cost guide Guntur',
    ];
    assert.equal(new Set(variants.map(ti.toTopicKey)).size, 1);
  });

  it('splits Telugu phrasings asked with different intents', () => {
    const cost = ti.toTopicKey('గుంటూర్‌లో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంతి?');
    const guide = ti.toTopicKey('గుంటూర్‌లో వెబ్‌సైట్ ఎలా చేయాలి గైడ్');
    assert.notEqual(cost, guide);
  });

  it('never returns an empty key, in any language', () => {
    for (const { te } of PAIRS) {
      assert.ok(ti.toTopicKey(te).length > 0);
    }
    assert.ok(ti.toTopicKey('!!!').length > 0, 'degenerate input still yields a key');
  });
});

describe('mixed English/Telugu duplicate detection', () => {
  it('catches a Telugu restatement of an existing English topic', () => {
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

describe('Telugu script coverage', () => {
  it('measures the Telugu letter fraction, ignoring digits and URLs', () => {
    assert.equal(su.teluguScriptRatio('గుంటూర్ వెబ్‌సైట్'), 1);
    assert.equal(su.teluguScriptRatio('Website cost guide'), 0);
    assert.equal(su.teluguScriptRatio(''), 0);
    assert.equal(su.teluguScriptRatio('123 https://x.com/a'), 0);
    const mixed = su.teluguScriptRatio('గుంటూర్ Website ఖర్చు cost');
    assert.ok(mixed > 0 && mixed < 1, `expected a proper fraction, got ${mixed}`);
  });

  it('does not let proper nouns or code flip a Telugu article', () => {
    const body =
      'గుంటూర్‌లో వ్యాపారం కోసం Palnadu.dev వెబ్‌సైట్‌ను Next.js తో నిర్మిస్తుంది. https://palnadu.dev/contact లో సంప్రదించండి. ఖర్చు, సమయం మరియు నాణ్యత గురించి వివరంగా మాట్లాడుకుందాం.';
    assert.ok(su.teluguScriptRatio(body) >= 0.5, `ratio was ${su.teluguScriptRatio(body)}`);
  });

  it('catches an English body masquerading as Telugu', () => {
    const body = 'Website development cost in Guntur depends on features. Contact us for a quote today.';
    assert.ok(su.teluguScriptRatio(body) < 0.5, `ratio was ${su.teluguScriptRatio(body)}`);
  });
});

describe('Telugu style guidance', () => {
  it('forbids romanized Telugu and English body copy', () => {
    assert.match(st.TELUGU_STYLE_GUIDANCE, /[Nn]o romanized Telugu/);
    assert.match(st.TELUGU_STYLE_GUIDANCE, /body sentences in Telugu script/);
    assert.match(st.TELUGU_STYLE_GUIDANCE, /Never write whole English sentences/);
  });

  it('requires Telugu-script keywords for Telugu SEO placement', () => {
    assert.match(st.TELUGU_STYLE_GUIDANCE, /primary keyword verbatim/);
    assert.match(st.TELUGU_STYLE_GUIDANCE, /transliterated or English keywords do not count/);
  });

  it('keeps proper nouns, technical terms, and URLs in English', () => {
    assert.match(st.TELUGU_STYLE_GUIDANCE, /Palnadu\.dev/);
    assert.match(st.TELUGU_STYLE_GUIDANCE, /URLs/);
    assert.match(st.TELUGU_STYLE_GUIDANCE, /parentheses/);
  });
});
