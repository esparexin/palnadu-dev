import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import {
  setupTopicIdentity,
  createStore,
} from './blog-queue-fixtures.mjs';

let toTopicKey;

before(() => {
  const identity = setupTopicIdentity();
  toTopicKey = identity.toTopicKey;
});

describe('bilingual topic queue', () => {
  const EN_TOPIC = 'Website Development Cost in Guntur';
  const TE_TOPIC = 'గుంటూర్‌లో వెబ్‌సైట్ డెవలప్మెంట్ ఖర్చు ఎంతి?';

  it('enqueues the same subject in English and Telugu', async () => {
    const store = createStore();
    const key = toTopicKey(EN_TOPIC);
    assert.equal(toTopicKey(TE_TOPIC), key, 'precondition: shared cross-language identity');

    const en = await store.createTopic({ topicKey: key, topic: EN_TOPIC, language: 'en' });
    const te = await store.createTopic({ topicKey: key, topic: TE_TOPIC, language: 'te' });
    assert.equal(store.topics.length, 2);
    assert.equal(en.language, 'en');
    assert.equal(te.language, 'te');
  });

  it('refuses the same subject twice in one language', async () => {
    const store = createStore();
    const key = toTopicKey(EN_TOPIC);
    await store.createTopic({ topicKey: key, topic: EN_TOPIC, language: 'en' });

    await assert.rejects(
      () => store.createTopic({ topicKey: key, topic: 'reworded English version', language: 'en' }),
      /duplicate key/i,
    );
    assert.equal(store.topics.length, 1);
  });

  it('stores an English and a Telugu post under one topicKey', async () => {
    const store = createStore();
    const key = toTopicKey(EN_TOPIC);

    await store.createPost({ data: { topicKey: key, language: 'en', slug: 'website-cost-guntur', title: 'EN Title' } });
    await store.createPost({ data: { topicKey: key, language: 'te', slug: 'website-cost-guntur-te', title: 'TE Title' } });
    assert.equal(store.posts.length, 2);
  });

  it('refuses a second post for the same topicKey in the same language', async () => {
    const store = createStore();
    const key = toTopicKey(EN_TOPIC);

    await store.createPost({ data: { topicKey: key, language: 'en', slug: 'a', title: 'A' } });
    await assert.rejects(
      () => store.createPost({ data: { topicKey: key, language: 'en', slug: 'b', title: 'B' } }),
      /duplicate key/i,
    );
    assert.equal(store.posts.length, 1);
  });

  it('allows the same slug string in different languages', async () => {
    const store = createStore();
    await store.createPost({ data: { topicKey: 'k1', language: 'en', slug: 'shared-slug', title: 'EN' } });
    await store.createPost({ data: { topicKey: 'k2', language: 'te', slug: 'shared-slug', title: 'TE' } });
    assert.equal(store.posts.length, 2);
  });

  it('still refuses a repeated slug within one language', async () => {
    const store = createStore();
    await store.createPost({ data: { topicKey: 'k1', language: 'en', slug: 'same-slug', title: 'A' } });
    await assert.rejects(
      () => store.createPost({ data: { topicKey: 'k2', language: 'en', slug: 'same-slug', title: 'B' } }),
      /duplicate key/i,
    );
  });
});
