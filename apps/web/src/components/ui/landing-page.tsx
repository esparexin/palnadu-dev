"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import Globe from "@/components/ui/globe";
import { cn } from "@/lib/utils";
import { LandingHero } from "./landing-hero";
import { LandingStandards, LandingMethodology } from "./landing-standards";
import { LandingFaq } from "./landing-faq";
import { LandingCta } from "./landing-cta";

const DESKTOP_POSITIONS = [
  { top: 50, left: 75, scale: 1.25, opacity: 0.95 },
  { top: 50, left: 75, scale: 1.10, opacity: 0.90 },
  { top: 50, left: 75, scale: 1.15, opacity: 0.90 },
  { top: 50, left: 75, scale: 1.05, opacity: 0.85 },
  { top: 52, left: 50, scale: 1.45, opacity: 0.16 },
];

const MOBILE_POSITIONS = [
  { top: 78, left: 50, scale: 0.70, opacity: 0.22 },
  { top: 50, left: 82, scale: 0.60, opacity: 0.25 },
  { top: 50, left: 80, scale: 0.62, opacity: 0.28 },
  { top: 50, left: 80, scale: 0.60, opacity: 0.25 },
  { top: 52, left: 50, scale: 1.05, opacity: 0.14 },
];

export function ScrollGlobe() {
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);
  const [globeStyle, setGlobeStyle] = useState({
    transform: "translate3d(75vw, 50vh, 0) translate3d(-50%, -50%, 0) scale3d(1.25, 1.25, 1)",
    opacity: 0.95,
  });

  const progressBarRef = useRef<HTMLDivElement>(null);
  const globeContainerRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  const updateGlobePosition = useCallback((sectionIndex: number) => {
    const isDesktop = typeof window !== "undefined" && window.innerWidth >= 1024;
    const positions = isDesktop ? DESKTOP_POSITIONS : MOBILE_POSITIONS;
    const target = positions[sectionIndex] || positions[0];

    const transform = `translate3d(${target.left}vw, ${target.top}vh, 0) translate3d(-50%, -50%, 0) scale3d(${target.scale}, ${target.scale}, 1)`;
    
    if (globeContainerRef.current) {
      globeContainerRef.current.style.transform = transform;
      globeContainerRef.current.style.opacity = `${target.opacity}`;
    } else {
      setGlobeStyle({ transform, opacity: target.opacity });
    }
  }, []);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;

          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${progress})`;
          }

          const viewportCenter = window.innerHeight / 2;
          let newSection = 0;
          let minDistance = Infinity;

          sectionRefs.current.forEach((ref, index) => {
            if (ref) {
              const rect = ref.getBoundingClientRect();
              const center = rect.top + rect.height / 2;
              const dist = Math.abs(center - viewportCenter);
              if (dist < minDistance) {
                minDistance = dist;
                newSection = index;
              }
            }
          });

          if (newSection !== activeSectionRef.current) {
            activeSectionRef.current = newSection;
            setActiveSection(newSection);
            updateGlobePosition(newSection);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", () => updateGlobePosition(activeSectionRef.current), { passive: true });

    updateGlobePosition(0);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [updateGlobePosition]);

  const navLabels = ["Overview", "Standards", "Process", "FAQ", "Get Started"];

  return (
    <div className="relative w-full max-w-full overflow-x-hidden bg-white text-palnadu-dark">
      {/* Top Scroll Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-palnadu-border/40 z-50 pointer-events-none">
        <div 
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-palnadu-blue via-palnadu-blue to-palnadu-teal will-change-transform"
          style={{ transform: 'scaleX(0)', transformOrigin: 'left center' }}
        />
      </div>

      {/* Desktop Scroll Indicator Dots */}
      <div className="hidden lg:flex fixed right-4 sm:right-6 top-1/2 -translate-y-1/2 z-40">
        <div className="space-y-4">
          {navLabels.map((label, index) => (
            <div key={index} className="relative group">
              <div
                className={cn(
                  "nav-label absolute right-6 top-1/2 -translate-y-1/2",
                  "px-3 py-1 rounded-md text-xs font-semibold whitespace-nowrap",
                  "bg-white/95 backdrop-blur-md border border-palnadu-border shadow-md z-50 text-palnadu-dark",
                  activeSection === index ? "animate-fadeOut" : "opacity-0 pointer-events-none"
                )}
              >
                <div className="flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-palnadu-blue" />
                  <span>{label}</span>
                </div>
              </div>

              <button
                onClick={() => {
                  sectionRefs.current[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className={cn(
                  "relative w-2.5 h-2.5 rounded-full border-2 transition-all duration-300 hover:scale-125 cursor-pointer",
                  activeSection === index 
                    ? "bg-palnadu-blue border-palnadu-blue shadow-sm" 
                    : "bg-transparent border-palnadu-border hover:border-palnadu-blue"
                )}
                aria-label={`Go to ${label}`}
              />
            </div>
          ))}
        </div>
        <div className="absolute left-1/2 top-0 bottom-0 w-px bg-palnadu-border -translate-x-1/2 -z-10" />
      </div>

      {/* Globe Container */}
      <div
        ref={globeContainerRef}
        className="fixed top-0 left-0 z-10 pointer-events-none will-change-transform transition-all duration-[1000ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          transform: globeStyle.transform,
          opacity: globeStyle.opacity,
        }}
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-palnadu-blue/10 blur-3xl pointer-events-none" />
          <div className="scale-75 sm:scale-90 lg:scale-100">
            <Globe />
          </div>
        </div>
      </div>

      {/* Section 0: Hero */}
      <section
        ref={(el) => { sectionRefs.current[0] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 pt-10 pb-8 sm:pt-14 sm:pb-16 lg:pt-20 lg:pb-18 border-b border-palnadu-border/60 overflow-hidden w-full bg-transparent"
      >
        <LandingHero />
      </section>

      {/* Section 1: Standards */}
      <section
        ref={(el) => { sectionRefs.current[1] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-7 sm:py-14 lg:py-20 border-b border-palnadu-border/60 overflow-hidden w-full bg-transparent"
      >
        <LandingStandards />
      </section>

      {/* Section 2: Methodology */}
      <section
        ref={(el) => { sectionRefs.current[2] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-7 sm:py-14 lg:py-20 border-b border-palnadu-border/60 overflow-hidden w-full bg-transparent"
      >
        <LandingMethodology />
      </section>

      {/* Section 3: FAQ */}
      <section
        ref={(el) => { sectionRefs.current[3] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-7 sm:py-14 lg:py-20 border-b border-palnadu-border/60 overflow-hidden w-full bg-transparent"
      >
        <LandingFaq />
      </section>

      {/* Section 4: Consultation CTA */}
      <section
        ref={(el) => { sectionRefs.current[4] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-14 lg:py-24 overflow-hidden w-full bg-transparent"
      >
        <LandingCta />
      </section>
    </div>
  );
}

export default ScrollGlobe;
