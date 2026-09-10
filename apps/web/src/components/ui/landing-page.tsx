"use client";

import React, { useEffect, useRef, useState } from "react"; 
import Link from "next/link";
import Globe from "@/components/ui/globe";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

// Desktop scroll waypoints (anchored to the right side of the screen)
const DESKTOP_WAYPOINTS = [
  { top: 22, right: 8, scale: 1.15, rotate: 0, opacity: 0.95 },   // 0: Hero
  { top: 32, right: 6, scale: 0.95, rotate: -8, opacity: 0.85 },  // 1: Standards
  { top: 28, right: 7, scale: 1.05, rotate: 6, opacity: 0.85 },   // 2: Methodology (Vibrant & Clearly Visible!)
  { top: 46, right: 8, scale: 0.75, rotate: 0, opacity: 0.35 },   // 3: CTA
];

export function ScrollGlobe() {
  const [activeSection, setActiveSection] = useState(0);
  const activeSectionRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const desktopGlobeRef = useRef<HTMLDivElement>(null);
  const progressBarRef = useRef<HTMLDivElement>(null);
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    let ticking = false;

    const onScroll = () => {
      if (!ticking) {
        requestAnimationFrame(() => {
          const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
          const docHeight = document.documentElement.scrollHeight - window.innerHeight;
          const progress = docHeight > 0 ? Math.min(Math.max(scrollTop / docHeight, 0), 1) : 0;

          // 1. Top Progress Bar
          if (progressBarRef.current) {
            progressBarRef.current.style.transform = `scaleX(${progress})`;
          }

          // 2. Identify Active Section
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

          // 3. Desktop Scroll Waypoint Movement (High opacity in Methodology!)
          if (desktopGlobeRef.current && window.innerWidth >= 1024) {
            const wp = DESKTOP_WAYPOINTS[newSection] || DESKTOP_WAYPOINTS[0];
            desktopGlobeRef.current.style.transform = `translate3d(0, ${wp.top}vh, 0) scale3d(${wp.scale}, ${wp.scale}, 1) rotate(${wp.rotate}deg)`;
            desktopGlobeRef.current.style.right = `${wp.right}vw`;
            desktopGlobeRef.current.style.opacity = `${wp.opacity}`;
          }

          if (newSection !== activeSectionRef.current) {
            activeSectionRef.current = newSection;
            setActiveSection(newSection);
          }

          ticking = false;
        });
        ticking = true;
      }
    };

    window.addEventListener("scroll", onScroll, { passive: true });

    // Initial desktop placement
    if (desktopGlobeRef.current && window.innerWidth >= 1024) {
      const initWp = DESKTOP_WAYPOINTS[0];
      desktopGlobeRef.current.style.transform = `translate3d(0, ${initWp.top}vh, 0) scale3d(${initWp.scale}, ${initWp.scale}, 1) rotate(${initWp.rotate}deg)`;
      desktopGlobeRef.current.style.right = `${initWp.right}vw`;
      desktopGlobeRef.current.style.opacity = `${initWp.opacity}`;
    }

    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const navLabels = ["Overview", "Standards", "Process", "Get Started"];

  return (
    <div 
      ref={containerRef}
      className="relative w-full max-w-full overflow-x-hidden bg-white text-palnadu-dark"
    >
      {/* Top Progress Bar */}
      <div className="fixed top-0 left-0 w-full h-0.5 bg-palnadu-border/40 z-50 pointer-events-none">
        <div 
          ref={progressBarRef}
          className="h-full bg-gradient-to-r from-palnadu-blue via-palnadu-blue to-palnadu-teal will-change-transform shadow-xs"
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

      {/* ── DESKTOP SCROLL-ANIMATED GLOBE (Desktop Only: Anchored right, travels down waypoints) ── */}
      <div
        ref={desktopGlobeRef}
        className="hidden lg:block fixed top-0 z-10 pointer-events-none will-change-transform transition-all duration-700 ease-[cubic-bezier(0.23,1,0.32,1)]"
        style={{
          transform: `translate3d(0, ${DESKTOP_WAYPOINTS[0].top}vh, 0) scale3d(${DESKTOP_WAYPOINTS[0].scale}, ${DESKTOP_WAYPOINTS[0].scale}, 1) rotate(${DESKTOP_WAYPOINTS[0].rotate}deg)`,
          right: `${DESKTOP_WAYPOINTS[0].right}vw`,
          opacity: DESKTOP_WAYPOINTS[0].opacity,
        }}
      >
        <div className="relative flex items-center justify-center">
          <div className="absolute w-72 h-72 rounded-full bg-palnadu-blue/10 blur-3xl pointer-events-none" />
          <div className="relative z-10">
            <Globe />
          </div>
        </div>
      </div>

      {/* ── SECTION 0: HERO & TRUST METRICS ── */}
      <section
        ref={(el) => { sectionRefs.current[0] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 pt-6 pb-12 sm:py-14 lg:py-20 border-b border-palnadu-border/60 overflow-hidden w-full"
      >
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
          
          {/* Left Column (7 cols): Content & Trust Proof */}
          <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
            {/* Pure Typographic Eyebrow — No Pills, No Chips */}
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
              Problem-First Software Studio
            </p>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-palnadu-dark leading-[1.12]">
              Start With The Problem.
              <span className="block text-palnadu-blue mt-1">We Build The Solution.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-palnadu-body leading-relaxed max-w-xl">
              Palnadu.dev turns real-world business challenges into practical, production-ready software. We validate ideas, eliminate manual business bottlenecks, and engineer what works.
            </p>

            {/* Mobile 2-Column Buttons: "Any Idea →" & "Services" */}
            <div className="grid grid-cols-2 gap-2.5 w-full max-w-sm sm:max-w-none sm:flex sm:flex-row sm:items-center sm:gap-3 pt-1">
              <Link
                href="/contact"
                className="w-full sm:w-auto px-3 py-3 sm:px-7 sm:py-3.5 rounded-md font-semibold text-xs sm:text-sm text-center inline-flex items-center justify-center bg-palnadu-blue text-white hover:bg-[#12487e] shadow-xs transition-colors"
              >
                <span>Any Idea</span>
                <ArrowRight className="ml-1.5 h-3.5 w-3.5 sm:h-4 sm:w-4 shrink-0" />
              </Link>
              <Link
                href="/services"
                className="w-full sm:w-auto px-3 py-3 sm:px-7 sm:py-3.5 rounded-md font-semibold text-xs sm:text-sm text-center inline-flex items-center justify-center border border-palnadu-blue bg-white text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
              >
                Services
              </Link>
            </div>

            {/* Trust Metrics Bar — Fills the lower hero, zero empty void */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3.5 sm:gap-4 pt-6 border-t border-palnadu-border/60">
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

          {/* Right Column: Mobile Inline Globe (Prominent in Hero) */}
          <div className="lg:hidden flex items-center justify-center relative py-4 my-2 overflow-visible">
            <div className="absolute w-56 h-56 rounded-full bg-palnadu-blue/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 transform scale-85 opacity-95">
              <Globe />
            </div>
          </div>

          {/* Desktop Right Column Placeholder (Reserves grid space so text never shifts) */}
          <div className="hidden lg:block lg:col-span-5 h-[360px]" aria-hidden="true" />

        </div>
      </section>

      {/* ── SECTION 1: STANDARDS & METHODOLOGY ("TRUTH BEFORE CODE") ── */}
      <section
        ref={(el) => { sectionRefs.current[1] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-16 lg:py-20 bg-palnadu-off-white/40 border-b border-palnadu-border/60 overflow-hidden w-full"
      >
        <div className="max-w-7xl mx-auto space-y-8 sm:space-y-10">
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

          {/* 4 Structured Engineering Commitments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2 text-left">
              <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="font-bold text-sm text-palnadu-dark">Diagnostic First</h3>
              <p className="text-xs text-palnadu-body leading-relaxed">
                We audit workflow bottlenecks, user demands, and technical limitations before development begins.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2 text-left">
              <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-teal flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="font-bold text-sm text-palnadu-dark">Fixed Boundaries</h3>
              <p className="text-xs text-palnadu-body leading-relaxed">
                Clear milestones and upfront scope limits. No open-ended hourly billing or surprise engineering invoices.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2 text-left">
              <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="font-bold text-sm text-palnadu-dark">100% Ownership</h3>
              <p className="text-xs text-palnadu-body leading-relaxed">
                You receive full Git repository ownership and cloud credentials upon completion. Zero vendor lock-in.
              </p>
            </div>

            <div className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2 text-left">
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
      </section>

      {/* ── SECTION 2: 4-STEP DELIVERY METHODOLOGY ("HOW WE WORK WITH YOU") ── */}
      <section
        ref={(el) => { sectionRefs.current[2] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-10 sm:py-16 lg:py-20 bg-white border-b border-palnadu-border/60 overflow-hidden w-full"
      >
        <div className="max-w-7xl mx-auto space-y-6 sm:space-y-8">
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

          {/* Mobile Globe Showcase in Methodology — 100% Visible, High Opacity, Never Covered! */}
          <div className="lg:hidden flex flex-col items-center justify-center py-4 my-2 relative">
            <div className="absolute w-52 h-52 rounded-full bg-palnadu-blue/10 blur-2xl pointer-events-none" />
            <div className="relative z-10 transform scale-75 opacity-90">
              <Globe />
            </div>
            <p className="text-[10px] font-mono text-palnadu-secondary uppercase tracking-wider mt-1 text-center">
              Global Standards • Local Accountability
            </p>
          </div>

          {/* 4 Process Step Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {[
              { step: "01", phase: "Analyze", title: "Diagnose First", desc: "Identify workflow bottlenecks, user demands, and technical limits." },
              { step: "02", phase: "Scope", title: "Honest Boundaries", desc: "Fixed pricing, transparent milestones, and zero software bloat." },
              { step: "03", phase: "Build", title: "Disciplined Sprints", desc: "Clean TypeScript code delivered with weekly staging progress access." },
              { step: "04", phase: "Deliver", title: "Handoff & Support", desc: "100% code and infrastructure ownership with post-launch support." },
            ].map((p) => (
              <div key={p.step} className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-1.5 text-left">
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
      </section>

      {/* ── SECTION 3: HIGH-IMPACT CONSULTATION CTA ── */}
      <section
        ref={(el) => { sectionRefs.current[3] = el; }}
        className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-12 sm:py-16 lg:py-24 bg-white overflow-hidden w-full"
      >
        <div className="max-w-4xl mx-auto rounded-2xl border border-palnadu-border bg-palnadu-light-blue/30 p-6 sm:p-10 lg:p-12 shadow-sm text-center space-y-4 sm:space-y-5">
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
              className="w-full sm:w-auto px-7 py-3 rounded-md font-semibold text-sm bg-palnadu-teal text-white hover:bg-[#157c5c] shadow-xs transition-colors"
            >
              Tell Us What You Want To Build →
            </Link>
            <Link
              href="/services"
              className="w-full sm:w-auto px-7 py-3 rounded-md font-semibold text-sm border border-palnadu-blue text-palnadu-blue bg-white hover:bg-palnadu-off-white transition-colors"
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
