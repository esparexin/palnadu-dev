import { execFileSync } from 'node:child_process';
import { mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

const SOURCES = ['topic-identity.ts'];
let toTopicKey;
let canonicalizeTopic;

export function setupTopicIdentity() {
  if (toTopicKey && canonicalizeTopic) {
    return { toTopicKey, canonicalizeTopic };
  }
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
  return { toTopicKey, canonicalizeTopic };
}

export function createStore() {
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
      const language = data.language ?? 'en';
      if (topics.some((t) => t.topicKey === data.topicKey && (t.language ?? 'en') === language)) {
        const err = new Error('E11000 duplicate key error collection: blog_topics topic_key_1_language_1');
        err.code = 'P2002';
        throw err;
      }
      const row = { id: `t${topics.length + 1}`, status: 'PENDING', attempts: 0, language, ...data };
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
      const language = data.language ?? 'en';
      if (posts.some((p) => p.topicKey === data.topicKey && (p.language ?? 'en') === language)) {
        const err = new Error(
          `E11000 duplicate key error collection: blog_posts topic_key_1_language_1 (${data.topicKey}, ${language})`,
        );
        err.code = 'P2002';
        throw err;
      }
      if (posts.some((p) => p.slug === data.slug && (p.language ?? 'en') === language)) {
        const err = new Error('E11000 duplicate key error collection: blog_posts language_1_slug_1');
        err.code = 'P2002';
        throw err;
      }
      const row = { id: `p${posts.length + 1}`, language, ...data };
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

export function createQueue(store, opts = {}) {
  const maxAttempts = opts.maxAttempts ?? 3;
  const retryDelayMs = opts.retryDelayMs ?? 60 * 60 * 1000;

  return {
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

export const TOPICS = [
  { topic: 'Website Development Cost in Guntur', category: 'website-development' },
  { topic: 'Mobile App Development Cost in Vijayawada', category: 'app-development' },
  { topic: 'School Admission Portal Software', category: 'school-websites' },
  { topic: 'Local SEO for Clinics in Guntur', category: 'local-seo-business' },
  { topic: 'ERP Software for Wholesale Traders', category: 'website-development' },
  { topic: 'Cold Storage Software in Palnadu', category: 'website-development' },
];

export async function seed(store, toKeyFn) {
  for (const t of TOPICS) {
    await store.createTopic({ topicKey: toKeyFn(t.topic), topic: t.topic, categorySlug: t.category });
  }
}
