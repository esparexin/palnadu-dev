import { SectionHeading } from '@/components/layout/section-heading';

export function IdentitySection() {
  return (
    <section className="bg-muted/30 py-20 md:py-28" id="identity">
      <div className="container">
        <SectionHeading
          label="Our roots"
          title="Built by Palnadu. Built with pride."
        />

        <div className="mx-auto mt-12 max-w-2xl space-y-6 text-center">
          <p className="text-lg text-muted-foreground leading-relaxed">
            Palnadu.dev is built by developers from Palnadu with the ambition of creating
            high-quality digital products from the region for customers everywhere.
          </p>
          <p className="text-lg text-muted-foreground leading-relaxed">
            With 8+ years of experience in technology and problem solving, we bring real engineering
            depth to every project — whether it&apos;s a startup MVP or an enterprise platform.
          </p>
        </div>
      </div>
    </section>
  );
}
