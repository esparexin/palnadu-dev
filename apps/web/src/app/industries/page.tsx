import type { Metadata } from 'next';
import { SectionHeading } from '@/components/layout/section-heading';
import { CtaSection } from '@/components/sections/cta-section';

export const metadata: Metadata = {
  title: 'Industries We Serve',
  description:
    'Tailored technology solutions for startups, education, retail, healthcare, and small businesses.',
};

const industries = [
  {
    name: 'Startups & Early-Stage',
    slug: 'startups',
    description: 'Rapid MVP development, technical validation, and scalable foundation for new ventures.',
  },
  {
    name: 'Small & Medium Businesses',
    slug: 'small-business',
    description: 'Custom internal software, inventory automation, and modern customer portals.',
  },
  {
    name: 'Education & Training',
    slug: 'education',
    description: 'Student portals, learning platforms, administrative automation, and testing systems.',
  },
  {
    name: 'Retail & Commerce',
    slug: 'retail',
    description: 'Specialized order processing, point-of-sale connectors, and digital catalogs.',
  },
  {
    name: 'Healthcare & Clinics',
    slug: 'healthcare',
    description: 'Appointment scheduling, patient records, clinic workflows, and notification systems.',
  },
];

export default function IndustriesPage() {
  return (
    <div className="bg-white">
      <section className="py-12 sm:py-16">
        <div className="container max-w-4xl">
          <SectionHeading
            label="Sectors"
            title="Tailored to Your Industry"
          />

          {/* Small Boxes Grid */}
          <div className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {industries.map((ind) => (
              <div
                key={ind.slug}
                className="rounded-lg border border-palnadu-border bg-palnadu-off-white p-4 shadow-2xs hover:border-palnadu-blue transition-colors"
              >
                <h3 className="text-sm font-bold text-palnadu-dark mb-1">{ind.name}</h3>
                <p className="text-xs text-palnadu-body leading-relaxed">{ind.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaSection />
    </div>
  );
}
