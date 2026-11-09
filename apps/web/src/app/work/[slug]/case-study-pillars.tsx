import Link from 'next/link';
import Image from 'next/image';
import { ArrowRight, BarChart3 } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CaseStudyPillarsProps {
  study: any;
}

export function CaseStudyPillars({ study }: CaseStudyPillarsProps) {
  return (
    <section className="py-14 sm:py-20 border-b border-palnadu-border">
      <div className="container max-w-4xl space-y-10">
        {/* The Problem */}
        <div className="p-6 sm:p-8 rounded-xl border border-palnadu-error/30 bg-palnadu-error/5 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-palnadu-error font-bold">
            01. The Problem & Operational Challenge
          </h2>
          <h3 className="text-lg sm:text-xl font-bold text-palnadu-dark">
            What was broken before software?
          </h3>
          <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
            {study.problem}
          </p>
        </div>

        {/* The Solution */}
        <div className="p-6 sm:p-8 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
            02. The Custom Software Solution
          </h2>
          <h3 className="text-lg sm:text-xl font-bold text-palnadu-dark">
            How Palnadu.dev engineered the solution
          </h3>
          <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
            {study.solution}
          </p>
        </div>

        {/* The Measurable Result */}
        <div className="p-6 sm:p-8 rounded-xl border border-palnadu-border bg-palnadu-light-blue/50 space-y-3">
          <h2 className="text-xs font-mono uppercase tracking-widest text-palnadu-teal-dark font-bold flex items-center gap-1.5">
            <BarChart3 className="h-4 w-4" />
            <span>03. The Result & Commercial ROI</span>
          </h2>
          <h3 className="text-lg sm:text-xl font-bold text-palnadu-dark">
            Measurable business impact achieved
          </h3>
          <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
            {study.result}
          </p>
        </div>

        {/* Extended Content if Present */}
        {study.content && (
          <div className="prose prose-slate max-w-none pt-4 text-palnadu-body text-sm sm:text-base leading-relaxed">
            <div dangerouslySetInnerHTML={{ __html: study.content }} />
          </div>
        )}

        {/* Screenshot Gallery if Present */}
        {study.images && study.images.length > 0 && (
          <div className="space-y-4 pt-4 border-t border-palnadu-border">
            <h3 className="text-sm font-mono uppercase tracking-wider text-palnadu-secondary font-bold">
              Application Screenshots
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              {study.images.map((img: string, i: number) => (
                <div
                  key={i}
                  className="relative aspect-video rounded-xl overflow-hidden border border-palnadu-border shadow-sm bg-palnadu-off-white"
                >
                  <Image
                    src={img}
                    alt={`${study.title} preview ${i + 1}`}
                    fill
                    sizes="(max-width: 768px) 100vw, 500px"
                    className="object-cover"
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom Project Inquiry Callout */}
        <div className="p-6 sm:p-8 rounded-xl border border-palnadu-border bg-palnadu-off-white/60 flex flex-col sm:flex-row items-center justify-between gap-4 text-center sm:text-left">
          <div className="space-y-1">
            <h4 className="text-base font-bold text-palnadu-dark">
              Need a similar system engineered for your company?
            </h4>
            <p className="text-xs sm:text-sm text-palnadu-secondary">
              Talk directly with the senior developers who designed this architecture.
            </p>
          </div>

          <Button
            asChild
            className="bg-palnadu-blue text-white hover:bg-palnadu-dark-hover shrink-0 text-xs sm:text-sm h-10 px-5"
          >
            <Link href="/contact" className="flex items-center gap-1.5">
              <span>Discuss Your Project</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </div>
    </section>
  );
}
