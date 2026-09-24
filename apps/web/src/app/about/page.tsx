import type { Metadata } from 'next';
import { siteConfig, getOrganizationSchema, getBreadcrumbSchema } from '@palnadu/config';
import { LampContainer } from '@/components/ui/lamp';
import { CtaSection } from '@/components/sections/cta-section';

export const metadata: Metadata = {
  title: 'About Us',
  description:
    'Palnadu.dev is a technology company built by developers from Palnadu with 8+ years of experience. We turn real-world problems into practical software.',
  alternates: {
    canonical: '/about',
  },
};

export default function AboutPage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'AboutPage',
    '@id': `${siteConfig.url}/about/#webpage`,
    name: 'About Palnadu.dev',
    description:
      'Palnadu.dev is a technology company built by developers from Palnadu with 8+ years of experience. We turn real-world problems into practical software.',
    url: `${siteConfig.url}/about`,
    mainEntity: {
      '@type': 'Organization',
      '@id': `${siteConfig.url}/#organization`,
    },
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'About Us', path: '/about' },
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
      {/* Lamp Hero Showcase */}
      <LampContainer className="min-h-[65vh] sm:min-h-[75vh]">
        <div className="mx-auto max-w-2xl space-y-3.5 text-center">
          <p className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
            About Palnadu.dev
          </p>
          <h1 className="bg-gradient-to-br from-white via-slate-100 to-slate-400 py-1 bg-clip-text text-2xl sm:text-4xl md:text-5xl font-extrabold tracking-tight text-transparent leading-tight">
            Software engineers, not commission salespeople.
          </h1>
          <p className="mx-auto max-w-lg text-sm sm:text-base text-slate-300 leading-relaxed font-normal">
            Built by engineers from Palnadu with 8+ years of experience turning real-world problems into practical software.
          </p>
        </div>
      </LampContainer>

      {/* Main Story Content */}
      <section className="py-12 sm:py-16 bg-white">
        <div className="container max-w-3xl">
          <div className="space-y-8 text-sm sm:text-base text-palnadu-body leading-relaxed">
            <div className="space-y-2">
              <h2 className="text-base sm:text-lg font-bold text-palnadu-dark">Who We Are</h2>
              <p>
                Palnadu.dev was built by software engineers from the Palnadu region. We have spent more than eight years designing web applications, building mobile platforms, automating manual business operations, and validating startup MVPs.
              </p>
              <p>
                We partner directly with startup founders, small-to-medium businesses, and individuals who have genuine digital challenges.
              </p>
            </div>

            <div className="space-y-2 border-t border-palnadu-border pt-6">
              <h2 className="text-base sm:text-lg font-bold text-palnadu-dark">Our Standard: Truth Before Code</h2>
              <p>
                Before we write a single line of code, we spend time understanding your workflow and where things break down. We look for hidden bottlenecks, assess hosting and database dependencies, and explain realistic costs upfront.
              </p>
              <p>
                If an idea has technical limitations or future scaling traps, we explain them before development starts. If you don&apos;t need custom software, we tell you that honestly and point you to simpler existing tools.
              </p>
            </div>

            <div className="space-y-2 border-t border-palnadu-border pt-6">
              <h2 className="text-base sm:text-lg font-bold text-palnadu-dark">A Boundary on Price, Not on Quality</h2>
              <p>
                We believe great software should be accessible. Affordable engineering comes from disciplined scope, sensible architectural choices, avoiding trendy bloat, and shipping in phases.
              </p>
              <p>
                When you partner with us, you work directly with the developers building your product. That means faster communication, honest engineering answers, and software that actually works when your customers use it.
              </p>
            </div>
          </div>
        </div>
      </section>

      <CtaSection />
      </div>
    </>
  );
}
