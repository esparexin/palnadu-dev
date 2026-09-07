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
    <>
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            label="Regional Presence"
            title="Rooted in Palnadu. Serving Globally."
            description="Our engineering base is located in the Palnadu region, delivering digital solutions worldwide."
          />

          <div className="mx-auto mt-16 max-w-2xl text-center">
            <div className="rounded-xl border bg-card p-8">
              <p className="text-muted-foreground leading-relaxed">
                We work with businesses across Narasaraopet, Chilakaluripet, Sattenapalle,
                Vinukonda, throughout Andhra Pradesh, India, and internationally. Dedicated local
                hub profiles will be launched as physical community tech initiatives roll out.
              </p>
            </div>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
