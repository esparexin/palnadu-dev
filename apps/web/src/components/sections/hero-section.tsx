import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ChevronRight, ShieldCheck } from 'lucide-react';
import { Hero3DWrapper } from '@/components/three/hero-3d-wrapper';

export function HeroSection() {
  return (
    <section className="relative min-h-[92vh] flex items-center overflow-hidden">
      {/* 3D Dynamic Background Layer (Chaotic Problem → Ordered Solution) */}
      <Hero3DWrapper />

      {/* Content — always real HTML (SEO Critical requirement #6) */}
      <div className="container relative z-10 py-16 sm:py-24 md:py-32">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          {/* Studio Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full border border-cyan-500/20 bg-cyan-950/30 text-cyan-300 text-xs sm:text-sm font-mono backdrop-blur-md animate-fade-in shadow-inner">
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            <span>Problem-First Software Studio</span>
            <span className="text-cyan-500/60">•</span>
            <span>8+ Years Experience</span>
          </div>

          {/* Primary Headline */}
          <h1 className="text-4xl font-extrabold tracking-tight sm:text-5xl md:text-6xl lg:text-7xl text-balance leading-[1.1]">
            Start with the problem.{' '}
            <span className="text-gradient-cyan block mt-1 sm:inline">
              We build the solution.
            </span>
          </h1>

          {/* Supporting Statement */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed text-balance">
            Palnadu.dev helps startups, businesses, and individuals turn real-world problems and
            ideas into practical, high-quality digital solutions.
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-2">
            <Button
              asChild
              size="xl"
              className="w-full sm:w-auto bg-cyan-400 text-slate-950 hover:bg-cyan-300 shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:scale-[1.02] transition-all font-semibold"
            >
              <Link href="/contact" className="flex items-center justify-center gap-2">
                <span>Tell us your problem</span>
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="xl"
              className="w-full sm:w-auto border-slate-700/80 bg-slate-900/60 text-slate-200 hover:bg-slate-800 hover:text-white backdrop-blur-sm"
            >
              <Link href="#process" className="flex items-center justify-center gap-2">
                <span>See how we work</span>
                <ChevronRight className="h-4 w-4 text-cyan-400" />
              </Link>
            </Button>
          </div>

          {/* Key Value Anchors */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-6 sm:gap-10 text-xs sm:text-sm text-slate-400">
            <div className="flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-cyan-400" />
              <span>Honest advice before development</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>Boundaries on price, not quality</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
              <span>No unnecessary complexity</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
