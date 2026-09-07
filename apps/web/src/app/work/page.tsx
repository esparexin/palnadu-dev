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
    <>
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            label="Our work"
            title="Problems we've solved"
            description="Real projects following our problem-first approach. Case studies will be added as projects are completed."
          />

          <div className="mx-auto mt-16 max-w-2xl text-center">
            <div className="rounded-xl border border-dashed p-12">
              <p className="text-muted-foreground">
                Case studies are coming soon. We only showcase real projects with real results —
                no fabricated examples.
              </p>
              <p className="mt-4 text-sm text-muted-foreground">
                Have a project you&apos;d like to discuss?
              </p>
            </div>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
