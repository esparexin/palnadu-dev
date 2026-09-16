import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { api } from '@/lib/api';
import { CtaSection } from '@/components/sections/cta-section';
import { ArrowLeft, ArrowRight, CheckCircle2, Cpu, BarChart3, Building } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res: any = await api.caseStudies.getBySlug(slug);
    const study = res?.data;

    if (!study) {
      return { title: 'Case Study Not Found | Palnadu.dev' };
    }

    const title = study.seoTitle || `${study.title} | Case Study | ${siteConfig.name}`;
    const description = study.seoDescription || study.result || study.problem;

    return {
      title,
      description,
      alternates: {
        canonical: `/work/${slug}`,
      },
      openGraph: {
        title,
        description,
        url: `${siteConfig.url}/work/${slug}`,
        images: study.images?.[0] ? [{ url: study.images[0] }] : undefined,
      },
    };
  } catch {
    return { title: 'Case Study | Palnadu.dev' };
  }
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;

  let study: any = null;
  try {
    const res: any = await api.caseStudies.getBySlug(slug);
    study = res?.data;
  } catch {
    notFound();
  }

  if (!study || study.status !== 'PUBLISHED') {
    notFound();
  }

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'CreativeWork',
    '@id': `${siteConfig.url}/work/${slug}/#work`,
    name: study.title,
    headline: study.title,
    description: study.seoDescription || study.result,
    creator: getOrganizationRef(),
    about: study.problem,
    datePublished: study.createdAt,
    dateModified: study.updatedAt,
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'Our Work', path: '/work' },
    { name: study.title, path: `/work/${slug}` },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="bg-white">
        {/* Case Study Header */}
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
                <span className="text-gray-300 flex items-center gap-1">
                  <Building className="h-3.5 w-3.5" />
                  <span>{study.client.company}</span>
                </span>
              )}
            </div>

            <h1 className="text-2xl sm:text-4xl lg:text-5xl font-black tracking-tight text-white leading-tight">
              {study.title}
            </h1>

            {study.result && (
              <p className="text-sm sm:text-base text-gray-300 leading-relaxed max-w-2xl">
                {study.result}
              </p>
            )}

            {/* Tech Stack Chips */}
            {study.technology && study.technology.length > 0 && (
              <div className="pt-3 flex flex-wrap items-center gap-1.5">
                <span className="text-xs font-mono text-gray-400 mr-1 flex items-center gap-1">
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

        {/* 3-Core Structural Pillars: Problem, Solution, Outcome */}
        <section className="py-14 sm:py-20 border-b border-palnadu-border">
          <div className="container max-w-4xl space-y-10">
            {/* The Problem */}
            <div className="p-6 sm:p-8 rounded-xl border border-red-200 bg-red-50/40 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-red-700 font-bold">
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
            <div className="p-6 sm:p-8 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-3">
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
            <div className="p-6 sm:p-8 rounded-xl border border-emerald-200 bg-emerald-50/40 space-y-3">
              <h2 className="text-xs font-mono uppercase tracking-widest text-emerald-800 font-bold flex items-center gap-1.5">
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
                    <div key={i} className="rounded-xl overflow-hidden border border-palnadu-border shadow-xs bg-palnadu-off-white">
                      <img src={img} alt={`${study.title} preview ${i + 1}`} className="w-full h-auto object-cover" />
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

              <Button asChild className="bg-palnadu-blue text-white hover:bg-[#12487e] shrink-0 text-xs sm:text-sm h-10 px-5">
                <Link href="/contact" className="flex items-center gap-1.5">
                  <span>Discuss Your Project</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <CtaSection />
      </div>
    </>
  );
}
