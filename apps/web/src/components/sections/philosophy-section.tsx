import { SectionHeading } from '@/components/layout/section-heading';

export function PhilosophySection() {
  return (
    <section className="py-20 md:py-28" id="philosophy">
      <div className="container">
        <SectionHeading
          label="Our approach"
          title="We don't just build software. We solve problems."
        />

        <div className="mx-auto mt-12 max-w-3xl space-y-6 text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            You don&apos;t need to know whether you need a website, mobile application, SaaS
            product, automation, dashboard, or custom software.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Tell us what isn&apos;t working. We&apos;ll help determine whether technology can solve
            it — and what the right solution should be.
          </p>
        </div>
      </div>
    </section>
  );
}
