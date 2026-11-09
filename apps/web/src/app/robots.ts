import { MetadataRoute } from 'next';
import { siteConfig } from '@palnadu/config';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: ['/', '/_next/static/', '/_next/image/'],
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: ['Googlebot', 'Bingbot'],
        allow: ['/', '/_next/static/', '/_next/image/'],
        disallow: ['/admin/', '/api/'],
      },
      {
        userAgent: [
          'GPTBot',
          'ChatGPT-User',
          'PerplexityBot',
          'ClaudeBot',
          'Google-Extended',
          'Applebot',
        ],
        allow: ['/', '/_next/static/', '/_next/image/'],
        disallow: ['/admin/', '/api/'],
      },
    ],
    sitemap: `${siteConfig.url}/sitemap.xml`,
    host: siteConfig.url,
  };
}
