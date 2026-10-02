import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Bilingual quota allocator: 3 Telugu + 2 English per cycle.
 *
 * Like the other suites, the pure allocator module is compiled with tsc and
 * the emitted JS is imported directly — no Nest container, no database.
 */

const SOURCES = ['bilingual-quota.ts'];
let quota;

before(() => {
  const outDir = mkdtempSync(join(tmpdir(), 'quota-test-'));
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
    ],
    { cwd: process.cwd(), stdio: 'pipe' },
  );
  quota = require(join(outDir, 'bilingual-quota.js'));
});

function topic(topicKey, topic, language, createdAt) {
  return { topicKey, topic, language, createdAt: new Date(createdAt) };
}

describe('readBilingualConfig', () => {
  it('is disabled when the setting is absent', () => {
    const cfg = quota.readBilingualConfig(() => undefined);
    assert.equal(cfg.enabled, false);
    assert.deepEqual(cfg.quota, { te: 3, en: 2 });
  });

  it('is disabled for falsy or malformed values, never enabled by accident', () => {
    for (const v of [false, 0, '', null, 'yes', 1]) {
      const cfg = quota.readBilingualConfig((k) =>
        k === 'bilingual_generation_enabled' ? v : undefined,
      );
      assert.equal(cfg.enabled, false, `value ${JSON.stringify(v)} must not enable`);
    }
  });

  it('enables only on explicit true', () => {
    const cfg = quota.readBilingualConfig((k) =>
      k === 'bilingual_generation_enabled' ? true : undefined,
    );
    assert.equal(cfg.enabled, true);
  });

  it('falls back to 3/2 on missing, negative, or absurd quotas', () => {
    const missing = quota.readBilingualConfig(() => undefined);
    assert.deepEqual(missing.quota, { te: 3, en: 2 });

    const negative = quota.readBilingualConfig((k) =>
      k === 'bilingual_quota_te' ? -5 : undefined,
    );
    assert.deepEqual(negative.quota, { te: 3, en: 2 });

    const huge = quota.readBilingualConfig((k) =>
      k === 'bilingual_quota_te' ? 100 : undefined,
    );
    assert.deepEqual(huge.quota, { te: 3, en: 2 });
  });

  it('honours sane custom quotas, including zero for a language', () => {
    const cfg = quota.readBilingualConfig((k) =>
      ({ bilingual_generation_enabled: true, bilingual_quota_te: 1, bilingual_quota_en: 4 })[k],
    );
    assert.equal(cfg.enabled, true);
    assert.deepEqual(cfg.quota, { te: 1, en: 4 });
  });
});

describe('allocateQuota', () => {
  it('selects 3 te + 2 en oldest-first', () => {
    const pending = [
      topic('k-te-1', 'గుంటూరులో వెబ్‌సైట్ ఖర్చు', 'te', '2026-01-05'),
      topic('k-en-1', 'Website cost in Guntur', 'en', '2026-01-01'),
      topic('k-te-2', 'విజయవాడలో యాప్ ధర', 'te', '2026-01-02'),
      topic('k-en-2', 'School portals in Narasaraopet', 'en', '2026-01-03'),
      topic('k-te-3', 'స్కూల్ ఫీజు పోర్టల్', 'te', '2026-01-01'),
      topic('k-en-3', 'Local SEO for clinics', 'en', '2026-01-04'),
      topic('k-te-4', 'హాస్పిటల్ అపాయింట్‌మెంట్ సాఫ్ట్‌వేర్', 'te', '2026-01-04'),
    ];
    const selected = quota.allocateQuota(pending, { te: 3, en: 2 });
    const te = selected.filter((t) => t.language === 'te').map((t) => t.topicKey);
    const en = selected.filter((t) => t.language === 'en').map((t) => t.topicKey);
    assert.equal(te.length, 3);
    assert.equal(en.length, 2);
    // Oldest-first within each language (subject to anti-clustering).
    assert.ok(te.includes('k-te-3'), 'oldest te topic should be selected');
    assert.ok(en.includes('k-en-1'), 'oldest en topic should be selected');
  });

  it('takes fewer when a language has too little backlog', () => {
    const pending = [topic('k-en-1', 'Website cost in Guntur', 'en', '2026-01-01')];
    const selected = quota.allocateQuota(pending, { te: 3, en: 2 });
    assert.equal(selected.length, 1);
    assert.equal(selected[0].language, 'en');
  });

  it('returns nothing for an empty queue or zero quota', () => {
    assert.deepEqual(quota.allocateQuota([], { te: 3, en: 2 }), []);
    const pending = [topic('k-en-1', 'Website cost in Guntur', 'en', '2026-01-01')];
    assert.deepEqual(quota.allocateQuota(pending, { te: 0, en: 0 }), []);
  });

  it('defers same-subject topics so one cycle cannot cluster', () => {
    const pending = [
      topic('k-te-1', 'గుంటూరులో వెబ్‌సైట్ ఖర్చు', 'te', '2026-01-01'),
      topic('k-te-2', 'విజయవాడలో వెబ్‌సైట్ ధర', 'te', '2026-01-02'),
      topic('k-te-3', 'స్కూల్ ఫీజు పోర్టల్ నరసరావుపేట', 'te', '2026-01-03'),
    ];
    const selected = quota.allocateQuota(pending, { te: 3, en: 0 });
    const keys = selected.map((t) => t.topicKey);
    // k-te-1 and k-te-2 share the website-cost subject; only one may go.
    assert.ok(!(keys.includes('k-te-1') && keys.includes('k-te-2')), 'clustered subjects deferred');
    assert.ok(keys.includes('k-te-3'), 'unrelated subject still selected');
  });

  it('never selects the same row twice', () => {
    const pending = [
      topic('k-te-1', 'గుంటూరులో వెబ్‌సైట్ ఖర్చు', 'te', '2026-01-01'),
      topic('k-en-1', 'Website cost in Guntur', 'en', '2026-01-01'),
    ];
    const selected = quota.allocateQuota(pending, { te: 3, en: 2 });
    const ids = selected.map((t) => t.topicKey + ':' + t.language);
    assert.equal(new Set(ids).size, ids.length);
  });
});
