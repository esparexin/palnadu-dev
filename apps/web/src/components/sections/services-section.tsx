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
    'Before spending savings on code, we help you validate if customers actually want the solution, study real competitors, and define a practical MVP scope.',
  'web-development':
    'Internal portals, SaaS products, and customer dashboards built with fast, reliable web technology that your team and users will actually enjoy using.',
  'mobile-app-development':
    'iOS and Android mobile apps designed around simple user workflows. Built to work smoothly even on low-bandwidth field connections.',
  'mvp-development':
    'The simplest version of your product that tests your core hypothesis with real users. Launched in weeks with zero throwaway code.',
  'custom-software':
    'Built around how your specific business already runs. Eliminating the workarounds you are currently forced to make with rigid off-the-shelf software.',
  'business-automation':
    'Stop copying data by hand. We connect your orders, inventory, notifications, and spreadsheets so repetitive tasks run automatically in the background.',
  'technical-consulting':
    'Direct, honest technical advice. Architecture reviews, technology selection, and frank risk assessments before you commit development budget.',
};

export function ServicesSection() {
  return (
    <section className="py-24 sm:py-32 relative border-t border-slate-900" id="services">
      <div className="container">
        <div className="max-w-3xl mb-14">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">
            What we build
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            Practical software for real problems.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            Whether you are validating a fresh startup concept or fixing a manual workflow that eats forty hours a week.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon] || Code;
            const description = humanDescriptions[service.slug] || service.shortDescription;

            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/40 p-6 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/40"
              >
                <div>
                  <div className="mb-5 flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs text-slate-500 font-semibold">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-lg font-semibold text-white group-hover:text-cyan-300 transition-colors">
                    {service.title}
                  </h3>

                  <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                    {description}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1.5 text-xs font-medium text-slate-400 group-hover:text-cyan-400 transition-colors pt-4 border-t border-slate-900/80">
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
