import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// Emitted JS is CommonJS; createRequire lets ESM load it.
const require = createRequire(import.meta.url);

/**
 * Regression tests for the bilingual blog foundation.
 *
 * Covers the API-side invariants: translation-group rules, backfill planning,
 * language parsing, and the schema-level constraints (enum, per-language slug
 * uniqueness, translationGroupId index without uniqueness). Like the other API
 * suites, framework-free modules are compiled with tsc and the emitted JS is
 * imported directly, so the tests exercise the real shipped logic.
 */

const SOURCES = ['blog-translations.ts', 'language-backfill.ts'];

let translations;
let backfill;

const here = dirname(fileURLToPath(import.meta.url));

before(() => {
  const outDir = mkdtempSync(join(tmpdir(), 'blog-i18n-test-'));
  execFileSync(
    'npx',
    [
      'tsc',
      ...SOURCES.map((s) => `src/blog/${s}`),
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
    { cwd: join(here, '..'), stdio: 'pipe' },
  );

  const req = (name) => require(join(outDir, name));
  translations = req('blog-translations.js');
  backfill = req('language-backfill.js');
});

/** Extract one model block from schema.prisma text. */
function modelBlock(schema, name) {
  const match = schema.match(new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`, 'm'));
  assert.ok(match, `model ${name} not found in schema`);
  return match[0];
}

describe('language parsing', () => {
  it("accepts 'en' and 'te'", () => {
    assert.equal(translations.parseLanguageValue('en'), 'en');
    assert.equal(translations.parseLanguageValue('te'), 'te');
  });

  it('treats missing values as unset, not as English', () => {
    assert.equal(translations.parseLanguageValue(undefined), undefined);
    assert.equal(translations.parseLanguageValue(null), undefined);
    assert.equal(translations.parseLanguageValue(''), undefined);
  });

  it('rejects anything else instead of silently defaulting', () => {
    for (const bad of ['fr', 'EN', 'TE', 'en-US', 'english', 0, false]) {
      const res = translations.parseLanguageValue(bad);
      assert.ok(res && typeof res === 'object' && 'invalid' in res, `${JSON.stringify(bad)} must be invalid`);
    }
  });
});

describe('translation-group invariant', () => {
  it('refuses an empty group', () => {
    assert.equal(translations.validateTranslationGroup([]).ok, false);
  });

  it('accepts one English plus one Telugu post', () => {
    const res = translations.validateTranslationGroup([
      { id: 'a', language: 'en' },
      { id: 'b', language: 'te' },
    ]);
    assert.equal(res.ok, true);
  });

  it('refuses a second Telugu article in the same group', () => {
    // One English article beside several Telugu articles on different intents
    // is legitimate ONLY as separate groups; within one group each language
    // appears at most once.
    const res = translations.validateTranslationGroup([
      { id: 'a', language: 'en' },
      { id: 'b', language: 'te' },
      { id: 'c', language: 'te' },
    ]);
    assert.equal(res.ok, false);
    assert.match(res.reason, /already represented/);
  });

  it('refuses a second English article in the same group', () => {
    const res = translations.validateTranslationGroup([
      { id: 'a', language: 'en' },
      { id: 'b', language: 'en' },
    ]);
    assert.equal(res.ok, false);
  });

  it('allows re-adding the same post idempotently', () => {
    assert.equal(
      translations.canJoinGroup([{ id: 'a', language: 'en' }], { id: 'a', language: 'en' }),
      true,
    );
  });

  it('blocks joining when the language is taken by another post', () => {
    assert.equal(
      translations.canJoinGroup(
        [{ id: 'a', language: 'en' }, { id: 'b', language: 'te' }],
        { id: 'c', language: 'te' },
      ),
      false,
    );
  });

  it('reports the languages present in a group', () => {
    assert.deepEqual(
      translations.groupLanguages([{ language: 'te' }, { language: 'en' }]),
      ['en', 'te'],
    );
    assert.deepEqual(translations.groupLanguages([{ language: 'en' }]), ['en']);
    assert.deepEqual(translations.groupLanguages([]), []);
  });
});

describe('language backfill planning', () => {
  it('plans legacy rows missing language for en, leaves the rest alone', () => {
    const plan = backfill.planLanguageBackfill(
      [
        { id: 'p1' },
        { id: 'p2', language: null },
        { id: 'p3', language: 'en' },
        { id: 'p4', language: 'te' },
      ],
      [{ id: 't1' }, { id: 't2', language: 'en' }],
    );
    // Existing posts stay English; Telugu rows are never touched.
    assert.deepEqual(plan.postIds.sort(), ['p1', 'p2']);
    assert.deepEqual(plan.topicIds, ['t1']);
  });

  it('is a no-op when everything already has a language', () => {
    const plan = backfill.planLanguageBackfill(
      [{ id: 'p1', language: 'en' }],
      [{ id: 't1', language: 'te' }],
    );
    assert.deepEqual(plan, { postIds: [], topicIds: [] });
  });
});

describe('schema constraints', () => {
  const schema = readFileSync(join(here, '..', 'prisma', 'schema.prisma'), 'utf8');

  it('defines a BlogLanguage enum with exactly en and te', () => {
    const match = schema.match(/enum BlogLanguage \{([\s\S]*?)\n\}/);
    assert.ok(match, 'BlogLanguage enum missing');
    const values = match[1].split('\n').map((l) => l.trim()).filter(Boolean);
    assert.deepEqual(values, ['en', 'te']);
  });

  it('requires language on BlogPost with an en default', () => {
    const post = modelBlock(schema, 'BlogPost');
    assert.match(post, /language\s+BlogLanguage\s+@default\(en\)/);
  });

  it('scopes slug uniqueness per language instead of globally', () => {
    const post = modelBlock(schema, 'BlogPost');
    assert.match(post, /\@\@unique\(\[language,\s*slug\]\)/);
    assert.ok(!/slug\s+String\s+@unique/.test(post), 'global slug @unique must be gone from BlogPost');
  });

  it('indexes translationGroupId without making it unique', () => {
    const post = modelBlock(schema, 'BlogPost');
    assert.match(post, /translationGroupId\s+String\?/);
    assert.match(post, /\@\@index\(\[translationGroupId\]\)/);
    assert.ok(
      !/@unique/.test(post.split('translationGroupId')[1].split('\n')[0]),
      'translationGroupId must not be unique (null groups would collide on MongoDB)',
    );
  });

  it('gives queued topics a defaulted language with a compound index', () => {
    const topic = modelBlock(schema, 'BlogTopic');
    assert.match(topic, /language\s+BlogLanguage\s+@default\(en\)/);
    assert.match(topic, /\@\@index\(\[language,\s*status\]\)/);
  });

  it('keeps the generation log language optional so legacy rows need no backfill', () => {
    const log = modelBlock(schema, 'BlogGenerationLog');
    assert.match(log, /language\s+BlogLanguage\?/);
  });
});
