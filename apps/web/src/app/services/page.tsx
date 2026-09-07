import type { Metadata } from 'next';
import Link from 'next/link';
import { services } from '@palnadu/config';
import { CtaSection } from '@/components/sections/cta-section';
import {
  Lightbulb,
  Globe,
  Smartphone,
  Rocket,
  Code,
  Zap,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';

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

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Web applications, mobile apps, MVP development, custom software, business automation, and technical consulting. Built by engineers from Palnadu.',
};

export default function ServicesPage() {
  return (
    <>
      <section className="py-24 sm:py-32 relative">
        <div className="container max-w-5xl">
          <div className="space-y-4 mb-16">
            <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
              Services
            </p>
            <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white leading-tight">
              Software built around your actual problems.
            </h1>
            <p className="mt-4 text-lg text-slate-300 max-w-2xl leading-relaxed">
              We help at every stage — from testing a raw idea to building custom platforms that streamline your daily business.
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {services.map((service, index) => {
              const Icon = iconMap[service.icon] || Code;
              const desc = humanDescriptions[service.slug] || service.shortDescription;

              return (
                <Link
                  key={service.slug}
                  href={`/services/${service.slug}`}
                  className="group flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/40 p-7 backdrop-blur-sm transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/40"
                >
                  <div>
                    <div className="mb-5 flex items-center justify-between">
                      <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-slate-900 border border-slate-800 text-cyan-400 group-hover:border-cyan-500/40 transition-colors">
                        <Icon className="h-6 w-6" />
                      </div>
                      <span className="font-mono text-xs text-slate-500 font-semibold">
                        0{index + 1}
                      </span>
                    </div>

                    <h2 className="text-xl font-bold text-white group-hover:text-cyan-300 transition-colors">
                      {service.title}
                    </h2>

                    <p className="mt-3 text-sm sm:text-base text-slate-400 leading-relaxed">
                      {desc}
                    </p>
                  </div>

                  <div className="mt-6 flex items-center gap-2 text-xs font-semibold text-cyan-400 pt-4 border-t border-slate-900">
                    <span>Read our approach</span>
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
