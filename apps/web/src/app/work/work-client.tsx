"use client";

import React from "react";
import Link from "next/link";
import Image from "next/image";
import { ContainerScroll } from "@/components/ui/container-scroll-animation";
import { Button } from "@/components/ui/button";

const caseStudies = [
  {
    title: "Grain and Rice Mill Gate-Pass Automation",
    category: "Operations Web Application",
    location: "Sattenapalle, Palnadu",
    problem:
      "Manual weighbridge slips and hand-written gate passes created frequent inventory disputes with buyers, delayed evening reconciliations, and lacked verification across multiple godowns.",
    solution:
      "We engineered a lightweight Next.js portal integrated with weighbridge serial outputs, automated WhatsApp delivery memos, and role-based access for clerks, gate operators, and mill owners.",
    outcome:
      "Daily reconciliations that took over two hours every evening now happen instantly with zero paper discrepancies.",
    techStack: ["Next.js", "TypeScript", "MongoDB", "WhatsApp Cloud API"],
    image:
      "https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Educational Institution Admissions and Fee Portal",
    category: "Institutional Platform",
    location: "Narasaraopet, Palnadu",
    problem:
      "Over 1,500 student admissions each academic season caused long campus queues, lost paper inquiry sheets, and delayed fee reconciliations between administrative desks.",
    solution:
      "We built a mobile-friendly admission portal with automated student ID assignment, Razorpay UPI fee payment verification, and instant WhatsApp receipt dispatch.",
    outcome:
      "Saved administrative staff 20+ hours per week during peak admissions and allowed parents to submit inquiries and fee payments from their smartphones.",
    techStack: ["Next.js", "Tailwind CSS", "PostgreSQL", "Razorpay"],
    image:
      "https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Multi-Chamber Cold Storage Stock Management",
    category: "Custom Logistics Platform",
    location: "Chilakaluripet, NH-16 Corridor",
    problem:
      "Tracking agricultural commodity lot numbers, chamber rack allocations, and moisture levels across registers resulted in accidental space double-booking and slow retrieval times.",
    solution:
      "We developed a responsive cloud platform displaying interactive chamber grid heatmaps, lot aging alerts, and automated WhatsApp delivery orders for farmers and commission agents.",
    outcome:
      "Enabled complete real-time visibility into chamber occupancy and reduced truck turnaround times during dispatch.",
    techStack: ["React", "TypeScript", "Node.js", "Prisma"],
    image:
      "https://images.unsplash.com/photo-1553413077-190dd305871c?auto=format&fit=crop&w=1200&q=80",
  },
  {
    title: "Hospital Patient Scheduling and Diagnostics Dashboard",
    category: "Healthcare Application",
    location: "Guntur, Andhra Pradesh",
    problem:
      "A multi-speciality clinic experienced crowded waiting lobbies, overlapping doctor appointments, and lost physical diagnostic reports.",
    solution:
      "We constructed a clean appointment system with digital token queues, automated appointment reminders, and secure PDF diagnostic report delivery to patients.",
    outcome:
      "Reduced average patient lobby wait times by 35% and centralized doctor schedules across medical departments.",
    techStack: ["Next.js", "Tailwind CSS", "MongoDB", "Cloud Storage"],
    image:
      "https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?auto=format&fit=crop&w=1200&q=80",
  },
];

const engineeringStandards = [
  {
    title: "Direct Engineer Collaboration",
    description:
      "You speak directly with the senior developers who design and write your code. We cut out account managers and middle layers so requirements remain accurate.",
  },
  {
    title: "100% Code Ownership",
    description:
      "You own the full source code repository, deployment infrastructure, and database with zero vendor lock-in or recurring monthly per-user licensing fees.",
  },
  {
    title: "Disciplined Delivery Sprints",
    description:
      "We build focused, practical applications delivered in structured three to six-week milestones, allowing you to validate systems with real users quickly.",
  },
];

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
            {/* Subtle bottom gradient to blend dashboard cleanly */}
            <div className="absolute inset-0 bg-gradient-to-t from-palnadu-dark/80 via-transparent to-transparent" />
            <div className="absolute bottom-4 left-4 right-4 sm:bottom-6 sm:left-6 sm:right-6 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-white">
              <div>
                <p className="text-xs uppercase tracking-wider text-emerald-400 font-semibold">Live Operational Platform</p>
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
      <section className="py-16 sm:py-24 bg-palnadu-off-white/40 border-t border-palnadu-border" id="case-studies">
        <div className="container max-w-6xl mx-auto px-4 sm:px-6">
          <div className="max-w-3xl mb-12 sm:mb-16 space-y-3">
            <p className="text-xs font-semibold uppercase tracking-wider text-palnadu-blue">
              Real-World Case Studies
            </p>
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight text-palnadu-dark leading-tight">
              Featured Client Implementations
            </h2>
            <p className="text-base sm:text-lg text-palnadu-body leading-relaxed font-normal">
              Practical technology engineered to eliminate manual paperwork, data entry errors, and communication breakdowns across regional enterprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-10">
            {caseStudies.map((study, idx) => (
              <article
                key={idx}
                className="flex flex-col justify-between bg-white rounded-2xl border border-palnadu-border p-6 sm:p-8 shadow-sm hover:border-palnadu-blue hover:shadow-md transition-all space-y-6"
              >
                <div className="space-y-4">
                  <div className="relative h-48 sm:h-56 w-full rounded-xl overflow-hidden border border-palnadu-border/60 bg-palnadu-off-white">
                    <Image
                      src={study.image}
                      alt={study.title}
                      fill
                      sizes="(max-width: 768px) 100vw, 600px"
                      className="object-cover transition-transform duration-500 hover:scale-105"
                    />
                    <div className="absolute top-3 left-3 bg-white/95 backdrop-blur-md px-3 py-1 rounded-full text-xs font-semibold text-palnadu-dark shadow-sm">
                      {study.location}
                    </div>
                  </div>

                  <div>
                    <span className="text-xs font-semibold text-palnadu-blue uppercase tracking-wider">
                      {study.category}
                    </span>
                    <h3 className="text-xl font-bold text-palnadu-dark leading-snug mt-1">
                      {study.title}
                    </h3>
                  </div>

                  <div className="space-y-2 text-sm text-palnadu-body leading-relaxed">
                    <div>
                      <strong className="text-palnadu-dark font-semibold">The Problem: </strong>
                      <span>{study.problem}</span>
                    </div>
                    <div>
                      <strong className="text-palnadu-dark font-semibold">The Solution: </strong>
                      <span>{study.solution}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-palnadu-border/60 space-y-3">
                  <div className="text-xs bg-emerald-50 text-emerald-900 border border-emerald-200/60 p-3 rounded-lg leading-relaxed">
                    <strong className="font-semibold text-emerald-950">Verified Outcome: </strong>
                    <span>{study.outcome}</span>
                  </div>

                  <div className="flex flex-wrap gap-1.5 pt-1">
                    {study.techStack.map((tech) => (
                      <span
                        key={tech}
                        className="text-xs text-palnadu-body bg-palnadu-off-white px-2.5 py-1 rounded-md"
                      >
                        {tech}
                      </span>
                    ))}
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

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
              <Link href="/contact">Schedule an Engineering Consultation</Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="border-white/20 bg-transparent text-white hover:bg-white/10 font-semibold px-6 h-11 text-sm rounded-lg"
            >
              <Link href="/services">Explore All Services</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}

export default WorkClient;
