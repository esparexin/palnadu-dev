import type { Metadata } from 'next';
import { SectionHeading } from '@/components/layout/section-heading';
import { CtaSection } from '@/components/sections/cta-section';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Technical articles, guides, and insights on software development, startups, and digital solutions by Palnadu.dev.',
};

export default function BlogPage() {
  return (
    <div className="bg-white">
      <section className="py-16 sm:py-24 min-h-[45vh] flex flex-col justify-center">
        <div className="container">
          <SectionHeading
            label="Articles"
            title="Insights & Guides"
            description="Practical articles on technology, software architecture, and product validation."
          />

          <div className="mx-auto mt-8 max-w-xl text-center">
            <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white p-6 sm:p-8 shadow-2xs">
              <h3 className="text-base font-bold text-palnadu-dark mb-1.5">Articles In Preparation</h3>
              <p className="text-sm text-palnadu-body leading-relaxed">
                We are preparing practical engineering breakdowns and startup guides.
              </p>
            </div>
          </div>
        </div>
      </section>
      <CtaSection />
    </div>
  );
}
