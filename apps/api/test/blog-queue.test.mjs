import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  setupTopicIdentity,
  createStore,
  createQueue,
  TOPICS,
  seed,
} from './blog-queue-fixtures.mjs';

let toTopicKey;
let canonicalizeTopic;

before(() => {
  const identity = setupTopicIdentity();
  toTopicKey = identity.toTopicKey;
  canonicalizeTopic = identity.canonicalizeTopic;
});

describe('durable topic queue', () => {
  it('resolves topic keys independent of LLM title/slug', () => {
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
    await seed(store, toTopicKey);
    const q = createQueue(store);

    const [a, b] = await Promise.all([q.claim('worker-a'), q.claim('worker-b')]);
    const claimed = [a, b].filter(Boolean);
    const keys = claimed.map((t) => t.topicKey);
    assert.equal(new Set(keys).size, keys.length, 'no topic claimed twice');

    const claimedRows = store.topics.filter((t) => t.status === 'CLAIMED');
    assert.equal(claimedRows.length, keys.length, 'exactly the claimed rows are CLAIMED');
  });

  it('never hands out the same topic twice across many cycles', async () => {
    const store = createStore();
    await seed(store, toTopicKey);
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
    await seed(store, toTopicKey);
    const q = createQueue(store);

    let attempt = 0;
    for (;;) {
      const t = await store.findFirstPending({ maxAttempts: 3 });
      if (!t) break;
      await q.claim('worker');
      attempt += 1;
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
    await seed(store, toTopicKey);
    const q = createQueue(store);

    const t = await q.claim('worker');
    await q.retry(t.topicKey, 'Gemini timeout');

    const row = await store.findTopicUnique({ where: { topicKey: t.topicKey } });
    assert.equal(row.status, 'PENDING', 'topic returns to the queue');
    assert.equal(row.attempts, 1);
    assert.match(row.lastError, /Gemini timeout/);
    assert.ok(row.nextRetryAt, 'a retry time is scheduled');

    const again = await q.claim('worker');
    assert.ok(again, 'topic is claimable again');
  });

  it('parks a topic after exhausting retries but never deletes it', async () => {
    const store = createStore();
    await seed(store, toTopicKey);
    const q = createQueue(store, { maxAttempts: 2 });

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
    await seed(store, toTopicKey);
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
    await seed(store, toTopicKey);
    const q = createQueue(store);

    const t = await q.claim('crashed-worker');
    assert.ok(t);

    store.topics[0].claimedAt = new Date(Date.now() - store.STALE_MS - 1000);
    store.topics[0].status = 'PENDING';

    const reclaimed = await q.claim('healthy-worker');
    assert.ok(reclaimed, 'a stale claim is reclaimable');
    assert.equal(reclaimed.topicKey, t.topicKey);
  });
});
