export function AffordabilitySection() {
  return (
    <section className="py-24 sm:py-32 relative border-t border-slate-900" id="affordability">
      <div className="container max-w-4xl">
        <div className="space-y-4 mb-14">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            Pricing philosophy
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            We put a boundary on price —<br />
            <span className="text-slate-400 font-normal">not on quality.</span>
          </h2>
        </div>

        <div className="space-y-6 text-base sm:text-lg text-slate-300 leading-relaxed">
          <p>
            Cheap software development is usually the most expensive thing a business can buy. You pay less upfront, but end up paying three times more when the code breaks, the original freelancers disappear, and you have to scrap the whole thing and start over.
          </p>
          <p>
            We don&apos;t position ourselves as a discount shop. We practice <strong className="text-white font-semibold">cost-conscious, practical engineering</strong>.
          </p>
        </div>

        <div className="mt-12 grid gap-6 sm:grid-cols-2 pt-6 border-t border-slate-900/90 text-sm sm:text-base">
          <div className="space-y-2">
            <h3 className="font-semibold text-white">Disciplined Scope</h3>
            <p className="text-slate-400 leading-relaxed">
              We define the smallest set of features that genuinely solves your problem, eliminating the 60% of nice-to-have bloat that inflates software budgets.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white">Sensible Architecture</h3>
            <p className="text-slate-400 leading-relaxed">
              We use reliable, modular architecture like Next.js, TypeScript, and PostgreSQL that runs smoothly on standard, cost-effective hosting rather than over-engineered cloud setups.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white">Phased Releases</h3>
            <p className="text-slate-400 leading-relaxed">
              We ship phase one quickly so you can test it with real users and make adjustments before committing additional capital to phase two.
            </p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold text-white">Direct Engineering</h3>
            <p className="text-slate-400 leading-relaxed">
              You work directly with the developers writing your software. No layers of non-technical account executives adding markups to your bill.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
