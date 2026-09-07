import { SectionHeading } from '@/components/layout/section-heading';

const principles = [
  'Correct scope',
  'Avoiding unnecessary features',
  'Appropriate technology',
  'Practical architecture',
  'Phased development',
  'Transparent requirements',
  'Sensible engineering decisions',
];

export function AffordabilitySection() {
  return (
    <section className="py-20 md:py-28" id="affordability">
      <div className="container">
        <SectionHeading
          label="Pricing philosophy"
          title="We put a boundary on price — not on quality."
        />

        <div className="mx-auto mt-12 max-w-3xl">
          <p className="mb-8 text-center text-lg text-muted-foreground leading-relaxed">
            Affordable development comes from making the right decisions — not from cutting
            corners.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {principles.map((principle) => (
              <div
                key={principle}
                className="flex items-center gap-3 rounded-lg border bg-card px-5 py-4"
              >
                <div className="h-1.5 w-1.5 rounded-full bg-primary flex-shrink-0" />
                <span className="text-sm font-medium">{principle}</span>
              </div>
            ))}
          </div>

          <p className="mt-8 text-center text-sm text-muted-foreground">
            Affordable, practical, cost-conscious engineering.
          </p>
        </div>
      </div>
    </section>
  );
}
