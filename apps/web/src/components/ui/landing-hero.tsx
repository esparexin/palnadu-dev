import React from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export function LandingHero() {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      {/* Left Column (7 cols): Content & Trust Proof */}
      <div className="lg:col-span-7 space-y-4 sm:space-y-5 text-left">
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

        {/* Trust Metrics Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-4 gap-y-4 sm:gap-4 pt-8 sm:pt-9 border-t border-palnadu-border/50">
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

      {/* Desktop Right Column: Reserves space for the scrolling globe */}
      <div className="hidden lg:block lg:col-span-5 h-[380px]" aria-hidden="true" />

      {/* Mobile Reserved Height for Globe in Hero */}
      <div className="lg:hidden h-[200px]" aria-hidden="true" />
    </div>
  );
}
