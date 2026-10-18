import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@palnadu/config';
import { CtaSection } from '@/components/sections/cta-section';
import { Rocket, GraduationCap, Building2, Stethoscope, Store, Factory, ArrowRight, CheckCircle2 } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Industries We Serve in Palnadu & Andhra Pradesh',
  description:
    'Custom software development, web applications, and automation tailored for startups, schools, healthcare clinics, wholesale traders, and regional businesses in Palnadu and Guntur.',
  alternates: {
    canonical: '/industries',
  },
};

const industrySectors = [
  {
    icon: Rocket,
    name: 'Startups & Early-Stage Ventures',
    slug: 'startups',
    subtitle: 'From Idea to Validated Minimum Viable Product',
    overview:
      'We partner with founders in Andhra Pradesh and nationwide to design, prototype, and ship lean, high-speed MVPs in 3-to-6-week sprints. We evaluate technical feasibility, avoid architecture lock-in, and build products ready to onboard paying customers.',
    deliverables: [
      '3–6 week rapid MVP development',
      'Scalable Next.js & TypeScript architecture',
      'Stripe & Razorpay payment integrations',
      '100% source code & Git repository ownership',
    ],
  },
  {
    icon: Store,
    name: 'Wholesale, Agri-Trading & Cold Storages',
    slug: 'agri-trading',
    subtitle: 'Replacing Paper Slips & WhatsApp Chaos with Live Portals',
    overview:
      'Designed specifically for grain merchants, seed distributors, cotton ginning mills, and cold storage facilities across Palnadu, Narasaraopet, and Guntur. We build centralized inventory management systems that calculate moisture deductions, track batch allocations, and generate instant WhatsApp PDF invoices.',
    deliverables: [
      'Godown & cold storage bay allocation tracking',
      'Real-time mandi purchase settlement receipts',
      'Automated WhatsApp billing & PDF statements',
      'Role-based access for field agents and clerks',
    ],
  },
  {
    icon: GraduationCap,
    name: 'Education, Junior Colleges & Academies',
    slug: 'education',
    subtitle: 'Sub-Second Web Platforms & Student Information Systems',
    overview:
      'Educational institutions in Narasaraopet, Guntur, and Vijayawada need web portals that load instantly on low-bandwidth mobile networks during high-traffic admission cycles. We replace fragile WordPress setups with high-converting, mobile-first Next.js portals and student information dashboards.',
    deliverables: [
      'Sub-second mobile loading speed for parents and students',
      'Online digital admission inquiry pipelines',
      'Fee management & receipt generation systems',
      'High-resolution campus photo & event galleries',
    ],
  },
  {
    icon: Stethoscope,
    name: 'Healthcare, Diagnostic Centers & Clinics',
    slug: 'healthcare',
    subtitle: 'Patient Scheduling & Seamless Clinic Workflows',
    overview:
      'Specialty hospitals, polyclinics, and diagnostic centers handle hundreds of walk-ins daily. We build intuitive doctor schedule directories, appointment booking pipelines, and automated SMS/WhatsApp appointment reminders that eliminate front-desk telephone bottlenecks.',
    deliverables: [
      'Multi-doctor appointment scheduling calendars',
      'Digital patient queue & token tracking',
      'Diagnostic report download portals',
      'Google Maps directions & clinic location SEO',
    ],
  },
  {
    icon: Factory,
    name: 'Manufacturing, Limestone & Transport Ancillaries',
    slug: 'manufacturing-logistics',
    subtitle: 'Fleet Dispatch Tracking & Factory Contract Software',
    overview:
      'Centering around Chilakaluripet and Macherla industrial corridors, we engineer web platforms that track lorry trips, driver advances, weighbridge gate records, and raw material dispatches without depending on error-prone paper ledgers.',
    deliverables: [
      'Fleet trip logs, freight memos & LR slips',
      'Gate pass & weighbridge digital records',
      'Vendor invoice reconciliation dashboards',
      'Corporate export portfolios for industrial clients',
    ],
  },
  {
    icon: Building2,
    name: 'Retail Merchandising & Local Service Enterprises',
    slug: 'small-business',
    subtitle: 'Custom Operations Software Built Around Your Shop',
    overview:
      'Small and medium enterprises in Sattenapalle, Vinukonda, and Guntur often struggle with rigid, expensive software subscriptions. We engineer bespoke retail catalog portals, customer loyalty engines, and internal task managers that eliminate operational friction.',
    deliverables: [
      'Digital product catalogs & quotation builders',
      'Branch-to-branch stock transfer management',
      'Staff sales performance tracking',
      'Direct integration with regional GST accounting',
    ],
  },
];

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

  const breadcrumbJsonLd = {
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
        name: 'Industries',
        item: `${siteConfig.url}/industries`,
      },
    ],
  };

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
                          <p className="text-[11px] font-mono text-palnadu-teal font-semibold">
                            {sector.subtitle}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed">
                        {sector.overview}
                      </p>

                      <div className="pt-2 space-y-2 border-t border-palnadu-border/60">
                        <p className="text-[11px] font-mono uppercase tracking-wider text-palnadu-secondary font-bold">
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

                    <div className="pt-3 border-t border-palnadu-border/50">
                      <Link
                        href="/contact"
                        className="inline-flex items-center gap-1.5 text-xs font-semibold text-palnadu-blue hover:underline"
                      >
                        <span>Discuss {sector.name.split('&')[0]} software</span>
                        <ArrowRight className="h-3.5 w-3.5" />
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
