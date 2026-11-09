import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const SOURCES = ['topic-key-backfill.ts'];
let topicKeys;
const here = dirname(fileURLToPath(import.meta.url));

before(() => {
  const outDir = mkdtempSync(join(tmpdir(), 'blog-i18n-schema-test-'));
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
  topicKeys = req('blog/topic-key-backfill.js');
});

/** Extract one model block from schema.prisma text. */
function modelBlock(schema, name) {
  const match = schema.match(new RegExp(`model ${name} \\{[\\s\\S]*?\\n\\}`, 'm'));
  assert.ok(match, `model ${name} not found in schema`);
  return match[0];
}

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

describe('topicKey backfill planning', () => {
  it('derives canonical keys from titles, suffixing only on collision', () => {
    const out = topicKeys.assignTopicKeys([
      { id: 'a', slug: 'website-cost-guntur', title: 'Website Development Cost in Guntur' },
      { id: 'b', slug: 'website-pricing-guntur', title: 'Website Development Pricing in Guntur' },
      { id: 'c', slug: 'school-portal', title: 'School Admission Portal Software' },
    ]);
    assert.equal(out[0].topicKey, out[1].topicKey.replace(/-2$/, ''));
    assert.equal(out[0].suffixed, false);
    assert.equal(out[1].suffixed, true);
    assert.match(out[1].topicKey, /-2$/);
    assert.equal(out[2].suffixed, false);
  });

  it('resolves Telugu titles through the same concept identity', () => {
    const out = topicKeys.assignTopicKeys([
      { id: 'a', slug: 'upi-mdr', title: 'UPIపై MDR ఛార్జీలు ఎందుకు?' },
    ]);
    assert.ok(out[0].topicKey.length > 0, 'Telugu title must yield a non-empty key');
    assert.ok(!/[^a-z0-9+-]/.test(out[0].topicKey.replace(/-/g, '')), 'key must stay URL-safe');
  });

  it('respects pre-taken keys so re-runs never collide', () => {
    const first = topicKeys.assignTopicKeys([
      { id: 'a', slug: 'x', title: 'Website Development Cost in Guntur' },
    ]);
    const out = topicKeys.assignTopicKeys(
      [{ id: 'b', slug: 'y', title: 'Website Development Cost in Guntur' }],
      new Set([first[0].topicKey]),
    );
    assert.notEqual(out[0].topicKey, first[0].topicKey);
    assert.equal(out[0].suffixed, true);
  });

  it('falls back to slug when the title yields nothing usable', () => {
    const out = topicKeys.assignTopicKeys([{ id: 'a', slug: '22000', title: '!!!' }]);
    assert.ok(out[0].topicKey.length > 0);
  });
});
