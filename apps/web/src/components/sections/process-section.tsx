'use client';

const steps = [
  {
    number: '01',
    title: 'Understand',
    summary: "We don't talk tech stacks first. We listen to where your work gets stuck.",
    detail:
      'We sit down with you and figure out the exact bottleneck. Who is using the software? What takes hours today that should take seconds? Where do orders or customer inquiries get dropped? We find the real problem first.',
  },
  {
    number: '02',
    title: 'Analyze',
    summary: 'Uncovering dependencies, technical limitations, and hidden traps before writing code.',
    detail:
      'Every project has hidden complexity — legacy databases, third-party API reliability, mobile network connectivity, or hosting costs. We evaluate these upfront so nobody gets blindsided two months later.',
  },
  {
    number: '03',
    title: 'Explain',
    summary: 'Straight talk on what needs to be built, what doesn’t, and what it will actually cost.',
    detail:
      "We give you our honest assessment before taking a rupee or dollar. If something in your wish list is unnecessary or overly expensive, we tell you directly. If there's a simpler existing tool that solves it, we recommend that instead.",
  },
  {
    number: '04',
    title: 'Plan',
    summary: 'Setting clean milestones, architecture, and delivery dates.',
    detail:
      'We define the technical roadmap in clear, understandable phases. You know exactly what gets delivered each week, how data is stored, and what success looks like at every checkpoint.',
  },
  {
    number: '05',
    title: 'Build',
    summary: 'Quality engineering with continuous visibility.',
    detail:
      'We write strictly typed, well-architected code that is built to last. You get regular access to a working staging environment where you can click through features as they are completed.',
  },
  {
    number: '06',
    title: 'Deliver',
    summary: 'Thorough testing, clean handoff, and zero lock-in.',
    detail:
      'We run end-to-end tests, verify security, configure production deployment, and walk your team through the system. You own 100% of your code, data, and infrastructure.',
  },
  {
    number: '07',
    title: 'Support',
    summary: 'Standing behind what we ship for the long haul.',
    detail:
      'Good software evolves. We provide ongoing support, monitor uptime, patch dependencies, and help you build phase two once real customer feedback comes in.',
  },
];

export function ProcessSection() {
  return (
    <section className="py-24 sm:py-32 relative border-t border-slate-900" id="process">
      <div className="container max-w-4xl">
        <div className="mb-16">
          <p className="text-xs font-mono uppercase tracking-widest text-cyan-400 mb-3">
            How we work
          </p>
          <h2 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-white">
            A clear process. No guessing.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-400 leading-relaxed">
            From the first phone call until your software has been running in production for years.
          </p>
        </div>

        {/* Clean Apple-style editorial timeline */}
        <div className="space-y-12">
          {steps.map((step) => (
            <div
              key={step.number}
              className="grid gap-4 sm:grid-cols-[80px_1fr] sm:gap-8 pb-10 border-b border-slate-900/90 last:border-0"
            >
              <div className="font-mono text-xl sm:text-2xl font-bold text-slate-600">
                {step.number}
              </div>
              <div className="space-y-2">
                <h3 className="text-xl sm:text-2xl font-semibold text-white">
                  {step.title}
                </h3>
                <p className="text-sm sm:text-base font-medium text-cyan-300/90">
                  {step.summary}
                </p>
                <p className="text-sm sm:text-base text-slate-400 leading-relaxed pt-1">
                  {step.detail}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
