import { HeroSection } from '@/components/sections/hero-section';
import { PhilosophySection } from '@/components/sections/philosophy-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProcessSection } from '@/components/sections/process-section';
import { TransparencySection } from '@/components/sections/transparency-section';
import { AffordabilitySection } from '@/components/sections/affordability-section';
import { IdentitySection } from '@/components/sections/identity-section';
import { CtaSection } from '@/components/sections/cta-section';
import { siteConfig } from '@palnadu/config';

// Comprehensive Google SEO Structured Data (JSON-LD)
function JsonLd() {
  const professionalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Palnadu.dev',
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    image: `${siteConfig.url}/og.png`,
    description: siteConfig.description,
    telephone: '+91',
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

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Palnadu.dev',
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      '@type': 'Organization',
      name: 'Palnadu.dev',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does Palnadu.dev specialize in?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Palnadu.dev is a problem-first software studio specializing in web applications, mobile apps (iOS & Android), custom business software, startup MVP development, business automation, and technical consulting.',
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
      {
        '@type': 'Question',
        name: 'How does Palnadu.dev keep development affordable?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We put a boundary on price, not on quality. Affordability comes from choosing practical architecture, avoiding unnecessary features, phased milestone development, and eliminating technical bloat.',
        },
      },
      {
        '@type': 'Question',
        name: 'Can I reach out if I am not sure which technology I need?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Yes! You do not need to know whether you need a native app, SaaS platform, or script. Tell us your problem and we will help determine the right solution.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
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
      <HeroSection />
      <PhilosophySection />
      <ServicesSection />
      <ProcessSection />
      <TransparencySection />
      <AffordabilitySection />
      <IdentitySection />
      <CtaSection />
    </>
  );
}
