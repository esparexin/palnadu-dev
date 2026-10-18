import type { Metadata } from 'next';
import Link from 'next/link';
import { services, siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { HeroParallax } from '@/components/blocks/hero-parallax';
import { CtaSection } from '@/components/sections/cta-section';

const actualServiceDetails: Record<string, { summary: string; deliverables: string[] }> = {
  'website-development': {
    summary:
      'High-performance corporate websites, school portals, and business platforms built with Next.js for fast page loading, clean mobile presentation, and strong search rankings.',
    deliverables: ['Corporate Websites', 'School Portals', 'Speed Optimization', 'Structured Schema SEO'],
  },
  'web-development': {
    summary:
      'Custom web platforms, customer dashboards, internal operations portals, and software tools built with Next.js and TypeScript for businesses that have outgrown generic software.',
    deliverables: ['SaaS Products', 'Operations Portals', 'Client Dashboards', 'REST APIs'],
  },
  'mobile-app-development': {
    summary:
      'Cross-platform iOS and Android mobile applications designed around straightforward daily workflows for regional businesses, field staff, and everyday customers.',
    deliverables: ['iOS Apps', 'Android Apps', 'Offline Data Sync', 'App Store Release'],
  },
  'android-app-development': {
    summary:
      'Native Android applications engineered for regional business operations, offline data recording, and direct deployment to the Google Play Store.',
    deliverables: ['Android Business Apps', 'Offline First Sync', 'Barcode Scanners', 'Play Store Publishing'],
  },
  'ios-app-development': {
    summary:
      'Refined iOS applications designed for iPhone and iPad, following Apple Human Interface Guidelines with secure cloud synchronization and App Store approval.',
    deliverables: ['iPhone and iPad Apps', 'Swift and React Native', 'Apple Design Standards', 'App Store Approval'],
  },
  'idea-validation': {
    summary:
      'Objective evaluation of customer demand, technical feasibility, and realistic development costs before investing capital into custom software.',
    deliverables: ['Workflow Analysis', 'Competitor Review', 'Feasibility Assessment', 'Product Roadmap'],
  },
  'mvp-development': {
    summary:
      'Focused minimum viable products delivered in 3 to 6-week sprints to help businesses test their core offering with real paying customers quickly.',
    deliverables: ['Fast Sprint Delivery', 'Essential Features', 'Payment Integration', 'Post-Launch Roadmap'],
  },
  'custom-software': {
    summary:
      'Software built specifically around your day-to-day business operations, eliminating awkward workarounds and recurring monthly subscription fees.',
    deliverables: ['Tailored Internal Tools', 'Billing and Inventory', 'Data Migration', 'Complete Code Ownership'],
  },
  'business-automation': {
    summary:
      'Practical automation that reduces repetitive office work, connects disparate spreadsheets and databases, and sends automated customer notifications.',
    deliverables: ['Order Processing', 'Inventory Sync', 'WhatsApp Notifications', 'Automated Daily Reports'],
  },
  'digital-marketing': {
    summary:
      'Search engine optimization and Google Business Profile management designed to help regional customers find your business when looking for your services.',
    deliverables: ['Technical SEO', 'Google Maps Visibility', 'Local Directory Listings', 'Lead Tracking'],
  },
  'technical-consulting': {
    summary:
      'Pragmatic technical guidance on architecture decisions, software vendor proposals, database design, and cloud hosting cost reduction.',
    deliverables: ['Architecture Reviews', 'Vendor Proposal Audits', 'Database Optimization', 'Cloud Cost Reduction'],
  },
};

const products = [
  {
    title: 'Website Development',
    link: '/services/website-development',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/00/0078af2419c8685262b4cb05ea3387bc1b4dc0aff1cc86784fa5c21355110f85.png',
  },
  {
    title: 'Web Applications',
    link: '/services/web-development',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/a9/a9e66d34a03bb780d87a046622415fe66996e805d1a55af26e3fbb0c6d161df5.png',
  },
  {
    title: 'Mobile Applications',
    link: '/services/mobile-app-development',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/14/14a2ca44971e7a57f400fb4234791307dc8a884480f088d55c93f1da810bec1b.png',
  },
  {
    title: 'Android App Development',
    link: '/services/android-app-development',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/7e/7ec6b0631c5ec4bb73db25a679e53512881cda9505de9f99d5eea88386e395c7.png',
  },
  {
    title: 'iOS App Development',
    link: '/services/ios-app-development',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/fc/fc2bb00ed499d276e6a5d4443e6dcf098fac9f6766642a299a81c64789b0622e.png',
  },
  {
    title: 'Idea Validation',
    link: '/services/idea-validation',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/b5/b51f454a6a9bb89c7d7e7fc105f7d160f1153025cdf67e5c64a51a9b63c4a573.png',
  },
  {
    title: 'MVP Development',
    link: '/services/mvp-development',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/3c/3cc4bdb349803dd76c89837cc1ca7dd4a113515584aa000312d80fdb1a413f04.png',
  },
  {
    title: 'Custom Software',
    link: '/services/custom-software',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/0e/0ef45b035d910971f334f4772f087a0e5dd98581949fc3ccbe5c2701ab56bb1d.png',
  },
  {
    title: 'Business Automation',
    link: '/services/business-automation',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/8b/8b23235b5768392458daa681a9dda498119c1bf3f13fef09cc3a245380b6c667.png',
  },
  {
    title: 'Digital Marketing & SEO',
    link: '/services/digital-marketing',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/e5/e51c0891a3642cb996939dbd684f05c25be0eaae0b07d35e3bc116f4ac27851c.png',
  },
  {
    title: 'Technical Consulting',
    link: '/services/technical-consulting',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/3d/3d180ec296d869336365946cb2daefe986ecbd39d8a5d4a4048609ec1cb7ebbb.png',
  },
  {
    title: 'SaaS Platforms',
    link: '/services/web-development',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/03/033a3e4edc9fbba9007dd73b8c0090e530387945d7de5f1feeb461dbee00a199.png',
  },
  {
    title: 'School & College Portals',
    link: '/services/website-development',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/b3/b3a5d3324e18812bd72162b467947892d436762fc40f61b4f5a38d806d9891e1.png',
  },
  {
    title: 'Billing & POS Systems',
    link: '/services/custom-software',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/e1/e12f1285b2695143f5449c31ccb4594ce95cb90770941e25d7184bad0387807b.png',
  },
  {
    title: 'Cloud ERP Solutions',
    link: '/services/business-automation',
    thumbnail:
      'https://cdn.21st.dev/assets/mirror/f8/f8b50d29904a7459e1e1fd88ce60003155ce69597d2a4ab57cc25975783e6bd1.png',
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

        {/* Core Capabilities Section */}
        <section className="py-16 sm:py-24 bg-white border-t border-slate-200" id="capabilities-list">
          <div className="container max-w-4xl mx-auto px-4 sm:px-6">
            <div className="mb-10 sm:mb-14">
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-slate-900 leading-tight">
                Software Engineering and Web Development Capabilities
              </h2>
              <p className="mt-3 text-base sm:text-lg text-slate-600 leading-relaxed max-w-2xl">
                Every project at Palnadu.dev is built by software engineers working directly with business owners. We focus on dependable architecture, clear timelines, and software that genuinely supports your business operations.
              </p>
            </div>

            {/* Clean Editorial Services List */}
            <div className="divide-y divide-slate-200 border-y border-slate-200">
              {services.map((service) => {
                const detail = actualServiceDetails[service.slug] || {
                  summary: service.shortDescription,
                  deliverables: [],
                };

                return (
                  <article
                    key={service.slug}
                    className="py-6 sm:py-8 first:pt-6 last:pb-6 transition-colors hover:bg-slate-50/60 rounded-xl px-3 -mx-3"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                      <div className="max-w-2xl space-y-2">
                        <h3 className="text-lg sm:text-xl font-bold text-slate-900 leading-snug">
                          <Link
                            href={`/services/${service.slug}`}
                            className="text-slate-900 hover:text-palnadu-blue transition-colors"
                          >
                            {service.title}
                          </Link>
                        </h3>

                        <p className="text-sm sm:text-base text-slate-600 leading-relaxed">
                          {detail.summary}
                        </p>

                        {/* Deliverables as natural tags */}
                        {detail.deliverables.length > 0 && (
                          <div className="flex flex-wrap gap-2 pt-2">
                            {detail.deliverables.map((item) => (
                              <span
                                key={item}
                                className="text-xs text-slate-600 bg-slate-100 rounded-md px-2.5 py-1"
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
