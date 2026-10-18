import type { Metadata } from 'next';
import Link from 'next/link';
import { coreLocations, siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { CtaSection } from '@/components/sections/cta-section';
import { MapPin, ArrowRight, Globe } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Locations We Serve in Palnadu, Guntur & Andhra Pradesh',
  description:
    'Tailored software development, web applications, and website design for enterprises across Palnadu, Guntur, Narasaraopet, Chilakaluripet, and Andhra Pradesh.',
  alternates: {
    canonical: '/locations',
  },
};

const nearbyTowns = [
  'Bapatla',
  'Amaravati',
  'Tenali',
  'Piduguralla',
  'Repalle',
  'Prathipadu',
  'Dachepalle',
  'Gurazala',
];

export default function LocationsPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    '@id': `${siteConfig.url}/locations/#itemlist`,
    name: 'Locations Served by Palnadu.dev',
    description: 'Regional software development hubs across Palnadu, Guntur, and coastal Andhra Pradesh.',
    url: `${siteConfig.url}/locations`,
    provider: getOrganizationRef(),
    itemListElement: coreLocations.map((loc, idx) => ({
      '@type': 'ListItem',
      position: idx + 1,
      name: loc.name,
      url: `${siteConfig.url}/locations/${loc.slug}`,
      description: loc.tagline,
    })),
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'Locations', path: '/locations' },
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
        {/* Main Directory Section */}
        <section className="py-14 sm:py-20">
          <div className="container max-w-5xl space-y-12">
            <div className="text-center max-w-2xl mx-auto space-y-3">
              <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
                Regional Presence
              </p>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
                Software Development Across Palnadu & Guntur
              </h1>
              <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
                Headquartered in Palnadu with senior engineering talent designing custom web platforms, mobile apps, and business automation for regional commerce.
              </p>
            </div>

            {/* Core Locations Grid */}
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {coreLocations.map((loc) => (
                <Link
                  key={loc.slug}
                  href={`/locations/${loc.slug}`}
                  className="group rounded-xl border border-palnadu-border bg-white p-6 shadow-2xs hover:border-palnadu-blue hover:shadow-md transition-all flex flex-col justify-between"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="inline-flex items-center gap-1.5 text-xs font-mono font-semibold text-palnadu-teal">
                        <MapPin className="h-3.5 w-3.5" />
                        <span>{loc.district}</span>
                      </div>
                      <span className="h-2 w-2 rounded-full bg-palnadu-teal" />
                    </div>

                    <div>
                      <h2 className="text-lg font-bold text-palnadu-dark group-hover:text-palnadu-blue transition-colors">
                        {loc.name}
                      </h2>
                      <p className="text-xs text-palnadu-secondary line-clamp-2 mt-1 leading-relaxed">
                        {loc.tagline}
                      </p>
                    </div>

                    {/* Key Industry Tags */}
                    <div className="pt-2 flex flex-wrap gap-1">
                      {loc.keyIndustries.slice(0, 3).map((ind, i) => (
                        <span
                          key={i}
                          className="text-[10px] px-2 py-0.5 rounded-md bg-palnadu-off-white text-palnadu-body font-medium border border-palnadu-border/60 truncate max-w-full"
                        >
                          {ind}
                        </span>
                      ))}
                    </div>
                  </div>

                  <div className="pt-4 mt-4 border-t border-palnadu-border/50 flex items-center justify-between text-xs font-semibold text-palnadu-blue group-hover:underline">
                    <span>View {loc.name} Hub</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              ))}
            </div>

            {/* Additional Regional Coverage */}
            <div className="rounded-xl border border-palnadu-border bg-palnadu-off-white/50 p-6 sm:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Globe className="h-4 w-4 text-palnadu-blue" />
                <h3 className="text-sm font-bold text-palnadu-dark">
                  Serving Businesses Throughout Coastal Andhra Pradesh
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed max-w-3xl">
                In addition to our primary hubs, we partner with clients, clinics, educational institutions, and traders located in surrounding regions:
              </p>
              <div className="flex flex-wrap gap-2 pt-1">
                {nearbyTowns.map((town) => (
                  <span
                    key={town}
                    className="text-xs px-3 py-1 rounded-full bg-white border border-palnadu-border text-palnadu-dark font-medium shadow-2xs"
                  >
                    {town}
                  </span>
                ))}
                <span className="text-xs px-3 py-1 rounded-full bg-palnadu-light-blue text-palnadu-blue font-semibold border border-palnadu-blue/20">
                  + Vijayawada & Statewide AP
                </span>
              </div>
            </div>
          </div>
        </section>

        <CtaSection />
      </div>
    </>
  );
}
