import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import {
  siteConfig,
  blogCanonicalUrl,
  buildHreflangAlternates,
  type BlogLocale,
} from '@palnadu/config';
import { api } from '@/lib/api';

/**
 * Shared data + SEO layer for localized blog article pages.
 *
 * `/blog/<slug>` calls these with `'en'`, `/te/blog/<slug>` with `'te'`.
 * Both routes resolve through the same code, so English rendering cannot
 * drift from Telugu rendering, and canonical/hreflang rules apply equally.
 */

/** Fetch one post in one language. 404s when the slug is not in that locale. */
export async function getLocalizedPost(slug: string, locale: BlogLocale): Promise<any> {
  let post: any = null;
  try {
    const res: any = await api.blog.getBySlug(slug, locale);
    post = res?.data;
  } catch {
    notFound();
  }

  // Language is authoritative: a slug that resolves in the other locale must
  // not render here (e.g. /te/blog/<english-slug>).
  if (!post || (post.language ?? 'en') !== locale) {
    notFound();
  }
  return post;
}

/** Absolute self-referencing canonical for a post. */
export function articleCanonical(post: { slug: string; language?: string }): string {
  return blogCanonicalUrl(siteConfig.url, {
    slug: post.slug,
    language: (post.language ?? 'en') as BlogLocale,
  });
}

/** Translations as the API returns them, normalized for the SEO helpers. */
export function articleTranslations(post: any): { slug: string; language: BlogLocale }[] {
  const list = Array.isArray(post?.translations) ? post.translations : [];
  return list
    .filter((t: any) => typeof t?.slug === 'string' && (t.language === 'en' || t.language === 'te'))
    .map((t: any) => ({ slug: t.slug, language: t.language as BlogLocale }));
}

/** Full <head> metadata for an article page: self canonical + hreflang. */
export function buildArticleMetadata(post: any, locale: BlogLocale): Metadata {
  const canonical = articleCanonical({ ...post, language: locale });
  const alternates = buildHreflangAlternates(
    siteConfig.url,
    { slug: post.slug, language: locale },
    articleTranslations(post),
  );

  const title = post.seoTitle ? { absolute: post.seoTitle } : post.title;
  const ogTitle = post.seoTitle || `${post.title} | ${siteConfig.name}`;
  const description = post.seoDescription || post.excerpt || siteConfig.description;
  const ogImage = post.ogImage || post.coverImage || `${siteConfig.url}/og.png`;

  return {
    title,
    description,
    alternates: {
      canonical,
      languages: { ...alternates.languages },
    },
    openGraph: {
      title: ogTitle,
      description,
      url: canonical,
      type: 'article',
      publishedTime: post.publishDate || post.createdAt,
      images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: 'summary_large_image',
      title: ogTitle,
      description,
      images: [ogImage],
    },
  };
}

/** Base path for in-article navigation (back link, category, related). */
export function articleBasePath(locale: BlogLocale): string {
  return locale === 'te' ? '/te/blog' : '/blog';
}

/** Locale tag for date formatting and JSON-LD inLanguage. */
export function articleDateLocale(locale: BlogLocale): string {
  return locale === 'te' ? 'te-IN' : 'en-US';
}
