import type { Metadata } from 'next';
import { siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
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
    '@id': `${siteConfig.url}/work/#webpage`,
    name: 'Our Work | Palnadu.dev',
    description:
      'A visual collection of our most recent works — each piece crafted with intention, emotion and style.',
    url: `${siteConfig.url}/work`,
    creator: getOrganizationRef(),
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'Work', path: '/work' },
  ]);

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
