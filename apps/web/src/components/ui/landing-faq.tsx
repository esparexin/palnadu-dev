import React from 'react';
import { HelpCircle } from 'lucide-react';

export const HOMEPAGE_FAQS = [
  {
    question: 'What does Palnadu.dev specialize in?',
    answer:
      'Palnadu.dev is a problem-first software studio specializing in web applications, mobile apps, custom business software, startup MVP development, business automation, and technical consulting.',
  },
  {
    question: 'What does "Start with the problem" mean?',
    answer:
      'Instead of pushing unnecessary frameworks or features, we diagnose what is broken in your workflow or idea first. We evaluate feasibility, limitations, and future costs before writing any code.',
  },
] as const;

export function LandingFaq() {
  return (
    <div className="max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 items-center">
      <div className="lg:col-span-7 space-y-6">
        <div className="max-w-2xl text-left">
          <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-1.5">
            Common Inquiries
          </p>
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-palnadu-dark">
            Frequently Asked Questions
          </h2>
          <p className="mt-1 text-xs sm:text-sm text-palnadu-body leading-relaxed">
            Straightforward answers to how we work, evaluate problems, and engineer software.
          </p>
        </div>

        <div className="space-y-3.5">
          {HOMEPAGE_FAQS.map((faq, index) => (
            <div
              key={index}
              className="p-4 sm:p-5 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-2 text-left"
            >
              <h3 className="text-sm sm:text-base font-bold text-palnadu-dark flex items-start gap-2.5">
                <HelpCircle className="h-4 w-4 text-palnadu-blue shrink-0 mt-0.5" />
                <span>{faq.question}</span>
              </h3>
              <p className="text-xs sm:text-sm text-palnadu-body pl-6 leading-relaxed">
                {faq.answer}
              </p>
            </div>
          ))}
        </div>
      </div>

      <div className="hidden lg:block lg:col-span-5 h-[340px]" aria-hidden="true" />
    </div>
  );
}
