import Link from 'next/link';
import {
  Lightbulb,
  Globe,
  Smartphone,
  Rocket,
  Code,
  Zap,
  MessageSquare,
} from 'lucide-react';
import { services } from '@palnadu/config';
import { SectionHeading } from '@/components/layout/section-heading';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  Globe,
  Smartphone,
  Rocket,
  Code,
  Zap,
  MessageSquare,
};

export function ServicesSection() {
  return (
    <section className="bg-muted/30 py-20 md:py-28" id="services">
      <div className="container">
        <SectionHeading
          label="What we do"
          title="Services"
          description="From idea validation to production software — we help at every stage."
        />

        <div className="mx-auto mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service) => {
            const Icon = iconMap[service.icon] || Code;
            return (
              <Link key={service.slug} href={`/services/${service.slug}`}>
                <Card className="group h-full transition-all hover:shadow-md hover:border-foreground/20">
                  <CardHeader>
                    <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                      <Icon className="h-5 w-5 text-primary" />
                    </div>
                    <CardTitle className="text-lg group-hover:text-primary transition-colors">
                      {service.title}
                    </CardTitle>
                    <CardDescription className="leading-relaxed">
                      {service.shortDescription}
                    </CardDescription>
                  </CardHeader>
                </Card>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
