import { HelpCircle } from 'lucide-react';

interface LocationFaqProps {
  location: any;
}

export function LocationFaq({ location }: LocationFaqProps) {
  if (!location.faq || location.faq.length === 0) return null;

  return (
    <section className="py-14 sm:py-20 bg-white">
      <div className="container max-w-3xl space-y-8">
        <div className="space-y-2 text-center">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
            Questions & Answers
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-palnadu-dark tracking-tight">
            Frequently Asked Questions in {location.name}
          </h2>
        </div>

        <div className="space-y-4">
          {location.faq.map((item: any, idx: number) => (
            <div
              key={idx}
              className="p-5 rounded-xl border border-palnadu-border bg-palnadu-off-white/40 space-y-2"
            >
              <h3 className="text-sm font-bold text-palnadu-dark flex items-start gap-2">
                <HelpCircle className="h-4 w-4 text-palnadu-blue shrink-0 mt-0.5" />
                <span>{item.q}</span>
              </h3>
              <p className="text-xs sm:text-sm text-palnadu-body pl-6 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
