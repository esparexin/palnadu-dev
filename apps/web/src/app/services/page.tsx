import type { Metadata } from 'next';
import Link from 'next/link';
import { services, siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { HeroParallax } from '@/components/blocks/hero-parallax';
import { CtaSection } from '@/components/sections/cta-section';

const actualServiceDetails: Record<string, { summary: string; deliverables: string[] }> = {
  'website-development': {
    summary: 'High-performance corporate websites, school platforms, and institutional portals engineered with Next.js for instant loading and high conversion.',
    deliverables: ['Corporate Websites', 'School & College Portals', 'Sub-second LCP', 'Schema SEO'],
  },
  'web-development': {
    summary: 'High-performance SaaS platforms, internal management portals, customer dashboards, and custom web applications built with Next.js and TypeScript.',
    deliverables: ['SaaS products', 'Operations portals', 'Client dashboards', 'REST APIs'],
  },
  'mobile-app-development': {
    summary: 'Native & cross-platform iOS and Android applications designed around intuitive, friction-free everyday user workflows.',
    deliverables: ['iOS apps', 'Android apps', 'Offline data sync', 'App Store release'],
  },
  'android-app-development': {
    summary: 'Native and cross-platform Android mobile applications engineered for regional business workflows, offline data collection, and Google Play Store release.',
    deliverables: ['Android Business Apps', 'Offline-First Sync', 'Hardware Barcode Scanners', 'Play Store Release'],
  },
  'ios-app-development': {
    summary: 'Premium iOS applications engineered for iPhone and iPad with fluid user experience, Apple App Store compliance, and rock-solid cloud integrations.',
    deliverables: ['iPhone & iPad Apps', 'Swift / React Native', 'Apple Design Guidelines', 'App Store Approval'],
  },
  'idea-validation': {
    summary: 'Validate real customer demand, competitor landscape, technical feasibility, and MVP direction before spending development capital.',
    deliverables: ['Problem validation', 'Competitor audit', 'Feasibility report', 'MVP roadmap'],
  },
  'mvp-development': {
    summary: 'Lean minimum viable products built in 3 to 6-week sprints to validate business hypotheses with real paying users.',
    deliverables: ['3-6 week sprints', 'Core feature set', 'Live user testing', 'Post-launch plan'],
  },
  'custom-software': {
    summary: 'Software engineered specifically around your company’s operational workflows, eliminating rigid off-the-shelf workarounds.',
    deliverables: ['Workflow mapping', 'Custom internal tools', 'Legacy replacement', '100% code ownership'],
  },
  'business-automation': {
    summary: 'Eliminate repetitive manual tasks by automating order processing, inventory updates, transactional notifications, and spreadsheets.',
    deliverables: ['Order pipelines', 'Inventory sync', 'Webhook alerts', 'Spreadsheet bridges'],
  },
  'digital-marketing': {
    summary: 'Data-driven search engine optimization, Google Business Profile dominance, and local commercial visibility for enterprises.',
    deliverables: ['Technical SEO Audits', 'Google Business (GBP)', 'Local 3-Pack Rankings', 'Search Intent Strategy'],
  },
  'technical-consulting': {
    summary: 'Direct, honest technical advice on system architecture, tech stack selection, database design, and cloud scaling risks.',
    deliverables: ['Architecture audits', 'Tech selection', 'Database design', 'Cost optimization'],
  },
};

const products = [
  {
    title: "Moonbeam",
    link: "https://gomoonbeam.com",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/00/0078af2419c8685262b4cb05ea3387bc1b4dc0aff1cc86784fa5c21355110f85.png",
  },
  {
    title: "Cursor",
    link: "https://cursor.so",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/a9/a9e66d34a03bb780d87a046622415fe66996e805d1a55af26e3fbb0c6d161df5.png",
  },
  {
    title: "Rogue",
    link: "https://userogue.com",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/14/14a2ca44971e7a57f400fb4234791307dc8a884480f088d55c93f1da810bec1b.png",
  },
  {
    title: "Editorially",
    link: "https://editorially.org",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/7e/7ec6b0631c5ec4bb73db25a679e53512881cda9505de9f99d5eea88386e395c7.png",
  },
  {
    title: "Editrix AI",
    link: "https://editrix.ai",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/fc/fc2bb00ed499d276e6a5d4443e6dcf098fac9f6766642a299a81c64789b0622e.png",
  },
  {
    title: "Pixel Perfect",
    link: "https://app.pixelperfect.quest",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/b5/b51f454a6a9bb89c7d7e7fc105f7d160f1153025cdf67e5c64a51a9b63c4a573.png",
  },
  {
    title: "Algochurn",
    link: "https://algochurn.com",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/3c/3cc4bdb349803dd76c89837cc1ca7dd4a113515584aa000312d80fdb1a413f04.png",
  },
  {
    title: "Aceternity UI",
    link: "https://ui.aceternity.com",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/0e/0ef45b035d910971f334f4772f087a0e5dd98581949fc3ccbe5c2701ab56bb1d.png",
  },
  {
    title: "Tailwind Master Kit",
    link: "https://tailwindmasterkit.com",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/8b/8b23235b5768392458daa681a9dda498119c1bf3f13fef09cc3a245380b6c667.png",
  },
  {
    title: "SmartBridge",
    link: "https://smartbridgetech.com",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/e5/e51c0891a3642cb996939dbd684f05c25be0eaae0b07d35e3bc116f4ac27851c.png",
  },
  {
    title: "Renderwork Studio",
    link: "https://renderwork.studio",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/3d/3d180ec296d869336365946cb2daefe986ecbd39d8a5d4a4048609ec1cb7ebbb.png",
  },
  {
    title: "Creme Digital",
    link: "https://cremedigital.com",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/03/033a3e4edc9fbba9007dd73b8c0090e530387945d7de5f1feeb461dbee00a199.png",
  },
  {
    title: "Golden Bells Academy",
    link: "https://goldenbellsacademy.com",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/b3/b3a5d3324e18812bd72162b467947892d436762fc40f61b4f5a38d806d9891e1.png",
  },
  {
    title: "Invoker Labs",
    link: "https://invoker.lol",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/e1/e12f1285b2695143f5449c31ccb4594ce95cb90770941e25d7184bad0387807b.png",
  },
  {
    title: "E Free Invoice",
    link: "https://efreeinvoice.com",
    thumbnail:
      "https://cdn.21st.dev/assets/mirror/f8/f8b50d29904a7459e1e1fd88ce60003155ce69597d2a4ab57cc25975783e6bd1.png",
  },
];

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Web applications, mobile apps, MVP development, custom software, business automation, and technical consulting. Built by engineers from Palnadu.',
  alternates: {
    canonical: '/services',
  },
};

export default function ServicesPage() {
  const servicesJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    name: 'Palnadu.dev Engineering Services',
    description:
      'Web applications, mobile apps, MVP development, custom software, business automation, and technical consulting.',
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
      {/* Parallax Product Showcase */}
      <HeroParallax products={products} />

      {/* Actual Capabilities Directory */}
      <section className="py-14 sm:py-20 bg-white border-t border-palnadu-border" id="capabilities-list">
        <div className="container max-w-3xl">
          <div className="mb-8">
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1">
              Directory
            </p>
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-palnadu-dark leading-tight">
              Software Engineering & Web Development Services
            </h1>
          </div>

          {/* Clean Typographic List With Actual Services Content */}
          <div className="divide-y divide-palnadu-border border-y border-palnadu-border">
            {services.map((service, index) => {
              const detail = actualServiceDetails[service.slug] || {
                summary: service.shortDescription,
                deliverables: [],
              };

              return (
                <div
                  key={service.slug}
                  className="py-5 px-2 -mx-2 hover:bg-palnadu-light-blue/30 transition-colors"
                >
                  <div className="flex flex-col sm:flex-row sm:items-baseline justify-between gap-2">
                    <div className="flex items-baseline gap-3 sm:gap-4">
                      <span className="font-mono text-xs text-palnadu-secondary font-bold shrink-0">
                        0{index + 1}
                      </span>
                      <div>
                        <Link
                          href={`/services/${service.slug}`}
                          className="text-base sm:text-lg font-bold text-palnadu-dark hover:text-palnadu-blue transition-colors"
                        >
                          {service.title}
                        </Link>
                        <p className="mt-1 text-[13px] sm:text-sm text-palnadu-body leading-relaxed max-w-xl">
                          {detail.summary}
                        </p>

                        {/* Deliverables tags */}
                        {detail.deliverables.length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
                            {detail.deliverables.map((item) => (
                              <span key={item} className="text-xs sm:text-[13px] text-palnadu-secondary flex items-center gap-1 font-mono">
                                <span className="text-palnadu-teal">▪</span>
                                {item}
                              </span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>

                    <Link
                      href={`/services/${service.slug}`}
                      className="text-xs sm:text-sm font-semibold text-palnadu-blue hover:underline shrink-0 pl-7 sm:pl-4 mt-1 sm:mt-0 inline-flex items-center gap-1"
                    >
                      <span>Explore</span>
                      <span>→</span>
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
