import { HeroSection } from '@/components/sections/hero-section';
import { PhilosophySection } from '@/components/sections/philosophy-section';
import { ServicesSection } from '@/components/sections/services-section';
import { ProcessSection } from '@/components/sections/process-section';
import { TransparencySection } from '@/components/sections/transparency-section';
import { AffordabilitySection } from '@/components/sections/affordability-section';
import { IdentitySection } from '@/components/sections/identity-section';
import { CtaSection } from '@/components/sections/cta-section';
import { siteConfig } from '@palnadu/config';

// JSON-LD structured data
function JsonLd() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'Palnadu.dev',
    url: siteConfig.url,
    logo: `${siteConfig.url}/logo.png`,
    description: siteConfig.description,
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.contact.email,
      contactType: 'customer service',
    },
    sameAs: [siteConfig.links.github, siteConfig.links.twitter, siteConfig.links.linkedin],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Palnadu.dev',
    url: siteConfig.url,
    description: siteConfig.description,
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
