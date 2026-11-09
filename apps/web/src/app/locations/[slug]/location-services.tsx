import Link from 'next/link';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

interface LocationServicesProps {
  location: any;
}

export function LocationServices({ location }: LocationServicesProps) {
  return (
    <section className="py-14 sm:py-20 bg-palnadu-off-white/30 border-b border-palnadu-border" id="services-offered">
      <div className="container max-w-4xl space-y-8">
        <div className="space-y-2">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
            Capabilities
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-palnadu-dark tracking-tight">
            Recommended Software Services for {location.name}
          </h2>
          <p className="text-xs sm:text-sm text-palnadu-body">
            Engineered with Next.js, TypeScript, and modern cloud databases for zero vendor lock-in.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {location.popularServices.map((serviceName: string, idx: number) => {
            const lower = serviceName.toLowerCase();
            const targetSlug =
              lower.includes('website') ? 'website-development' :
              lower.includes('seo') || lower.includes('google') || lower.includes('aeo') ? 'seo-aeo-geo' :
              lower.includes('marketing') ? 'digital-marketing' :
              lower.includes('test') || lower.includes('qa') ? 'software-testing-qa' :
              lower.includes('train') || lower.includes('course') ? 'practical-training' :
              lower.includes('erp') || lower.includes('custom') || lower.includes('inventory') ? 'custom-software' :
              lower.includes('automation') || lower.includes('mandi') || lower.includes('whatsapp') ? 'business-automation' :
              lower.includes('mobile') || lower.includes('android') ? 'android-app-development' :
              'web-development';

            return (
              <div
                key={idx}
                className="p-5 rounded-xl border border-palnadu-border bg-white shadow-sm hover:border-palnadu-blue transition-all space-y-2 flex flex-col justify-between"
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-palnadu-teal">
                    <CheckCircle2 className="h-4 w-4 shrink-0" />
                    <h3 className="text-sm font-bold text-palnadu-dark">{serviceName}</h3>
                  </div>
                  <p className="text-xs text-palnadu-secondary leading-relaxed">
                    Designed around regional workflows, local GST reporting, and phone/tablet interfaces.
                  </p>
                </div>
                <div className="pt-2 border-t border-palnadu-border/40">
                  <Link
                    href={`/services/${targetSlug}`}
                    className="text-xs font-semibold text-palnadu-blue hover:underline inline-flex items-center gap-1"
                  >
                    <span>Explore our engineering capability</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
        <div className="pt-2 text-center">
          <Link
            href="/services"
            className="text-xs sm:text-sm font-semibold text-palnadu-blue hover:underline inline-flex items-center gap-1.5"
          >
            <span>View all software engineering & digital services across Andhra Pradesh</span>
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
}
