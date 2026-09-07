import Link from 'next/link';

export function PhilosophySection() {
  return (
    <section className="py-12 sm:py-16 bg-white border-t border-palnadu-border" id="philosophy">
      <div className="container max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1">
            Philosophy
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-palnadu-dark">
            Solve the Real Problem First
          </h2>
        </div>

        {/* Clean Typographic 2-Column Split — No Card Boxes */}
        <div className="grid gap-6 sm:grid-cols-2">
          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-palnadu-dark">No Spec Required</h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              Tell us what causes friction in your business: where you lose hours, drop orders, or want to test an idea before spending capital.
            </p>
          </div>

          <div className="space-y-1.5">
            <h3 className="text-sm font-bold text-palnadu-dark">Honest Alternatives</h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              If an existing free tool or simple workflow adjustment solves your problem, we recommend that instead of billing you for custom software.
            </p>
          </div>
        </div>

        <div className="mt-5">
          <Link
            href="/contact"
            className="text-xs font-semibold text-palnadu-blue hover:underline"
          >
            Discuss your situation →
          </Link>
        </div>
      </div>
    </section>
  );
}
