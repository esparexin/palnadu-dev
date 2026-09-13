import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { coreLocations, siteConfig } from '@palnadu/config';
import { ArrowRight, MapPin, Building2, AlertCircle, CheckCircle2, HelpCircle, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CtaSection } from '@/components/sections/cta-section';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return coreLocations.map((loc) => ({
    slug: loc.slug,
  }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const location = coreLocations.find((l) => l.slug === slug);

  if (!location) return { title: 'Location Not Found | Palnadu.dev' };

  const title = `Software Development & Web Design in ${location.name}`;
  const description = `${location.tagline}. High-performance web applications, business automation, and custom software for enterprises in ${location.name}, Andhra Pradesh.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/locations/${slug}`,
    },
    openGraph: {
      title: `${title} | ${siteConfig.name}`,
      description,
      url: `${siteConfig.url}/locations/${slug}`,
    },
  };
}

export default async function LocationDetailPage({ params }: Props) {
  const { slug } = await params;
  const location = coreLocations.find((l) => l.slug === slug);

  if (!location) {
    notFound();
  }

  // Local Google Schema for regional search engine dominance
  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: `Palnadu.dev — ${location.name}`,
    description: location.tagline,
    url: `${siteConfig.url}/locations/${slug}`,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: '₹₹ / $$',
    address: {
      '@type': 'PostalAddress',
      addressLocality: location.name,
      addressRegion: 'Andhra Pradesh',
      addressCountry: 'IN',
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: location.name },
      { '@type': 'AdministrativeArea', name: location.district },
      { '@type': 'AdministrativeArea', name: 'Andhra Pradesh' },
      ...(location.surroundingMandals?.map((m) => ({ '@type': 'AdministrativeArea', name: m })) || []),
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: location.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Locations',
        item: `${siteConfig.url}/locations`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: location.name,
        item: `${siteConfig.url}/locations/${slug}`,
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(localBusinessSchema) }}
      />
      {location.faq.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />

      <div className="bg-white">
        {/* Header Hero */}
        <section className="relative overflow-hidden bg-gradient-to-b from-palnadu-dark via-[#083b6f] to-palnadu-dark py-16 sm:py-24 text-white">
          <div className="container max-w-4xl space-y-4">
            <div className="flex items-center gap-2">
              <Link
                href="/locations"
                className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-palnadu-teal hover:underline"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>All Locations</span>
              </Link>
              <span className="text-gray-400">•</span>
              <span className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-gray-300">
                <MapPin className="h-3 w-3 text-palnadu-teal" />
                <span>{location.district}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Software Development & Web Design in{' '}
              <span className="text-palnadu-teal">{location.name}</span>
            </h1>

            <p className="text-sm sm:text-lg text-palnadu-light-blue/90 leading-relaxed max-w-2xl">
              {location.tagline}
            </p>

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button asChild className="bg-palnadu-teal hover:bg-[#157c5c] text-white font-semibold text-xs sm:text-sm h-11 px-6 shadow-xs">
                <Link href="/contact" className="flex items-center justify-center gap-2">
                  <span>Discuss Your Project in {location.name}</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-white/20 text-white bg-white/10 hover:bg-white/20 text-xs sm:text-sm h-11 px-6">
                <a href="#services-offered">
                  <span>Explore Tailored Services</span>
                </a>
              </Button>
            </div>
          </div>
        </section>

        {/* Economic Profile & Regional Context */}
        <section className="py-14 sm:py-20 border-b border-palnadu-border">
          <div className="container max-w-4xl space-y-10">
            <div className="space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
                Regional Commercial Profile
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-palnadu-dark tracking-tight">
                Empowering Enterprises Across {location.name}
              </h2>
              <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
                {location.economicProfile}
              </p>
            </div>

            {/* Key Industries in this Location */}
            <div className="space-y-4">
              <h3 className="text-xs font-mono uppercase tracking-widest text-palnadu-secondary font-bold flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-palnadu-blue" />
                <span>Primary Commercial Sectors in {location.name}</span>
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
                {location.keyIndustries.map((industry) => (
                  <div
                    key={industry}
                    className="p-3 rounded-lg border border-palnadu-border bg-palnadu-off-white/50 text-xs font-semibold text-palnadu-dark flex items-center gap-2"
                  >
                    <span className="h-1.5 w-1.5 rounded-full bg-palnadu-blue shrink-0" />
                    <span>{industry}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Surrounding Mandals & Corridors Served */}
            {location.surroundingMandals && location.surroundingMandals.length > 0 && (
              <div className="rounded-xl border border-palnadu-border bg-palnadu-off-white/40 p-6 space-y-3">
                <div className="flex items-center gap-2 text-palnadu-dark">
                  <MapPin className="h-4 w-4 text-palnadu-blue shrink-0" />
                  <h3 className="text-sm font-bold">
                    Serving {location.name} & Surrounding Mandals / Corridors:
                  </h3>
                </div>
                <div className="flex flex-wrap gap-2 pt-1">
                  {location.surroundingMandals.map((mandal) => (
                    <span
                      key={mandal}
                      className="inline-flex items-center px-2.5 py-1 rounded-md bg-white border border-palnadu-border text-xs font-medium text-palnadu-dark shadow-2xs"
                    >
                      {mandal}
                    </span>
                  ))}
                </div>
                <p className="text-[11px] text-palnadu-secondary leading-relaxed">
                  Traders, clinics, schools, and enterprises across these regional mandals receive direct engineering advisory and on-site support from Palnadu.dev.
                </p>
              </div>
            )}

            {/* Common Operational Challenges Solved */}
            <div className="rounded-xl border border-red-200 bg-red-50/40 p-6 space-y-3">
              <div className="flex items-center gap-2 text-red-800">
                <AlertCircle className="h-4 w-4 shrink-0" />
                <h3 className="text-sm font-bold">
                  Common Bottlenecks Facing Businesses in {location.name}
                </h3>
              </div>
              <ul className="space-y-2 text-xs sm:text-sm text-palnadu-body">
                {location.commonPainPoints.map((pain, idx) => (
                  <li key={idx} className="flex items-start gap-2">
                    <span className="text-red-500 font-bold shrink-0 mt-0.5">•</span>
                    <span>{pain}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Tailored Services for this Location */}
        <section className="py-14 sm:py-20 bg-palnadu-off-white/30 border-b border-palnadu-border" id="services-offered">
          <div className="container max-w-4xl space-y-8">
            <div className="space-y-2">
              <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
                Capabilities
              </p>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-palnadu-dark tracking-tight">
                Recommended Software Services for {location.name}
              </h2>
              <p className="text-xs sm:text-sm text-palnadu-body">
                Engineered with Next.js, TypeScript, and modern cloud databases for zero vendor lock-in.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {location.popularServices.map((serviceName, idx) => (
                <div
                  key={idx}
                  className="p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs hover:border-palnadu-blue transition-all space-y-2"
                >
                  <div className="flex items-center gap-2 text-palnadu-teal">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <h3 className="text-sm font-bold text-palnadu-dark">{serviceName}</h3>
                  </div>
                  <p className="text-xs text-palnadu-secondary leading-relaxed">
                    Designed around regional workflows, local GST reporting, and phone/tablet interfaces.
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Local FAQ Section */}
        {location.faq.length > 0 && (
          <section className="py-14 sm:py-20 bg-white">
            <div className="container max-w-3xl space-y-8">
              <div className="space-y-2 text-center">
                <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
                  Questions & Answers
                </p>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-palnadu-dark tracking-tight">
                  Frequently Asked Questions in {location.name}
                </h2>
              </div>

              <div className="space-y-4">
                {location.faq.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-5 rounded-xl border border-palnadu-border bg-palnadu-off-white/40 space-y-2"
                  >
                    <h3 className="text-sm font-bold text-palnadu-dark flex items-start gap-2">
                      <HelpCircle className="h-4 w-4 text-palnadu-blue shrink-0 mt-0.5" />
                      <span>{item.q}</span>
                    </h3>
                    <p className="text-xs sm:text-sm text-palnadu-body pl-6 leading-relaxed">
                      {item.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        <CtaSection />
      </div>
    </>
  );
}
