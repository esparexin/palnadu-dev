import type { Metadata } from 'next';
import { siteConfig } from '@palnadu/config';
import { ContactForm } from './contact-form';

export const metadata: Metadata = {
  title: 'Contact',
  description:
    'Tell us your problem. We help startups, businesses, and individuals find the right digital solution.',
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

      <section className="py-20 md:py-28">
        <div className="container">
          <div className="mx-auto max-w-3xl">
            <div className="space-y-4 text-center">
              <p className="text-sm font-medium uppercase tracking-widest text-muted-foreground">
                Get in touch
              </p>
              <h1 className="text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
                Tell us your problem
              </h1>
              <p className="mx-auto max-w-xl text-lg text-muted-foreground leading-relaxed">
                Describe what you&apos;re dealing with. We&apos;ll listen, understand, and let you
                know how we can help.
              </p>
            </div>

            <div className="mt-12">
              <ContactForm />
            </div>

            <div className="mt-12 text-center">
              <p className="text-sm text-muted-foreground">
                You can also email us directly at{' '}
                <a
                  href={`mailto:${siteConfig.contact.email}`}
                  className="font-medium text-foreground hover:underline"
                >
                  {siteConfig.contact.email}
                </a>
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
