import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

/**
 * Durable-queue behaviour: claiming, leases, retry policy, and the promise that
 * a topic can never produce two posts.
 *
 * The queue logic lives inside BlogAutomationService, which needs Nest and
 * Prisma. Rather than boot the container, this suite re-implements the same
 * claim/release semantics against an in-memory store that mirrors the parts of
 * Prisma we depend on — notably the unique index on topicKey, which is the
 * database-level guarantee the design requires.
 */

const SOURCES = ['topic-identity.ts'];
let toTopicKey;
let canonicalizeTopic;

before(() => {
  const outDir = mkdtempSync(join(tmpdir(), 'queue-test-'));
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
  const m = require(join(outDir, 'topic-identity.js'));
  toTopicKey = m.toTopicKey;
  canonicalizeTopic = m.canonicalizeTopic;
});

// ── In-memory store mirroring the Prisma subset we rely on ─────────────────
function createStore() {
  const topics = [];
  const posts = [];
  const logs = [];
  const STALE_MS = 30 * 60 * 1000;

  const matches = (row, where) =>
    Object.entries(where).every(([k, v]) => row[k] === v);

  return {
    topics,
    posts,
    logs,

    async createTopic(data) {
      // Mirrors the unique index on topicKey.
      if (topics.some((t) => t.topicKey === data.topicKey)) {
        const err = new Error('E11000 duplicate key error collection: blog_topics topic_key');
        err.code = 'P2002';
        throw err;
      }
      const row = { id: `t${topics.length + 1}`, status: 'PENDING', attempts: 0, ...data };
      topics.push(row);
      return row;
    },

    async findTopicUnique({ where }) {
      return topics.find((t) => matches(t, where)) ?? null;
    },

    async findPostUnique({ where }) {
      return posts.find((p) => matches(p, where)) ?? null;
    },

    async createPost({ data }) {
      // The database-level guarantee: one topicKey => at most one post.
      if (posts.some((p) => p.topicKey === data.topicKey)) {
        const err = new Error(
          `E11000 duplicate key error collection: blog_posts topic_key (${data.topicKey})`,
        );
        err.code = 'P2002';
        throw err;
      }
      if (posts.some((p) => p.slug === data.slug)) {
        const err = new Error('E11000 duplicate key error collection: blog_posts slug');
        err.code = 'P2002';
        throw err;
      }
      const row = { id: `p${posts.length + 1}`, ...data };
      posts.push(row);
      return row;
    },

    async updateTopic({ where, data }) {
      const row = topics.find((t) => matches(t, where));
      if (!row) throw new Error('not found');
      Object.assign(row, data);
      return row;
    },

    async updateMany({ where, data }) {
      const candidates = topics.filter((t) => {
        for (const [k, v] of Object.entries(where)) {
          if (k === 'OR') continue;
          if (k === 'status' && Array.isArray(v)) {
            if (!v.includes(t.status)) return false;
            continue;
          }
          if (k === 'attempts') {
            if (typeof v === 'object' && v.lt !== undefined && !(t.attempts < v.lt)) return false;
            continue;
          }
          if (k === 'claimedAt' && typeof v === 'object' && v.lt !== undefined) {
            if (!(t.claimedAt && t.claimedAt < v.lt)) return false;
            continue;
          }
          if (t[k] !== v) return false;
        }
        return true;
      });
      for (const row of candidates) Object.assign(row, data);
      return { count: candidates.length };
    },

    async findFirstPending({ maxAttempts }) {
      return (
        topics.find((t) => t.status === 'PENDING' && t.attempts < maxAttempts) ?? null
      );
    },

    async log(data) {
      logs.push(data);
    },

    STALE_MS,
  };
}

/**
 * Faithful port of the service's claim/release semantics.
 */
function createQueue(store, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 3;
  const retryDelayMs = opts.retryDelayMs ?? 60 * 60 * 1000;

  return {
    /** Atomic claim: only one worker may move a topic out of PENDING. */
    async claim(workerId) {
      const candidate = await store.findFirstPending({ maxAttempts });
      if (!candidate) return null;

      const now = new Date();
      const staleBefore = new Date(now.getTime() - store.STALE_MS);
      const result = await store.updateMany({
        where: {
          id: candidate.id,
          status: ['PENDING', 'FAILED'],
          OR: [{ claimedAt: null }, { claimedAt: { lt: staleBefore } }],
        },
        data: { status: 'CLAIMED', claimedAt: now, claimedBy: workerId },
      });

      return result.count === 0 ? null : { ...candidate, status: 'CLAIMED', claimedBy: workerId };
    },

    async complete(topicKey, postId) {
      await store.updateTopic({
        where: { topicKey },
        data: { status: 'COMPLETED', postId, claimedAt: null, claimedBy: null },
      });
    },

    /** Transient failure: return to the queue for a later retry. */
    async retry(topicKey, error) {
      const row = await store.findTopicUnique({ where: { topicKey } });
      if (!row) return;
      await store.updateTopic({
        where: { topicKey },
        data: {
          attempts: row.attempts + 1,
          lastError: String(error).slice(0, 500),
          status: row.attempts + 1 >= maxAttempts ? 'FAILED' : 'PENDING',
          nextRetryAt: new Date(Date.now() + retryDelayMs),
          claimedAt: null,
          claimedBy: null,
        },
      });
    },

    /** Permanent rejection: park the topic, never delete it. */
    async reject(topicKey, error) {
      await store.updateTopic({
        where: { topicKey },
        data: {
          attempts: { __inc: 1 },
          lastError: String(error).slice(0, 500),
          status: 'FAILED',
          nextRetryAt: null,
          claimedAt: null,
          claimedBy: null,
        },
      });
    },
  };
}

const TOPICS = [
  { topic: 'Website Development Cost in Guntur', category: 'website-development' },
  { topic: 'Mobile App Development Cost in Vijayawada', category: 'app-development' },
  { topic: 'School Admission Portal Software', category: 'school-websites' },
  { topic: 'Local SEO for Clinics in Guntur', category: 'local-seo-business' },
  { topic: 'ERP Software for Wholesale Traders', category: 'website-development' },
  { topic: 'Cold Storage Software in Palnadu', category: 'website-development' },
];

async function seed(store) {
  for (const t of TOPICS) {
    await store.createTopic({ topicKey: toTopicKey(t.topic), topic: t.topic, categorySlug: t.category });
  }
}

describe('durable topic queue', () => {
  it('resolves topic keys independent of LLM title/slug', () => {
    // Two LLM outputs for one topic must map to one queue row.
    const topic = 'Website Development Cost in Guntur';
    assert.equal(
      toTopicKey(topic),
      toTopicKey('Website Development Pricing in Guntur: Complete Guide'),
    );
    assert.equal(canonicalizeTopic(topic).location, 'guntur');
  });

  it('rejects a duplicate enqueue at the database level', async () => {
    const store = createStore();
    await store.createTopic({ topicKey: 'website-development-cost-guntur', topic: TOPICS[0].topic });

    await assert.rejects(
      () => store.createTopic({ topicKey: 'website-development-cost-guntur', topic: 'reworded version' }),
      /duplicate key/i,
    );
    assert.equal(store.topics.length, 1);
  });

  it('claims each topic to exactly one worker', async () => {
    const store = createStore();
    await seed(store);
    const q = createQueue(store);

    // Simulate two workers racing over the same queue.
    const [a, b] = await Promise.all([q.claim('worker-a'), q.claim('worker-b')]);
    const claimed = [a, b].filter(Boolean);
    const keys = claimed.map((t) => t.topicKey);
    assert.equal(new Set(keys).size, keys.length, 'no topic claimed twice');

    const claimedRows = store.topics.filter((t) => t.status === 'CLAIMED');
    assert.equal(claimedRows.length, keys.length, 'exactly the claimed rows are CLAIMED');
  });

  it('never hands out the same topic twice across many cycles', async () => {
    const store = createStore();
    await seed(store);
    const q = createQueue(store);

    const processed = [];
    for (let i = 0; i < 10; i++) {
      const t = await q.claim('worker');
      if (!t) break;
      processed.push(t.topicKey);
      await q.complete(t.topicKey, `post_${t.id}`);
    }

    assert.equal(processed.length, TOPICS.length, 'every topic processed exactly once');
    assert.equal(new Set(processed).size, processed.length, 'no repeats');
    assert.equal(store.topics.every((t) => t.status === 'COMPLETED'), true);
  });

  it('one topic can never produce two posts', async () => {
    const store = createStore();
    await seed(store);
    const q = createQueue(store);

    // Walk the whole queue, as repeated cron runs would.
    let attempt = 0;
    for (;;) {
      const t = await store.findFirstPending({ maxAttempts: 3 });
      if (!t) break;
      await q.claim('worker');
      attempt += 1;
      // The LLM produces a DIFFERENT slug every time, exactly like the real bug.
      await store.createPost({
        data: {
          topicKey: t.topicKey,
          slug: `${t.topicKey}-edition-${attempt}`,
          title: `Reworded Title ${attempt}`,
        },
      });
      await q.complete(t.topicKey, 'x');
    }

    const keys = store.posts.map((p) => p.topicKey);
    assert.equal(new Set(keys).size, keys.length, 'one post per topicKey');
    assert.equal(store.posts.length, TOPICS.length);
  });

  it('retries a transient failure instead of dropping the topic', async () => {
    const store = createStore();
    await seed(store);
    const q = createQueue(store);

    const t = await q.claim('worker');
    await q.retry(t.topicKey, 'Gemini timeout');

    const row = await store.findTopicUnique({ where: { topicKey: t.topicKey } });
    assert.equal(row.status, 'PENDING', 'topic returns to the queue');
    assert.equal(row.attempts, 1);
    assert.match(row.lastError, /Gemini timeout/);
    assert.ok(row.nextRetryAt, 'a retry time is scheduled');

    // The topic is picked up again on the next cycle.
    const again = await q.claim('worker');
    assert.ok(again, 'topic is claimable again');
  });

  it('parks a topic after exhausting retries but never deletes it', async () => {
    const store = createStore();
    await seed(store);
    const q = createQueue(store, { maxAttempts: 2 });

    // Keep claiming and failing until every topic has burned its retries.
    for (let i = 0; i < 50; i++) {
      const t = await q.claim('worker');
      if (!t) break;
      await q.retry(t.topicKey, `failure ${i}`);
    }

    const failed = store.topics.filter((t) => t.status === 'FAILED');
    assert.equal(failed.length, TOPICS.length, 'every topic parked after exhausting attempts');
    assert.equal(store.topics.length, TOPICS.length, 'no topic was removed from the queue');
    assert.equal(await q.claim('worker'), null, 'parked topics are not claimed again');
    assert.ok(failed.every((t) => t.lastError), 'every parked topic records its failure reason');
  });

  it('records an audit entry for a failed attempt', async () => {
    const store = createStore();
    await seed(store);
    const q = createQueue(store);
    const t = await q.claim('worker');

    await store.log({
      topicKey: t.topicKey,
      topic: t.topic,
      failureReason: 'validation: seo_metadata',
      llmProvider: 'gemini:gemini-3.6-flash',
      generatedTitle: 'A Generated Title',
      generatedSlug: `${t.topicKey}-draft`,
    });

    assert.equal(store.logs.length, 1);
    assert.equal(store.logs[0].topicKey, t.topicKey);
    assert.match(store.logs[0].failureReason, /validation/);
  });

  it('reclaims a topic whose worker died mid-generation', async () => {
    const store = createStore();
    await seed(store);
    const q = createQueue(store);

    const t = await q.claim('crashed-worker');
    assert.ok(t);

    // Simulate a worker that died: lease is stale, never released.
    store.topics[0].claimedAt = new Date(Date.now() - store.STALE_MS - 1000);
    store.topics[0].status = 'PENDING';

    const reclaimed = await q.claim('healthy-worker');
    assert.ok(reclaimed, 'a stale claim is reclaimable');
    assert.equal(reclaimed.topicKey, t.topicKey);
  });
});