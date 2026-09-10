import type { Metadata } from 'next';
import { Zap, Palette, Puzzle } from 'lucide-react';
import { CtaSection } from '@/components/sections/cta-section';
import { BentoGrid01 } from '@/components/ui/bento-grid-01';

export const metadata: Metadata = {
  title: 'Work & Apps',
  description:
    'A visual collection of our most recent works — each piece crafted with intention, emotion and style.',
};

// 3 Core Architectural Pillars
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

export default function WorkPage() {
  return (
    <div className="bg-white text-palnadu-dark">
      {/* ── 1. HERO SECTION: ABOUT OUR APPS ── */}
      <section className="relative px-4 sm:px-8 md:px-12 lg:px-16 pt-12 pb-12 sm:pt-16 sm:pb-16 lg:pt-20 lg:pb-20 border-b border-palnadu-border/60 bg-palnadu-off-white/30">
        <div className="max-w-4xl mx-auto text-center space-y-4">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
            About our apps
          </p>

          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-palnadu-dark leading-[1.12]">
            A visual collection of our most recent works
            <span className="block text-xl sm:text-2xl lg:text-3xl font-normal text-palnadu-body mt-2 sm:mt-3">
              — each piece crafted with intention, emotion and style.
            </span>
          </h1>
        </div>
      </section>

      {/* ── 2. THREE CORE PILLARS: SPEED, DESIGN, INTEGRATION ── */}
      <section className="px-4 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-14 lg:py-16 border-b border-palnadu-border/60 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
            {appPillars.map((pillar) => {
              const Icon = pillar.icon;
              return (
                <div
                  key={pillar.title}
                  className="p-6 sm:p-7 rounded-xl border border-palnadu-border bg-white shadow-2xs hover:border-palnadu-blue hover:shadow-xs transition-all space-y-3 text-left"
                >
                  <div
                    className={`h-11 w-11 rounded-lg ${pillar.bg} ${pillar.accent} flex items-center justify-center shadow-2xs`}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <div className="space-y-1">
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

      {/* ── 3. INTERACTIVE BENTO GRID ── */}
      <BentoGrid01 />

      {/* ── 4. CTA SECTION ── */}
      <CtaSection />
    </div>
  );
}
