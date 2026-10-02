import { MetadataRoute } from 'next';
import {
  siteConfig,
  sitemapPages,
  services,
  buildBlogSitemapEntries,
  type BlogLocale,
} from '@palnadu/config';
import { api } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // ── Static pages (auto-synced from @palnadu/config registry) ──
  const staticPages: MetadataRoute.Sitemap = sitemapPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
    // The Telugu blog index alternates with the English one; both always
    // exist, so both alternates are always safe to emit.
    ...(page.path === '/blog'
      ? {
          alternates: {
            languages: {
              en: `${baseUrl}/blog`,
              te: `${baseUrl}/te/blog`,
              'x-default': `${baseUrl}/blog`,
            },
          },
        }
      : {}),
  }));

  // ── Telugu blog index (paired with /blog above) ──
  const teBlogIndex: MetadataRoute.Sitemap = [
    {
      url: `${baseUrl}/te/blog`,
      lastModified: new Date(),
      changeFrequency: 'weekly' as const,
      priority: 0.8,
      alternates: {
        languages: {
          en: `${baseUrl}/blog`,
          te: `${baseUrl}/te/blog`,
          'x-default': `${baseUrl}/blog`,
        },
      },
    },
  ];

  // ── Dynamic: individual service pages ──
  const servicePages: MetadataRoute.Sitemap = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // ── Dynamic: published case studies ──
  let caseStudyPages: MetadataRoute.Sitemap = [];
  try {
    const res: any = await api.caseStudies.list();
    const studies = res?.data || [];
    caseStudyPages = studies
      .filter((study: any) => study.status === 'PUBLISHED' || !study.status)
      .map((study: any) => ({
        url: `${baseUrl}/work/${study.slug}`,
        lastModified: new Date(study.updatedAt || study.createdAt),
        changeFrequency: 'monthly' as const,
        priority: 0.8,
      }));
  } catch {
    caseStudyPages = [];
  }

  // ── Dynamic: published & archived blog posts, both languages ──
  // Deliberately unfiltered by language: every locale gets its own URL.
  // Entries are deduplicated by URL and carry hreflang alternates only for
  // translations that exist in this same dataset.
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const res: any = await api.blog.list({ page: '1', limit: '500', includeArchived: 'true' });
    const posts = res?.data || [];
    blogPages = buildBlogSitemapEntries(
      baseUrl,
      posts.map((post: any) => ({
        slug: post.slug,
        language: (post.language ?? 'en') as BlogLocale,
        status: post.status,
        updatedAt: post.updatedAt,
        createdAt: post.createdAt,
        translationGroupId: post.translationGroupId ?? null,
      })),
    ).map((entry) => ({
      url: entry.url,
      lastModified: entry.lastModified,
      changeFrequency: entry.changeFrequency,
      priority: entry.priority,
      ...(entry.alternates ? { alternates: entry.alternates } : {}),
    }));
  } catch {
    blogPages = [];
  }

  return [...staticPages, ...teBlogIndex, ...servicePages, ...caseStudyPages, ...blogPages];
}
