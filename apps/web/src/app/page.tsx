import type { Metadata } from 'next';
import { ScrollGlobe } from '@/components/ui/landing-page';
import { siteConfig, getOrganizationSchema, getWebsiteSchema } from '@palnadu/config';
import { DiwaliIntro } from '@/components/homepage/diwali-intro';

// Default Homepage OpenGraph & Canonical Metadata (SSOT for Social Sharing & WhatsApp)
export const metadata: Metadata = {
  title: siteConfig.title,
  description: siteConfig.description,
  alternates: {
    canonical: 'https://www.palnadu.dev/',
  },
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: 'https://www.palnadu.dev/',
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

  const professionalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${siteConfig.url}/#service`,
    name: siteConfig.name,
    url: siteConfig.url,
    parentOrganization: {
      '@type': 'Organization',
      '@id': `${siteConfig.url}/#organization`,
    },
    logo: `${siteConfig.url}/logo.png`,
    image: `${siteConfig.url}/og.png`,
    description: siteConfig.description,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: '₹₹ / $$',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Andhra Pradesh',
      addressCountry: 'IN',
      addressLocality: 'Palnadu',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 16.2359,
      longitude: 80.0499,
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Palnadu' },
      { '@type': 'Country', name: 'India' },
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'Worldwide' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.contact.email,
      contactType: 'customer service',
      availableLanguage: ['English', 'Telugu'],
    },
    sameAs: [siteConfig.links.github, siteConfig.links.twitter, siteConfig.links.linkedin],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${siteConfig.url}/#faq`,
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does Palnadu.dev specialize in?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Palnadu.dev is a problem-first software studio specializing in web applications, mobile apps, custom business software, startup MVP development, business automation, and technical consulting.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does "Start with the problem" mean?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Instead of pushing unnecessary frameworks or features, we diagnose what is broken in your workflow or idea first. We evaluate feasibility, limitations, and future costs before writing any code.',
        },
      },
    ],
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
