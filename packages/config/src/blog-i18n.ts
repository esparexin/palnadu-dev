/**
 * Single source of truth for localized blog URLs, canonicals, and hreflang.
 *
 * URL scheme (deliberate, path-based — never query strings):
 *   English: /blog/<slug>
 *   Telugu:  /te/blog/<slug>
 *
 * All functions are pure so they can be unit tested without Next.js or Prisma.
 * The web app imports these for pages and the sitemap; both languages resolve
 * through the same code path, so the scheme cannot drift between them.
 */

export type BlogLocale = 'en' | 'te';

export const DEFAULT_BLOG_LOCALE: BlogLocale = 'en';

/** A translation as the sitemap/pages know it: slug + language. */
export interface BlogTranslationRef {
  slug: string;
  language: BlogLocale;
}

/** A post as the sitemap builder knows it. */
export interface SitemapBlogPost {
  slug: string;
  language: BlogLocale;
  status: 'PUBLISHED' | 'ARCHIVED' | string;
  updatedAt?: string | Date | null;
  createdAt?: string | Date | null;
  /** Explicit localization relationship. Null/undefined = standalone article. */
  translationGroupId?: string | null;
}

/** Relative path for a post in its own language. */
export function blogPostPath(post: { slug: string; language: BlogLocale }): string {
  return post.language === 'te' ? `/te/blog/${post.slug}` : `/blog/${post.slug}`;
}

/** Absolute URL for a relative path, against the canonical domain. */
export function absoluteBlogUrl(baseUrl: string, path: string): string {
  return `${baseUrl.replace(/\/$/, '')}${path}`;
}

/**
 * Self-referencing canonical for a post. Always derived from language + slug,
 * never from a stored string: a stale or cross-language `canonicalUrl` in the
 * database must not be able to point a Telugu page at its English sibling.
 */
export function blogCanonicalUrl(
  baseUrl: string,
  post: { slug: string; language: BlogLocale },
): string {
  return absoluteBlogUrl(baseUrl, blogPostPath(post));
}

export interface HreflangAlternates {
  canonical: string;
  /** Only locales whose URL actually exists. */
  languages: Partial<Record<BlogLocale | 'x-default', string>>;
}

/**
 * hreflang alternates for one post.
 *
 * Rules:
 * - canonical is always the page's own absolute URL (self-referencing).
 * - an alternate is emitted only for a translation that exists (published or
 *   archived sibling in the group), plus the page itself.
 * - `x-default` points at the English URL when one exists, else at the page
 *   itself. It is never pointed at a nonexistent URL.
 */
export function buildHreflangAlternates(
  baseUrl: string,
  self: { slug: string; language: BlogLocale },
  translations: BlogTranslationRef[],
): HreflangAlternates {
  const canonical = blogCanonicalUrl(baseUrl, self);
  const languages: Partial<Record<BlogLocale | 'x-default', string>> = {
    [self.language]: canonical,
  };

  for (const t of translations) {
    if (t.language !== self.language) {
      languages[t.language] = blogCanonicalUrl(baseUrl, t);
    }
  }

  languages['x-default'] = languages.en ?? canonical;

  return { canonical, languages };
}

export interface SitemapBlogEntry {
  url: string;
  lastModified: Date;
  changeFrequency: 'monthly';
  priority: number;
  alternates?: { languages: Record<string, string> };
}

/**
 * Sitemap entries for blog posts, grouped by translation relationship.
 *
 * - One entry per URL; duplicates collapse (first occurrence wins).
 * - `alternates.languages` mirrors the hreflang rule: only existing
 *   translations, plus `x-default`.
 * - Archived posts are included at lower priority (existing behaviour kept).
 */
export function buildBlogSitemapEntries(
  baseUrl: string,
  posts: SitemapBlogPost[],
): SitemapBlogEntry[] {
  const byUrl = new Map<string, SitemapBlogEntry>();

  // Index group members first so alternates resolve from the same dataset and
  // can never reference a post that isn't itself in the sitemap.
  const groups = new Map<string, SitemapBlogPost[]>();
  for (const p of posts) {
    if (!p.translationGroupId) continue;
    const list = groups.get(p.translationGroupId) ?? [];
    list.push(p);
    groups.set(p.translationGroupId, list);
  }

  for (const p of posts) {
    const url = blogCanonicalUrl(baseUrl, p);
    if (byUrl.has(url)) continue;

    const entry: SitemapBlogEntry = {
      url,
      lastModified: new Date(p.updatedAt || p.createdAt || Date.now()),
      changeFrequency: 'monthly',
      priority: p.status === 'ARCHIVED' ? 0.5 : 0.8,
    };

    const siblings = (p.translationGroupId ? groups.get(p.translationGroupId) ?? [] : []).filter(
      (s) => s.slug !== p.slug || s.language !== p.language,
    );
    if (siblings.length > 0) {
      const alternates = buildHreflangAlternates(
        baseUrl,
        { slug: p.slug, language: p.language },
        siblings.map((s) => ({ slug: s.slug, language: s.language })),
      );
      entry.alternates = { languages: { ...alternates.languages } as Record<string, string> };
    }

    byUrl.set(url, entry);
  }

  return [...byUrl.values()];
}
