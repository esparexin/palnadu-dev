import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { services } from '@palnadu/config';
import { siteConfig } from '@palnadu/config';
import { Button } from '@/components/ui/button';
import { ArrowRight, ArrowLeft } from 'lucide-react';

// Service content — stored here for now; admin-managed later
const serviceContent: Record<
  string,
  { content: string[]; benefits: string[]; faqItems?: { q: string; a: string }[] }
> = {
  'idea-validation': {
    content: [
      'Before investing time and money into development, it is essential to validate whether the idea solves a real problem for real people.',
      'We help you evaluate the problem, understand the target customer, analyze competitors, assess the market opportunity, determine technical feasibility, and define an MVP direction.',
      'This process reduces risk and helps you make informed decisions before writing a single line of code.',
    ],
    benefits: [
      'Understand if the problem is worth solving',
      'Identify your target customer clearly',
      'Analyze competitors and market opportunity',
      'Assess technical feasibility',
      'Define the right MVP scope',
      'Save time and money before development',
    ],
  },
  'web-development': {
    content: [
      'We build business platforms, SaaS products, internal portals, customer dashboards, and custom web applications.',
      'Every web application is built with appropriate technology, clean architecture, and production-ready quality — designed to work reliably and scale as needed.',
      'Whether you need a simple web tool or a complex multi-tenant platform, we work with you to define the right scope, technology, and approach.',
    ],
    benefits: [
      'Business platforms and portals',
      'SaaS products',
      'Customer-facing dashboards',
      'Internal tools and admin systems',
      'E-commerce and marketplaces',
      'Custom web applications',
    ],
  },
  'mobile-app-development': {
    content: [
      'We build iOS, Android, and cross-platform mobile applications that solve real business problems.',
      'We help you determine whether you need a native app, cross-platform solution, or a progressive web app — based on your actual requirements and budget.',
      'Every mobile app is designed for usability, performance, and maintainability.',
    ],
    benefits: [
      'iOS applications',
      'Android applications',
      'Cross-platform applications',
      'Progressive Web Apps',
      'App Store optimization support',
      'Ongoing mobile support',
    ],
  },
  'mvp-development': {
    content: [
      'An MVP is not a half-built product — it is the smallest version of a product that validates a business hypothesis.',
      'We help you define the right MVP scope, build it quickly with appropriate technology, and launch it to real users for validation.',
      'After launch, we help you analyze feedback and plan the next phase of development.',
    ],
    benefits: [
      'Correct MVP scope definition',
      'Fast development with appropriate technology',
      'Launch-ready product',
      'User feedback analysis',
      'Post-launch iteration planning',
      'Transition to full product development',
    ],
  },
  'custom-software': {
    content: [
      'Sometimes off-the-shelf software doesn\'t fit. When your business has specific workflows, processes, or requirements, custom software is the right choice.',
      'We build software around your specific business — not the other way around. Every system is designed for your actual users, processes, and growth trajectory.',
    ],
    benefits: [
      'Business-specific workflows',
      'Process automation',
      'Integration with existing systems',
      'Custom reporting and analytics',
      'User management and access control',
      'Scalable architecture',
    ],
  },
  'business-automation': {
    content: [
      'Repetitive manual processes are expensive and error-prone. We help you identify which processes can be automated and build practical automation solutions.',
      'We focus on automation that provides real time and cost savings — not unnecessary complexity.',
    ],
    benefits: [
      'Workflow automation',
      'Data processing automation',
      'Report generation',
      'Email and notification automation',
      'Integration between systems',
      'Reduced manual effort',
    ],
  },
  'technical-consulting': {
    content: [
      'Whether you need help choosing technology, designing architecture, analyzing an existing system, evaluating technical feasibility, or solving a specific technical problem — we can help.',
      'We provide honest, practical technical advice based on real experience. We will tell you if something is unnecessary, risky, or better approached differently.',
    ],
    benefits: [
      'Architecture design and review',
      'Technology selection guidance',
      'Existing system analysis',
      'Feasibility assessment',
      'Technical problem solving',
      'Honest technical advice',
    ],
  },
};

type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateStaticParams() {
  return services.map((s) => ({ slug: s.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);
  if (!service) return {};

  return {
    title: service.title,
    description: service.shortDescription,
    openGraph: {
      title: `${service.title} | ${siteConfig.name}`,
      description: service.shortDescription,
      url: `${siteConfig.url}/services/${slug}`,
    },
  };
}

export default async function ServicePage({ params }: Props) {
  const { slug } = await params;
  const service = services.find((s) => s.slug === slug);

  if (!service) {
    notFound();
  }

  const content = serviceContent[slug];

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Service',
    name: service.title,
    description: service.shortDescription,
    provider: {
      '@type': 'ProfessionalService',
      name: 'Palnadu.dev',
      url: siteConfig.url,
      telephone: '+91',
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'Andhra Pradesh',
        addressCountry: 'IN',
        addressLocality: 'Palnadu',
      },
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Services',
        item: `${siteConfig.url}/services`,
      },
      {
        '@type': 'ListItem',
        position: 3,
        name: service.title,
        item: `${siteConfig.url}/services/${slug}`,
      },
    ],
  };

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

      <section className="py-12 sm:py-16 relative bg-white">
        <div className="container relative z-10">
          <div className="mx-auto max-w-2xl">
            <Link
              href="/services"
              className="mb-6 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-palnadu-secondary hover:text-palnadu-blue transition-colors"
            >
              ← All Services
            </Link>

            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-palnadu-dark">
              {service.title}
            </h1>
            <p className="mt-2 text-sm sm:text-base text-palnadu-body leading-relaxed">
              {service.shortDescription}
            </p>

            {content && (
              <>
                <div className="mt-8 space-y-3.5">
                  {content.content.map((para, i) => (
                    <p key={i} className="text-palnadu-body leading-relaxed text-sm sm:text-base">
                      {para}
                    </p>
                  ))}
                </div>

                {content.benefits && (
                  <div className="mt-8 pt-6 border-t border-palnadu-border">
                    <h2 className="text-xs font-bold text-palnadu-dark uppercase tracking-wider font-mono mb-3">Coverage</h2>
                    <ul className="grid gap-2 sm:grid-cols-2">
                      {content.benefits.map((benefit) => (
                        <li key={benefit} className="text-sm text-palnadu-body font-medium flex items-baseline gap-2">
                          <span className="text-palnadu-blue font-bold text-xs">/</span>
                          <span>{benefit}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}

            <div className="mt-10 pt-8 border-t border-palnadu-border text-center">
              <h2 className="text-lg sm:text-xl font-bold text-palnadu-dark">Need help with {service.title.toLowerCase()}?</h2>
              <p className="mt-1.5 text-palnadu-body max-w-md mx-auto text-sm">
                Tell us your challenge and we&apos;ll explain our honest technical recommendations.
              </p>
              <Button asChild className="mt-4 bg-palnadu-blue text-white hover:bg-[#12487e] font-semibold text-sm h-11 sm:h-10 rounded-md px-6 shadow-xs">
                <Link href="/contact">
                  Tell us your problem →
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
