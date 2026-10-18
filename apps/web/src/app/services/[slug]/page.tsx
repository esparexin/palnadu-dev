import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { services, siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { Button } from '@/components/ui/button';
import { CheckCircle2, HelpCircle, ArrowLeft } from 'lucide-react';

interface ServiceDetailData {
  content: string[];
  deliverables: string[];
  architecture: string[];
  faq: { q: string; a: string }[];
}

const serviceContent: Record<string, ServiceDetailData> = {
  'website-development': {
    content: [
      'In modern commerce, your website is the digital front door to your business. When prospective customers, corporate partners, or parents search for your enterprise in Palnadu and Guntur, an outdated, slow-loading website with broken mobile layouts immediately destroys trust.',
      'Palnadu.dev engineers modern, high-converting corporate websites, institutional portals, and business platforms built with Next.js, React, and Tailwind CSS. We completely bypass sluggish WordPress templates and bloated site builders that get hacked and drag down Google rankings.',
      'Every website we construct is pre-rendered into clean, static HTML delivered across edge CDN nodes. This guarantees sub-second First Contentful Paint (FCP) and Largest Contentful Paint (LCP) even over spotty 4G mobile connectivity in regional towns.',
      'We integrate intuitive administrative content management tools, enabling your internal team to publish news announcements, upload gallery photos, and update pricing schedules without writing a single line of code.',
    ],
    deliverables: [
      'Custom Corporate Web Design: Clean typographic branding engineered for regional and global credibility.',
      'School & College Portals: Admission inquiry forms, exam circulars, and institutional portfolios.',
      'Core Web Vitals Optimization: 95+ Google Lighthouse scores with sub-1-second mobile load speeds.',
      'Full SEO & Schema.org Graph: Automatic XML sitemaps, OpenGraph metadata, and structured Knowledge Graph tags.',
      'Responsive Mobile-First UI: Flawless experience across Indian smartphones, tablets, and desktops.',
      'Admin Content Management Panel: Easy post, notice, and banner editing for non-technical team members.',
    ],
    architecture: [
      'Next.js 15+ App Router for static pre-rendering',
      'Tailwind CSS for ultra-lightweight styling',
      'Edge CDN caching via Vercel / Cloudflare',
      'Semantic HTML5 with Schema.org JSON-LD microdata',
    ],
    faq: [
      {
        q: 'Why should our company invest in a custom Next.js website instead of WordPress?',
        a: 'WordPress relies on dozens of third-party plugins that bloat page size, create critical security vulnerabilities, and take 5 to 8 seconds to load. Next.js produces static HTML that loads instantly, never gets hacked through vulnerable plugins, and significantly outperforms templates on Google Search rankings.',
      },
      {
        q: 'Can our staff update announcements and images without coding knowledge?',
        a: 'Yes. We build clean, password-protected admin dashboards allowing your office staff to easily upload photos, edit text, publish circulars, and manage lead inquiries.',
      },
      {
        q: 'Will our website be mobile friendly?',
        a: 'Every single website is designed mobile-first. Over 85% of regional web visits come from Android and iOS smartphones, and we test across popular regional screen resolutions.',
      },
    ],
  },
  'android-app-development': {
    content: [
      'Android powers over 95% of smartphones across Andhra Pradesh. From mandi brokers and commission agents in Narasaraopet to field sales teams in Guntur and delivery drivers navigating rural corridors, Android is the indispensable operating system for regional enterprise.',
      'Palnadu.dev builds robust, high-performance Android mobile applications tailored around real-world commercial workflows. We design lightweight, intuitive interfaces that regional staff and everyday consumers can operate without training.',
      'A primary failure mode of commercial Android apps in regional areas is poor handling of weak network connectivity. We architect offline-first data synchronization, allowing field reps to create orders, log customer visits, or record godown stock even in zero-reception areas. The app automatically syncs all changes the moment a cell signal is recovered.',
      'We handle the full lifecycle from UI/UX design and backend API integration to Google Play Console compliance, target API level updates, and production deployment.',
    ],
    deliverables: [
      'Custom Android Business Applications: Built for field sales, inventory tracking, and consumer ordering.',
      'Offline-First Data Architecture: Zero data loss with local SQLite caching and automated cloud sync.',
      'Hardware & Peripheral Integration: Camera barcode/QR scanning, Bluetooth thermal printers, and GPS geofencing.',
      'Push Notifications via Firebase: Instant transactional notifications, dispatch alerts, and promotional broadcasts.',
      'Google Play Store Release: Complete handling of app bundles, Play Store listing, and privacy disclosures.',
      '100% Source Code Ownership: Full Git repository transfer with complete technical documentation.',
    ],
    architecture: [
      'React Native & Expo / Kotlin runtime',
      'SQLite & WatermelonDB for local offline-first storage',
      'Firebase Cloud Messaging (FCM) for push notifications',
      'RESTful JSON APIs with end-to-end TLS encryption',
    ],
    faq: [
      {
        q: 'Can the Android app operate without an internet connection?',
        a: 'Yes. We engineer offline-first data stores. Staff can create invoices, log entries, or scan inventory offline; the app stores records locally and synchronizes with your cloud server as soon as connectivity resumes.',
      },
      {
        q: 'Do you publish the application to the Google Play Store?',
        a: 'Yes. We manage app signing, target SDK compliance, privacy policy requirements, and submission to the Google Play Console for public or internal track distribution.',
      },
      {
        q: 'Can our Android app connect with our existing desktop billing or accounting software?',
        a: 'Yes. We build custom API connectors and data export bridges that sync customer orders and payment records directly with your central database or Tally.',
      },
    ],
  },
  'ios-app-development': {
    content: [
      'While Android leads in volume, iOS leads in commercial purchasing power. Business executives, medical specialists, corporate directors, and high-value consumers overwhelmingly rely on iPhones and iPads for their daily productivity and purchasing decisions.',
      'Palnadu.dev designs and develops premium iOS applications that adhere rigorously to Apple’s Human Interface Guidelines (HIG). We create fluid, 60fps and 120fps native interactions with refined micro-animations and intuitive gesture navigation.',
      'Apple maintains the strictest App Store review standards in the technology industry. We take complete ownership of Apple Developer Program configuration, privacy manifest requirements, entitlements, TestFlight beta distribution, and App Store review compliance.',
      'Whether you require an executive business dashboard, a customer-facing portal, or an iPad kiosk system for clinics and showrooms, our iOS applications combine aesthetic excellence with enterprise reliability.',
    ],
    deliverables: [
      'Native & Cross-Platform iOS Apps: Engineered with Swift and React Native for fluid, responsive execution.',
      'iPad Business & Showroom Kiosks: Customized tablet layouts for retail displays, clinics, and billing desks.',
      'Apple Human Interface Guidelines: Polished visual hierarchy, typography, dark mode, and dynamic type support.',
      'Apple App Store Approval: End-to-end guidance through Apple Review Guidelines, entitlements, and privacy policies.',
      'Biometric & Secure Enclave Auth: Instant, secure login using Face ID and Touch ID.',
      'Real-Time Cloud Synchronization: Secure backend communication with zero data leakage.',
    ],
    architecture: [
      'React Native with Swift native bridges',
      'Apple Push Notification service (APNs)',
      'TestFlight automated build pipelines',
      'Secure Enclave & Biometric Authentication',
    ],
    faq: [
      {
        q: 'Why should our business build an iOS app if most local customers use Android?',
        a: 'Doctors, institutional directors, business owners, and affluent consumers disproportionately use iPhones. Offering a first-class iOS app establishes brand prestige and captures high-average-order-value transactions.',
      },
      {
        q: 'How difficult is it to get an app approved on the Apple App Store?',
        a: 'Apple rejects apps that do not meet strict usability, privacy, and design standards. Our team designs strictly to Apple guidelines, handles all privacy manifests, and guides your app through review to approval.',
      },
    ],
  },
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
  'digital-marketing': {
    content: [
      'Having a fast website is meaningless if prospective clients in your region cannot find you when searching for your services on Google. Traditional marketing agencies waste company budgets on generic social media posters, boosting Facebook posts to random audiences, and delivering zero measurable sales leads.',
      'Palnadu.dev approaches digital marketing through the discipline of software engineering. We focus strictly on high-intent search engine optimization (SEO), Google Business Profile (GBP) dominance, and localized discovery across Palnadu, Guntur, and coastal Andhra Pradesh.',
      'When a customer searches for "custom software in Guntur", "school web design in Narasaraopet", or "commercial inventory automation in Palnadu", your brand should appear in the coveted Google Local 3-Pack and top organic search positions.',
      'We combine technical SEO—fixing crawl errors, establishing Schema.org Knowledge Graphs, and optimizing Core Web Vitals—with authoritative regional content and strategic citation building to produce sustained, compounding inbound inquiries.',
    ],
    deliverables: [
      'Technical SEO Audits & Remediation: Resolving indexing errors, canonical issues, and Core Web Vitals bottlenecks.',
      'Google Business Profile (GBP) Mastery: Optimizing local business profiles to rank in the Google Maps Local 3-Pack.',
      'Local Citation & NAP Synchronization: Ensuring Name, Address, and Phone consistency across major business directories.',
      'High-Intent Regional Keyword Strategy: Targeting queries with genuine commercial buying intent instead of vanity search volume.',
      'Authoritative Content Architecture: Publishing educational guides and problem-first articles that establish topical authority.',
      'Transparent Analytics & Lead Tracking: Monthly reporting tracking actual phone calls, contact form submissions, and rank trajectory.',
    ],
    architecture: [
      'Google Search Console & Google Analytics 4 (GA4)',
      'Schema.org JSON-LD Knowledge Graph architecture',
      'Automated XML sitemaps & robots.txt crawl control',
      'Core Web Vitals monitoring and performance tracking',
    ],
    faq: [
      {
        q: 'How does Palnadu.dev approach SEO differently from ordinary digital marketing agencies?',
        a: 'Traditional agencies focus on social media likes and vague brand awareness. Because we are software developers, we optimize the technical foundation—server response times, semantic HTML, structured data graphs, and search intent targeting that converts searchers into paying clients.',
      },
      {
        q: 'How long does it take to see results from technical SEO in our region?',
        a: 'Local SEO enhancements (Google Maps and Google Business Profile) typically yield measurable visibility gains within 30 to 60 days. Broader organic search rankings for competitive regional keywords compound steadily over 3 to 6 months.',
      },
      {
        q: 'Can SEO help our business compete against established competitors?',
        a: 'Yes. Most legacy competitors in Andhra Pradesh have slow, outdated websites lacking structured data and proper local optimization. By establishing modern Core Web Vitals and clean Schema markup, your site can outrank them on high-value commercial queries.',
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
    '@id': `${siteConfig.url}/services/${slug}/#service`,
    name: service.title,
    description: service.shortDescription,
    url: `${siteConfig.url}/services/${slug}`,
    provider: getOrganizationRef(),
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

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'Services', path: '/services' },
    { name: service.title, path: `/services/${slug}` },
  ]);

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
                        <div key={idx} className="p-4 rounded-xl border border-palnadu-border bg-white shadow-sm space-y-1.5">
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
                Talk directly with senior developers who understand real-world workflows in{' '}
                <Link href="/locations/palnadu" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
                  Palnadu
                </Link>
                ,{' '}
                <Link href="/locations/guntur" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
                  Guntur
                </Link>
                , and{' '}
                <Link href="/locations/narasaraopet" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
                  Narasaraopet
                </Link>
                . We explain costs, limitations, and the cleanest architectural path forward.
              </p>
              <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
                <Button asChild className="bg-palnadu-blue text-white hover:bg-palnadu-dark-hover font-semibold text-sm h-11 px-7 shadow-sm">
                  <Link href="/contact">
                    Discuss Your Requirements →
                  </Link>
                </Button>
                <Button asChild variant="outline" className="border-palnadu-border text-palnadu-dark hover:bg-palnadu-off-white text-sm h-11 px-6">
                  <Link href="/work">
                    See Verified Works
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
