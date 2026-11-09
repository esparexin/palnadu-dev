"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Button } from "@/components/ui/button";
import { trackConsultationRequest } from "@/lib/analytics";
import { engineeringStandards } from "./work-data";
import { WorkCaseStudies } from "./work-case-studies";

export function WorkClient() {
  return (
    <div className="w-full bg-white text-palnadu-dark">
      {/* ── 1. CONTAINER SCROLL ANIMATION HERO ── */}
      <section className="relative w-full overflow-hidden bg-white pt-6 pb-12 sm:pt-12 sm:pb-20">
        <ContainerScroll
          titleComponent={
            <div className="space-y-3 sm:space-y-4">
              <p className="text-xs sm:text-sm font-semibold uppercase tracking-wider text-palnadu-blue">
                Engineering Showcase
              </p>
              <h1 className="text-3xl sm:text-5xl md:text-6xl font-extrabold text-palnadu-dark tracking-tight leading-tight max-w-4xl mx-auto">
                Software Solutions Built for <br />
                <span className="text-palnadu-blue">Real-World Operations</span>
              </h1>
              <p className="max-w-2xl mx-auto text-base sm:text-lg text-palnadu-body leading-relaxed font-normal">
                Explore enterprise web applications, operations portals, and mobile platforms engineered by Palnadu.dev for businesses in Andhra Pradesh.
              </p>
            </div>
          }
        >
          <div className="relative w-full h-full rounded-2xl overflow-hidden bg-palnadu-dark">
            <Image
              src="https://images.unsplash.com/photo-1551288049-bebda4e38f71?auto=format&fit=crop&w=2400&q=80"
              alt="Palnadu.dev Software Operations Dashboard"
              fill
              sizes="(max-width: 768px) 100vw, 1200px"
              className="object-cover object-left-top"
              priority
            />
            <div className="absolute inset-0 bg-gradient-to-t from-palnadu-dark/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
              <div>
                <p className="text-xs uppercase tracking-wider text-palnadu-teal font-semibold">Live Operational Platform</p>
                <p className="text-sm sm:text-base font-bold">Custom ERP, Dispatch & Multi-Branch Inventory Dashboard</p>
              </div>
              <span className="text-xs text-white/80 bg-white/10 backdrop-blur-md px-3 py-1 rounded-full w-fit">
                Sub-Second Edge Response
              </span>
            </div>
          </div>
        </ContainerScroll>
      </section>

      {/* ── 2. FEATURED CASE STUDIES SECTION ── */}
      <WorkCaseStudies />

      {/* ── 3. ENGINEERING STANDARDS ── */}
      <section className="py-16 sm:py-24 bg-white border-t border-palnadu-border">
        <div className="container max-w-5xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-12 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
              Our Development Approach
            </p>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold tracking-tight text-palnadu-dark leading-tight">
              Why Companies Trust Palnadu.dev
            </h2>
            <p className="text-base sm:text-lg text-palnadu-body leading-relaxed font-normal">
              We approach every engagement with straightforward engineering principles designed to protect your capital and deliver dependable software.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            {engineeringStandards.map((std, idx) => (
              <div
                key={idx}
                className="bg-palnadu-off-white/60 rounded-xl p-6 border border-palnadu-border space-y-2.5"
              >
                <h3 className="text-base sm:text-lg font-bold text-palnadu-dark leading-snug">
                  {std.title}
                </h3>
                <p className="text-sm text-palnadu-body leading-relaxed font-normal">
                  {std.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── 4. BOTTOM CONSULTATION CARD ── */}
      <section className="py-16 sm:py-20 bg-palnadu-dark text-white border-t border-palnadu-dark-hover">
        <div className="container max-w-3xl mx-auto px-4 text-center space-y-5">
          <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-white leading-tight">
            Have a project or manual process to solve?
          </h2>
          <p className="text-sm sm:text-base text-palnadu-light-blue/80 max-w-xl mx-auto leading-relaxed font-normal">
            Talk directly with senior developers who write your software. We evaluate technical feasibility, estimate realistic costs, and engineer what works.
          </p>
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <Button
              asChild
              className="bg-palnadu-blue hover:bg-palnadu-dark-hover text-white font-semibold px-7 h-11 text-sm rounded-lg shadow-sm"
            >
              <Link
                href="/contact"
                onClick={() =>
                  trackConsultationRequest({
                    cta_label: 'Schedule an Engineering Consultation',
                    source_section: 'work_portfolio_bottom_cta',
                    source_page: '/work',
                    destination_url: '/contact',
                  })
                }
              >
                Schedule an Engineering Consultation
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 font-semibold px-6 h-11 text-sm rounded-lg"
            >
              <Link
                href="/services"
                onClick={() =>
                  trackConsultationRequest({
                    cta_label: 'Explore All Services',
                    source_section: 'work_portfolio_bottom_cta',
                    source_page: '/work',
                    destination_url: '/services',
                  })
                }
              >
                Explore All Services
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default WorkClient;
