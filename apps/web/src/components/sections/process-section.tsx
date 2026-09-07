'use client';

const processCards = [
  {
    step: '01',
    phase: 'Understand & Analyze',
    title: 'Diagnose before code',
    summary:
      'We sit down with you to map out where your work gets stuck. Who uses the system? Where are orders dropped? We check API dependencies and technical constraints upfront.',
    keyAction: 'Problem diagnosis & technical feasibility check',
  },
  {
    step: '02',
    phase: 'Explain & Advise',
    title: 'Honest scope & pricing',
    summary:
      "Direct talk on what needs to be built, what doesn't, and what it will cost. If a simpler off-the-shelf tool solves your problem, we tell you directly.",
    keyAction: 'Fixed scope, transparent budget & risk evaluation',
  },
  {
    step: '03',
    phase: 'Plan & Build',
    title: 'Disciplined execution',
    summary:
      'Clear weekly milestones built with battle-tested TypeScript. You get regular access to a live staging environment to test progress as features are completed.',
    keyAction: 'Weekly staging builds & production-ready code',
  },
  {
    step: '04',
    phase: 'Deliver & Support',
    title: 'Full ownership & care',
    summary:
      'Rigorous testing, zero vendor lock-in with 100% code and infrastructure ownership, followed by ongoing SLA-backed maintenance as your business scales.',
    keyAction: 'Clean code handoff, testing & long-term support',
  },
];

export function ProcessSection() {
  return (
    <section className="py-12 sm:py-20 md:py-28 relative border-t border-slate-900" id="process">
      <div className="container">
        {/* Section Heading */}
        <div className="max-w-3xl mb-8 sm:mb-12">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-2 sm:mb-3">
            Engineering Methodology
          </p>
          <h2 className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white leading-tight">
            A clear process. No guessing.
          </h2>
          <p className="mt-2 sm:mt-4 text-sm sm:text-base text-slate-400 leading-relaxed">
            From the first conversation until your software is running in production for years. Four straightforward phases:
          </p>
        </div>

        {/* 4-Grid Process Board */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {processCards.map((card) => (
            <div
              key={card.step}
              className="flex flex-col justify-between rounded-xl sm:rounded-2xl border border-slate-800/90 bg-slate-950/50 p-5 sm:p-6 backdrop-blur-sm transition-all duration-300 hover:border-cyan-500/40 hover:bg-slate-900/40"
            >
              <div>
                {/* Step badge & phase */}
                <div className="flex items-center justify-between mb-4">
                  <span className="font-mono text-xs font-bold text-cyan-400 px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-500/30">
                    Step {card.step}
                  </span>
                </div>

                <p className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-1">
                  {card.phase}
                </p>

                <h3 className="text-base sm:text-lg font-bold text-white mb-2.5">
                  {card.title}
                </h3>

                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {card.summary}
                </p>
              </div>

              <div className="mt-6 pt-3 border-t border-slate-900/90">
                <span className="text-[11px] font-mono text-cyan-400/90 leading-tight block">
                  → {card.keyAction}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
