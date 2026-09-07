import type { Metadata } from 'next';
import Link from 'next/link';
import { services } from '@palnadu/config';
import { CinematicHero } from '@/components/ui/cinematic-landing-hero';
import { CtaSection } from '@/components/sections/cta-section';

const actualServiceDetails: Record<string, { summary: string; deliverables: string[] }> = {
  'idea-validation': {
    summary: 'Validate real customer demand, competitor landscape, technical feasibility, and MVP direction before spending development capital.',
    deliverables: ['Problem validation', 'Competitor audit', 'Feasibility report', 'MVP roadmap'],
  },
  'web-development': {
    summary: 'High-performance SaaS platforms, internal management portals, customer dashboards, and custom web applications built with Next.js and TypeScript.',
    deliverables: ['SaaS products', 'Operations portals', 'Client dashboards', 'REST APIs'],
  },
  'mobile-app-development': {
    summary: 'Native & cross-platform iOS and Android applications designed around intuitive, friction-free everyday user workflows.',
    deliverables: ['iOS apps', 'Android apps', 'Offline data sync', 'App Store release'],
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
  'technical-consulting': {
    summary: 'Direct, honest technical advice on system architecture, tech stack selection, database design, and cloud scaling risks.',
    deliverables: ['Architecture audits', 'Tech selection', 'Database design', 'Cost optimization'],
  },
};

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Web applications, mobile apps, MVP development, custom software, business automation, and technical consulting. Built by engineers from Palnadu.',
};

export default function ServicesPage() {
  return (
    <div className="bg-white">
      {/* 3D Cinematic Interactive Hero Showcase */}
      <CinematicHero
        brandName="Palnadu"
        tagline1="Software built around"
        tagline2="your real problems."
        cardHeading="Capabilities, redefined."
        cardDescription={
          <>
            <span className="text-white font-semibold">Palnadu.dev</span> builds custom web platforms, mobile applications, and automation systems tailored around your specific business operations.
          </>
        }
        metricValue={7}
        metricLabel="Core Services"
        ctaHeading="Build what works."
        ctaDescription="Work directly with the software engineers designing and writing your application."
      />

      {/* Actual Capabilities Directory */}
      <section className="py-14 sm:py-20 bg-white border-t border-palnadu-border" id="capabilities-list">
        <div className="container max-w-3xl">
          <div className="mb-8">
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1">
              Directory
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-palnadu-dark leading-tight">
              All 7 Engineering Capabilities
            </h2>
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
                        <p className="mt-1 text-xs text-palnadu-body leading-relaxed max-w-xl">
                          {detail.summary}
                        </p>

                        {/* Deliverables tags */}
                        {detail.deliverables.length > 0 && (
                          <div className="flex flex-wrap gap-x-3 gap-y-1 mt-2.5">
                            {detail.deliverables.map((item) => (
                              <span key={item} className="text-[11px] text-palnadu-secondary flex items-center gap-1 font-mono">
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
                      className="text-xs font-semibold text-palnadu-blue hover:underline shrink-0 pl-7 sm:pl-4 mt-1 sm:mt-0 inline-flex items-center gap-1"
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
  );
}
