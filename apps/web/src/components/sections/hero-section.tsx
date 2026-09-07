import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowDown } from 'lucide-react';
import { Hero3DWrapper } from '@/components/three/hero-3d-wrapper';

export function HeroSection() {
  return (
    <section className="relative min-h-[85vh] sm:min-h-[90vh] flex items-center justify-center overflow-hidden">
      {/* 3D Dynamic Particle Transformation */}
      <Hero3DWrapper />

      {/* Editorial Content — Compact on mobile, zero empty waste */}
      <div className="container relative z-10 py-10 sm:py-16 md:py-24">
        <div className="mx-auto max-w-4xl space-y-5 sm:space-y-7 text-center">
          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight text-balance leading-[1.12] text-white">
            Have a business idea, or need to automate a manual process?{' '}
            <span className="text-slate-400 font-normal block sm:inline mt-1 sm:mt-0">
              We build the solution.
            </span>
          </h1>

          {/* Direct subheadline */}
          <p className="mx-auto max-w-2xl text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed font-normal text-balance">
            Whether you want to validate and launch an early-stage startup MVP, or replace messy spreadsheets, WhatsApp orders, and manual paper logs with custom software — we engineer what works.
          </p>

          {/* Action CTAs */}
          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row pt-2 sm:pt-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-200 font-semibold px-7 py-5 rounded-full text-sm sm:text-base shadow-xl transition-transform active:scale-95"
            >
              <Link href="/contact" className="flex items-center justify-center gap-2">
                <span>Share your idea or challenge</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-900 hover:text-white px-7 py-5 rounded-full text-sm sm:text-base backdrop-blur-md"
            >
              <Link href="#philosophy" className="flex items-center justify-center gap-2">
                <span>How we work</span>
                <ArrowDown className="h-3.5 w-3.5 text-slate-400" />
              </Link>
            </Button>
          </div>

          <p className="text-xs text-slate-400 font-mono pt-1">
            8+ years solving real-world technical problems • Palnadu, India
          </p>
        </div>
      </div>
    </section>
  );
}
