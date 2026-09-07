export function TransparencySection() {
  const commitments = [
    {
      rule: '01',
      quote: "If we see a problem, we'll tell you.",
      explanation: 'We flag scaling costs and unstable APIs upfront before you spend money.',
    },
    {
      rule: '02',
      quote: "If not needed, we don't build it.",
      explanation: 'We eliminate bloated features and complex tooling that drain budget.',
    },
    {
      rule: '03',
      quote: "If there's a better way, we'll say it.",
      explanation: 'Clear trade-offs explained in plain language so you stay in control.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white border-t border-palnadu-border" id="transparency">
      <div className="container max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1">
            Commitment
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-palnadu-dark">
            No Hidden Surprises
          </h2>
        </div>

        {/* Clean Typographic Commitments — No Card Boxes */}
        <div className="grid gap-6 sm:grid-cols-3 divide-y sm:divide-y-0 sm:divide-x divide-palnadu-border">
          {commitments.map((item, idx) => (
            <div
              key={item.rule}
              className={`space-y-1.5 ${idx > 0 ? 'pt-4 sm:pt-0 sm:pl-6' : ''}`}
            >
              <span className="font-mono text-xs text-palnadu-blue font-bold block">
                Rule {item.rule}
              </span>
              <h3 className="text-sm font-bold text-palnadu-dark leading-snug">
                &ldquo;{item.quote}&rdquo;
              </h3>
              <p className="text-xs text-palnadu-body leading-relaxed">
                {item.explanation}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
