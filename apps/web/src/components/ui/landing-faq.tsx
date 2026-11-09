import React from 'react';
import { HelpCircle } from 'lucide-react';

export const HOMEPAGE_FAQS = [
  {
    question: 'What services does Palnadu.dev provide?',
    answer:
      'Palnadu.dev is a technology, software engineering, and digital growth studio. Our portfolio covers professional website development, modern UI/UX design, custom web applications, custom software engineering, mobile apps (iOS and Android), advanced digital marketing, technical SEO, AEO, GEO, software testing, QA, and real-time practical software training.',
  },
  {
    question: 'How does your "Start with the problem" approach work?',
    answer:
      'We diagnose your workflow, user bottlenecks, and technical requirements before writing code. We evaluate architecture feasibility, scalability limits, and realistic costs upfront. If an existing tool solves your challenge without custom software, we tell you directly.',
  },
  {
    question: 'What are Answer Engine Optimization (AEO) and Generative Engine Optimization (GEO)?',
    answer:
      'AEO and GEO optimize your digital presence for AI-powered search engines and answer engines including ChatGPT, Perplexity, and Google AI Overviews. We build structured entity schemas, factual machine-readable content, and authoritative references so AI systems accurately identify, summarize, and cite your business.',
  },
  {
    question: 'Do you provide software testing and quality assurance?',
    answer:
      'Yes. We conduct automated end-to-end testing, cross-device responsiveness verification, security audits, and performance benchmarking to ensure zero bugs and sub-second load times before production launch.',
  },
  {
    question: 'What is the real-time practical software training program?',
    answer:
      'We offer hands-on practical training mentored directly by active software engineers. Participants work on live production web applications, learning modern Next.js, TypeScript, cloud deployments, QA testing, and technical SEO with genuine portfolio code.',
  },
  {
    question: 'Which locations and regions does Palnadu.dev serve?',
    answer:
      'We are headquartered in Palnadu with regional service hubs in Macherla, Narasaraopet, Guntur, Chilakaluripet, Sattenapalle, and Vinukonda, serving enterprises across Andhra Pradesh and global clients.',
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

