import type { Metadata } from 'next';
import { siteConfig } from '@palnadu/config';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Share your business idea or the manual process you want to solve. We reply with direct, honest technical advice.',
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
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <section className="py-8 sm:py-12 md:py-16">
        <div className="container max-w-xl">
          <div className="space-y-2 text-center mb-6">
            <h1 className="text-xl sm:text-2xl md:text-3xl font-bold text-white">
              Contact Us
            </h1>
            <p className="text-sm text-slate-400">
              Have a business idea or a manual process you want to automate? Tell us below.
            </p>
          </div>

          <ContactForm />

          <div className="mt-6 text-center text-xs text-slate-500">
            You can also email us directly at{' '}
            <a
              href={`mailto:${siteConfig.contact.email}`}
              className="text-slate-300 hover:underline"
            >
              {siteConfig.contact.email}
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
