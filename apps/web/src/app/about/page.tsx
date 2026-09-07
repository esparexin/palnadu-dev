import type { Metadata } from 'next';
import { SectionHeading } from '@/components/layout/section-heading';
import { CtaSection } from '@/components/sections/cta-section';

export const metadata: Metadata = {
  title: 'About',
  description:
    'Palnadu.dev is a technology company built by developers from Palnadu. We help startups, businesses, and individuals solve real-world problems with practical digital solutions.',
};

export default function AboutPage() {
  return (
    <>
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            label="About us"
            title="Technology partner, not just a vendor."
            description="We are a technology company built by developers from Palnadu with 8+ years of experience in solving real-world problems."
          />

          <div className="mx-auto mt-16 max-w-3xl space-y-8 text-muted-foreground">
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Who we are</h3>
              <p className="leading-relaxed">
                Palnadu.dev is a technology company that helps startups, small and medium
                businesses, individuals, and existing product owners turn real-world problems and
                ideas into practical digital solutions.
              </p>
              <p className="leading-relaxed">
                We build web applications, mobile applications, custom software, SaaS products,
                MVPs, and business automation systems. We also provide technical consulting, startup
                idea validation, and ongoing development support.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">How we work</h3>
              <p className="leading-relaxed">
                We start with understanding the problem — not selling technology. Before writing
                a single line of code, we analyze requirements, identify limitations, evaluate
                risks, and explain everything clearly including expected costs and future
                considerations.
              </p>
              <p className="leading-relaxed">
                If a proposed solution has technical limitations, unnecessary features, or
                additional costs, we explain them before development begins. We believe customers
                should understand what is being built, why, and what it will cost.
              </p>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">What we believe</h3>
              <ul className="list-disc space-y-2 pl-5">
                <li>Customer understanding comes first</li>
                <li>Transparent communication throughout</li>
                <li>Affordable pricing through correct scope</li>
                <li>No unnecessary complexity</li>
                <li>No hidden charges</li>
                <li>Honest technical advice</li>
                <li>Quality engineering at every level</li>
                <li>Long-term support and partnership</li>
              </ul>
            </div>

            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-foreground">Our roots</h3>
              <p className="leading-relaxed">
                Built by developers from Palnadu with the ambition of creating high-quality digital
                products from the region for customers everywhere. We bring real engineering depth
                to every project.
              </p>
            </div>
          </div>
        </div>
      </section>
      <CtaSection />
    </>
  );
}
