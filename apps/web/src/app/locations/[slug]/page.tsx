import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { coreLocations, siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { ArrowRight, MapPin, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { CtaSection } from '@/components/sections/cta-section';
import { LocationProfile } from './location-profile';
import { LocationServices } from './location-services';
import { LocationFaq } from './location-faq';

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

  const title = `Web Development, Software & Digital Solutions in ${location.name} | Palnadu.dev`;
  const description = `${location.tagline}. Professional web development, custom software engineering, and digital growth solutions for businesses in ${location.name}, Andhra Pradesh.`;

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

  const localBusinessSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${siteConfig.url}/locations/${slug}/#business`,
    name: `Palnadu.dev — ${location.name}`,
    description: location.tagline,
    url: `${siteConfig.url}/locations/${slug}`,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: '₹₹ / $$',
    currenciesAccepted: 'INR, USD',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer, UPI',
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '09:00',
        closes: '19:00',
      },
    ],
    parentOrganization: getOrganizationRef(),
    address: {
      '@type': 'PostalAddress',
      streetAddress: location.serviceOffice || 'Main Road, Near Municipal Office',
      addressLocality: location.serviceOffice ? location.name : 'Macherla',
      postalCode: location.postalCode || '522426',
      addressRegion: 'Andhra Pradesh',
      addressCountry: 'IN',
    },
    geo: location.geo
      ? {
          '@type': 'GeoCoordinates',
          latitude: location.geo.latitude,
          longitude: location.geo.longitude,
        }
      : undefined,
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

  const breadcrumbSchema = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'Locations', path: '/locations' },
    { name: location.name, path: `/locations/${slug}` },
  ]);

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
        <section className="relative overflow-hidden bg-gradient-to-b from-palnadu-dark via-palnadu-dark-hover to-palnadu-dark py-16 sm:py-24 text-white">
          <div className="container max-w-4xl space-y-4">
            <div className="flex items-center gap-2">
              <Link
                href="/locations"
                className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-palnadu-teal hover:underline"
              >
                <ArrowLeft className="h-3 w-3" />
                <span>All Locations</span>
              </Link>
              <span className="text-palnadu-light-blue/60">•</span>
              <span className="inline-flex items-center gap-1 text-xs font-mono uppercase tracking-wider text-palnadu-light-blue/80">
                <MapPin className="h-3 w-3 text-palnadu-teal" />
                <span>{location.district}</span>
              </span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
              Web Development, Software &amp; Digital Solutions in{' '}
              <span className="text-palnadu-teal">{location.name}</span>
            </h1>

            <p className="text-sm sm:text-lg text-palnadu-light-blue/90 leading-relaxed max-w-2xl">
              {location.tagline}
            </p>

            {location.serviceOffice && (
              <div className="pt-1">
                <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-xs font-mono text-palnadu-teal">
                  <MapPin className="h-3 w-3 text-palnadu-teal" />
                  <span>Regional Hub: {location.serviceOffice}</span>
                </span>
              </div>
            )}

            <div className="pt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <Button asChild className="bg-palnadu-teal hover:bg-palnadu-teal-dark text-white font-semibold text-xs sm:text-sm h-11 px-6 shadow-sm">
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

        <LocationProfile location={location} />
        <LocationServices location={location} />
        <LocationFaq location={location} />
        <CtaSection />
      </div>
    </>
  );
}
