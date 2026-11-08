import Link from 'next/link';
import { ArrowLeft, Cpu, Building } from 'lucide-react';

interface CaseStudyHeroProps {
  study: any;
}

export function CaseStudyHero({ study }: CaseStudyHeroProps) {
  return (
    <section className="py-12 sm:py-16 bg-palnadu-dark text-white relative">
      <div className="container max-w-4xl space-y-5">
        <Link
          href="/work"
          className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-palnadu-teal hover:underline transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          <span>Back to Portfolio</span>
        </Link>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-2.5 py-0.5 rounded-full bg-palnadu-teal/20 text-palnadu-teal border border-palnadu-teal/40 font-semibold">
            Verified Case Study
          </span>
          {study.client?.company && (
            <span className="text-palnadu-light-blue/80 flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              <span>{study.client.company}</span>
            </span>
          )}
        </div>

        <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
          {study.title}
        </h1>

        {study.result && (
          <p className="text-sm sm:text-base text-palnadu-light-blue/80 leading-relaxed max-w-2xl">
            {study.result}
          </p>
        )}

        {study.technology && study.technology.length > 0 && (
          <div className="pt-3 flex flex-wrap items-center gap-1.5">
            <span className="text-xs font-mono text-palnadu-light-blue/60 mr-1 flex items-center gap-1">
              <Cpu className="h-3.5 w-3.5 text-palnadu-teal" />
              <span>Tech Stack:</span>
            </span>
            {study.technology.map((tech: string, i: number) => (
              <span
                key={i}
                className="text-xs font-mono px-2.5 py-0.5 rounded-md bg-white/10 border border-white/20 text-white font-medium"
              >
                {tech}
              </span>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
