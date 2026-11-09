import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { ScrollGlobe } from '@/components/ui/landing-page';
import {
  siteConfig,
  getOrganizationSchema,
  getWebsiteSchema,
  getProfessionalServiceSchema,
} from '@palnadu/config';
import { HOMEPAGE_FAQS } from '@/components/ui/landing-faq';

const DiwaliIntro = dynamic(
  () => import('@/components/homepage/diwali-intro').then((m) => m.DiwaliIntro)
);

// Default Homepage OpenGraph & Canonical Metadata (SSOT for Social Sharing & WhatsApp)
export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: siteConfig.url,
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: siteConfig.url,
    title: siteConfig.title,
    description: siteConfig.description,
    siteName: siteConfig.name,
    images: [
      {
        url: 'https://www.palnadu.dev/og.png',
        secureUrl: 'https://www.palnadu.dev/og.png',
        width: 1200,
        height: 630,
        type: 'image/png',
        alt: siteConfig.name,
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: siteConfig.title,
    description: siteConfig.description,
    images: ['https://www.palnadu.dev/og.png'],
    creator: '@palnadudev',
  },
};

// Comprehensive Google SEO Structured Data (JSON-LD)
function JsonLd() {
  const organizationSchema = getOrganizationSchema();
  const websiteSchema = getWebsiteSchema();
  const professionalServiceSchema = getProfessionalServiceSchema();

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteConfig.url}/#faq`,
    mainEntity: HOMEPAGE_FAQS.map((item) => ({
      '@type': 'Question',
      name: item.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.answer,
      },
    })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <DiwaliIntro />
      <ScrollGlobe />
    </>
  );
}
