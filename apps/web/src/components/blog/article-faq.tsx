import React from 'react';
import { HelpCircle } from 'lucide-react';
import type { BlogLocale } from '@palnadu/config';

interface ArticleFaqProps {
  faqItems: Array<{ q: string; a: string }>;
  locale: BlogLocale;
}

export function ArticleFaq({ faqItems, locale }: ArticleFaqProps) {
  if (!faqItems || faqItems.length === 0) return null;

  const headingText =
    locale === 'te' ? 'తరచుగా అడిగే ప్రశ్నలు (FAQ)' : 'Frequently Asked Questions';
  const subText =
    locale === 'te'
      ? 'ఈ అంశంపై ముఖ్యమైన సందేహాలు మరియు సమాధానాలు'
      : 'Key questions and practical insights related to this article';

  return (
    <section className="mt-12 pt-8 border-t border-palnadu-border" aria-label="Frequently Asked Questions">
      <div className="space-y-2 mb-6">
        <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
          FAQ
        </p>
        <h2 className="text-xl sm:text-2xl font-bold text-palnadu-dark">
          {headingText}
        </h2>
        <p className="text-xs sm:text-sm text-palnadu-secondary">
          {subText}
        </p>
      </div>

      <div className="space-y-3.5">
        {faqItems.map((item, idx) => (
          <div
            key={idx}
            className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-palnadu-off-white/40 space-y-2"
          >
            <h3 className="text-sm sm:text-base font-bold text-palnadu-dark flex items-start gap-2.5">
              <HelpCircle className="h-4 w-4 text-palnadu-blue shrink-0 mt-0.5" />
              <span>{item.q}</span>
            </h3>
            <p className="text-xs sm:text-sm text-palnadu-body pl-6 leading-relaxed">
              {item.a}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}
