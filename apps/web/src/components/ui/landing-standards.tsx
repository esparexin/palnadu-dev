import React from 'react';

export function LandingStandards() {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      <div className="lg:col-span-7 space-y-6">
        <div className="max-w-2xl text-left">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1.5">
            Engineering Standards
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
            Truth Before Code.
          </h2>
          <p className="mt-1.5 text-sm sm:text-base text-palnadu-body leading-relaxed">
            Before writing software, we diagnose where work gets stuck. We look at API dependencies, scalability risks, and realistic costs upfront. If a simple existing tool solves your problem, we tell you directly.
          </p>
        </div>

        {/* 4 Structured Engineering Commitments in Balanced 2x2 Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          <div className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-2 text-left">
            <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center font-bold text-xs">
              01
            </div>
            <h3 className="font-bold text-sm text-palnadu-dark">Diagnostic First</h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              We audit workflow bottlenecks, user demands, and technical limitations before development begins.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-2 text-left">
            <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-teal flex items-center justify-center font-bold text-xs">
              02
            </div>
            <h3 className="font-bold text-sm text-palnadu-dark">Fixed Boundaries</h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              Clear milestones and upfront scope limits. No open-ended hourly billing or surprise engineering invoices.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-2 text-left">
            <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center font-bold text-xs">
              03
            </div>
            <h3 className="font-bold text-sm text-palnadu-dark">100% Ownership</h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              You receive full Git repository ownership and cloud credentials upon completion. Zero vendor lock-in.
            </p>
          </div>

          <div className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-2 text-left">
            <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-dark flex items-center justify-center font-bold text-xs">
              04
            </div>
            <h3 className="font-bold text-sm text-palnadu-dark">Disciplined Sprints</h3>
            <p className="text-xs text-palnadu-body leading-relaxed">
              Clean, battle-tested TypeScript code delivered in focused 3 to 6-week MVP validation cycles.
            </p>
          </div>
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-5 h-[340px]" aria-hidden="true" />
    </div>
  );
}

export function LandingMethodology() {
  const steps = [
    { step: "01", phase: "Analyze", title: "Diagnose First", desc: "Identify workflow bottlenecks, user demands, and technical limits." },
    { step: "02", phase: "Scope", title: "Honest Boundaries", desc: "Fixed pricing, transparent milestones, and zero software bloat." },
    { step: "03", phase: "Build", title: "Disciplined Sprints", desc: "Clean TypeScript code delivered with weekly staging progress access." },
    { step: "04", phase: "Deliver", title: "Handoff & Support", desc: "100% code and infrastructure ownership with post-launch support." },
  ];

  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      <div className="lg:col-span-7 space-y-6">
        <div className="max-w-2xl text-left">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1.5">
            Methodology
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
            How We Work With You
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-palnadu-body">
            A transparent, phased engineering process designed to eliminate budget risk.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
          {steps.map((p) => (
            <div key={p.step} className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-1.5 text-left">
              <div className="flex items-center gap-1.5 text-xs font-mono">
                <span className="font-bold text-palnadu-blue">{p.step}</span>
                <span className="text-palnadu-secondary uppercase font-semibold">/ {p.phase}</span>
              </div>
              <h3 className="font-bold text-sm text-palnadu-dark">{p.title}</h3>
              <p className="text-xs text-palnadu-body leading-relaxed">{p.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-5 h-[340px]" aria-hidden="true" />
    </div>
  );
}
