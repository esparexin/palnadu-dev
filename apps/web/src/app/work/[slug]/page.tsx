import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { api } from '@/lib/api';
import { CtaSection } from '@/components/sections/cta-section';
import { CaseStudyHero } from './case-study-hero';
import { CaseStudyPillars } from './case-study-pillars';

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  try {
    const res: any = await api.caseStudies.list();
    const studies = res?.data || [];
    return studies
      .filter((s: any) => s.status === 'PUBLISHED' || !s.status)
      .map((s: any) => ({ slug: s.slug }));
  } catch {
    return [];
  }
}

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
        <CaseStudyHero study={study} />
        <CaseStudyPillars study={study} />
        <CtaSection />
      </div>
    </>
  );
}
