import type { Metadata } from 'next';
import Link from 'next/link';
import { Zap, Palette, Puzzle, ArrowRight, ArrowUpRight, CheckCircle2 } from 'lucide-react';
import { CtaSection } from '@/components/sections/cta-section';

export const metadata: Metadata = {
  title: 'Work & Apps',
  description:
    'A visual collection of our most recent works — each piece crafted with intention, emotion, and style. Built with speed, minimal load times, and plug-and-play architecture.',
};

// 3 Core Architectural Pillars specified for Palnadu apps
const appPillars = [
  {
    icon: Zap,
    title: 'Lightning-Fast Performance',
    description: 'Built with speed — minimal load times and optimized.',
    accent: 'text-palnadu-blue',
    bg: 'bg-palnadu-light-blue',
  },
  {
    icon: Palette,
    title: 'Beautifully Designed Components',
    description: 'Modern, pixel-perfect UI components ready for any project.',
    accent: 'text-palnadu-teal',
    bg: 'bg-teal-50',
  },
  {
    icon: Puzzle,
    title: 'Plug-and-Play Integration',
    description: 'Simple setup with support for React, Next.js, and Tailwind CSS.',
    accent: 'text-palnadu-dark',
    bg: 'bg-palnadu-off-white',
  },
];

// Production Applications Showcase
const featuredApps = [
  {
    title: 'Operations & Dispatch Automation ERP',
    category: 'Enterprise Web Application',
    description:
      'Engineered to eliminate paper logs and disconnected spreadsheets. Features automated dispatch queues, live driver telemetry, and instant multi-warehouse inventory reconciliation.',
    impact: '85% reduction in manual data entry',
    stack: ['Next.js', 'TypeScript', 'Tailwind CSS', 'PostgreSQL', 'Redis'],
    linkText: 'Explore System Architecture',
    href: '/contact',
  },
  {
    title: 'Offline-First Field Management Suite',
    category: 'Cross-Platform Mobile App',
    description:
      'Engineered for field engineers and logistics crews operating in areas with intermittent connectivity. Automatically queues sync mutations locally and reconciles on network reconnect.',
    impact: 'Zero data loss across 10,000+ daily logs',
    stack: ['React Native', 'Tailwind CSS', 'Node.js', 'SQLite', 'NestJS'],
    linkText: 'Explore Mobile Architecture',
    href: '/contact',
  },
  {
    title: 'Real-Time Industrial IoT Telemetry Hub',
    category: 'Real-Time Analytics Platform',
    description:
      'High-throughput telemetry ingestion platform processing real-time sensor streams. Features anomaly detection algorithms, instant operator alerts, and millisecond visualization latency.',
    impact: '<40ms real-time event latency',
    stack: ['React', 'Next.js', 'Tailwind CSS', 'WebSockets', 'TimescaleDB'],
    linkText: 'Explore IoT Architecture',
    href: '/contact',
  },
  {
    title: 'Multi-Tenant B2B Logistics Clearinghouse',
    category: 'SaaS Platform & API',
    description:
      'Cloud platform connecting freight forwarders with enterprise transport fleets. Includes automated rate negotiation engines, contract compliance verification, and instant e-billing.',
    impact: '100% automated milestone settlement',
    stack: ['Next.js', 'Tailwind CSS', 'Prisma', 'MongoDB', 'Docker'],
    linkText: 'Explore SaaS Architecture',
    href: '/contact',
  },
];

export default function WorkPage() {
  return (
    <div className="bg-white text-palnadu-dark">
      {/* ── 1. HERO SECTION: ABOUT OUR APPS ── */}
      <section className="relative px-4 sm:px-8 md:px-12 lg:px-16 pt-12 pb-14 sm:pt-16 sm:pb-20 lg:pt-24 lg:pb-24 border-b border-palnadu-border/60 bg-palnadu-off-white/30">
        <div className="max-w-4xl mx-auto text-center space-y-4 sm:space-y-5">
          {/* Eyebrow */}
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
            About our apps
          </p>

          {/* Main Title & Subtitle */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-palnadu-dark leading-[1.12]">
            A visual collection of our most recent works
            <span className="block text-xl sm:text-2xl lg:text-3xl font-normal text-palnadu-body mt-2 sm:mt-3">
              — each piece crafted with intention, emotion and style.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-palnadu-body leading-relaxed max-w-2xl mx-auto pt-2">
            We build software that solves actual business friction. Explore how we turn complex business operations into fast, elegant, and production-ready applications.
          </p>
        </div>
      </section>

      {/* ── 2. THREE CORE PILLARS: SPEED, DESIGN, INTEGRATION ── */}
      <section className="px-4 sm:px-8 md:px-12 lg:px-16 py-12 sm:py-16 lg:py-20 border-b border-palnadu-border/60 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {appPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-6 sm:p-7 rounded-xl border border-palnadu-border bg-white shadow-2xs hover:border-palnadu-blue hover:shadow-xs transition-all space-y-3.5 text-left"
                >
                  <div
                    className={`h-11 w-11 rounded-lg ${pillar.bg} ${pillar.accent} flex items-center justify-center shadow-2xs`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1.5">
                    <h3 className="font-bold text-base text-palnadu-dark">
                      {pillar.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed">
                      {pillar.description}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── 3. VISUAL COLLECTION: RECENT WORKS SHOWCASE ── */}
      <section className="px-4 sm:px-8 md:px-12 lg:px-16 py-12 sm:py-16 lg:py-24 bg-palnadu-off-white/20 border-b border-palnadu-border/60">
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-12">
          <div className="max-w-2xl text-left space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
              Production Portfolio
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
              Engineered For Impact.
            </h2>
            <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
              Every system is built to eliminate operational bottlenecks, reduce manual labor, and provide immediate visibility.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8">
            {featuredApps.map((app) => (
              <div
                key={app.title}
                className="rounded-2xl border border-palnadu-border bg-white p-6 sm:p-8 shadow-2xs hover:border-palnadu-blue hover:shadow-xs transition-all flex flex-col justify-between space-y-5"
              >
                <div className="space-y-3.5">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-mono font-semibold uppercase tracking-wider text-palnadu-blue">
                      {app.category}
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs font-mono text-palnadu-teal font-semibold">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>{app.impact}</span>
                    </span>
                  </div>

                  <h3 className="text-lg sm:text-xl font-bold text-palnadu-dark leading-snug">
                    {app.title}
                  </h3>

                  <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed">
                    {app.description}
                  </p>
                </div>

                <div className="space-y-4 pt-4 border-t border-palnadu-border/60">
                  {/* Tech Stack Pills */}
                  <div className="flex flex-wrap gap-1.5">
                    {app.stack.map((tech) => (
                      <span
                        key={tech}
                        className="px-2.5 py-1 rounded-md text-[11px] font-mono font-medium bg-palnadu-light-blue/60 text-palnadu-dark border border-palnadu-border/40"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>

                  {/* Action Link */}
                  <div className="pt-1">
                    <Link
                      href={app.href}
                      className="text-xs sm:text-sm font-semibold text-palnadu-blue hover:underline inline-flex items-center gap-1.5 group"
                    >
                      <span>{app.linkText}</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. CTA SECTION ── */}
      <CtaSection />
    </div>
  );
}
