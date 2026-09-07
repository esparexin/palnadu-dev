import Link from 'next/link';
import {
  Lightbulb,
  Globe,
  Smartphone,
  Rocket,
  Code,
  Zap,
  MessageSquare,
  ArrowUpRight,
} from 'lucide-react';
import { services } from '@palnadu/config';
import { SectionHeading } from '@/components/layout/section-heading';

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
    <section className="py-20 md:py-28 relative overflow-hidden" id="services">
      {/* Background ambient lighting */}
      <div className="ambient-glow-cyan top-1/3 right-10 w-[450px] h-[450px] opacity-10" />

      <div className="container relative z-10">
        <SectionHeading
          label="Our Engineering Capabilities"
          title="Digital Solutions Built for Real Workflows"
          description="From early-stage idea validation to scalable enterprise platforms — engineered with precision."
        />

        <div className="mx-auto mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {services.map((service, index) => {
            const Icon = iconMap[service.icon] || Code;
            return (
              <Link
                key={service.slug}
                href={`/services/${service.slug}`}
                className="group relative flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-slate-950/60 p-6 backdrop-blur-xl transition-all duration-300 hover:-translate-y-1.5 hover:border-cyan-500/40 hover:bg-slate-900/70 hover:shadow-xl hover:shadow-cyan-500/10"
              >
                <div>
                  <div className="mb-4 flex items-center justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 group-hover:scale-110 group-hover:bg-cyan-500/20 transition-all duration-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <span className="font-mono text-xs text-slate-500 font-semibold">
                      0{index + 1}
                    </span>
                  </div>

                  <h3 className="text-lg font-bold text-white group-hover:text-cyan-300 transition-colors">
                    {service.title}
                  </h3>

                  <p className="mt-2.5 text-sm text-slate-400 leading-relaxed">
                    {service.shortDescription}
                  </p>
                </div>

                <div className="mt-6 flex items-center gap-1 text-xs font-semibold text-cyan-400 opacity-80 group-hover:opacity-100 transition-opacity">
                  <span>Learn approach</span>
                  <ArrowUpRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
