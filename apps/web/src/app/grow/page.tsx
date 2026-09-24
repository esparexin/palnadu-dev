import type { Metadata } from 'next';
import { siteConfig } from '@palnadu/config';
import { GrowExperienceClient } from './grow-client';

export const metadata: Metadata = {
  title: 'Digital Marketing & Business Growth | Palnadu.dev',
  description:
    'Palnadu.dev helps local and growing businesses build their digital presence, reach the right audience, and turn online visibility into real business opportunities.',
  keywords: [
    'Digital Marketing Palnadu',
    'Local SEO Guntur',
    'Business Growth Andhra Pradesh',
    'Google Maps Optimization Narasaraopet',
    'Website Development and SEO',
    'Online Advertising ROAS',
    'Palnadu software company',
  ],
  alternates: {
    canonical: '/grow',
  },
  openGraph: {
    title: 'Digital Marketing & Business Growth | Palnadu.dev',
    description:
      'Turn online visibility into genuine business growth. High-speed web platforms, local search authority, and transparent performance telemetry.',
    url: `${siteConfig.url}/grow`,
    siteName: siteConfig.name,
    locale: 'en_IN',
    type: 'website',
    images: [
      {
        url: siteConfig.ogImage,
        width: 1200,
        height: 630,
        alt: 'Palnadu.dev Digital Marketing & Business Growth',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Digital Marketing & Business Growth | Palnadu.dev',
    description:
      'Turn online visibility into genuine business opportunities. Local SEO, web engineering, and performance telemetry.',
    images: [siteConfig.ogImage],
    creator: '@palnadudev',
  },
};

export default function GrowPage() {
  /**
   * Unified Schema.org Graph without duplicates or entity conflicts.
   * Google's recommended architecture for connecting WebPage, Service, and Breadcrumbs.
   */
  const unifiedSchemaGraph = {
    '@context': 'https://schema.org',
    '@graph': [
      // 1. WebPage Entity
      {
        '@type': 'WebPage',
        '@id': `${siteConfig.url}/grow/#webpage`,
        url: `${siteConfig.url}/grow`,
        name: 'Digital Marketing & Business Growth | Palnadu.dev',
        description:
          'Palnadu.dev helps local and growing businesses build their digital presence, reach the right audience, and turn online visibility into real business opportunities.',
        isPartOf: {
          '@type': 'WebSite',
          '@id': `${siteConfig.url}/#website`,
          name: siteConfig.name,
          url: siteConfig.url,
        },
        breadcrumb: {
          '@id': `${siteConfig.url}/grow/#breadcrumb`,
        },
        about: {
          '@id': `${siteConfig.url}/grow/#service`,
        },
      },

      // 2. Breadcrumb Navigation Entity
      {
        '@type': 'BreadcrumbList',
        '@id': `${siteConfig.url}/grow/#breadcrumb`,
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
            name: 'Grow',
            item: `${siteConfig.url}/grow`,
          },
        ],
      },

      // 3. Service Entity (Unlocks Google Rich Snippets & Local Search Relevance)
      {
        '@type': 'Service',
        '@id': `${siteConfig.url}/grow/#service`,
        name: 'Digital Marketing & Business Growth Engineering',
        serviceType: 'Digital Marketing',
        description:
          'Data-driven digital marketing, search engine optimization, regional Google Maps dominance, and lead acquisition telemetry.',
        provider: {
          '@type': 'Organization',
          '@id': `${siteConfig.url}/#organization`,
          name: siteConfig.name,
          url: siteConfig.url,
        },
        areaServed: [
          { '@type': 'AdministrativeArea', name: 'Palnadu' },
          { '@type': 'AdministrativeArea', name: 'Guntur' },
          { '@type': 'AdministrativeArea', name: 'Andhra Pradesh' },
          { '@type': 'Country', name: 'India' },
        ],
        hasOfferCatalog: {
          '@type': 'OfferCatalog',
          name: 'Core Growth Deliverables',
          itemListElement: [
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Search Engine Optimization & Core Web Vitals',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Local Digital Marketing & Google Business Profile',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Targeted Search & Meta Advertising',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Social Media Marketing & Brand Voice',
              },
            },
            {
              '@type': 'Offer',
              itemOffered: {
                '@type': 'Service',
                name: 'Conversion Tracking & WhatsApp Origin Telemetry',
              },
            },
          ],
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(unifiedSchemaGraph) }}
      />
      <main className="w-full min-h-screen">
        <GrowExperienceClient />
      </main>
    </>
  );
}
