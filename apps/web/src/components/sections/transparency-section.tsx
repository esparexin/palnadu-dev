export function TransparencySection() {
  const commitments = [
    {
      rule: '01',
      quote: "If we see a problem, we'll tell you.",
      explanation:
        'If an architecture will get expensive when you scale, or if a third-party API is unstable, we warn you before you spend any money on it.',
    },
    {
      rule: '02',
      quote: "If something doesn't need to be built, we'll tell you.",
      explanation:
        'We actively talk you out of unnecessary features, complex microservices, and bloated tools that drain your budget without adding value.',
    },
    {
      rule: '03',
      quote: "If there is a better approach, we'll explain it.",
      explanation:
        'We explain technical trade-offs in plain language so you always understand what is being built, why it was chosen, and what it costs.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 md:py-20 relative border-t border-slate-900" id="transparency">
      <div className="container max-w-5xl">
        {/* Highlighted Banner Box */}
        <div className="rounded-2xl sm:rounded-3xl border border-cyan-500/30 bg-gradient-to-b from-slate-900/90 to-slate-950/90 p-6 sm:p-10 md:p-12 shadow-2xl backdrop-blur-xl">
          <div className="space-y-3 mb-8 sm:mb-10 text-center sm:text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-cyan-500/30 bg-cyan-950/40 text-cyan-300 text-xs font-mono uppercase tracking-wider">
              <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
              <span>Honest Engineering Standards</span>
            </div>

            <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
              No hidden surprises.
            </h2>

            <p className="text-sm sm:text-base text-slate-300 max-w-2xl leading-relaxed">
              Before you spend a single rupee or dollar, here are the three commitments we make to every client:
            </p>
          </div>

          {/* 3 Prominent Highlighted Commitments */}
          <div className="grid gap-4 sm:gap-6 md:grid-cols-3">
            {commitments.map((item) => (
              <div
                key={item.rule}
                className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-800 bg-slate-950/80 p-5 sm:p-6 transition-all hover:border-cyan-500/40"
              >
                <div>
                  <span className="font-mono text-xs text-cyan-400 font-semibold block mb-2 sm:mb-3">
                    Rule {item.rule}
                  </span>
                  <h3 className="text-base sm:text-lg font-bold text-white leading-snug">
                    &ldquo;{item.quote}&rdquo;
                  </h3>
                </div>
                <p className="mt-3 sm:mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-900 pt-3">
                  {item.explanation}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center sm:text-left">
            <p className="text-xs text-slate-400 font-mono">
              You receive fixed price boundaries, risk disclosures, and honest scope before development starts.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
