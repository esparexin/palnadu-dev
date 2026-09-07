'use client';

import { useState } from 'react';
import { processSteps } from '@palnadu/config';
import { SectionHeading } from '@/components/layout/section-heading';
import { cn } from '@/lib/utils';
import {
  Search,
  Cpu,
  MessageSquare,
  Compass,
  Code2,
  CheckCircle2,
  LifeBuoy,
  ArrowRight,
} from 'lucide-react';
import Link from 'next/link';

const stepIcons = [
  Search,
  Cpu,
  MessageSquare,
  Compass,
  Code2,
  CheckCircle2,
  LifeBuoy,
];

const stepDetails: Record<string, string[]> = {
  '01': [
    'Direct founder-to-engineer conversation',
    'Root problem identification before proposing tools',
    'User journey and existing friction mapping',
  ],
  '02': [
    'Architectural and technical feasibility analysis',
    'Third-party dependency and integration risks',
    'Scalability and maintainability assessment',
  ],
  '03': [
    'Clear scope, realistic timeline, and transparent cost breakdown',
    'Explaining future risks and potential technical debt before coding',
    'Calling out unnecessary features that shouldn’t be built',
  ],
  '04': [
    'Technology stack selection best suited to your requirements',
    'Database schema, API contracts, and modular milestones',
    'Sprint cadence and delivery schedule alignment',
  ],
  '05': [
    'Production-grade TypeScript, robust tests, and strict linting',
    'Weekly progress visibility with staging access',
    'Security, performance, and accessibility standards enforced',
  ],
  '06': [
    'Rigorous end-to-end testing and QA',
    'Production infrastructure and CI/CD deployment',
    'Clean codebase handover and documentation',
  ],
  '07': [
    'SLA-backed technical support and system monitoring',
    'Iterative enhancements driven by real user feedback',
    'Long-term engineering partnership',
  ],
};

export function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0);
  const CurrentIcon = stepIcons[activeStep] || Search;
  const currentStepData = processSteps[activeStep];
  const deliverables = stepDetails[currentStepData.number] || [];

  return (
    <section className="py-20 md:py-28 relative overflow-hidden" id="process">
      {/* Ambient glow */}
      <div className="ambient-glow-cyan top-1/2 left-1/3 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] opacity-15" />

      <div className="container relative z-10">
        <SectionHeading
          label="Our Engineering Methodology"
          title="Problem → Understanding → Solution"
          description="A clear, transparent 7-step journey from initial problem to production-ready software."
        />

        <div className="mx-auto mt-14 max-w-5xl">
          {/* Methodology Progress Bar */}
          <div className="mb-8 hidden md:block">
            <div className="flex items-center justify-between text-xs font-mono text-slate-400 mb-2">
              <span className="text-cyan-400">Phase {activeStep + 1} of {processSteps.length}</span>
              <span>{Math.round(((activeStep + 1) / processSteps.length) * 100)}% Complete</span>
            </div>
            <div className="h-1.5 w-full bg-slate-900 rounded-full overflow-hidden border border-slate-800">
              <div
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-500 ease-out"
                style={{ width: `${((activeStep + 1) / processSteps.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="grid gap-8 md:grid-cols-[290px_1fr]">
            {/* Step Selector List with horizontal scroll on mobile */}
            <div className="flex flex-row gap-2 overflow-x-auto pb-2 md:flex-col md:gap-1.5 md:overflow-visible md:pb-0 scrollbar-none">
              {processSteps.map((step, index) => {
                const Icon = stepIcons[index] || Search;
                const isActive = activeStep === index;
                return (
                  <button
                    key={step.number}
                    onClick={() => setActiveStep(index)}
                    className={cn(
                      'flex items-center gap-3.5 rounded-xl px-4 py-3.5 text-left text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal border',
                      isActive
                        ? 'border-cyan-500/40 bg-cyan-950/40 text-white shadow-md shadow-cyan-500/10'
                        : 'border-transparent text-slate-400 hover:border-slate-800 hover:bg-slate-900/60 hover:text-slate-200',
                    )}
                  >
                    <div
                      className={cn(
                        'flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-xs font-mono transition-colors',
                        isActive
                          ? 'bg-cyan-400 text-slate-950 font-bold'
                          : 'bg-slate-900 text-slate-400',
                      )}
                    >
                      {step.number}
                    </div>
                    <div className="flex flex-col">
                      <span className={cn('text-sm font-semibold', isActive ? 'text-cyan-300' : 'text-slate-300')}>
                        {step.title}
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Step Detail Card with glassmorphism */}
            <div className="flex flex-col justify-between rounded-2xl border border-slate-800/90 bg-slate-950/70 backdrop-blur-xl p-6 sm:p-10 shadow-xl">
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-slate-800 pb-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400">
                      <CurrentIcon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="font-mono text-xs text-cyan-400 font-semibold uppercase tracking-wider">
                        Step {currentStepData.number}
                      </span>
                      <h3 className="text-2xl sm:text-3xl font-bold text-white">
                        {currentStepData.title}
                      </h3>
                    </div>
                  </div>
                </div>

                <p className="text-base sm:text-lg text-slate-300 leading-relaxed">
                  {currentStepData.description}
                </p>

                {deliverables.length > 0 && (
                  <div className="space-y-3 pt-2">
                    <p className="text-xs uppercase tracking-widest text-slate-400 font-mono">
                      What happens here:
                    </p>
                    <ul className="space-y-2.5">
                      {deliverables.map((item, idx) => (
                        <li key={idx} className="flex items-start gap-3 text-sm text-slate-300">
                          <CheckCircle2 className="h-4 w-4 text-cyan-400 shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="mt-8 pt-5 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4">
                <span className="text-xs text-slate-400">
                  Ready to solve your challenge?
                </span>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-400 hover:text-cyan-300 transition-colors"
                >
                  <span>Discuss your problem</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
