import type { Metadata } from 'next';
import Link from 'next/link';
import { services, siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { HeroParallax } from '@/components/blocks/hero-parallax';
import { CtaSection } from '@/components/sections/cta-section';
import { actualServiceDetails, products } from './services-data';

export const metadata: Metadata = {
  title: 'Engineering Services & Digital Solutions',
  description:
    'Explore our complete portfolio: website development, UI/UX design, custom web applications, mobile apps, software engineering, digital marketing, SEO/AEO/GEO, QA testing, and practical training.',
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesPage() {
  const servicesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Palnadu.dev Engineering & Digital Solutions',
    description:
      'Complete engineering and digital growth portfolio: websites, web apps, software engineering, digital marketing, SEO, AEO, GEO, QA testing, and real-time training.',
    url: `${siteConfig.url}/services`,
    provider: getOrganizationRef(),
    itemListElement: services.map((service, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: service.title,
      url: `${siteConfig.url}/services/${service.slug}`,
      description: service.shortDescription,
    })),
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'Services', path: '/services' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(servicesJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="bg-white">
        <HeroParallax products={products} />

        <section className="py-16 sm:py-24 bg-white border-t border-palnadu-border" id="capabilities-list">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6">
            <div className="mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-palnadu-dark leading-tight">
                Software Engineering, Web Development & Digital Growth Capabilities
              </h2>
              <p className="mt-3 text-base sm:text-lg text-palnadu-body leading-relaxed max-w-2xl">
                Every project at Palnadu.dev is built by software engineers working directly with business owners. We focus on dependable architecture, clear timelines, and digital solutions that genuinely support your business operations and growth.
              </p>
            </div>

            <div className="divide-y divide-palnadu-border/60 border-y border-palnadu-border">
              {services.map((service) => {
                const detail = actualServiceDetails[service.slug] || {
                  summary: service.shortDescription,
                  deliverables: [],
                };

                return (
                  <article
                    key={service.slug}
                    className="py-6 sm:py-8 first:pt-6 last:pb-6 transition-colors hover:bg-palnadu-off-white/60 rounded-xl px-3 -mx-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="max-w-2xl space-y-2">
                        <h3 className="text-lg sm:text-xl font-bold text-palnadu-dark leading-snug">
                          <Link
                            href={`/services/${service.slug}`}
                            className="text-palnadu-dark hover:text-palnadu-blue transition-colors"
                          >
                            {service.title}
                          </Link>
                        </h3>

                        <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
                          {detail.summary}
                        </p>

                        {detail.deliverables.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {detail.deliverables.map((item) => (
                              <span
                                key={item}
                                className="text-xs text-palnadu-body bg-palnadu-off-white rounded-md px-2.5 py-1"
                              >
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>

                      <div className="pt-1 sm:pt-0 shrink-0">
                        <Link
                          href={`/services/${service.slug}`}
                          className="text-sm font-semibold text-palnadu-blue hover:text-palnadu-dark-hover transition-colors"
                        >
                          View service details
                        </Link>
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </section>

        <CtaSection />
      </div>
    </>
  );
}
