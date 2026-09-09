import { MetadataRoute } from 'next';
import { services } from '@palnadu/config';
import { api } from '@/lib/api';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const baseUrl = 'https://palnadu.dev';

  const staticPages = [
    '',
    '/about',
    '/services',
    '/work',
    '/blog',
    '/contact',
    '/privacy',
    '/terms',
  ].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === '' ? ('weekly' as const) : ('monthly' as const),
    priority: route === '' ? 1 : route === '/services' ? 0.9 : 0.7,
  }));

  const servicePages = services.map((service) => ({
    url: `${baseUrl}/services/${service.slug}`,
    lastModified: new Date(),
    changeFrequency: 'monthly' as const,
    priority: 0.8,
  }));

  // Dynamically include published blog posts in Google sitemap
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

  return [...staticPages, ...servicePages, ...blogPages];
}
