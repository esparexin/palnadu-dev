import type { Metadata } from 'next';
import { SectionHeading } from '@/components/layout/section-heading';
import { CtaSection } from '@/components/sections/cta-section';

export const metadata: Metadata = {
  title: 'Locations We Serve',
  description:
    'Headquartered in Palnadu with engineering talent serving clients locally and globally.',
};

export default function LocationsPage() {
  return (
    <div className="bg-white">
      <section className="py-12 sm:py-16">
        <div className="container max-w-2xl">
          <SectionHeading
            label="Presence"
            title="Rooted in Palnadu, Serving Globally"
          />

          <div className="mt-8 text-center">
            <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white p-6 shadow-2xs">
              <p className="text-xs sm:text-sm text-palnadu-body leading-relaxed">
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
