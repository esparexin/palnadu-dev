import type { Metadata } from 'next';
import { siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { WorkClient } from './work-client';

export const metadata: Metadata = {
  title: 'Our Work',
  description:
    'Explore practical software platforms, web applications, and business systems engineered by Palnadu.dev for businesses in Andhra Pradesh.',
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
      'Explore practical software platforms, web applications, and business systems engineered by Palnadu.dev for businesses in Andhra Pradesh.',
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
