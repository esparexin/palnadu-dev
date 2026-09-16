import { MetadataRoute } from 'next';
import { siteConfig, sitemapPages, services } from '@palnadu/config';
import { api } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = siteConfig.url;

  // ── Static pages (auto-synced from @palnadu/config registry) ──
  const staticPages: MetadataRoute.Sitemap = sitemapPages.map((page) => ({
    url: `${baseUrl}${page.path}`,
    lastModified: new Date(),
    changeFrequency: page.changeFrequency,
    priority: page.priority,
  }));

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

  // ── Dynamic: published blog posts ──
  let blogPages: MetadataRoute.Sitemap = [];
  try {
    const res: any = await api.blog.list({ page: '1', limit: '100' });
    const posts = res?.data || [];
    blogPages = posts.map((post: any) => ({
      url: `${baseUrl}/blog/${post.slug}`,
      lastModified: new Date(post.updatedAt || post.createdAt),
      changeFrequency: 'monthly' as const,
      priority: 0.8,
    }));
  } catch {
    blogPages = [];
  }

  return [...staticPages, ...servicePages, ...caseStudyPages, ...blogPages];
}
