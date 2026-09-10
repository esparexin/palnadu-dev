import type { Metadata } from 'next';
import { siteConfig } from '@palnadu/config';
import { ContactSection } from '@/components/ui/contact';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Share your business idea or the manual process you want to solve. We reply with direct, honest technical advice.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Palnadu.dev',
    url: `${siteConfig.url}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Palnadu.dev',
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactSection />
    </>
  );
}
