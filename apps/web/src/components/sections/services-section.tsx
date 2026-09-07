import Link from 'next/link';
import { services } from '@palnadu/config';

const shortSummaries: Record<string, string> = {
  'idea-validation': 'Validate demand, competitor landscape, feasibility, and MVP direction.',
  'web-development': 'Fast, reliable SaaS, internal portals, dashboards, and custom web applications.',
  'mobile-app-development': 'iOS and Android applications designed around everyday workflows.',
  'mvp-development': 'Lean minimum viable products launched in weeks to test core hypotheses.',
  'custom-software': 'Software tailored to your exact business operations and specific workflows.',
  'business-automation': 'Automate spreadsheets, orders, notifications, and repetitive manual tasks.',
  'technical-consulting': 'Architecture audits, technology selection, and frank technical problem solving.',
};

export function ServicesSection() {
  return (
    <section className="py-12 sm:py-16 bg-white border-t border-palnadu-border" id="services">
      <div className="container max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1">
            Capabilities
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-palnadu-dark">
            What We Build
          </h2>
        </div>

        {/* Clean Typographic List — No Card Boxes, No Generic Icons */}
        <div className="divide-y divide-palnadu-border border-y border-palnadu-border">
          {services.map((service, index) => {
            const summary = shortSummaries[service.slug] || service.shortDescription;

            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group flex flex-col sm:flex-row sm:items-baseline justify-between py-3.5 px-2 -mx-2 hover:bg-palnadu-light-blue/40 transition-colors"
              >
                <div className="flex items-baseline gap-3 sm:gap-4">
                  <span className="font-mono text-xs text-palnadu-secondary font-bold shrink-0">
                    0{index + 1}
                  </span>
                  <div>
                    <h3 className="text-sm font-bold text-palnadu-dark group-hover:text-palnadu-blue transition-colors">
                      {service.title}
                    </h3>
                    <p className="text-xs text-palnadu-body mt-0.5 leading-relaxed">
                      {summary}
                    </p>
                  </div>
                </div>
                <span className="text-xs font-semibold text-palnadu-blue group-hover:translate-x-0.5 transition-transform shrink-0 mt-1 sm:mt-0 pl-7 sm:pl-4">
                  View →
                </span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
