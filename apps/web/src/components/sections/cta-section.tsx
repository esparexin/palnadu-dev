import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="py-12 sm:py-20 relative w-full flex flex-col justify-between" id="cta">
      <div className="container max-w-4xl text-center my-auto">
        <div className="space-y-6">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            Next steps
          </p>
          <h2 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-white text-balance leading-[1.1]">
            Have a problem that needs solving?
          </h2>

          <p className="mx-auto max-w-xl text-base sm:text-lg text-slate-300 leading-relaxed font-normal">
            Tell us what isn&apos;t working. We&apos;ll look at the situation, tell you the truth about what it takes to fix, and help you find the right path forward.
          </p>

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
              <Link href="/services">See all services</Link>
            </Button>
          </div>

          <p className="text-xs text-slate-500 pt-2">
            No sales pitches. Straightforward engineering conversations.
          </p>
        </div>
      </div>
    </section>
  );
}
