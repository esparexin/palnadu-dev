import { SectionHeading } from '@/components/layout/section-heading';
import { AlertCircle, Ban, ArrowUpRight } from 'lucide-react';

const statements = [
  {
    icon: AlertCircle,
    color: 'text-amber-400 bg-amber-400/10 border-amber-400/20',
    title: 'Honest Risk Evaluation',
    text: "If we see a problem, we'll tell you.",
    subtext: 'We assess hosting bottlenecks, scale limits, and integration traps before you spend capital.',
  },
  {
    icon: Ban,
    color: 'text-rose-400 bg-rose-400/10 border-rose-400/20',
    title: 'Disciplined Scope',
    text: "If something doesn't need to be built, we'll tell you.",
    subtext: 'We actively eliminate bloated features and redundant modules that drain your budget.',
  },
  {
    icon: ArrowUpRight,
    color: 'text-cyan-400 bg-cyan-400/10 border-cyan-400/20',
    title: 'Better Alternatives',
    text: "If there is a better approach, we'll explain it.",
    subtext: 'Often an off-the-shelf connector or phased automation is smarter than a massive custom rewrite.',
  },
];

export function TransparencySection() {
  return (
    <section className="py-20 md:py-28 relative overflow-hidden" id="transparency">
      <div className="container relative z-10">
        <SectionHeading
          label="Transparent Partnership"
          title="No Hidden Surprises. Direct Truth."
          description="You should never have to wonder what is being built, why, or what the real costs and risks are."
        />

        <div className="mx-auto mt-14 grid max-w-5xl gap-6 md:grid-cols-3">
          {statements.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.text}
                className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-7 backdrop-blur-xl transition-all duration-300 hover:border-slate-700 hover:bg-slate-900/50 hover:-translate-y-1"
              >
                <div>
                  <div className={`mb-5 flex h-12 w-12 items-center justify-center rounded-xl border ${item.color}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <h3 className="text-sm font-mono uppercase tracking-wider text-slate-400 mb-2">
                    {item.title}
                  </h3>
                  <p className="text-lg font-bold text-white leading-snug">
                    {item.text}
                  </p>
                </div>
                <p className="mt-4 text-xs sm:text-sm text-slate-400 leading-relaxed border-t border-slate-900 pt-4">
                  {item.subtext}
                </p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-2xl text-center">
          <p className="text-sm text-slate-400 leading-relaxed">
            We make no unrealistic guarantees or marketing exaggerations. Before a project
            begins, you receive a clear scope, fixed budget boundary, risk disclosure, and honest
            milestones.
          </p>
        </div>
      </div>
    </section>
  );
}
