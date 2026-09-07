import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function PhilosophySection() {
  return (
    <section className="py-12 sm:py-20 md:py-28 relative border-t border-slate-900" id="philosophy">
      <div className="container max-w-4xl">
        <div className="space-y-4 sm:space-y-6">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            How we approach work
          </p>

          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            We don&apos;t just build software.<br />
            <span className="text-slate-400 font-normal">We solve the problem in front of you.</span>
          </h2>

          <div className="space-y-4 text-sm sm:text-base md:text-lg text-slate-300 leading-relaxed pt-1">
            <p>
              Most software projects run into trouble not because of bad code, but because nobody stopped to ask if the thing being built was actually what was needed.
            </p>
            <p>
              You don&apos;t need an 80-page specification or a chosen tech stack. Tell us what is causing friction: where are you losing hours every week, where are orders getting dropped, or what business idea are you trying to test before spending your savings?
            </p>
            <p className="border-l-2 border-cyan-400 pl-4 text-slate-200 italic py-0.5">
              &ldquo;If a free existing tool or a simple spreadsheet adjustment solves your issue, we will tell you to do that instead of paying us to build software. We only build when custom code genuinely moves your business forward.&rdquo;
            </p>
          </div>

          <div className="pt-3">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Have an idea or process you&apos;d like to discuss?</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
