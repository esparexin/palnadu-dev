import { SectionHeading } from '@/components/layout/section-heading';
import { Check } from 'lucide-react';

const principles = [
  {
    title: 'Correct Scope',
    desc: 'Focusing exclusively on features that solve the core problem for users.',
  },
  {
    title: 'Avoiding Unnecessary Features',
    desc: 'Eliminating bloated microservices or unproven tools that add overhead.',
  },
  {
    title: 'Appropriate Technology',
    desc: 'Choosing battle-tested TypeScript, PostgreSQL, and Next.js over trendy experiments.',
  },
  {
    title: 'Practical Architecture',
    desc: 'Modular monolithic patterns that scale gracefully without cloud inflation.',
  },
  {
    title: 'Phased Development',
    desc: 'Releasing iteratively to validate early before committing deep capital.',
  },
  {
    title: 'Transparent Requirements',
    desc: 'No sudden scope creep, surprise invoices, or ambiguous sprint billings.',
  },
  {
    title: 'Sensible Engineering Decisions',
    desc: 'Clean code, strict types, and robust automated testing that prevent costly rewrites.',
  },
];

export function AffordabilitySection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden" id="affordability">
      {/* Ambient background glow */}
      <div className="ambient-glow-cyan bottom-10 right-1/4 w-[400px] h-[400px] opacity-10" />

      <div className="container relative z-10">
        <SectionHeading
          label="Pricing & Value Philosophy"
          title="We put a boundary on price — not on quality."
          description="Affordable development does not mean cheap shortcuts. It comes from disciplined engineering and eliminating waste."
        />

        <div className="mx-auto mt-14 max-w-4xl">
          <div className="grid gap-4 sm:grid-cols-2">
            {principles.map((item) => (
              <div
                key={item.title}
                className="flex items-start gap-4 rounded-xl border border-slate-800/80 bg-slate-950/60 p-5 backdrop-blur-md transition-all hover:border-cyan-500/30 hover:bg-slate-900/60"
              >
                <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-cyan-500/10 text-cyan-400 mt-0.5">
                  <Check className="h-4 w-4" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-white">{item.title}</h4>
                  <p className="mt-1 text-xs text-slate-400 leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-10 rounded-2xl border border-slate-800 bg-slate-900/40 p-6 text-center backdrop-blur-md">
            <p className="text-sm text-slate-300 font-medium">
              We position as your <span className="text-cyan-400 font-semibold">long-term technology partner</span>, delivering cost-conscious, reliable engineering.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
