import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, existsSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
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

  const req = (name) => {
    const nested = join(outDir, 'blog', name);
    if (existsSync(nested)) return require(nested);
    return require(join(outDir, name));
  };
  translations = req('blog-translations.js');
  backfill = req('language-backfill.js');
});

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

  it('extracts hex ids from Extended JSON without mangling them', () => {
    assert.equal(backfill.toHexId({ $oid: '6abf5425d0b6c2401bb206c7' }), '6abf5425d0b6c2401bb206c7');
    assert.equal(backfill.toHexId('6abf5425d0b6c2401bb206c7'), '6abf5425d0b6c2401bb206c7');
    assert.throws(() => backfill.toHexId({ nope: 1 }), /Unrecognized _id shape/);
    assert.throws(() => backfill.toHexId(null), /Unrecognized _id shape/);
  });
});
