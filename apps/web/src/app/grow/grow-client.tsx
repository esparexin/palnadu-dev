"use client";

import React from "react";
import MetroHero from "@/components/ui/scroll-locked-video-hero";
import { StackingDeck } from "@/components/ui/stacking-card";
import { GrowPositioningCard, GrowCapabilitiesCard } from "./grow-cards-intro";
import { GrowStagesShowcase } from "./grow-stages-showcase";
import {
  GrowPipelineCard,
  GrowTailoredCard,
  GrowTransparencyCard,
} from "./grow-cards-framework";
import {
  GrowPrinciplesCard,
  GrowNextChapterCard,
} from "./grow-cards-closure";
import { GrowFinalCta } from "./grow-final-cta";

export function GrowExperienceClient() {
  return (
    <div className="flex flex-col w-full bg-white text-palnadu-dark">
      {/* 1. Hero Section: Scroll-Driven Video Hero */}
      <section className="relative w-full">
        <MetroHero
          videoSrc="/videos/metro-hero.mp4"
          title="Digital Marketing"
          tagline="Grow With Us. Let Your Business Growth Show."
          scrollHint="SCROLL TO EXPLORE GROWTH"
        />
      </section>

      {/* 2-9. Stacking Cards Deck: Full Progressive Journey */}
      <StackingDeck className="bg-[#020b18]" cardCount={8}>
        {(deckProgress) => (
          <>
            <GrowPositioningCard deckProgress={deckProgress} />
            <GrowStagesShowcase deckProgress={deckProgress} />
            <GrowCapabilitiesCard deckProgress={deckProgress} />
            <GrowPipelineCard deckProgress={deckProgress} />
            <GrowTailoredCard deckProgress={deckProgress} />
            <GrowTransparencyCard deckProgress={deckProgress} />
            <GrowPrinciplesCard deckProgress={deckProgress} />
            <GrowNextChapterCard deckProgress={deckProgress} />
          </>
        )}
      </StackingDeck>

      {/* 10. Final Call To Action & Floating Button */}
      <GrowFinalCta />
    </div>
  );
}

export default GrowExperienceClient;
