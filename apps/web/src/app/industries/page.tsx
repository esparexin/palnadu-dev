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
    name: 'Healthcare & Wellness',
    slug: 'healthcare',
    description: 'Appointment scheduling, patient records, clinic workflows, and notification systems.',
  },
];

export default function IndustriesPage() {
  return (
    <>
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            label="Industries"
            title="Technology tailored to your sector"
            description="We apply practical problem-solving to industry-specific operational challenges."
          />

          <div className="mx-auto mt-16 grid max-w-4xl gap-6 md:grid-cols-2">
            {industries.map((ind) => (
              <div key={ind.slug} className="rounded-xl border bg-card p-6 shadow-sm">
                <h3 className="text-xl font-semibold mb-2">{ind.name}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{ind.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
