"use client";

import React, { useEffect, useRef, useState, useCallback } from "react"; 
import Link from "next/link";
import Globe from "@/components/ui/globe";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Desktop waypoints (anchored to the right 5-column runway of the 12-col grid)
const DESKTOP_POSITIONS = [
  { top: 50, left: 75, scale: 1.25, opacity: 0.95 }, // 0: Hero — 95% crisp & clearly visible
  { top: 50, left: 75, scale: 1.10, opacity: 0.90 }, // 1: Standards — 90% crisp & visible
  { top: 50, left: 75, scale: 1.15, opacity: 0.90 }, // 2: Methodology — 90% crisp & visible
  { top: 52, left: 50, scale: 1.45, opacity: 0.16 }, // 3: CTA — Centered ambient backdrop
];

// Mobile waypoints (calibrated to sit cleanly below metrics and stay non-intrusive)
const MOBILE_POSITIONS = [
  { top: 78, left: 50, scale: 0.72, opacity: 0.90 }, // 0: Hero — Cleanly below trust metrics, zero text overlap
  { top: 50, left: 82, scale: 0.60, opacity: 0.25 }, // 1: Standards — Soft ambient background
  { top: 50, left: 80, scale: 0.62, opacity: 0.28 }, // 2: Methodology — Soft ambient background
  { top: 52, left: 50, scale: 1.05, opacity: 0.14 }, // 3: CTA — Centered ambient backdrop
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

          // 1. Top progress bar
          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${progress})`;
          }

          // 2. Detect which section is in focus
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

          // 3. Update globe animation when active section changes
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

    // Initialize position on load
    updateGlobePosition(0);

    return () => {
      window.removeEventListener("scroll", onScroll);
    };
  }, [updateGlobePosition]);

  const navLabels = ["Overview", "Standards", "Process", "Get Started"];

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

      {/* ── THE ORIGINAL SMOOTH SCROLLING GLOBE ANIMATION ── */}
      <div
        ref={globeContainerRef}
        className="fixed top-0 left-0 z-10 pointer-events-none will-change-transform transition-all duration-[1000ms] ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          transform: globeStyle.transform,
          opacity: globeStyle.opacity,
        }}
      >
        <div className="relative flex items-center justify-center">
          {/* Ambient Radial Glow Backdrop */}
          <div className="absolute w-64 h-64 sm:w-72 sm:h-72 rounded-full bg-palnadu-blue/10 blur-3xl pointer-events-none" />
          <div className="scale-75 sm:scale-90 lg:scale-100">
            <Globe />
          </div>
        </div>
      </div>

      {/* ── SECTION 0: HERO & BALANCED 2-COLUMN GRID ── */}
      <section
        ref={(el) => { sectionRefs.current[0] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 pt-10 pb-8 sm:pt-14 sm:pb-16 lg:pt-20 lg:pb-18 border-b border-palnadu-border/60 overflow-hidden w-full bg-transparent"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (7 cols): Content & Trust Proof */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
            {/* Pure Typographic Eyebrow with comfortable spacing */}
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1.5 sm:mb-2">
              Problem-First Software Studio
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-palnadu-dark leading-[1.12]">
              Start With The Problem.
              <span className="block text-palnadu-blue mt-1">We Build The Solution.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-palnadu-body leading-relaxed max-w-xl">
              Palnadu.dev turns real-world business challenges into practical, production-ready software. We validate ideas, eliminate manual business bottlenecks, and engineer what works.
            </p>

            {/* Mobile 2-Column Action Buttons | Desktop Wide Action Buttons */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm sm:max-w-none sm:flex sm:flex-row sm:items-center sm:gap-3 lg:gap-4 pt-2 sm:pt-2.5">
              <Link
                href="/contact"
                className="w-full sm:w-auto lg:min-w-[210px] px-3 py-3 sm:px-7 sm:py-3.5 lg:px-8 lg:py-4 rounded-md font-semibold text-xs sm:text-sm lg:text-base text-center inline-flex items-center justify-center bg-palnadu-blue text-white hover:bg-palnadu-dark-hover shadow-sm transition-colors"
              >
                <span>Any Idea</span>
                <ArrowRight className="ml-1.5 lg:ml-2 h-3.5 w-3.5 sm:h-4 sm:w-4 lg:h-4.5 lg:w-4.5 shrink-0" />
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto lg:min-w-[210px] px-3 py-3 sm:px-7 sm:py-3.5 lg:px-8 lg:py-4 rounded-md font-semibold text-xs sm:text-sm lg:text-base text-center inline-flex items-center justify-center border border-palnadu-blue bg-white text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
              >
                Services
              </Link>
            </div>

            {/* Trust Metrics Bar — Decongested with balanced padding and grid gaps */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4 sm:gap-4 pt-8 sm:pt-9 border-t border-palnadu-border/50">
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-palnadu-dark">8+ Years</p>
                <p className="text-[11px] sm:text-xs text-palnadu-secondary">Engineering Experience</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-palnadu-teal">100%</p>
                <p className="text-[11px] sm:text-xs text-palnadu-secondary">Code Ownership</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-palnadu-blue">Fixed Scope</p>
                <p className="text-[11px] sm:text-xs text-palnadu-secondary">No Surprise Bills</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-palnadu-dark">Direct Access</p>
                <p className="text-[11px] sm:text-xs text-palnadu-secondary">To Senior Engineers</p>
              </div>
            </div>
          </div>

          {/* Desktop Right Column: Reserves space for the scrolling globe */}
          <div className="hidden lg:block lg:col-span-5 h-[380px]" aria-hidden="true" />

          {/* Mobile Reserved Height for Globe in Hero — Clean clearance below metrics */}
          <div className="lg:hidden h-[200px]" aria-hidden="true" />

        </div>
      </section>

      {/* ── SECTION 1: STANDARDS ("TRUTH BEFORE CODE") ── */}
      <section
        ref={(el) => { sectionRefs.current[1] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-7 sm:py-14 lg:py-20 border-b border-palnadu-border/60 overflow-hidden w-full bg-transparent"
      >
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

          {/* Desktop Right Column: Clear Runway for Scrolling Globe */}
          <div className="hidden lg:block lg:col-span-5 h-[340px]" aria-hidden="true" />
        </div>
      </section>

      {/* ── SECTION 2: 4-STEP DELIVERY METHODOLOGY ("HOW WE WORK WITH YOU") ── */}
      <section
        ref={(el) => { sectionRefs.current[2] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-7 sm:py-14 lg:py-20 border-b border-palnadu-border/60 overflow-hidden w-full bg-transparent"
      >
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
              {[
                { step: "01", phase: "Analyze", title: "Diagnose First", desc: "Identify workflow bottlenecks, user demands, and technical limits." },
                { step: "02", phase: "Scope", title: "Honest Boundaries", desc: "Fixed pricing, transparent milestones, and zero software bloat." },
                { step: "03", phase: "Build", title: "Disciplined Sprints", desc: "Clean TypeScript code delivered with weekly staging progress access." },
                { step: "04", phase: "Deliver", title: "Handoff & Support", desc: "100% code and infrastructure ownership with post-launch support." },
              ].map((p) => (
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

          {/* Desktop Right Column: Clear Runway for Scrolling Globe */}
          <div className="hidden lg:block lg:col-span-5 h-[340px]" aria-hidden="true" />
        </div>
      </section>

      {/* ── SECTION 3: HIGH-IMPACT CONSULTATION CTA ── */}
      <section
        ref={(el) => { sectionRefs.current[3] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-8 sm:py-14 lg:py-24 overflow-hidden w-full bg-transparent"
      >
        <div className="max-w-4xl mx-auto rounded-2xl border border-palnadu-border bg-white/95 backdrop-blur-md p-6 sm:p-10 lg:p-12 shadow-sm text-center space-y-4 sm:space-y-5">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
            Get Started
          </p>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
            Ready To Build What Works?
          </h2>

          <p className="text-sm sm:text-base text-palnadu-body max-w-xl mx-auto leading-relaxed">
            Work directly with the software developers designing and writing your solution. Fixed price boundaries, honest engineering advice, and 100% code ownership.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-1">
            <Link
              href="/contact"
              className="w-full sm:w-auto px-7 py-3 rounded-md font-semibold text-sm bg-palnadu-teal text-white hover:bg-palnadu-teal-dark shadow-sm transition-colors"
            >
              Tell Us What You Want To Build →
            </Link>
            <Link
              href="/services"
              className="w-full sm:w-auto px-7 py-3 rounded-md font-semibold text-sm border border-palnadu-blue text-palnadu-blue bg-white hover:bg-palnadu-light-blue transition-colors"
            >
              Explore All Services
            </Link>
          </div>

          <p className="text-[11px] text-palnadu-secondary pt-1">
            We reply within one business day with direct technical advice. Zero sales pressure.
          </p>
        </div>
      </section>
    </div>
  );
}

export default ScrollGlobe;
