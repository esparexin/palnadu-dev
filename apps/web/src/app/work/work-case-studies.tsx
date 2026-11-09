import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight } from 'lucide-react';
import { caseStudies } from './work-data';

export function WorkCaseStudies() {
  return (
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
                <div className="text-xs bg-palnadu-light-blue text-palnadu-dark border border-palnadu-border p-3 rounded-lg leading-relaxed">
                  <strong className="font-semibold text-palnadu-dark">Verified Outcome: </strong>
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

                <div className="pt-2 flex items-center justify-between border-t border-palnadu-border/40">
                  <Link
                    href={`/work/${study.slug}`}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold text-palnadu-blue hover:text-palnadu-dark-hover transition-colors group"
                  >
                    <span>Read Architecture Breakdown</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
