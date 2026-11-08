import React from 'react';
import Link from 'next/link';

export function LandingCta() {
  return (
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

      <p className="text-xs text-palnadu-secondary pt-1">
        We reply within one business day with direct technical advice. Zero sales pressure.
      </p>
    </div>
  );
}
