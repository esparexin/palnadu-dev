import type { Metadata } from 'next';
import Link from 'next/link';
import { services } from '@palnadu/config';
import { SectionHeading } from '@/components/layout/section-heading';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { CtaSection } from '@/components/sections/cta-section';
import {
  Lightbulb,
  Globe,
  Smartphone,
  Rocket,
  Code,
  Zap,
  MessageSquare,
} from 'lucide-react';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Lightbulb,
  Globe,
  Smartphone,
  Rocket,
  Code,
  Zap,
  MessageSquare,
};

export const metadata: Metadata = {
  title: 'Services',
  description:
    'Web applications, mobile apps, MVP development, custom software, business automation, and technical consulting. From idea validation to production.',
};

export default function ServicesPage() {
  return (
    <>
      <section className="py-20 md:py-28">
        <div className="container">
          <SectionHeading
            label="Services"
            title="What we build"
            description="From idea validation to production software — we help at every stage of your digital journey."
          />

          <div className="mx-auto mt-16 grid max-w-5xl gap-6 md:grid-cols-2">
            {services.map((service) => {
              const Icon = iconMap[service.icon] || Code;
              return (
                <Link key={service.slug} href={`/services/${service.slug}`}>
                  <Card className="group h-full transition-all hover:shadow-md hover:border-foreground/20">
                    <CardHeader className="space-y-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl group-hover:text-primary transition-colors">
                        {service.title}
                      </CardTitle>
                      <CardDescription className="text-base leading-relaxed">
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
      <CtaSection />
    </>
  );
}
