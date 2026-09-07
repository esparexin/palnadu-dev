import { MetadataRoute } from 'next';
import { services } from '@palnadu/config';

export default function sitemap(): MetadataRoute.Sitemap {
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

  return [...staticPages, ...servicePages];
}
