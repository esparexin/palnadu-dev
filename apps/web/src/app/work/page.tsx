import type { Metadata } from 'next';
import { SectionHeading } from '@/components/layout/section-heading';
import { CtaSection } from '@/components/sections/cta-section';

export const metadata: Metadata = {
  title: 'Work',
  description:
    'Case studies and projects by Palnadu.dev. Real problems solved with practical technology.',
};

export default function WorkPage() {
  return (
    <div className="bg-white">
      <section className="py-12 sm:py-16">
        <div className="container">
          <SectionHeading
            label="Our Work"
            title="Problems We've Solved"
            description="Real projects following our problem-first approach."
          />

          <div className="mx-auto mt-8 max-w-xl text-center">
            <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white p-6 shadow-2xs">
              <h3 className="text-sm font-bold text-palnadu-dark mb-1">Case Studies Coming Soon</h3>
              <p className="text-xs text-palnadu-body leading-relaxed">
                We only showcase verified projects with measurable business outcomes.
              </p>
            </div>
          </div>
        </div>
      </section>
      <CtaSection />
    </div>
  );
}
