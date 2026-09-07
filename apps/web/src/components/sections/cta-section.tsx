import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  return (
    <section className="py-12 sm:py-20 md:py-28 relative border-t border-slate-900" id="cta">
      <div className="container max-w-4xl text-center">
        <div className="space-y-4 sm:space-y-6">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            Next steps
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight text-white text-balance leading-[1.15]">
            Have a business idea, or need to automate a manual process?
          </h2>

          <p className="mx-auto max-w-xl text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed font-normal">
            Tell us what you&apos;re trying to achieve. We&apos;ll look at the situation, explain what it takes to build, and help you find the most cost-effective path forward.
          </p>

          <div className="flex flex-col items-center justify-center gap-3 sm:flex-row pt-2 sm:pt-4">
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto bg-white text-slate-950 hover:bg-slate-200 font-semibold px-7 py-5 rounded-full text-sm sm:text-base shadow-xl transition-transform active:scale-95"
            >
              <Link href="/contact" className="flex items-center justify-center gap-2">
                <span>Tell us what you want to build or fix</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full sm:w-auto border-slate-800 bg-slate-950/40 text-slate-300 hover:bg-slate-900 hover:text-white px-7 py-5 rounded-full text-sm sm:text-base backdrop-blur-md"
            >
              <Link href="/services">See all services</Link>
            </Button>
          </div>

          <p className="text-xs text-slate-500 pt-1">
            No sales pitches. Straightforward engineering conversations.
          </p>
        </div>
      </div>
    </section>
  );
}
