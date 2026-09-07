import type { Metadata } from 'next';
import { siteConfig } from '@palnadu/config';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Discuss Your Idea or Process',
  description:
    'Have a business idea or need to automate a manual process? Talk directly to the engineers at Palnadu.dev for honest, practical digital solutions.',
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

      <section className="py-8 sm:py-12 md:py-16 relative">
        <div className="container max-w-3xl">
          <div className="space-y-3 text-center mb-6 sm:mb-8">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Direct Engineering Consultation
            </p>
            <h1 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight text-balance">
              Have a business idea, or need a digital solution for a manual problem?
            </h1>
            <p className="mx-auto max-w-xl text-xs sm:text-sm md:text-base text-slate-300 leading-relaxed">
              Tell us what you want to build or what manual process you want to automate. We review your requirements and respond directly with honest technical advice.
            </p>
          </div>

          <ContactForm />

          <div className="mt-6 text-center">
            <p className="text-xs text-slate-400">
              Prefer direct email?{' '}
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="font-medium text-cyan-400 hover:underline"
              >
                {siteConfig.contact.email}
              </a>
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
