import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { CtaSection } from '@/components/sections/cta-section';
import { ArrowLeft, ArrowRight, CheckCircle2 } from 'lucide-react';
import { industrySectors } from '../industries-data';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return industrySectors.map((sector) => ({ slug: sector.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const sector = industrySectors.find((s) => s.slug === slug);

  if (!sector) {
    return { title: 'Industry Not Found | Palnadu.dev' };
  }

  return {
    title: `${sector.name} Software Development & Systems`,
    description: sector.overview,
    alternates: {
      canonical: `/industries/${slug}`,
    },
    openGraph: {
      title: `${sector.name} Software Development | Palnadu.dev`,
      description: sector.overview,
      url: `${siteConfig.url}/industries/${slug}`,
    },
  };
}

export default async function IndustryDetailPage({ params }: Props) {
  const { slug } = await params;
  const sector = industrySectors.find((s) => s.slug === slug);

  if (!sector) {
    notFound();
  }

  const Icon = sector.icon;

  const serviceJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    '@id': `${siteConfig.url}/industries/${slug}/#service`,
    name: `${sector.name} Software Engineering Solutions`,
    description: sector.overview,
    provider: getOrganizationRef(),
    areaServed: {
      '@type': 'AdministrativeArea',
      name: 'Andhra Pradesh, India',
    },
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'Industries', path: '/industries' },
    { name: sector.name, path: `/industries/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="bg-white">
        {/* Industry Sector Header */}
        <section className="py-12 sm:py-16 bg-palnadu-dark text-white">
          <div className="container max-w-4xl space-y-5">
            <Link
              href="/industries"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-palnadu-teal hover:underline transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to All Industries</span>
            </Link>

            <div className="flex items-center gap-3 pt-2">
              <div className="h-12 w-12 rounded-xl bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center shrink-0 shadow-sm">
                <Icon className="h-6 w-6" />
              </div>
              <div>
                <p className="text-xs font-mono uppercase tracking-widest text-palnadu-teal font-semibold">
                  Specialized Sector Engineering
                </p>
                <h1 className="text-2xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-white leading-tight">
                  {sector.name}
                </h1>
              </div>
            </div>

            <p className="text-sm sm:text-base text-palnadu-light-blue/90 leading-relaxed max-w-2xl pt-2">
              {sector.subtitle}
            </p>
          </div>
        </section>

        {/* Sector In-Depth Breakdown */}
        <section className="py-14 sm:py-20 border-b border-palnadu-border">
          <div className="container max-w-4xl space-y-10">
            {/* Sector Overview Card */}
            <div className="p-6 sm:p-8 rounded-xl border border-palnadu-border bg-palnadu-off-white/50 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
                Operational Overview
              </h2>
              <h3 className="text-lg sm:text-xl font-bold text-palnadu-dark">
                How We Solve Industry-Specific Bottlenecks
              </h3>
              <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
                {sector.overview}
              </p>
            </div>

            {/* Core Solutions Delivered */}
            <div className="space-y-4">
              <div className="space-y-1">
                <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
                  Technical Architecture
                </p>
                <h2 className="text-xl sm:text-2xl font-bold text-palnadu-dark">
                  Core Solutions Delivered
                </h2>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                {sector.deliverables.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl border border-palnadu-border bg-white shadow-sm flex items-start gap-3"
                  >
                    <CheckCircle2 className="h-4 w-4 text-palnadu-teal shrink-0 mt-0.5" />
                    <span className="text-xs sm:text-sm text-palnadu-dark font-medium leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Engineering Inquiry Callout */}
            <div className="p-6 sm:p-8 rounded-xl border border-palnadu-border bg-palnadu-light-blue/40 flex flex-col sm:flex-row items-center justify-between gap-5">
              <div className="space-y-1 text-center sm:text-left">
                <h3 className="text-base font-bold text-palnadu-dark">
                  Ready to engineer systems for your organization?
                </h3>
                <p className="text-xs sm:text-sm text-palnadu-body">
                  Speak directly with the software engineers building your solution in Andhra Pradesh.
                </p>
              </div>

              <Link
                href="/contact"
                className="inline-flex items-center gap-1.5 px-5 py-2.5 rounded-md bg-palnadu-blue text-white text-xs sm:text-sm font-semibold hover:bg-palnadu-dark-hover transition-colors shadow-sm shrink-0"
              >
                <span>Discuss Your Project</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </section>

        <CtaSection />
      </div>
    </>
  );
}
