"use client";

import React from "react"; 
import Link from "next/link";
import Globe from "@/components/ui/globe";
import { services } from "@palnadu/config";
import { ArrowRight, CheckCircle2, Shield, Zap, Layers, Code, Clock, Users, ArrowUpRight, Check } from "lucide-react";

export function ScrollGlobe() {
  return (
    <div className="relative w-full max-w-screen overflow-x-hidden bg-white text-palnadu-dark">
      {/* ── 1. HERO SECTION: BALANCED 2-COLUMN DESKTOP GRID ── */}
      <section className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 pt-8 pb-16 sm:py-16 lg:py-20 border-b border-palnadu-border/60">
        <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
          
          {/* Left Column (7 cols): Content & Trust Proof */}
          <div className="lg:col-span-7 space-y-6 text-left">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-palnadu-light-blue/70 border border-palnadu-blue/20 text-palnadu-blue text-xs font-semibold">
              <span className="h-1.5 w-1.5 rounded-full bg-palnadu-blue animate-pulse" />
              <span className="font-mono uppercase tracking-wider text-[11px]">Problem-First Software Studio</span>
            </div>

            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-palnadu-dark leading-[1.12]">
              Start With The Problem.
              <span className="block text-palnadu-blue mt-1">We Build The Solution.</span>
            </h1>

            <p className="text-sm sm:text-base md:text-lg text-palnadu-body leading-relaxed max-w-xl">
              Palnadu.dev turns real-world business challenges into practical, production-ready software. We validate ideas, eliminate manual business bottlenecks, and engineer what works.
            </p>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <Link
                href="/contact"
                className="px-7 py-3.5 rounded-md font-semibold text-sm text-center inline-flex items-center justify-center bg-palnadu-blue text-white hover:bg-[#12487e] shadow-xs transition-colors"
              >
                <span>Discuss Your Idea</span>
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
              <Link
                href="/services"
                className="px-7 py-3.5 rounded-md font-semibold text-sm text-center inline-flex items-center justify-center border border-palnadu-blue bg-white text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
              >
                Explore Services
              </Link>
            </div>

            {/* Trust Metrics Bar — Fills the lower hero and eliminates empty void */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-8 border-t border-palnadu-border/60">
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-palnadu-dark">8+ Years</p>
                <p className="text-xs text-palnadu-secondary">Engineering Experience</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-palnadu-teal">100%</p>
                <p className="text-xs text-palnadu-secondary">Code Ownership</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-palnadu-blue">Fixed Scope</p>
                <p className="text-xs text-palnadu-secondary">No Surprise Bills</p>
              </div>
              <div className="space-y-0.5">
                <p className="text-xl sm:text-2xl font-black text-palnadu-dark">Direct Access</p>
                <p className="text-xs text-palnadu-secondary">To Senior Engineers</p>
              </div>
            </div>
          </div>

          {/* Right Column (5 cols): Anchored 3D Globe Visual */}
          <div className="lg:col-span-5 flex items-center justify-center relative">
            {/* Ambient Radial Glow Backdrop */}
            <div className="absolute w-72 h-72 rounded-full bg-palnadu-blue/10 blur-3xl pointer-events-none" />
            <div className="relative z-10 transform scale-90 sm:scale-100 lg:scale-110 py-4">
              <Globe />
            </div>
          </div>

        </div>
      </section>

      {/* ── 2. STANDARDS: "TRUTH BEFORE CODE" ── */}
      <section className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-16 sm:py-20 bg-palnadu-off-white/40 border-b border-palnadu-border/60">
        <div className="max-w-7xl mx-auto space-y-10">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
              Engineering Standards
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
              Truth Before Code.
            </h2>
            <p className="mt-2 text-sm sm:text-base text-palnadu-body leading-relaxed">
              Before writing software, we diagnose where work gets stuck. We look at API dependencies, scalability risks, and realistic costs upfront. If a simple existing tool solves your problem, we tell you directly.
            </p>
          </div>

          {/* 4 Structured Engineering Commitments */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2">
              <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center font-bold text-xs">
                01
              </div>
              <h3 className="font-bold text-sm text-palnadu-dark">Diagnostic First</h3>
              <p className="text-xs text-palnadu-body leading-relaxed">
                We audit workflow bottlenecks, user demands, and technical limitations before development begins.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2">
              <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-teal flex items-center justify-center font-bold text-xs">
                02
              </div>
              <h3 className="font-bold text-sm text-palnadu-dark">Fixed Boundaries</h3>
              <p className="text-xs text-palnadu-body leading-relaxed">
                Clear milestones and upfront scope limits. No open-ended hourly billing or surprise engineering invoices.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2">
              <div className="h-8 w-8 rounded-md bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center font-bold text-xs">
                03
              </div>
              <h3 className="font-bold text-sm text-palnadu-dark">100% Ownership</h3>
              <p className="text-xs text-palnadu-body leading-relaxed">
                You receive full Git repository ownership and cloud credentials upon completion. Zero vendor lock-in.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2">
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

      {/* ── 3. CAPABILITIES: ALL 7 CORE SERVICES ── */}
      <section className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-16 sm:py-24 bg-white border-b border-palnadu-border/60">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
                Capabilities
              </p>
              <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
                Practical Engineering Directory
              </h2>
              <p className="mt-1 text-sm text-palnadu-body">
                Custom software engineered around your actual operations &mdash; eliminating messy spreadsheets and manual logs.
              </p>
            </div>
            <Link
              href="/services"
              className="text-xs font-semibold text-palnadu-blue hover:underline shrink-0 flex items-center gap-1"
            >
              <span>View All 7 Services</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          {/* Clean 3-Column Services Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {services.map((srv, idx) => (
              <Link
                key={srv.slug}
                href={`/services/${srv.slug}`}
                className="p-5 rounded-xl border border-palnadu-border bg-white hover:border-palnadu-blue hover:shadow-2xs transition-all flex flex-col justify-between group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-palnadu-secondary font-mono">
                    <span>0{idx + 1}</span>
                    <ArrowUpRight className="h-3.5 w-3.5 text-palnadu-secondary group-hover:text-palnadu-blue group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
                  </div>
                  <h3 className="font-bold text-sm text-palnadu-dark group-hover:text-palnadu-blue transition-colors">
                    {srv.title}
                  </h3>
                  <p className="text-xs text-palnadu-body leading-relaxed line-clamp-2">
                    {srv.shortDescription}
                  </p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. PROCESS: 4-STEP METHODOLOGY ── */}
      <section className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-16 sm:py-20 bg-palnadu-off-white/40 border-b border-palnadu-border/60">
        <div className="max-w-7xl mx-auto space-y-8">
          <div className="max-w-2xl">
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
              Methodology
            </p>
            <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
              How We Work With You
            </h2>
            <p className="mt-1 text-sm text-palnadu-body">
              A transparent, phased engineering process designed to eliminate budget risk.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { step: "01", phase: "Analyze", title: "Diagnose First", desc: "Identify workflow bottlenecks, user demands, and technical limits." },
              { step: "02", phase: "Scope", title: "Honest Boundaries", desc: "Fixed pricing, transparent milestones, and zero software bloat." },
              { step: "03", phase: "Build", title: "Disciplined Sprints", desc: "Clean TypeScript code delivered with weekly staging progress access." },
              { step: "04", phase: "Deliver", title: "Handoff & Support", desc: "100% code and infrastructure ownership with post-launch support." },
            ].map((p) => (
              <div key={p.step} className="p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2">
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

      {/* ── 5. ACTION: HIGH-IMPACT CONSULTATION CTA ── */}
      <section className="relative z-20 px-4 sm:px-8 md:px-12 lg:px-16 py-16 sm:py-24 bg-white">
        <div className="max-w-4xl mx-auto rounded-2xl border border-palnadu-border bg-palnadu-light-blue/30 p-8 sm:p-12 shadow-sm text-center space-y-5">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
            Get Started
          </p>

          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
            Ready To Build What Works?
          </h2>

          <p className="text-sm sm:text-base text-palnadu-body max-w-xl mx-auto leading-relaxed">
            Work directly with the software developers designing and writing your solution. Fixed price boundaries, honest engineering advice, and 100% code ownership.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
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

          <p className="text-[11px] text-palnadu-secondary pt-2">
            We reply within one business day with direct technical advice. Zero sales pressure.
          </p>
        </div>
      </section>
    </div>
  );
}

export default ScrollGlobe;
