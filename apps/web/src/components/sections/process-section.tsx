'use client';

import { useState } from 'react';
import { processSteps } from '@palnadu/config';
import { SectionHeading } from '@/components/layout/section-heading';
import { cn } from '@/lib/utils';

export function ProcessSection() {
  const [activeStep, setActiveStep] = useState(0);

  return (
    <section className="py-20 md:py-28" id="process">
      <div className="container">
        <SectionHeading
          label="How we work"
          title="Problem → Understanding → Solution"
          description="A clear, honest process from problem to production."
        />

        <div className="mx-auto mt-16 max-w-5xl">
          <div className="grid gap-8 md:grid-cols-[280px_1fr]">
            {/* Step List */}
            <div className="flex flex-row gap-2 overflow-x-auto md:flex-col md:gap-1 md:overflow-visible">
              {processSteps.map((step, index) => (
                <button
                  key={step.number}
                  onClick={() => setActiveStep(index)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-4 py-3 text-left text-sm font-medium transition-all whitespace-nowrap md:whitespace-normal',
                    activeStep === index
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-muted hover:text-foreground',
                  )}
                >
                  <span className="font-mono text-xs opacity-60">{step.number}</span>
                  <span>{step.title}</span>
                </button>
              ))}
            </div>

            {/* Step Detail */}
            <div className="flex items-center rounded-lg border bg-card p-8 md:p-12">
              <div className="space-y-4">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm text-muted-foreground">
                    {processSteps[activeStep].number}
                  </span>
                  <h3 className="text-2xl font-bold">{processSteps[activeStep].title}</h3>
                </div>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  {processSteps[activeStep].description}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
