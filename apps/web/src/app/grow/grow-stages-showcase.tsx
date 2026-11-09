"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StackingSection } from "@/components/ui/stacking-card";
import { cn } from "@/lib/utils";
import { growthStages } from "./grow-stages-data";

interface GrowStagesShowcaseProps {
  deckProgress: any;
}

export function GrowStagesShowcase({ deckProgress }: GrowStagesShowcaseProps) {
  const [activeStage, setActiveStage] = useState(0);

  return (
    <StackingSection
      i={1}
      total={8}
      progress={deckProgress}
      cardClassName="bg-palnadu-off-white border-palnadu-border p-5 sm:p-8 lg:p-12"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2 sm:space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
            Progressive Growth System
          </p>
          <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-palnadu-dark tracking-tight leading-snug sm:leading-tight">
            We Don’t Just Talk About Growth.
            <br />
            <span className="text-palnadu-blue">We Work Towards It.</span>
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-palnadu-body max-w-xl mx-auto">
            A practical framework that connects every stage of how customers find, evaluate, and choose your business.
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
            {growthStages.map((stage, idx) => {
              const isActive = activeStage === idx;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={cn(
                    "px-4 py-2 rounded-full text-xs sm:text-sm font-semibold transition-all cursor-pointer touch-manipulation",
                    isActive
                      ? "bg-palnadu-blue text-white shadow-sm"
                      : "bg-white text-palnadu-body border border-palnadu-border hover:text-palnadu-dark hover:border-palnadu-blue/40"
                  )}
                >
                  {stage.shortTitle}
                </button>
              );
            })}
          </div>
        </div>

        {/* Mobile-Friendly Stage Segmented Switcher (text-[10px] replaced with text-xs) */}
        <div className="lg:hidden grid grid-cols-4 gap-1 p-1 bg-palnadu-light-blue/60 rounded-xl mb-4 border border-palnadu-border">
          {growthStages.map((stage, idx) => (
            <button
              key={stage.id}
              type="button"
              onClick={() => setActiveStage(idx)}
              className={`py-2 px-1 text-center rounded-lg text-xs font-bold transition-all touch-manipulation cursor-pointer ${
                activeStage === idx
                  ? "bg-white text-palnadu-blue shadow-sm"
                  : "text-palnadu-body hover:text-palnadu-dark"
              }`}
            >
              <span className="block text-xs font-mono opacity-60">0{idx + 1}</span>
              <span className="truncate block text-xs">{stage.shortTitle}</span>
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 lg:gap-8 items-center">
          <div className="hidden lg:block lg:col-span-5 space-y-3">
            {growthStages.map((stage, idx) => {
              const isSelected = activeStage === idx;
              const Icon = stage.icon;
              return (
                <button
                  key={stage.id}
                  type="button"
                  onClick={() => setActiveStage(idx)}
                  className={`w-full text-left p-4 sm:p-5 rounded-xl transition-all duration-150 border cursor-pointer touch-manipulation ${
                    isSelected
                      ? "bg-white shadow-md border-palnadu-blue ring-1 ring-palnadu-blue"
                      : "bg-white/60 hover:bg-white border-palnadu-border hover:border-palnadu-blue/40"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className={cn(
                      "text-xs font-bold uppercase tracking-wider",
                      isSelected ? "text-palnadu-blue" : "text-palnadu-muted"
                    )}>
                      {stage.tag}
                    </span>
                    <Icon
                      className={`h-4 w-4 ${
                        isSelected ? "text-palnadu-blue" : "text-palnadu-muted"
                      }`}
                    />
                  </div>
                  <h3 className="text-base sm:text-lg font-bold text-palnadu-dark">
                    {stage.title}
                  </h3>
                  <p className="text-xs text-palnadu-body mt-1 line-clamp-2">
                    {stage.description}
                  </p>
                </button>
              );
            })}
          </div>

          <div className="lg:col-span-7">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.div
                key={growthStages[activeStage].id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.15, ease: "easeOut" }}
                className="rounded-2xl bg-white border border-palnadu-border shadow-md sm:shadow-xl p-4 sm:p-6 lg:p-7 space-y-4 relative overflow-hidden"
              >
                <div
                  className={`absolute -right-20 -top-20 w-64 h-64 rounded-full bg-gradient-to-br ${growthStages[activeStage].color} blur-3xl pointer-events-none`}
                />

                <div className="flex items-center justify-between border-b border-palnadu-border pb-3 gap-3">
                  <div>
                    <span className="text-xs font-bold uppercase tracking-wider text-palnadu-blue">
                      {growthStages[activeStage].tag}
                    </span>
                    <h4 className="text-lg sm:text-2xl font-bold text-palnadu-dark leading-tight mt-0.5">
                      {growthStages[activeStage].title}
                    </h4>
                    <p className="text-xs sm:text-sm text-palnadu-body mt-0.5">
                      {growthStages[activeStage].tagline}
                    </p>
                  </div>
                  <div className="h-10 w-10 sm:h-12 sm:w-12 rounded-xl bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center shrink-0">
                    {React.createElement(growthStages[activeStage].icon, { className: "h-5 w-5 sm:h-6 sm:w-6" })}
                  </div>
                </div>

                <p className="text-xs sm:text-sm lg:text-base text-palnadu-body leading-relaxed">
                  {growthStages[activeStage].description}
                </p>

                {/* Clean simulated visual element (text-[11px] replaced with text-xs) */}
                <div className="rounded-xl bg-palnadu-dark text-white p-4 border border-white/10 space-y-2 text-xs">
                  <div className="flex items-center justify-between border-b border-white/10 pb-2">
                    <span className="text-xs text-white/90 font-semibold">
                      {growthStages[activeStage].previewContent.headline}
                    </span>
                    <span className="text-xs text-palnadu-teal uppercase font-medium">
                      Verified Metric
                    </span>
                  </div>

                  <div className="space-y-1.5 pt-1">
                    {growthStages[activeStage].previewContent.details.map((item, dIdx) => (
                      <div
                        key={dIdx}
                        className="flex flex-col sm:flex-row sm:items-center sm:justify-between py-1 border-b border-white/5 last:border-0 text-xs gap-1 sm:gap-2"
                      >
                        <span className="text-white/60">{item.label}</span>
                        <span className="text-white font-medium bg-white/10 px-2 py-0.5 rounded w-fit">
                          {item.val}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                  <div className="text-xs text-palnadu-body">
                    <span className="text-palnadu-muted">Expected Outcome: </span>
                    <strong className="text-palnadu-dark font-bold text-xs sm:text-sm">
                      {growthStages[activeStage].metrics}
                    </strong>
                  </div>
                  <Button
                    asChild
                    size="sm"
                    variant="outline"
                    className="text-xs border-palnadu-border text-palnadu-dark hover:bg-palnadu-light-blue w-full sm:w-auto h-10 sm:h-9 justify-center font-medium"
                  >
                    <Link href="/contact" className="flex items-center justify-center gap-1.5">
                      <span>Implement this stage</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                </div>

                <div className="lg:hidden flex items-center justify-between pt-2.5 border-t border-palnadu-border/60 text-xs">
                  <button
                    type="button"
                    onClick={() => setActiveStage((prev) => Math.max(0, prev - 1))}
                    disabled={activeStage === 0}
                    className="inline-flex items-center gap-1 text-palnadu-body hover:text-palnadu-dark disabled:opacity-30 disabled:pointer-events-none py-1.5 px-2.5 rounded-lg border border-palnadu-border/60 bg-palnadu-light-blue/30 font-medium"
                  >
                    <ChevronLeft className="h-3.5 w-3.5" />
                    <span>Previous</span>
                  </button>
                  <span className="text-xs font-medium text-palnadu-muted">
                    {activeStage + 1} / {growthStages.length}
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveStage((prev) => Math.min(growthStages.length - 1, prev + 1))}
                    disabled={activeStage === growthStages.length - 1}
                    className="inline-flex items-center gap-1 text-palnadu-blue hover:text-palnadu-dark disabled:opacity-30 disabled:pointer-events-none py-1.5 px-2.5 rounded-lg border border-palnadu-blue/30 bg-palnadu-light-blue/60 font-semibold"
                  >
                    <span>Next Stage</span>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </motion.div>
            </AnimatePresence>
          </div>
        </div>
      </div>
    </StackingSection>
  );
}
