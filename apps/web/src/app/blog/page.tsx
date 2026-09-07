import type { Metadata } from 'next';
import { SectionHeading } from '@/components/layout/section-heading';

export const metadata: Metadata = {
  title: 'Blog',
  description:
    'Technical articles, guides, and insights on software development, startups, and digital solutions by Palnadu.dev.',
};

export default function BlogPage() {
  return (
    <section className="py-20 md:py-28">
      <div className="container">
        <SectionHeading
          label="Blog"
          title="Insights & Guides"
          description="Practical articles on technology, startups, and building digital products."
        />

        <div className="mx-auto mt-16 max-w-2xl text-center">
          <div className="rounded-xl border border-dashed p-12">
            <p className="text-muted-foreground">
              Articles are coming soon. We are preparing genuinely useful content — not keyword
              filler.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
