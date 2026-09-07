export function AffordabilitySection() {
  const points = [
    {
      title: 'Disciplined Scope',
      desc: 'Eliminating the 60% of unnecessary feature bloat that inflates initial budgets.',
    },
    {
      title: 'Sensible Architecture',
      desc: 'Battle-tested Next.js and PostgreSQL running efficiently on cost-effective hosting.',
    },
    {
      title: 'Phased Releases',
      desc: 'Ship core features first to test with real users before investing in phase two.',
    },
    {
      title: 'Direct Engineering',
      desc: 'Work directly with the developers writing code. Zero middle-management overhead.',
    },
  ];

  return (
    <section className="py-12 sm:py-16 bg-white border-t border-palnadu-border" id="affordability">
      <div className="container max-w-3xl">
        <div className="mb-6">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1">
            Pricing
          </p>
          <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-palnadu-dark">
            Boundary on Price, Not on Quality
          </h2>
        </div>

        {/* Clean 2-Column Typographic Layout — No Card Boxes */}
        <div className="grid gap-x-8 gap-y-5 sm:grid-cols-2">
          {points.map((pt, i) => (
            <div key={pt.title} className="space-y-1">
              <span className="font-mono text-xs text-palnadu-secondary font-bold">0{i + 1}</span>
              <h3 className="font-bold text-palnadu-dark text-sm">{pt.title}</h3>
              <p className="text-xs text-palnadu-body leading-relaxed">{pt.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
