import type { Metadata } from 'next';
import { siteConfig, getBreadcrumbSchema } from '@palnadu/config';
import {
  DataDeletionIntro,
  DataDeletionScope,
  DataDeletionSteps,
} from './data-deletion-sections';
import {
  DataDeletionProcess,
  DataDeletionExceptions,
  DataDeletionContact,
} from './data-deletion-details';

export const metadata: Metadata = {
  title: 'User Data Deletion Request',
  description:
    'Instructions and process for requesting deletion of personal data and communication records collected by Palnadu.dev, including Meta WhatsApp integration data.',
  alternates: {
    canonical: '/data-deletion',
  },
  openGraph: {
    title: 'User Data Deletion Request | Palnadu.dev',
    description:
      'Instructions and process for requesting deletion of personal data and communication records collected by Palnadu.dev, including Meta WhatsApp integration data.',
    url: `${siteConfig.url}/data-deletion`,
    siteName: siteConfig.name,
    locale: 'en_IN',
    type: 'website',
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function DataDeletionPage() {
  const webPageJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'WebPage',
    '@id': `${siteConfig.url}/data-deletion/#webpage`,
    url: `${siteConfig.url}/data-deletion`,
    name: 'User Data Deletion Request | Palnadu.dev',
    description:
      'Instructions and process for requesting deletion of personal data and communication records collected by Palnadu.dev, including Meta WhatsApp integration data.',
    isPartOf: {
      '@type': 'WebSite',
      '@id': `${siteConfig.url}/#website`,
      name: siteConfig.name,
      url: siteConfig.url,
    },
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'User Data Deletion Request', path: '/data-deletion' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(webPageJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="bg-white">
        <section className="py-14 sm:py-20">
          <div className="container">
            <div className="mx-auto max-w-3xl space-y-10">
              <DataDeletionIntro />
              <DataDeletionScope />
              <DataDeletionSteps />
              <DataDeletionProcess />
              <DataDeletionExceptions />
              <DataDeletionContact />
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
