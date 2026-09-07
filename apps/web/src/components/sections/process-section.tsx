const processCards = [
  {
    step: '01',
    phase: 'Analyze',
    title: 'Diagnose First',
    summary: 'Identify real workflow bottlenecks, user demands, and technical constraints.',
  },
  {
    step: '02',
    phase: 'Scope',
    title: 'Honest Boundaries',
    summary: 'Clear pricing, transparent timeline, and zero unnecessary software bloat.',
  },
  {
    step: '03',
    phase: 'Build',
    title: 'Disciplined Sprints',
    summary: 'Battle-tested TypeScript code delivered with weekly staging access.',
  },
  {
    step: '04',
    phase: 'Deliver',
    title: 'Handoff & Support',
    summary: '100% code and infrastructure ownership with long-term maintenance.',
  },
];

export function ProcessSection() {
  return (
    <section className="py-12 sm:py-16 bg-white border-t border-palnadu-border" id="process">
      <div className="container max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1">
            Methodology
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-palnadu-dark">
            How We Work
          </h2>
        </div>

        {/* Clean Typographic 4-Step Grid — No Card Boxes, No Generic Icons */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
          {processCards.map((card) => (
            <div key={card.step} className="space-y-1">
              <div className="flex items-center gap-1.5">
                <span className="font-mono text-xs font-bold text-palnadu-blue">
                  {card.step}
                </span>
                <span className="text-[11px] font-mono uppercase text-palnadu-secondary font-semibold">
                  / {card.phase}
                </span>
              </div>
              <h3 className="text-sm font-bold text-palnadu-dark">
                {card.title}
              </h3>
              <p className="text-xs text-palnadu-body leading-relaxed">
                {card.summary}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
