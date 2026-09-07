import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight, MessageSquareCode } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden" id="cta">
      {/* Centered luminous background */}
      <div className="ambient-glow-cyan top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] opacity-15" />

      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-8 sm:p-12 md:p-16 text-center shadow-2xl backdrop-blur-2xl">
          <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-2xl bg-cyan-400/10 border border-cyan-400/20 text-cyan-400 shadow-inner">
            <MessageSquareCode className="h-7 w-7" />
          </div>

          <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl lg:text-5xl text-white text-balance leading-tight">
            Have a problem that needs solving?
          </h2>

          <p className="mx-auto mt-4 max-w-xl text-base sm:text-lg text-slate-300 leading-relaxed">
            Tell us what you&apos;re dealing with. We&apos;ll analyze it, give you an honest appraisal,
            and recommend the simplest, highest-quality path forward.
          </p>

          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button
              asChild
              size="xl"
              className="w-full sm:w-auto bg-cyan-400 text-slate-950 hover:bg-cyan-300 font-semibold shadow-lg shadow-cyan-500/25 hover:shadow-cyan-400/40 hover:scale-[1.02] transition-all"
            >
              <Link href="/contact" className="flex items-center justify-center gap-2">
                <span>Tell us your problem</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="xl"
              className="w-full sm:w-auto border-slate-700 bg-slate-950/60 text-slate-300 hover:bg-slate-900 hover:text-white"
            >
              <Link href="/services">Explore our services</Link>
            </Button>
          </div>

          <p className="mt-6 text-xs text-slate-400">
            No aggressive sales tactics. Direct conversation with practicing engineers.
          </p>
        </div>
      </div>
    </section>
  );
}
