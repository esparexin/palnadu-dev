'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CheckCircle2, HelpCircle, ArrowLeft } from 'lucide-react';
import { trackServiceEngagement, trackConsultationRequest } from '@/lib/analytics';
import type { ServiceDetailData } from './service-data';

interface ServiceDetailContentProps {
  service: any;
  content?: ServiceDetailData;
}

export function ServiceDetailContent({ service, content }: ServiceDetailContentProps) {
  useEffect(() => {
    if (service?.slug) {
      trackServiceEngagement({
        service_slug: service.slug,
        service_title: service.title || service.slug,
        engagement_type: 'view_detail',
      });
    }
  }, [service?.slug, service?.title]);
  return (
    <section className="py-12 sm:py-16 relative bg-white">
      <div className="container relative z-10">
        <div className="mx-auto max-w-3xl">
          <Link
            href="/services"
            className="mb-6 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-palnadu-secondary hover:text-palnadu-blue transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            <span>All Engineering Capabilities</span>
          </Link>

          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-palnadu-dark leading-tight">
            {service.title}
          </h1>
          <p className="mt-3 text-base sm:text-lg text-palnadu-body leading-relaxed">
            {service.shortDescription}
          </p>

          {content && (
            <>
              {/* In-Depth Educational Context */}
              <div className="mt-8 space-y-4 text-sm sm:text-base text-palnadu-body leading-relaxed border-t border-palnadu-border/60 pt-8">
                {content.content.map((para, i) => (
                  <p key={i}>{para}</p>
                ))}
              </div>

              {/* Core Deliverables Breakdown */}
              {content.deliverables && (
                <div className="mt-10 pt-8 border-t border-palnadu-border">
                  <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
                    Key Deliverables
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-palnadu-dark mb-4">
                    What We Build & Deliver
                  </h2>
                  <ul className="grid gap-3 sm:grid-cols-1">
                    {content.deliverables.map((item, idx) => (
                      <li
                        key={idx}
                        className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/40 text-xs sm:text-sm text-palnadu-body font-medium flex items-start gap-2.5"
                      >
                        <CheckCircle2 className="h-4 w-4 text-palnadu-teal shrink-0 mt-0.5" />
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Technical Architecture */}
              {content.architecture && (
                <div className="mt-10 pt-8 border-t border-palnadu-border">
                  <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
                    Modern Tech Stack
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-palnadu-dark mb-4">
                    Architectural Standards & Tools
                  </h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    {content.architecture.map((arch, idx) => (
                      <div
                        key={idx}
                        className="p-3 rounded-md bg-palnadu-light-blue/40 border border-palnadu-blue/20 text-xs font-mono font-medium text-palnadu-dark flex items-center gap-2"
                      >
                        <span className="h-1.5 w-1.5 rounded-full bg-palnadu-blue shrink-0" />
                        <span>{arch}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Service Specific FAQs */}
              {content.faq && content.faq.length > 0 && (
                <div className="mt-10 pt-8 border-t border-palnadu-border">
                  <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
                    Frequently Asked Questions
                  </p>
                  <h2 className="text-xl sm:text-2xl font-bold text-palnadu-dark mb-5">
                    Common Questions About {service.title}
                  </h2>
                  <div className="space-y-3.5">
                    {content.faq.map((item, idx) => (
                      <div key={idx} className="p-4 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-1.5">
                        <h3 className="text-sm font-bold text-palnadu-dark flex items-start gap-2">
                          <HelpCircle className="h-4 w-4 text-palnadu-blue shrink-0 mt-0.5" />
                          <span>{item.q}</span>
                        </h3>
                        <p className="text-xs sm:text-sm text-palnadu-body pl-6 leading-relaxed">
                          {item.a}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}

          {/* Direct Consultation CTA Card */}
          <div className="mt-12 pt-8 border-t border-palnadu-border text-center rounded-xl border border-palnadu-border bg-palnadu-off-white/50 p-8 space-y-3">
            <h2 className="text-xl sm:text-2xl font-extrabold text-palnadu-dark">
              Have a project requiring {service.title.toLowerCase()}?
            </h2>
            <p className="text-xs sm:text-sm text-palnadu-body max-w-md mx-auto leading-relaxed">
              Talk directly with senior developers who understand real-world workflows in{' '}
              <Link href="/locations/palnadu" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
                Palnadu
              </Link>
              ,{' '}
              <Link href="/locations/guntur" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
                Guntur
              </Link>
              , and{' '}
              <Link href="/locations/narasaraopet" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
                Narasaraopet
              </Link>
              . We explain costs, limitations, and the cleanest architectural path forward.
            </p>
            <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button asChild className="bg-palnadu-blue text-white hover:bg-palnadu-dark-hover font-semibold text-sm h-11 px-7 shadow-sm">
                <Link
                  href="/contact"
                  onClick={() => {
                    trackConsultationRequest({
                      cta_label: 'Discuss Your Requirements →',
                      source_section: 'service_detail_bottom_cta',
                      source_page: `/services/${service.slug}`,
                      destination_url: '/contact',
                    });
                    trackServiceEngagement({
                      service_slug: service.slug,
                      service_title: service.title || service.slug,
                      engagement_type: 'cta_click',
                      destination_url: '/contact',
                    });
                  }}
                >
                  Discuss Your Requirements →
                </Link>
              </Button>
              <Button asChild variant="outline" className="border-palnadu-border text-palnadu-dark hover:bg-palnadu-off-white text-sm h-11 px-6">
                <Link href="/work">
                  See Verified Works
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
