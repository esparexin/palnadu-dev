import Link from 'next/link';
import {
  Lightbulb,
  Globe,
  Smartphone,
  Rocket,
  Code,
  Zap,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';
import { services } from '@palnadu/config';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  Globe,
  Smartphone,
  Rocket,
  Code,
  Zap,
  MessageSquare,
};

const humanDescriptions: Record<string, string> = {
  'idea-validation':
    'Before spending savings on code, we help you validate if customers actually want it, study competitors, and define a practical MVP scope.',
  'web-development':
    'Internal portals, SaaS products, and customer dashboards built with fast, reliable web tech that your team and users will actually enjoy using.',
  'mobile-app-development':
    'iOS and Android mobile apps designed around simple user workflows. Built to work smoothly even on low-bandwidth connections.',
  'mvp-development':
    'The leanest version of your product that tests your core hypothesis with real users. Launched in weeks with zero throwaway code.',
  'custom-software':
    'Built around how your specific business already runs, eliminating the workarounds you are forced to make with rigid off-the-shelf tools.',
  'business-automation':
    'Stop copying data by hand. We connect your orders, inventory, notifications, and spreadsheets so repetitive tasks run automatically.',
  'technical-consulting':
    'Direct, honest technical advice. Architecture reviews, technology selection, and frank risk assessments before committing development budget.',
};

export function ServicesSection() {
  return (
    <section className="py-12 sm:py-20 md:py-28 relative border-t border-slate-900" id="services">
      <div className="container">
        <div className="max-w-3xl mb-8 sm:mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2 sm:mb-3">
            What we build
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            Practical software for real problems.
          </h2>
          <p className="mt-2 sm:mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
            Whether validating a fresh startup concept or fixing a manual workflow that eats forty hours a week.
          </p>
        </div>

        <div className="grid gap-3.5 sm:gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon] || Code;
            const description = humanDescriptions[service.slug] || service.shortDescription;

            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-800/80 bg-slate-950/40 p-4 sm:p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/40"
              >
                <div>
                  <div className="mb-3 sm:mb-4 flex items-center justify-between">
                    <div className="flex h-9 w-9 sm:h-11 sm:w-11 items-center justify-center rounded-lg sm:rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <span className="font-mono text-xs text-slate-500 font-semibold">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-base sm:text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {service.title}
                  </h3>

                  <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="mt-4 sm:mt-6 flex items-center gap-1.5 text-xs font-medium text-slate-400 group-hover:text-cyan-400 transition-colors pt-3 border-t border-slate-900/80">
                  <span>How we do this</span>
                  <ArrowUpRight className="h-3.5 w-3.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
