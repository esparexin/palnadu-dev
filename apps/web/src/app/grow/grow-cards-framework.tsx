import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { StackingSection } from "@/components/ui/stacking-card";
import { pipelineSteps, customPillars, methodology } from "./grow-services-data";

interface GrowCardsProps {
  deckProgress: any;
}

export function GrowPipelineCard({ deckProgress }: GrowCardsProps) {
  return (
    <StackingSection
      i={3}
      total={8}
      progress={deckProgress}
      cardClassName="bg-palnadu-dark border-white/10 text-white p-5 sm:p-8 lg:p-12"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2.5 sm:space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-teal">
            The Progression Framework
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-snug sm:leading-tight">
            From Visibility to Business Growth
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-palnadu-light-blue/80 max-w-xl mx-auto">
            A continuous, measurable chain from first search impression to sustained expansion.
          </p>
        </div>

        <div className="relative space-y-3 sm:space-y-4">
          {pipelineSteps.map((step, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -12 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.35, delay: idx * 0.08 }}
              className="relative flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-5 bg-white/5 border border-white/10 rounded-2xl p-3.5 sm:p-5 backdrop-blur-sm hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between w-full sm:w-auto gap-3 sm:block">
                <div className="h-9 w-9 sm:h-12 sm:w-12 rounded-xl bg-palnadu-blue border border-white/20 text-white font-mono font-bold text-xs sm:text-base flex items-center justify-center shrink-0 shadow-md">
                  {step.number}
                </div>
                <span className="sm:hidden text-xs font-medium text-palnadu-teal">
                  {step.stat}
                </span>
              </div>

              <div className="flex-1 space-y-1 w-full">
                <div className="flex items-center justify-between gap-2">
                  <h3 className="text-base sm:text-lg font-bold text-white">
                    {step.title}
                  </h3>
                  <span className="hidden sm:inline-block text-xs font-medium text-palnadu-teal">
                    {step.stat}
                  </span>
                </div>
                <p className="text-xs text-palnadu-light-blue/80">
                  {step.subtitle}
                </p>
                <p className="text-xs sm:text-sm text-palnadu-light-blue/90 leading-relaxed pt-0.5">
                  {step.description}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </StackingSection>
  );
}

export function GrowTailoredCard({ deckProgress }: GrowCardsProps) {
  return (
    <StackingSection
      i={4}
      total={8}
      progress={deckProgress}
      cardClassName="bg-white border-palnadu-border p-5 sm:p-8 lg:p-12"
    >
      <div className="max-w-5xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2 sm:space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
            Tailored Strategy
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-palnadu-dark tracking-tight leading-snug sm:leading-tight">
            Every Business Is Different
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-palnadu-body max-w-2xl mx-auto leading-relaxed">
            We do not sell rigid, one-size-fits-all packages. We examine the specific mechanics of your industry, location, and competition before building your approach.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
          {customPillars.map((pillar, idx) => {
            const Icon = pillar.icon;
            return (
              <div
                key={idx}
                className="rounded-2xl border border-palnadu-border bg-palnadu-off-white p-4 space-y-2 hover:border-palnadu-blue transition-colors"
              >
                <div className="flex items-center gap-2.5">
                  <div className="h-8 w-8 sm:h-9 sm:w-9 rounded-lg bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center shrink-0">
                    <Icon className="h-4 w-4" />
                  </div>
                  <h3 className="text-sm sm:text-base font-bold text-palnadu-dark">{pillar.title}</h3>
                </div>
                <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed pt-0.5">
                  {pillar.desc}
                </p>
              </div>
            );
          })}

          <div className="rounded-2xl border border-dashed border-palnadu-blue/40 bg-palnadu-light-blue/30 p-4 flex flex-col justify-between space-y-3">
            <div className="space-y-1">
              <p className="text-xs font-bold uppercase tracking-wider text-palnadu-blue">
                Discovery Session
              </p>
              <h4 className="text-sm sm:text-base font-bold text-palnadu-dark">
                No Pre-Packaged Templates
              </h4>
              <p className="text-xs text-palnadu-body leading-relaxed">
                Direct consultation with our engineers to evaluate your specific digital needs.
              </p>
            </div>
            <Button asChild size="sm" className="bg-palnadu-blue text-white text-xs w-full sm:w-auto h-10 font-semibold shadow-sm">
              <Link href="/contact" className="justify-center">Schedule Discovery</Link>
            </Button>
          </div>
        </div>
      </div>
    </StackingSection>
  );
}

export function GrowTransparencyCard({ deckProgress }: GrowCardsProps) {
  return (
    <StackingSection
      i={5}
      total={8}
      progress={deckProgress}
      cardClassName="bg-palnadu-light-blue border-palnadu-border p-5 sm:p-8 lg:p-12"
    >
      <div className="max-w-5xl mx-auto">
        <div className="max-w-3xl mx-auto text-center space-y-2 sm:space-y-3 mb-6 sm:mb-10">
          <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
            Engineering Transparency
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-palnadu-dark tracking-tight leading-snug sm:leading-tight">
            We Show the Work Behind the Growth
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-palnadu-body max-w-xl mx-auto leading-relaxed">
            No complicated agency buzzwords or unverified promises. We focus on what we can build, measure, and transparently demonstrate to you.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6 sm:mb-10">
          {methodology.map((m, idx) => (
            <motion.div
              key={idx}
              whileHover={{ scale: 1.02 }}
              className="rounded-xl sm:rounded-2xl bg-white p-4 border border-palnadu-border shadow-sm flex sm:flex-col items-start gap-3 sm:gap-2 group hover:border-palnadu-blue/40 transition-colors"
            >
              <span className="font-mono text-xs font-bold text-palnadu-blue">
                {m.step}
              </span>
              <div className="space-y-1 flex-1">
                <h3 className="text-base sm:text-lg font-bold text-palnadu-dark tracking-tight group-hover:text-palnadu-blue transition-colors">
                  {m.word}
                </h3>
                <p className="text-xs text-palnadu-body leading-relaxed">{m.summary}</p>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="rounded-2xl bg-palnadu-blue text-white p-6 sm:p-8 text-center max-w-3xl mx-auto shadow-md space-y-2">
          <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-light-blue">
            The Primary Goal
          </p>
          <h3 className="text-xl sm:text-2xl font-bold tracking-tight leading-snug">
            Make Your Digital Presence Work Harder For Your Business
          </h3>
          <p className="text-xs sm:text-sm text-palnadu-light-blue/90 max-w-xl mx-auto leading-relaxed">
            Your website, search listings, and social channels should be active commercial assets that consistently bring customer inquiries.
          </p>
        </div>
      </div>
    </StackingSection>
  );
}
