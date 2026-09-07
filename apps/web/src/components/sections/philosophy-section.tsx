import { SectionHeading } from '@/components/layout/section-heading';
import { CheckCircle, XCircle, ArrowRight } from 'lucide-react';
import Link from 'next/link';

export function PhilosophySection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden" id="philosophy">
      {/* Subtle ambient lighting */}
      <div className="ambient-glow-amber top-1/2 left-10 w-[400px] h-[400px] opacity-10" />

      <div className="container relative z-10">
        <SectionHeading
          label="Our Core Philosophy"
          title="We don't just build software. We solve problems."
          description="You don't need to know the technical jargon or architecture upfront. Tell us what isn't working."
        />

        {/* Philosophy Comparison / Contrast Cards */}
        <div className="mx-auto mt-14 grid max-w-4xl gap-6 md:grid-cols-2">
          {/* Traditional Agency */}
          <div className="rounded-2xl border border-rose-950/40 bg-slate-950/50 p-6 sm:p-8 backdrop-blur-xl">
            <div className="flex items-center gap-2.5 text-rose-400 font-mono text-xs uppercase tracking-wider mb-4">
              <XCircle className="h-4 w-4" />
              <span>Generic Software Vendors</span>
            </div>
            <h3 className="text-lg font-bold text-slate-200 mb-3">
              Sell features first, ask questions later
            </h3>
            <ul className="space-y-3 text-sm text-slate-400">
              <li className="flex items-start gap-2">
                <span className="text-rose-500 shrink-0">✕</span>
                <span>Pushing complex, expensive frameworks you don&apos;t need</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 shrink-0">✕</span>
                <span>Hiding future technical limitations and hosting risks</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-rose-500 shrink-0">✕</span>
                <span>Building features before validating if users actually want them</span>
              </li>
            </ul>
          </div>

          {/* Palnadu.dev Approach */}
          <div className="rounded-2xl border border-cyan-500/40 bg-slate-950/70 p-6 sm:p-8 backdrop-blur-xl shadow-xl shadow-cyan-500/5">
            <div className="flex items-center gap-2.5 text-cyan-400 font-mono text-xs uppercase tracking-wider mb-4">
              <CheckCircle className="h-4 w-4" />
              <span>Palnadu.dev Methodology</span>
            </div>
            <h3 className="text-lg font-bold text-white mb-3">
              Start with the problem. Build only what works.
            </h3>
            <ul className="space-y-3 text-sm text-slate-300">
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 shrink-0">✓</span>
                <span>Explaining limitations and future risks before writing a line of code</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 shrink-0">✓</span>
                <span>Telling you candidly if something shouldn&apos;t be built</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-cyan-400 shrink-0">✓</span>
                <span>Putting a boundary on price — never on engineering quality</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Callout */}
        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-base text-slate-300 leading-relaxed">
            Whether your challenge requires an MVP, web app, mobile app, internal automation, or
            honest consultation — we figure out what will actually move the needle for your
            business.
          </p>
          <div className="mt-6">
            <Link
              href="/contact"
              className="inline-flex items-center gap-2 text-sm font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <span>Explain what you&apos;re dealing with</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
