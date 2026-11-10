import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig, getBreadcrumbSchema } from '@palnadu/config';
import { CtaSection } from '@/components/sections/cta-section';
import { ArrowRight, CheckCircle2 } from 'lucide-react';
import { industrySectors } from './industries-data';

export const metadata: Metadata = {
  title: 'Industries We Serve in Palnadu & Andhra Pradesh',
  description:
    'Custom software development, web applications, and automation tailored for startups, schools, healthcare clinics, wholesale traders, and regional businesses in Palnadu and Guntur.',
  alternates: {
    canonical: '/industries',
  },
};

export default function IndustriesPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Industries Served by Palnadu.dev',
    description: 'Custom software engineering and web application development across regional industry verticals.',
    url: `${siteConfig.url}/industries`,
    itemListElement: industrySectors.map((sector, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: sector.name,
      description: sector.overview,
    })),
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'Industries', path: '/industries' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="bg-white">
        {/* Main Section */}
        <section className="py-14 sm:py-20">
          <div className="container max-w-5xl space-y-12">
            {/* Semantic H1 Heading */}
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
                Commercial Sectors
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
                Software Solutions Tailored to Your Industry
              </h1>
              <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
                We engineer practical, problem-first software around the specific commercial workflows of businesses, educational institutions, and healthcare providers in Palnadu, Guntur, and beyond.
              </p>
            </div>

            {/* In-Depth Industry Vertical Cards */}
            <div className="grid gap-6 md:grid-cols-2">
              {industrySectors.map((sector) => {
                const Icon = sector.icon;
                return (
                  <div
                    key={sector.slug}
                    className="rounded-xl border border-palnadu-border bg-white p-6 sm:p-7 shadow-sm hover:border-palnadu-blue hover:shadow-sm transition-all flex flex-col justify-between space-y-5"
                  >
                    <div className="space-y-4">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-lg bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center shrink-0 shadow-sm">
                          <Icon className="h-5 w-5" />
                        </div>
                        <div>
                          <h2 className="text-base sm:text-lg font-bold text-palnadu-dark leading-snug">
                            {sector.name}
                          </h2>
                          <p className="text-xs font-mono text-palnadu-teal font-semibold">
                            {sector.subtitle}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed">
                        {sector.overview}
                      </p>

                      <div className="pt-2 space-y-2 border-t border-palnadu-border/60">
                        <p className="text-xs font-mono uppercase tracking-wider text-palnadu-secondary font-bold">
                          Core Solutions Delivered:
                        </p>
                        <ul className="grid gap-1.5 text-xs text-palnadu-body">
                          {sector.deliverables.map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                              <CheckCircle2 className="h-3.5 w-3.5 text-palnadu-teal shrink-0" />
                              <span>{item}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    <div className="pt-3 border-t border-palnadu-border/50 flex flex-wrap items-center justify-between gap-2">
                      <Link
                        href={`/industries/${sector.slug}`}
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-palnadu-blue hover:text-palnadu-dark-hover transition-colors"
                      >
                        <span>View Sector Architecture</span>
                        <ArrowRight className="h-3.5 w-3.5" />
                      </Link>
                      <Link
                        href="/contact"
                        className="text-xs text-palnadu-secondary hover:text-palnadu-blue underline transition-colors"
                      >
                        <span>Consult engineers</span>
                      </Link>
                    </div>
                  </div>
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
