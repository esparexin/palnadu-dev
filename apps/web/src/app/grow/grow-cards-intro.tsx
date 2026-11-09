import React from "react";
import { motion } from "framer-motion";
import { StackingSection } from "@/components/ui/stacking-card";
import { servicesList } from "./grow-services-data";

interface GrowCardsProps {
  deckProgress: any;
}

export function GrowPositioningCard({ deckProgress }: GrowCardsProps) {
  return (
    <StackingSection
      i={0}
      total={8}
      progress={deckProgress}
      id="growth-journey"
      cardClassName="bg-white border-palnadu-border p-5 sm:p-8 lg:p-12"
    >
      <div className="max-w-5xl mx-auto">
        <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue mb-3">
          Clear Commercial Direction
        </p>

        <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-extrabold text-palnadu-dark tracking-tight leading-snug sm:leading-tight mb-4 sm:mb-8">
          Your business doesn’t need more marketing noise.
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-5 sm:gap-8 items-start">
          <div className="md:col-span-7 space-y-3.5 sm:space-y-6 text-sm sm:text-base lg:text-lg text-palnadu-body leading-relaxed">
            <p className="font-semibold text-palnadu-dark text-base sm:text-xl lg:text-2xl leading-snug">
              It needs the right people to discover you, trust you, and choose you.
            </p>
            <p>
              At <span className="font-bold text-palnadu-dark">Palnadu.dev</span>, we help local
              and growing businesses build their digital presence, reach the right audience, and
              turn online visibility into real business opportunities.
            </p>
            <p className="text-xs sm:text-sm text-palnadu-body/80 border-l-2 border-palnadu-blue pl-3 sm:pl-4 py-1 italic">
              We focus on tangible commercial outcomes rather than inflated follower counts that generate zero revenue.
            </p>
          </div>

          <div className="md:col-span-5 rounded-2xl p-5 sm:p-6 bg-palnadu-light-blue/40 border border-palnadu-border space-y-4">
            <h3 className="text-xs font-bold uppercase tracking-wider text-palnadu-blue">
              The Practical Difference
            </h3>
            <ul className="space-y-4 text-xs sm:text-sm">
              <li className="space-y-1">
                <span className="font-semibold text-palnadu-dark block">Superficial metrics:</span>
                <p className="text-palnadu-body leading-relaxed">
                  Buying social followers, inflating impression reports, and running generic ad campaigns that never turn into paying customers.
                </p>
              </li>
              <li className="space-y-1 border-t border-palnadu-border/60 pt-3">
                <span className="font-semibold text-palnadu-blue block">The Palnadu.dev approach:</span>
                <p className="text-palnadu-body leading-relaxed">
                  Direct phone calls, verified WhatsApp inquiries, local Google Maps ranking, and high-speed web platforms built to convert visitors into clients.
                </p>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </StackingSection>
  );
}

export function GrowCapabilitiesCard({ deckProgress }: GrowCardsProps) {
  return (
    <StackingSection
      i={2}
      total={8}
      progress={deckProgress}
      cardClassName="bg-white border-palnadu-border p-5 sm:p-8 lg:p-12"
    >
      <div className="max-w-6xl mx-auto">
        <div className="text-center max-w-3xl mx-auto mb-6 sm:mb-10 space-y-2 sm:space-y-3">
          <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
            Capabilities
          </p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold text-palnadu-dark tracking-tight">
            What We Do
          </h2>
          <p className="text-xs sm:text-sm lg:text-base text-palnadu-body max-w-xl mx-auto">
            Focused digital channels engineered to bring verifiable customers to your doorstep.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5 sm:gap-5">
          {servicesList.map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <motion.div
                key={idx}
                whileHover={{ y: -4 }}
                transition={{ duration: 0.2 }}
                className="rounded-2xl border border-palnadu-border bg-white p-4 sm:p-5 shadow-sm hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 sm:h-11 sm:w-11 rounded-xl bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center group-hover:bg-palnadu-blue group-hover:text-white transition-colors shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5" />
                    </div>
                    <h3 className="text-base sm:text-lg font-bold text-palnadu-dark leading-snug">
                      {srv.title}
                    </h3>
                  </div>
                  <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed pt-0.5">
                    {srv.description}
                  </p>
                </div>

                <div className="mt-3.5 pt-3 border-t border-palnadu-border/60">
                  <p className="text-xs font-bold uppercase tracking-wider text-palnadu-dark mb-2">
                    Key Deliverables
                  </p>
                  <ul className="space-y-1.5 text-xs text-palnadu-body">
                    {srv.focus.map((item, fIdx) => (
                      <li key={fIdx} className="flex items-start gap-2">
                        <span className="text-palnadu-teal font-bold select-none">•</span>
                        <span className="leading-snug text-palnadu-dark">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </StackingSection>
  );
}
