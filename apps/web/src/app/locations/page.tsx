import type { Metadata } from 'next';
import { SectionHeading } from '@/components/layout/section-heading';
import { CtaSection } from '@/components/sections/cta-section';

export const metadata: Metadata = {
  title: 'Locations We Serve',
  description:
    'Headquartered in Palnadu with engineering talent serving clients locally and globally.',
  alternates: {
    canonical: '/locations',
  },
};

export default function LocationsPage() {
  return (
    <div className="bg-white">
      <section className="py-16 sm:py-24 min-h-[45vh] flex flex-col justify-center">
        <div className="container max-w-2xl">
          <SectionHeading
            label="Presence"
            title="Rooted in Palnadu, Serving Globally"
          />

          <div className="mt-8 text-center">
            <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white p-6 sm:p-8 shadow-2xs">
              <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
                We work with businesses across Narasaraopet, Chilakaluripet, Sattenapalle,
                Vinukonda, throughout Andhra Pradesh, India, and internationally.
              </p>
            </div>
          </div>
        </div>
      </section>
      <CtaSection />
    </div>
  );
}
