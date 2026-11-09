import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { api } from '@/lib/api';
import { CtaSection } from '@/components/sections/cta-section';
import { caseStudies } from '../work-data';
import { CaseStudyHero } from './case-study-hero';
import { CaseStudyPillars } from './case-study-pillars';

type Props = {
  params: Promise<{ slug: string }>;
};

async function getCaseStudyData(slug: string) {
  try {
    const res: any = await api.caseStudies.getBySlug(slug);
    if (res?.data && (res.data.status === 'PUBLISHED' || !res.data.status)) {
      return res.data;
    }
  } catch {
    // API unavailable or record not in DB, fall back to static SSOT
  }

  const staticMatch = caseStudies.find((s) => s.slug === slug);
  if (staticMatch) {
    return {
      title: staticMatch.title,
      slug: staticMatch.slug,
      category: staticMatch.category,
      location: staticMatch.location,
      problem: staticMatch.problem,
      solution: staticMatch.solution,
      result: staticMatch.outcome,
      technology: staticMatch.techStack,
      images: [staticMatch.image],
      status: 'PUBLISHED',
      createdAt: '2026-01-01T00:00:00Z',
      updatedAt: '2026-01-01T00:00:00Z',
    };
  }

  return null;
}

export async function generateStaticParams() {
  const staticSlugs = caseStudies.map((s) => ({ slug: s.slug }));
  try {
    const res: any = await api.caseStudies.list();
    const dynamicSlugs: string[] = (res?.data || [])
      .filter((s: any) => s.status === 'PUBLISHED' || !s.status)
      .map((s: any) => String(s.slug));
    const all = [...new Set([...staticSlugs.map((s) => s.slug), ...dynamicSlugs])];
    return all.map((slug) => ({ slug }));
  } catch {
    return staticSlugs;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const study = await getCaseStudyData(slug);

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
}

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;
  const study = await getCaseStudyData(slug);

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
        <CaseStudyHero study={study} />
        <CaseStudyPillars study={study} />
        <CtaSection />
      </div>
    </>
  );
}
