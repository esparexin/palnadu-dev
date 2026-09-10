import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { services, siteConfig } from '@palnadu/config';
import { Button } from '@/components/ui/button';
import { CheckCircle2, HelpCircle, Layers, ArrowLeft } from 'lucide-react';

interface ServiceDetailData {
  content: string[];
  deliverables: string[];
  architecture: string[];
  faq: { q: string; a: string }[];
}

const serviceContent: Record<string, ServiceDetailData> = {
  'idea-validation': {
    content: [
      'The number one reason digital startups and internal software projects fail is not faulty programming—it is investing development capital into building something customers do not actually want or need. Before writing a single line of production code, our senior engineers help you rigorously interrogate your core assumptions.',
      'We work directly with founders and business operators across Andhra Pradesh to diagnose whether your concept solves a genuine, painful operational bottleneck or if it represents an unnecessary feature. We evaluate technical feasibility, explore third-party API dependencies, review existing market competitors, and construct an actionable implementation scope.',
      'Instead of encouraging you to spend lakhs on an oversized platform, we provide unvarnished technical feedback. If your business objective can be achieved using a simple automation workflow, a low-code database, or existing tools, we will tell you directly.',
      'By the conclusion of the validation phase, you receive a comprehensive technical architectural blueprint, estimated cloud hosting costs, recommended technology stack, and an exact milestone roadmap for a lean Minimum Viable Product (MVP).',
    ],
    deliverables: [
      'Customer Problem & Workflow Audit: Identifying the exact point of friction.',
      'Technical Feasibility Assessment: Database, API, and cloud hosting constraints.',
      'Market & Competitor Analysis: Differentiating your offering from existing alternatives.',
      'Lean MVP Architecture Blueprint: Defining strictly necessary initial features.',
      'Realistic Cost & Timeline Model: Transparent capital allocation without hidden surprises.',
      'Risk & Limitation Breakdown: Flagging scaling traps before writing software.',
    ],
    architecture: [
      'Interactive User Flow Mapping',
      'Data Schema Prototyping',
      'API Dependency & Integration Audit',
      'Milestone-Based Sprint Roadmap',
    ],
    faq: [
      {
        q: 'How long does an idea validation engagement take?',
        a: 'Typically between 1 to 2 weeks. We conduct structured discovery sessions, evaluate feasibility, and present an actionable architectural report.',
      },
      {
        q: 'What if you find our idea is not technically or commercially viable?',
        a: 'We provide honest engineering truth. We will point out the exact failure points and suggest pivot strategies or simpler tools rather than taking your money to build something destined to struggle.',
      },
      {
        q: 'Do we own the research and blueprints produced?',
        a: 'Yes. You receive 100% intellectual property ownership of all user flows, technical specifications, and scoping documents.',
      },
    ],
  },
  'web-development': {
    content: [
      'In modern commerce, your web platform is often the first interaction prospective clients, partners, and parents have with your brand. Legacy websites built with bloated PHP templates or slow drag-and-drop page builders take 6 to 9 seconds to load, fail Google Core Web Vitals, and leak potential leads every single day.',
      'Palnadu.dev engineers high-performance web applications and digital platforms using Next.js (App Router), TypeScript, and Tailwind CSS, deploying directly to global cloud edge networks. Our platforms consistently achieve 90–100 Google Lighthouse scores with sub-second page loads across regional mobile 4G and 5G connections.',
      'We build across the spectrum of commercial requirements: from high-converting institutional portals for junior colleges and healthcare facilities, to complex multi-tenant SaaS applications and internal operations dashboards for wholesale distributors in Palnadu and Guntur.',
      'Every web application is engineered with type-safe backend integrations, robust security headers, automated sitemaps, semantic Schema.org structured data, and responsive interfaces optimized for common Indian smartphones.',
    ],
    deliverables: [
      'High-Speed Next.js & React Applications: Pre-rendered HTML for instant loading.',
      'Custom Corporate & Institutional Portals: Mobile-first web platforms for regional enterprises.',
      'SaaS Application Engineering: Multi-tenant dashboards with role-based access control.',
      'Core Web Vitals Optimization: Sub-1-second LCP and zero layout shifts for higher SEO rank.',
      'REST & tRPC API Architecture: Secure communication between clients and databases.',
      '100% Source Code Ownership: Full Git repository transfer with zero agency lock-in.',
    ],
    architecture: [
      'Next.js 15+ with React Server Components',
      'TypeScript for complete end-to-end type safety',
      'Tailwind CSS for streamlined, zero-bloat styling',
      'Edge CDN deployment via Cloudflare & Vercel',
    ],
    faq: [
      {
        q: 'Why does Palnadu.dev recommend Next.js over WordPress?',
        a: 'Next.js delivers sub-second page loads, eliminates vulnerable third-party plugins that get hacked, provides 100% custom UI control, and directly improves your Google search rankings through superior Core Web Vitals.',
      },
      {
        q: 'Can our staff easily update text and blog posts without coding?',
        a: 'Yes. We integrate lightweight, intuitive administrative portals allowing non-technical team members to publish articles, update announcements, and modify content easily.',
      },
      {
        q: 'Are your websites mobile-friendly?',
        a: 'All our platforms are mobile-first. Over 85% of regional web traffic comes from smartphones, so we rigorously test on common Android and iOS screens.',
      },
    ],
  },
  'mobile-app-development': {
    content: [
      'Mobile devices are the central nervous system of everyday business in Andhra Pradesh. Whether it is field sales agents booking orders in rural mandis, delivery drivers updating transport milestones on NH-16, or patients booking doctor consultations, a seamless mobile experience is essential.',
      'Palnadu.dev designs and develops iOS, Android, and cross-platform mobile applications that solve tangible operational problems without unnecessary complexity or bloated file sizes.',
      'We help you determine whether your business genuinely requires a standalone native mobile application, a cross-platform solution (React Native), or an ultra-fast Progressive Web App (PWA). We evaluate factors like offline data synchronization, camera barcode scanning, push notifications, and development budget before recommending an architectural path.',
      'Our mobile applications emphasize intuitive usability, fast startup times, offline resilience under spotty connectivity, and reliable background synchronization with your centralized cloud database.',
    ],
    deliverables: [
      'Cross-Platform iOS & Android Apps: Single codebase reducing development cost.',
      'Progressive Web Applications (PWA): App-like experience without app store downloads.',
      'Offline-First Data Synchronization: Work reliably in areas with low cell coverage.',
      'Push Notifications & Alerts: Keep customers and staff informed automatically.',
      'Hardware Integrations: Camera barcode/QR scanning, GPS location tracking, and camera uploads.',
      'App Store & Play Store Deployment: Complete handling of publishing and store guidelines.',
    ],
    architecture: [
      'React Native & Expo for cross-platform delivery',
      'SQLite / WatermelonDB for local offline caching',
      'Secure JWT authentication & biometric logins',
      'Background workers for seamless cloud synchronization',
    ],
    faq: [
      {
        q: 'Should our business build a native app or a Progressive Web App (PWA)?',
        a: 'If you need deep hardware integration (Bluetooth printers, background GPS) or public app store presence, a cross-platform mobile app is best. For internal workflows and fast customer portals, a PWA often saves 50% in development costs while offering app-like speed.',
      },
      {
        q: 'How do you handle poor internet connectivity in rural areas?',
        a: 'We architect offline-first data stores. Staff can enter orders or update stock without signal; the app automatically queues and syncs transactions the moment connectivity is restored.',
      },
    ],
  },
  'mvp-development': {
    content: [
      'A Minimum Viable Product (MVP) is not a broken, half-built prototype—it is the smallest, most disciplined version of a product that directly validates a commercial hypothesis with real paying users.',
      'Too many founders spend 9 to 12 months and their entire savings building an exhaustive feature set, only to discover that users only cared about one core capability. Palnadu.dev specializes in rapid 3-to-6-week MVP delivery sprints.',
      'We enforce strict scope boundaries. We identify the single primary problem your application solves, architect a rock-solid foundation, and ship it to production quickly. This allows you to collect real customer feedback, demonstrate traction to investors, and generate cash flow before expanding scope.',
      'Following launch, we analyze telemetry data, user feedback, and error logs to prioritize the next evolutionary development phase with precision.',
    ],
    deliverables: [
      '3-to-6-Week Rapid Build Sprints: Fast time-to-market with disciplined scope.',
      'Production-Ready Infrastructure: Scalable foundation ready for paying customers.',
      'Core Payment Gateway Integration: UPI, credit cards, and net banking via Razorpay/Stripe.',
      'Essential Administrative Dashboard: Monitor signups, transactions, and user activity.',
      'Post-Launch Analytics & Feedback Loops: Actionable data to guide Phase 2 development.',
      'Total Intellectual Property Ownership: You own all repository code from sprint one.',
    ],
    architecture: [
      'Next.js Fullstack architecture with serverless edge handlers',
      'PostgreSQL with Prisma ORM for clean, migration-friendly schemas',
      'Automated CI/CD deployment pipelines on GitHub Actions',
      'Integrated error logging and telemetry monitoring',
    ],
    faq: [
      {
        q: 'What is included in a 3-to-6-week MVP sprint?',
        a: 'Core user onboarding, authentication, primary functional workflow, payment gateway integration, basic administrative controls, and production cloud deployment.',
      },
      {
        q: 'What happens after the MVP is launched?',
        a: 'We review user behavior and transaction metrics together. We then help you plan iterative feature sprints based on real customer demand rather than guesswork.',
      },
    ],
  },
  'custom-software': {
    content: [
      'Commercial businesses across Palnadu and Guntur—such as grain traders, cold storage operators, ginning mills, and multi-speciality clinics—regularly struggle because generic software was not built for their regional operating models.',
      'Off-the-shelf software forces your staff to adopt rigid, unnatural workflows, pay recurring monthly per-user licenses in USD, and work around missing features using messy Excel spreadsheets. When software doesn’t fit your business, operational drag and billing errors multiply.',
      'Palnadu.dev engineers custom business software built precisely around your operational workflows. We map how quotes are generated, how transport memos are dispatched, how batch inventory is tracked, and how reconciliations occur.',
      'Because every system is custom-built with clean TypeScript and modern databases, there are zero recurring user licensing fees. You own your code, your data, and your platform indefinitely.',
    ],
    deliverables: [
      'Tailored ERP & Operations Software: Aligned directly with your company’s workflow.',
      'Centralized Godown & Multi-Branch Inventory: Real-time stock visibility across locations.',
      'Automated Billing & Invoice Generation: GST-compliant invoices with WhatsApp PDF dispatch.',
      'Role-Based Staff Access Controls: Specific dashboards for clerks, managers, and owners.',
      'Legacy Data Migration: Clean transfer of historical records from Tally and Excel.',
      'Zero Recurring Software Licensing: Complete platform ownership without monthly fees.',
    ],
    architecture: [
      'Relational PostgreSQL / MongoDB databases with automated backups',
      'Role-Based Access Control (RBAC) security matrix',
      'Automated WhatsApp Cloud API & SMS integration',
      'Responsive browser dashboards accessible from phone, tablet, and PC',
    ],
    faq: [
      {
        q: 'How does custom software compare in cost to commercial SaaS subscriptions?',
        a: 'While custom software requires an initial development investment, it eliminates recurring per-user monthly fees. For a business with 10–25 staff, custom software typically pays for itself within 12 to 18 months, after which your operational software cost drops to near zero.',
      },
      {
        q: 'Can custom software integrate with our existing Tally accounting?',
        a: 'Yes. We build data export/import routines and API connectors that sync sales invoices, receipts, and ledger records into Tally without double manual entry.',
      },
    ],
  },
  'business-automation': {
    content: [
      'Repetitive manual tasks are an invisible drain on company profitability. In regional businesses across Andhra Pradesh, valuable staff spend 2 to 4 hours every single day re-typing WhatsApp orders into Excel sheets, sending manual payment receipts, calculating complex deductions on calculators, and compiling evening sales summaries.',
      'Manual processes are slow, expensive, and inevitably produce costly human errors. Palnadu.dev builds practical, targeted business automation solutions that connect your disparate tools into a smooth, automated workflow.',
      'We focus strictly on high-ROI automation: systems that save verified hours every week and pay for themselves rapidly. We do not build automation for the sake of novelty; we automate the repetitive tasks that pull owners and staff away from customer service and sales.',
      'From automated customer order notifications and instant PDF ledger generation to automated inventory deduction triggers, our solutions deliver reliability and operational calm.',
    ],
    deliverables: [
      'Automated WhatsApp & SMS Notifications: Instant order confirmations and dispatch tracking.',
      'Spreadsheet & Manual Entry Elimination: Sync web orders directly with inventory databases.',
      'Dynamic Calculation Engines: Automated tax, commission, transport freight, and discounts.',
      'Automated Daily & Monthly Business Reports: Summary analytics delivered directly to owners.',
      'Cross-System API Integrations: Connect payment gateways, CRMs, and accounting portals.',
      'Staff Time Recovery: Eliminate 15+ hours of repetitive administrative drudgery per week.',
    ],
    architecture: [
      'Webhook receivers and background task queues',
      'Official WhatsApp Business API integration',
      'Headless PDF generation engines for instant invoices',
      'Automated cron schedules for daily reconciliations',
    ],
    faq: [
      {
        q: 'What is the most common business process we automate?',
        a: 'Order-to-cash workflows: replacing informal WhatsApp order messages with a single entry portal that automatically creates an invoice, deducts inventory stock, and sends a WhatsApp PDF receipt to the buyer.',
      },
      {
        q: 'Do we need to replace all our current software to automate?',
        a: 'No. We build lightweight connectors and web portals that sit alongside your existing tools, bridging the gaps where staff currently perform manual data entry.',
      },
    ],
  },
  'technical-consulting': {
    content: [
      'Navigating modern technology choices can be overwhelming. Founders and enterprise leaders are bombarded with conflicting advice, trendy frameworks, and expensive agency proposals promising unrealistic outcomes.',
      'Palnadu.dev provides honest, objective technical consulting based on more than eight years of hands-on software engineering. We do not sell vendor-sponsored software or receive kickbacks from third-party platforms. When you consult with us, you get direct, pragmatic engineering advice.',
      'We evaluate your current codebase or architecture for security vulnerabilities, identify database bottlenecks, assess technical debt, and review third-party development proposals to ensure you are not being overcharged.',
      'Whether you need advice choosing between native mobile apps versus web applications, designing a cloud migration roadmap, or conducting technical due diligence on a software acquisition, we provide clear, actionable technical clarity.',
    ],
    deliverables: [
      'Architecture & Codebase Audit: Identifying security risks and performance bottlenecks.',
      'Technology Stack Selection Guidance: Choosing reliable frameworks that scale sensibly.',
      'Vendor Proposal & Scope Review: Independent evaluation of third-party IT agency quotes.',
      'Cloud Infrastructure Optimization: Reducing excessive AWS, Google Cloud, and hosting bills.',
      'Database Optimization & Indexing: Resolving slow query times and database crashes.',
      'Objective Technical Due Diligence: Independent assessment for founders and investors.',
    ],
    architecture: [
      'Deep architectural review against industry security standards',
      'Database query profiling and index optimization reports',
      'Cloud resource utilization audits and cost reduction roadmaps',
      'Written technical evaluation reports with clear priority matrices',
    ],
    faq: [
      {
        q: 'Can you review a software quote we received from another IT company?',
        a: 'Yes. We routinely conduct independent proposal audits. We examine their proposed scope, tech stack, and pricing to help you negotiate fair terms and avoid unnecessary costs.',
      },
      {
        q: 'Who performs the technical consultation?',
        a: 'You speak directly with senior software engineers with 8+ years of production experience—never junior account managers or sales representatives.',
      },
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
    title: `${service.title} Services | Palnadu.dev`,
    description: service.shortDescription,
    alternates: {
      canonical: `/services/${slug}`,
    },
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
      telephone: siteConfig.contact.phone,
      address: {
        '@type': 'PostalAddress',
        addressRegion: 'Andhra Pradesh',
        addressCountry: 'IN',
        addressLocality: 'Palnadu',
      },
    },
  };

  const faqJsonLd = content?.faq ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: content.faq.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  } : null;

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
      {faqJsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <section className="py-12 sm:py-16 relative bg-white">
        <div className="container relative z-10">
          <div className="mx-auto max-w-3xl">
            <Link
              href="/services"
              className="mb-6 inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-palnadu-secondary hover:text-palnadu-blue transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>All Engineering Capabilities</span>
            </Link>

            {/* Semantic H1 */}
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-palnadu-dark leading-tight">
              {service.title}
            </h1>
            <p className="mt-3 text-base sm:text-lg text-palnadu-body leading-relaxed">
              {service.shortDescription}
            </p>

            {content && (
              <>
                {/* In-Depth Educational Context */}
                <div className="mt-8 space-y-4 text-sm sm:text-base text-palnadu-body leading-relaxed border-t border-palnadu-border/60 pt-8">
                  {content.content.map((para, i) => (
                    <p key={i}>{para}</p>
                  ))}
                </div>

                {/* Core Deliverables Breakdown */}
                {content.deliverables && (
                  <div className="mt-10 pt-8 border-t border-palnadu-border">
                    <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
                      Key Deliverables
                    </p>
                    <h2 className="text-xl sm:text-2xl font-bold text-palnadu-dark mb-4">
                      What We Build & Deliver
                    </h2>
                    <ul className="grid gap-3 sm:grid-cols-1">
                      {content.deliverables.map((item, idx) => (
                        <li key={idx} className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/40 text-xs sm:text-sm text-palnadu-body font-medium flex items-start gap-2.5">
                          <CheckCircle2 className="h-4 w-4 text-palnadu-teal shrink-0 mt-0.5" />
                          <span>{item}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Technical Architecture */}
                {content.architecture && (
                  <div className="mt-10 pt-8 border-t border-palnadu-border">
                    <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
                      Modern Tech Stack
                    </p>
                    <h2 className="text-xl sm:text-2xl font-bold text-palnadu-dark mb-4">
                      Architectural Standards & Tools
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                      {content.architecture.map((arch, idx) => (
                        <div key={idx} className="p-3 rounded-md bg-palnadu-light-blue/40 border border-palnadu-blue/20 text-xs font-mono font-medium text-palnadu-dark flex items-center gap-2">
                          <span className="h-1.5 w-1.5 rounded-full bg-palnadu-blue shrink-0" />
                          <span>{arch}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Service Specific FAQs */}
                {content.faq && content.faq.length > 0 && (
                  <div className="mt-10 pt-8 border-t border-palnadu-border">
                    <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold mb-2">
                      Frequently Asked Questions
                    </p>
                    <h2 className="text-xl sm:text-2xl font-bold text-palnadu-dark mb-5">
                      Common Questions About {service.title}
                    </h2>
                    <div className="space-y-3.5">
                      {content.faq.map((item, idx) => (
                        <div key={idx} className="p-4 rounded-xl border border-palnadu-border bg-white shadow-2xs space-y-1.5">
                          <h3 className="text-sm font-bold text-palnadu-dark flex items-start gap-2">
                            <HelpCircle className="h-4 w-4 text-palnadu-blue shrink-0 mt-0.5" />
                            <span>{item.q}</span>
                          </h3>
                          <p className="text-xs sm:text-sm text-palnadu-body pl-6 leading-relaxed">
                            {item.a}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}

            {/* Direct Consultation CTA Card */}
            <div className="mt-12 pt-8 border-t border-palnadu-border text-center rounded-xl border border-palnadu-border bg-palnadu-off-white/50 p-8 space-y-3">
              <h2 className="text-xl sm:text-2xl font-extrabold text-palnadu-dark">
                Have a project requiring {service.title.toLowerCase()}?
              </h2>
              <p className="text-xs sm:text-sm text-palnadu-body max-w-md mx-auto leading-relaxed">
                Talk directly with senior developers who understand real-world workflows in Palnadu and Guntur. We explain costs, limitations, and the cleanest architectural path forward.
              </p>
              <div className="pt-2">
                <Button asChild className="bg-palnadu-blue text-white hover:bg-[#12487e] font-semibold text-sm h-11 px-7 shadow-xs">
                  <Link href="/contact">
                    Discuss Your Requirements →
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
