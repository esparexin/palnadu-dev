import React from "react";
import Link from "next/link";
import { ChevronDown, ArrowRight } from "lucide-react";

interface VideoHeroOverlaysProps {
  title: string;
  scrollHint: string;
  tagline: string;
  scrollProgress: number;
  onScrollToJourney: () => void;
}

export function VideoHeroOverlays({
  title,
  scrollHint,
  tagline,
  scrollProgress,
  onScrollToJourney,
}: VideoHeroOverlaysProps) {
  const titleOpacity = Math.max(1 - scrollProgress * 3.2, 0);
  const titleTranslateY = scrollProgress * -40;

  const ctaOpacity = Math.min(Math.max((scrollProgress - 0.32) / 0.28, 0), 1);
  const ctaTranslateY = Math.max((1 - ctaOpacity) * 24, 0);

  return (
    <>
      {/* Ambient Darkening Gradient Overlays */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "radial-gradient(ellipse at center, rgba(3,8,20,0.2) 0%, rgba(3,8,20,0.65) 100%), linear-gradient(180deg, rgba(3,8,20,0.45) 0%, rgba(3,8,20,0.15) 40%, rgba(3,8,20,0.8) 100%)",
          pointerEvents: "none",
        }}
      />

      {/* Phase 1: Title Screen */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 1.5rem",
          textAlign: "center",
          opacity: titleOpacity,
          transform: `translateY(${titleTranslateY}px)`,
          pointerEvents: titleOpacity > 0.1 ? "auto" : "none",
          zIndex: 10,
        }}
      >
        <div className="max-w-4xl mx-auto space-y-3 sm:space-y-4">
          <p className="text-xs sm:text-sm font-semibold uppercase tracking-widest text-palnadu-teal">
            {scrollHint}
          </p>
          <h1
            style={{
              fontSize: "clamp(2.5rem, 7vw, 5.5rem)",
              fontWeight: 900,
              lineHeight: 1.05,
              letterSpacing: "-0.03em",
              color: "#ffffff",
              textShadow: "0 4px 30px rgba(0, 0, 0, 0.7)",
            }}
          >
            {title}
          </h1>
        </div>
      </div>

      {/* Phase 2: Tagline and CTAs */}
      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "0 1.5rem",
          textAlign: "center",
          opacity: ctaOpacity,
          transform: `translateY(${ctaTranslateY}px)`,
          pointerEvents: ctaOpacity > 0.2 ? "auto" : "none",
          zIndex: 10,
        }}
      >
        <div className="max-w-3xl mx-auto space-y-5 sm:space-y-6">
          <p
            style={{
              fontSize: "clamp(1.2rem, 3.2vw, 2rem)",
              fontWeight: 700,
              lineHeight: 1.25,
              color: "#ffffff",
              textShadow: "0 4px 24px rgba(0, 0, 0, 0.7)",
            }}
          >
            {tagline}
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <Link
              href="/contact"
              className="inline-flex items-center justify-center gap-2 px-7 py-3.5 rounded-full bg-palnadu-blue hover:bg-palnadu-dark-hover text-white font-bold text-sm shadow-xl hover:scale-105 active:scale-95 transition-all w-full sm:w-auto"
            >
              <span>Contact Us</span>
              <ArrowRight className="h-4 w-4" />
            </Link>

            <button
              type="button"
              onClick={onScrollToJourney}
              className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-white/12 hover:bg-white/20 backdrop-blur-md border border-white/25 text-white font-semibold text-sm transition-all w-full sm:w-auto cursor-pointer"
            >
              <span>Explore Growth Journey</span>
              <ChevronDown className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Scroll Progress Indicator Line */}
      <div
        style={{
          position: "absolute",
          left: 0,
          right: 0,
          bottom: 0,
          height: 3,
          backgroundColor: "rgba(255, 255, 255, 0.1)",
          zIndex: 20,
        }}
      >
        <div
          style={{
            height: "100%",
            width: `${Math.min(scrollProgress * 100, 100)}%`,
            backgroundColor: "rgba(255, 255, 255, 0.75)",
            transition: "width 0.05s linear",
          }}
        />
      </div>

      {/* Bottom Scroll Chevron */}
      <div
        onClick={onScrollToJourney}
        aria-label="Scroll to content"
        style={{
          position: "absolute",
          left: "50%",
          bottom: "clamp(20px, 4vh, 32px)",
          transform: "translateX(-50%)",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          color: "rgba(255, 255, 255, 0.7)",
          cursor: "pointer",
          zIndex: 20,
          opacity: titleOpacity,
          transition: "opacity 0.2s ease",
        }}
      >
        <ChevronDown className="h-5 w-5 animate-bounce" />
      </div>
    </>
  );
}
