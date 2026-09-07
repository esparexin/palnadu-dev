import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Hero3DWrapper } from '@/components/three/hero-3d-wrapper';

export function HeroSection() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 3D Dynamic Particle Transformation (Apple-style scroll driven) */}
      <Hero3DWrapper />

      {/* Editorial Content — Authentic, Human, Direct */}
      <div className="container relative z-10 py-20 sm:py-28 md:py-36">
        <div className="mx-auto max-w-4xl space-y-8 text-center">
          {/* Main Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-8xl font-bold tracking-tight text-balance leading-[1.08] text-white">
            Start with the problem.{' '}
            <span className="text-slate-400 font-normal block sm:inline">
              We build the solution.
            </span>
          </h1>

          {/* Human-written subheadline */}
          <p className="mx-auto max-w-2xl text-lg sm:text-xl text-slate-300 leading-relaxed font-normal">
            You don&apos;t need to know whether you need a mobile app, a web dashboard, or custom automation. If something in your business is slow, manual, or broken — tell us. We figure out what will actually fix it.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row pt-4">
            <Button
              asChild
              size="xl"
              className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-200 font-semibold px-8 py-6 rounded-full text-base shadow-xl transition-transform active:scale-95"
            >
              <Link href="/contact" className="flex items-center gap-2">
                <span>Tell us your problem</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="xl"
              className="w-full sm:w-auto border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-900 hover:text-white px-8 py-6 rounded-full text-base backdrop-blur-md"
            >
              <Link href="#philosophy" className="flex items-center gap-2">
                <span>See how we think</span>
                <ArrowDown className="h-4 w-4 text-slate-400" />
              </Link>
            </Button>
          </div>

          <p className="text-xs sm:text-sm text-slate-400 pt-2 font-mono">
            8+ years solving real-world technical problems • Palnadu, India
          </p>
        </div>
      </div>
    </section>
  );
}
