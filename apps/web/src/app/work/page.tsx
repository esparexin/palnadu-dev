import type { Metadata } from 'next';
import { siteConfig } from '@palnadu/config';
import { WorkClient } from './work-client';

export const metadata: Metadata = {
  title: 'Our Work',
  description:
    'A visual collection of our most recent works — each piece crafted with intention, emotion and style. See what Palnadu.dev engineers build.',
  alternates: {
    canonical: '/work',
  },
};

export default function WorkPage() {
  const collectionJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'Our Work | Palnadu.dev',
    description:
      'A visual collection of our most recent works — each piece crafted with intention, emotion and style.',
    url: `${siteConfig.url}/work`,
    creator: {
      '@type': 'Organization',
      name: 'Palnadu.dev',
      url: siteConfig.url,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Work',
        item: `${siteConfig.url}/work`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <WorkClient />
    </>
  );
}
