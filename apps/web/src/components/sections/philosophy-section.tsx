import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function PhilosophySection() {
  return (
    <section className="py-24 sm:py-32 relative border-t border-slate-900" id="philosophy">
      <div className="container max-w-4xl">
        <div className="space-y-6">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            How we approach work
          </p>

          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            We don&apos;t just build software.<br />
            <span className="text-slate-400 font-normal">We solve the problem in front of you.</span>
          </h2>

          <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed pt-2">
            <p>
              Most software projects run into trouble not because of bad code, but because nobody stopped to ask if the thing being built was actually what was needed.
            </p>
            <p>
              You don&apos;t need to arrive with an 80-page specification or decide whether you need a native mobile app, a web portal, or a database migration. Just tell us what is causing friction. Where are you losing hours every week? Where are orders getting dropped? What idea are you trying to test before spending your savings?
            </p>
            <p className="border-l-2 border-cyan-400 pl-4 text-slate-200 italic">
              &ldquo;If a free tool or a simple spreadsheet adjustment solves your issue, we will tell you to do that instead of paying us to build software. We only build when software will genuinely move your business forward.&rdquo;
            </p>
            <p>
              When a custom build is the right choice, we keep it disciplined. No bloated microservices, no unnecessary frameworks, and no surprise invoices.
            </p>
          </div>

          <div className="pt-6">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Have a problem you&apos;d like to talk through?</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
