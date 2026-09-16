import type { Metadata } from 'next';
import Link from 'next/link';
import { siteConfig } from '@palnadu/config';
import { ContactSection } from '@/components/ui/contact';
import { ShieldCheck, Clock, Users, ArrowRight, MessageSquare, Phone, Mail } from 'lucide-react';

export const metadata: Metadata = {
  title: 'Contact Our Software Engineers',
  description:
    'Share your business idea or the manual process you want to solve. Talk directly with senior developers from Palnadu and Guntur. We reply with direct, honest technical advice within 24 hours.',
  alternates: {
    canonical: '/contact',
  },
};

export default function ContactPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'ContactPage',
    name: 'Contact Palnadu.dev',
    url: `${siteConfig.url}/contact`,
    mainEntity: {
      '@type': 'Organization',
      name: 'Palnadu.dev',
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
      address: {
        '@type': 'PostalAddress',
        addressLocality: 'Palnadu',
        addressRegion: 'Andhra Pradesh',
        addressCountry: 'IN',
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <ContactSection title="Contact Our Software Engineers" />

      {/* Extended Engagement Details (Boosts Word Count & Answers Customer Questions) */}
      <section className="py-14 sm:py-20 bg-palnadu-off-white/40 border-t border-palnadu-border">
        <div className="container max-w-4xl space-y-10">
          <div className="text-center max-w-2xl mx-auto space-y-2">
            <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
              Engineering First
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-palnadu-dark tracking-tight">
              What Happens When You Reach Out to Us?
            </h2>
            <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed">
              We do not employ commission salespeople. Your inquiry is reviewed directly by the senior developers who design and build systems.
            </p>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div className="p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2">
              <div className="h-9 w-9 rounded-lg bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center">
                <Clock className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-palnadu-dark">24-Hour Review SLA</h3>
              <p className="text-xs text-palnadu-secondary leading-relaxed">
                We review your problem statement, evaluate technical feasibility, and respond within one business day with realistic timelines.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2">
              <div className="h-9 w-9 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-palnadu-dark">100% Code Ownership</h3>
              <p className="text-xs text-palnadu-secondary leading-relaxed">
                You own 100% of your source code, database credentials, and cloud hosting accounts. Zero vendor lock-in or recurring hostage fees.
              </p>
            </div>

            <div className="p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-2">
              <div className="h-9 w-9 rounded-lg bg-purple-50 text-purple-700 flex items-center justify-center">
                <Users className="h-4 w-4" />
              </div>
              <h3 className="text-sm font-bold text-palnadu-dark">Direct Engineer Access</h3>
              <p className="text-xs text-palnadu-secondary leading-relaxed">
                Speak directly with developers who understand regional business workflows across Palnadu, Narasaraopet, and Guntur.
              </p>
            </div>
          </div>

          {/* Quick Contact Methods */}
          <div className="p-6 rounded-xl border border-palnadu-border bg-white flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-palnadu-dark">Prefer a Direct Phone Call or WhatsApp?</h3>
              <p className="text-xs text-palnadu-secondary mt-0.5">
                Our team is available Monday to Saturday, 9:00 AM – 7:00 PM IST.
              </p>
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <a
                href={`tel:${siteConfig.contact.phone}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md bg-palnadu-blue text-white text-xs font-semibold hover:bg-[#12487e] transition-colors"
              >
                <Phone className="h-3.5 w-3.5" />
                <span>{siteConfig.contact.phone}</span>
              </a>
              <a
                href={`mailto:${siteConfig.contact.email}`}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-md border border-palnadu-border text-palnadu-dark text-xs font-semibold hover:bg-palnadu-off-white transition-colors"
              >
                <Mail className="h-3.5 w-3.5" />
                <span>{siteConfig.contact.email}</span>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
