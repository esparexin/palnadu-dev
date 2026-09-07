export function TransparencySection() {
  return (
    <section className="py-24 sm:py-32 relative border-t border-slate-900" id="transparency">
      <div className="container max-w-4xl">
        <div className="space-y-4 mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400">
            Honest engineering
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            No hidden surprises.
          </h2>
        </div>

        <div className="space-y-12">
          <div className="space-y-3 pb-8 border-b border-slate-900/90">
            <p className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-snug">
              &ldquo;If we see a problem, we&apos;ll tell you.&rdquo;
            </p>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
              If an architecture will get expensive when you reach 500 users, or if an API you want to rely on is unstable, we tell you before you spend money on it.
            </p>
          </div>

          <div className="space-y-3 pb-8 border-b border-slate-900/90">
            <p className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-snug">
              &ldquo;If something doesn&apos;t need to be built, we&apos;ll tell you.&rdquo;
            </p>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
              Many founders and businesses think they need a complex system when a simple, well-designed tool would solve the whole issue. We actively talk you out of unnecessary work.
            </p>
          </div>

          <div className="space-y-3">
            <p className="text-2xl sm:text-3xl md:text-4xl font-semibold text-white leading-snug">
              &ldquo;If there is a better approach, we&apos;ll explain it.&rdquo;
            </p>
            <p className="text-base sm:text-lg text-slate-400 leading-relaxed max-w-2xl">
              We explain our technical choices in plain language so you always know what is being built, why it was chosen, and what the trade-offs are.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
