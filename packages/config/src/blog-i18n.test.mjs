import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  blogPostPath,
  blogCanonicalUrl,
  buildHreflangAlternates,
  buildBlogSitemapEntries,
} from '../dist/index.js';

const BASE = 'https://www.palnadu.dev';

describe('localized blog URLs', () => {
  it('keeps the existing English URL unchanged', () => {
    assert.equal(blogPostPath({ slug: 'my-post', language: 'en' }), '/blog/my-post');
  });

  it('resolves Telugu posts under /te/blog/<slug> with no query string', () => {
    const path = blogPostPath({ slug: 'my-post', language: 'te' });
    assert.equal(path, '/te/blog/my-post');
    assert.ok(!path.includes('?'), 'language must be a path segment, not a query param');
  });
});

describe('self-referencing canonicals', () => {
  it('canonicalizes the English page to itself', () => {
    assert.equal(
      blogCanonicalUrl(BASE, { slug: 'my-post', language: 'en' }),
      'https://www.palnadu.dev/blog/my-post',
    );
  });

  it('canonicalizes the Telugu page to itself, never to English', () => {
    assert.equal(
      blogCanonicalUrl(BASE, { slug: 'my-post', language: 'te' }),
      'https://www.palnadu.dev/te/blog/my-post',
    );
  });

  it('produces absolute URLs on the canonical domain', () => {
    const url = blogCanonicalUrl(BASE, { slug: 'x', language: 'te' });
    assert.ok(url.startsWith('https://www.palnadu.dev/'));
  });
});

describe('hreflang alternates', () => {
  it('links English and Telugu reciprocally with x-default to English', () => {
    const en = buildHreflangAlternates(
      BASE,
      { slug: 'prices', language: 'en' },
      [{ slug: 'prices', language: 'te' }],
    );
    assert.equal(en.canonical, 'https://www.palnadu.dev/blog/prices');
    assert.equal(en.languages.en, 'https://www.palnadu.dev/blog/prices');
    assert.equal(en.languages.te, 'https://www.palnadu.dev/te/blog/prices');
    assert.equal(en.languages['x-default'], 'https://www.palnadu.dev/blog/prices');

    const te = buildHreflangAlternates(
      BASE,
      { slug: 'prices', language: 'te' },
      [{ slug: 'prices', language: 'en' }],
    );
    assert.equal(te.canonical, 'https://www.palnadu.dev/te/blog/prices');
    assert.equal(te.languages.en, 'https://www.palnadu.dev/blog/prices');
    assert.equal(te.languages.te, 'https://www.palnadu.dev/te/blog/prices');
    assert.equal(te.languages['x-default'], 'https://www.palnadu.dev/blog/prices');
  });

  it('emits no alternate for a translation that does not exist', () => {
    const solo = buildHreflangAlternates(BASE, { slug: 'solo', language: 'en' }, []);
    assert.deepEqual(Object.keys(solo.languages).sort(), ['en', 'x-default']);
    assert.ok(!('te' in solo.languages));
  });

  it('points x-default at the page itself when only Telugu exists', () => {
    const teOnly = buildHreflangAlternates(BASE, { slug: 'only-te', language: 'te' }, []);
    assert.equal(teOnly.languages['x-default'], 'https://www.palnadu.dev/te/blog/only-te');
    assert.ok(!('en' in teOnly.languages));
  });

  it('ignores a same-language entry in the translation list', () => {
    const res = buildHreflangAlternates(
      BASE,
      { slug: 'a', language: 'en' },
      [{ slug: 'a', language: 'en' }],
    );
    assert.deepEqual(Object.keys(res.languages).sort(), ['en', 'x-default']);
  });
});

describe('sitemap entries', () => {
  it('emits both localized URLs', () => {
    const entries = buildBlogSitemapEntries(BASE, [
      { slug: 'prices', language: 'en', status: 'PUBLISHED', translationGroupId: 'g1' },
      { slug: 'prices', language: 'te', status: 'PUBLISHED', translationGroupId: 'g1' },
    ]);
    const urls = entries.map((e) => e.url).sort();
    assert.deepEqual(urls, [
      'https://www.palnadu.dev/blog/prices',
      'https://www.palnadu.dev/te/blog/prices',
    ]);
  });

  it('never emits duplicate entries for the same URL', () => {
    const entries = buildBlogSitemapEntries(BASE, [
      { slug: 'dup', language: 'en', status: 'PUBLISHED' },
      { slug: 'dup', language: 'en', status: 'PUBLISHED' },
    ]);
    assert.equal(entries.length, 1);
  });

  it('attaches alternates only where a translation exists', () => {
    const entries = buildBlogSitemapEntries(BASE, [
      { slug: 'paired', language: 'en', status: 'PUBLISHED', translationGroupId: 'g1' },
      { slug: 'paired', language: 'te', status: 'PUBLISHED', translationGroupId: 'g1' },
      { slug: 'solo', language: 'en', status: 'PUBLISHED' },
    ]);
    const paired = entries.find((e) => e.url.endsWith('/blog/paired'));
    const solo = entries.find((e) => e.url.endsWith('/blog/solo'));
    assert.ok(paired.alternates, 'paired post should carry alternates');
    assert.equal(paired.alternates.languages.te, 'https://www.palnadu.dev/te/blog/paired');
    assert.equal(solo.alternates, undefined, 'standalone post must not carry alternates');
  });

  it('keeps archived posts at lower priority', () => {
    const entries = buildBlogSitemapEntries(BASE, [
      { slug: 'old', language: 'en', status: 'ARCHIVED' },
    ]);
    assert.equal(entries[0].priority, 0.5);
  });
});
