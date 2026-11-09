import type { ServiceDetailData } from './service-data-core';

export const advancedServiceContent: Record<string, ServiceDetailData> = {
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
