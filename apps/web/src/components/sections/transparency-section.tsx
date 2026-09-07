import { SectionHeading } from '@/components/layout/section-heading';
import { AlertCircle, Ban, ArrowUpRight } from 'lucide-react';

const statements = [
  {
    icon: AlertCircle,
    text: "If we see a problem, we'll tell you.",
  },
  {
    icon: Ban,
    text: "If something doesn't need to be built, we'll tell you.",
  },
  {
    icon: ArrowUpRight,
    text: "If there is a better approach, we'll explain it.",
  },
];

export function TransparencySection() {
  return (
    <section className="bg-muted/30 py-20 md:py-28" id="transparency">
      <div className="container">
        <SectionHeading label="Honest engineering" title="No hidden surprises." />

        <div className="mx-auto mt-12 grid max-w-4xl gap-6 md:grid-cols-3">
          {statements.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.text}
                className="flex flex-col items-center space-y-4 rounded-lg border bg-card p-8 text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-base font-medium leading-relaxed">{item.text}</p>
              </div>
            );
          })}
        </div>

        <div className="mx-auto mt-12 max-w-2xl space-y-4 text-center">
          <p className="text-muted-foreground leading-relaxed">
            Before development begins, you should understand what is being built, why it is being
            built, what it will cost, what the limitations are, and what future considerations
            exist.
          </p>
        </div>
      </div>
    </section>
  );
}
