// ─── Color Palette, Media & Schema (SSOT) ────────────────────────
export * from './colors';
export * from './media';
export * from './schema';

// ─── Site Configuration ───────────────────────────────────────

export const siteConfig = {
  name: 'Palnadu.dev',
  brandName: 'Palnadu.dev',
  title: 'Palnadu.dev — Start with the problem. We build the solution.',
  description:
    'Palnadu.dev helps startups, businesses, and individuals turn real-world problems and ideas into practical digital solutions.',
  url: 'https://www.palnadu.dev',
  ogImage: 'https://www.palnadu.dev/og.png',
  creator: 'Palnadu.dev',
  links: {
    github: 'https://github.com/esparexin',
    twitter: 'https://twitter.com/palnadudev',
    linkedin: 'https://linkedin.com/company/palnadudev',
  },
  contact: {
    email: 'hello@palnadu.dev',
    phone: '+91-9030787819',
  },
} as const;

// ─── Navigation ───────────────────────────────────────────────

export interface NavItem {
  title: string;
  href: string;
  description?: string;
  children?: NavItem[];
}

export const mainNavItems: NavItem[] = [
  { title: 'Home', href: '/' },
  { title: 'About', href: '/about' },
  { title: 'Services', href: '/services' },
  { title: 'Work', href: '/work' },
  { title: 'Blog', href: '/blog' },
  { title: 'Contact', href: '/contact' },
];

export const footerNavItems = {
  services: [
    { title: 'Website Development', href: '/services/website-development' },
    { title: 'Web Applications', href: '/services/web-development' },
    { title: 'Android App Development', href: '/services/android-app-development' },
    { title: 'iOS App Development', href: '/services/ios-app-development' },
    { title: 'Custom Software', href: '/services/custom-software' },
    { title: 'Business Automation', href: '/services/business-automation' },
    { title: 'Digital Marketing & SEO', href: '/services/digital-marketing' },
    { title: 'MVP Development', href: '/services/mvp-development' },
    { title: 'Technical Consulting', href: '/services/technical-consulting' },
  ],
  company: [
    { title: 'About', href: '/about' },
    { title: 'Work', href: '/work' },
    { title: 'Blog', href: '/blog' },
    { title: 'Locations', href: '/locations' },
    { title: 'Contact', href: '/contact' },
  ],
  legal: [
    { title: 'Privacy Policy', href: '/privacy' },
    { title: 'Terms of Service', href: '/terms' },
  ],
};

// ─── Services Data ────────────────────────────────────────────

export const services = [
  {
    title: 'Website Development',
    slug: 'website-development',
    shortDescription:
      'High-performance corporate websites, school platforms, and institutional portals engineered with Next.js.',
    icon: 'Globe',
  },
  {
    title: 'Web Applications',
    slug: 'web-development',
    shortDescription:
      'Build business platforms, SaaS products, portals, dashboards, and custom web applications.',
    icon: 'Globe',
  },
  {
    title: 'Mobile Applications',
    slug: 'mobile-app-development',
    shortDescription:
      'Build iOS, Android, and cross-platform mobile applications.',
    icon: 'Smartphone',
  },
  {
    title: 'Android App Development',
    slug: 'android-app-development',
    shortDescription:
      'Native and cross-platform Android mobile applications built for regional business operations and the Google Play Store.',
    icon: 'Smartphone',
  },
  {
    title: 'iOS App Development',
    slug: 'ios-app-development',
    shortDescription:
      'Premium iOS mobile applications engineered for iPhone and iPad with clean architecture and App Store deployment.',
    icon: 'Smartphone',
  },
  {
    title: 'Idea Validation',
    slug: 'idea-validation',
    shortDescription:
      'Validate the problem, customer, competition, market opportunity, feasibility, and MVP direction.',
    icon: 'Lightbulb',
  },
  {
    title: 'MVP Development',
    slug: 'mvp-development',
    shortDescription:
      'Launch your minimum viable product quickly with the right technology and scope.',
    icon: 'Rocket',
  },
  {
    title: 'Custom Software',
    slug: 'custom-software',
    shortDescription:
      'Build software around specific business workflows and requirements.',
    icon: 'Code',
  },
  {
    title: 'Business Automation',
    slug: 'business-automation',
    shortDescription:
      'Reduce repetitive manual processes through practical automation.',
    icon: 'Zap',
  },
  {
    title: 'Digital Marketing & SEO',
    slug: 'digital-marketing',
    shortDescription:
      'Data-driven technical SEO, Google Search optimization, local search visibility, and digital growth for enterprises.',
    icon: 'BarChart',
  },
  {
    title: 'Technical Consulting',
    slug: 'technical-consulting',
    shortDescription:
      'Architecture, technology selection, existing-system analysis, feasibility, and technical problem solving.',
    icon: 'MessageSquare',
  },
] as const;

// ─── Process Steps ────────────────────────────────────────────

export const processSteps = [
  {
    number: '01',
    title: 'Understand',
    description:
      "Understand the customer's actual problem, users, workflow, and requirements.",
  },
  {
    number: '02',
    title: 'Analyze',
    description:
      'Identify technical dependencies, limitations, risks, and future challenges.',
  },
  {
    number: '03',
    title: 'Explain',
    description:
      'Explain recommendations, limitations, possible future problems, scope, and expected cost before development.',
  },
  {
    number: '04',
    title: 'Plan',
    description:
      'Define architecture, technology, scope, milestones, and implementation approach.',
  },
  {
    number: '05',
    title: 'Build',
    description:
      'Develop the agreed solution with quality, security, reliability, and maintainability in mind.',
  },
  {
    number: '06',
    title: 'Deliver',
    description:
      'Test, refine, document where appropriate, and deliver.',
  },
  {
    number: '07',
    title: 'Support',
    description:
      'Continue development and support based on customer requirements.',
  },
] as const;

// ─── Revenue Divisions & Mandals (SSOT) ───────────────────────

export interface RevenueDivision {
  name: string;
  district: string;
  mandals: string[];
}

export const revenueDivisions: Record<string, RevenueDivision> = {
  gurazala: {
    name: 'Gurazala Revenue Division',
    district: 'Palnadu District',
    mandals: ['Gurazala', 'Dachepalle', 'Durgi', 'Karempudi', 'Machavaram', 'Macherla', 'Piduguralla', 'Rentachintala', 'Veldurthi'],
  },
  narasaraopet: {
    name: 'Narasaraopet Revenue Division',
    district: 'Palnadu District',
    mandals: ['Narasaraopet', 'Bollapalle', 'Chilakaluripet', 'Edlapadu', 'Ipur', 'Nadendla', 'Nuzendla', 'Rompicherla', 'Savalyapuram', 'Vinukonda'],
  },
  sattenapalli: {
    name: 'Sattenapalli Revenue Division',
    district: 'Palnadu District',
    mandals: ['Sattenapalli', 'Amaravathi', 'Atchampet', 'Bellamkonda', 'Krosuru', 'Muppalla', 'Nekarikallu', 'Pedakurapadu', 'Rajupalem'],
  },
  guntur: {
    name: 'Guntur Revenue Division',
    district: 'Guntur District',
    mandals: ['Guntur East', 'Guntur West', 'Medikonduru', 'Pedakakani', 'Pedanandipadu', 'Phirangipuram', 'Prathipadu', 'Tadikonda', 'Thullur', 'Vatticherukuru'],
  },
  tenali: {
    name: 'Tenali Revenue Division',
    district: 'Guntur District',
    mandals: ['Tenali', 'Chebrolu', 'Duggirala', 'Kakumanu', 'Kollipara', 'Mangalagiri', 'Ponnur', 'Tadepalle'],
  },
};

// ─── Location Data (SSOT) ─────────────────────────────────────
// Genuine economic and commercial data for Palnadu, Guntur & surrounding hubs.
// Avoids doorway/duplicate pages by providing authentic local business context.

export interface LocationData {
  slug: string;
  name: string;
  district: string;
  revenueDivision?: string;
  surroundingMandals?: string[];
  tagline: string;
  economicProfile: string;
  keyIndustries: string[];
  commonPainPoints: string[];
  popularServices: string[];
  faq: { q: string; a: string }[];
}

export const coreLocations: LocationData[] = [
  {
    slug: 'guntur',
    name: 'Guntur',
    district: 'Guntur District',
    revenueDivision: 'Guntur & Tenali Revenue Divisions',
    surroundingMandals: [
      'Guntur East', 'Guntur West', 'Medikonduru', 'Pedakakani', 'Pedanandipadu',
      'Phirangipuram', 'Prathipadu', 'Tadikonda', 'Thullur', 'Vatticherukuru',
      'Tenali', 'Chebrolu', 'Duggirala', 'Mangalagiri', 'Ponnur', 'Tadepalle',
    ],
    tagline: 'Web Applications, Custom Software & Digital Transformation for Guntur Enterprises',
    economicProfile: 'As the commercial and agricultural powerhouse of coastal Andhra Pradesh, Guntur hosts Asia’s largest chili market yard, tobacco trading houses, major multi-speciality medical centers, and expanding educational institutions.',
    keyIndustries: [
      'Agricultural Spice & Grain Trading',
      'Private Hospitals & Diagnostic Centers',
      'Cotton & Textile Ginning',
      'Engineering Colleges & Schools',
      'Wholesale Consumer Goods Distribution',
    ],
    commonPainPoints: [
      'Inventory reconciliation between mandi yards, godowns, and head offices',
      'Unreliable desktop accounting software unable to sync with field billing reps',
      'Slow, bloated WordPress websites that crash during admissions or seasonal marketing campaigns',
    ],
    popularServices: [
      'Custom ERP & Inventory Management Web Apps',
      'Hospital Patient Portals & Appointment Engines',
      'High-Speed Next.js Corporate Websites',
      'B2B Wholesale Ordering Platforms',
    ],
    faq: [
      {
        q: 'Why should Guntur businesses choose custom software over ready-made accounting tools?',
        a: 'Off-the-shelf tools don’t fit regional mandi credit cycles, multiple dispatch godowns, or transport memo workflows. Custom software engineered by Palnadu.dev is built around your exact commercial workflow with 100% data ownership.',
      },
      {
        q: 'Can our sales team in Guntur use the system on their mobile phones?',
        a: 'Yes. All web applications and business portals built by Palnadu.dev are mobile-first, lightweight, and engineered to work reliably on standard 4G and 5G networks.',
      },
    ],
  },
  {
    slug: 'palnadu',
    name: 'Palnadu',
    district: 'Palnadu District',
    revenueDivision: 'Palnadu District (All Divisions)',
    surroundingMandals: [
      'Narasaraopet', 'Chilakaluripet', 'Sattenapalle', 'Vinukonda', 'Macherla',
      'Gurazala', 'Piduguralla', 'Dachepalle', 'Amaravathi', 'Karempudi',
    ],
    tagline: 'Software Engineering, Web Development & Business Automation Rooted in Palnadu',
    economicProfile: 'Formed as a dedicated district with Narasaraopet as its administrative center, Palnadu is an emerging economic corridor with rapid growth in agro-industries, limestone processing, educational campuses, and regional commerce.',
    keyIndustries: [
      'Agro-Processing & Seed Distribution',
      'Cotton Ginning & Trading',
      'Educational Institutions & Academies',
      'Healthcare & Specialty Clinics',
      'Local Merchant Retail',
    ],
    commonPainPoints: [
      'Reliance on paper books, WhatsApp chats, and Excel spreadsheets for critical business orders',
      'High fees paid to metropolitan IT agencies that don’t understand regional commercial realities',
      'Zero technical support when software breaks or staff turnover occurs',
    ],
    popularServices: [
      'Custom Business Management Software',
      'School & College Admissions Portals',
      'Local Business Websites with High-Speed Next.js',
      'Automated Billing & WhatsApp PDF Invoicing',
    ],
    faq: [
      {
        q: 'Where is Palnadu.dev based?',
        a: 'Palnadu.dev is headquartered in the Palnadu region. We work directly with business owners, founders, and institutions across Palnadu, Narasaraopet, Chilakaluripet, and surrounding regions.',
      },
      {
        q: 'How fast can a custom software MVP be launched?',
        a: 'We deliver focused, practical MVPs in rapid 3-to-6-week sprints so your business starts capturing value immediately without massive upfront capital expenditure.',
      },
    ],
  },
  {
    slug: 'narasaraopet',
    name: 'Narasaraopet',
    district: 'Palnadu District (Headquarters)',
    revenueDivision: 'Narasaraopet Revenue Division',
    surroundingMandals: [
      'Narasaraopet', 'Bollapalle', 'Chilakaluripet', 'Edlapadu', 'Ipur',
      'Nadendla', 'Nuzendla', 'Rompicherla', 'Savalyapuram', 'Vinukonda',
    ],
    tagline: 'Fast Websites, Educational Portals & Custom Software in Narasaraopet',
    economicProfile: 'The commercial and educational heart of Palnadu district, Narasaraopet connects surrounding agrarian and industrial centers with leading engineering colleges, healthcare clinics, and wholesale markets.',
    keyIndustries: [
      'Higher Education & Engineering Colleges',
      'Automotive Spares & Machinery',
      'Seed & Agro Inputs',
      'Speciality Hospitals & Diagnostics',
      'Retail Shopping Complexes',
    ],
    commonPainPoints: [
      'College websites that take 8+ seconds to load and fail on smartphones',
      'Manual student fee tracking and enquiry paperwork prone to human error',
      'Loss of local search visibility to competitors on Google Maps and regional searches',
    ],
    popularServices: [
      'Student Information Systems & College Portals',
      'Local SEO & Fast Business Websites',
      'Clinic Patient Scheduling Applications',
      'Automated Ledger & Invoicing Software',
    ],
    faq: [
      {
        q: 'Can Palnadu.dev redesign an existing slow college or school website in Narasaraopet?',
        a: 'Yes. We migrate fragile WordPress and PHP websites to sub-second Next.js edge platforms with online admission inquiries, photo galleries, and mobile-friendly speed.',
      },
    ],
  },
  {
    slug: 'chilakaluripet',
    name: 'Chilakaluripet',
    district: 'Palnadu District',
    revenueDivision: 'Narasaraopet Revenue Division',
    surroundingMandals: [
      'Chilakaluripet', 'Edlapadu', 'Nadendla', 'Purushothapatnam', 'Kavuru',
      'Gannavaram', 'Pasumarru', 'NH-16 Logistics Corridor',
    ],
    tagline: 'Transport Logistics, Commercial Software & Web Solutions in Chilakaluripet',
    economicProfile: 'Positioned on the NH-16 highway, Chilakaluripet is an essential transport, vehicle body building, and agricultural produce transit hub in Andhra Pradesh.',
    keyIndustries: [
      'Highway Transport & Fleet Logistics',
      'Commercial Auto Body Works',
      'Cotton & Tobacco Trading',
      'Cold Storage Operations',
      'Agri-Equipment Supply',
    ],
    commonPainPoints: [
      'Tracking vehicle maintenance, driver trip logs, and consignor billings across paper slips',
      'Cold storage bay occupancy tracking managed through prone-to-loss registers',
      'Lack of professional digital presence when pitching corporate logistics contracts',
    ],
    popularServices: [
      'Fleet & Trip Dispatch Tracking Web Apps',
      'Cold Storage Stock Allocation Software',
      'Professional Corporate Websites for Logistics Operators',
      'Automated WhatsApp LR / Consignment Slips',
    ],
    faq: [
      {
        q: 'Do you build custom fleet or lorry transport billing software?',
        a: 'Yes. We engineer customized web platforms that track trip advances, diesel consumption, freight bills, and transport memos with real-time phone access.',
      },
    ],
  },
  {
    slug: 'sattenapalle',
    name: 'Sattenapalle',
    district: 'Palnadu District',
    revenueDivision: 'Sattenapalli Revenue Division',
    surroundingMandals: [
      'Sattenapalli', 'Amaravathi', 'Atchampet', 'Bellamkonda', 'Krosuru',
      'Muppalla', 'Nekarikallu', 'Pedakurapadu', 'Rajupalem',
    ],
    tagline: 'Agri-Trading Software & Modern Web Development in Sattenapalle',
    economicProfile: 'A major railway junction and commercial trading town in Palnadu, Sattenapalle is famous for paddy, cotton, chili markets, and residential educational hubs.',
    keyIndustries: [
      'Paddy & Rice Mills',
      'Cotton Ginning',
      'Timber & Construction Materials',
      'Junior Colleges & Schools',
      'General Merchant Trade',
    ],
    commonPainPoints: [
      'Calculating dynamic moisture deductions and mill yields manually',
      'WhatsApp invoice disputes with wholesale purchasers in other districts',
    ],
    popularServices: [
      'Rice Mill & Ginning Inventory Applications',
      'Wholesale Billing Software with GST Reports',
      'High-Converting School & Business Websites',
    ],
    faq: [
      {
        q: 'Can we access our Sattenapalle mill software while traveling?',
        a: 'Yes. All systems are deployed to secure cloud servers with role-based logins for owners, managers, and clerks accessible from any device.',
      },
    ],
  },
  {
    slug: 'vinukonda',
    name: 'Vinukonda',
    district: 'Palnadu District',
    revenueDivision: 'Narasaraopet Revenue Division',
    surroundingMandals: [
      'Vinukonda', 'Bollapalle', 'Savalyapuram', 'Ipur', 'Nuzendla',
      'Kurichedu Border', 'Tripuranthakam Border',
    ],
    tagline: 'Custom Software & Web Application Development in Vinukonda',
    economicProfile: 'Situated on the Guntur-Guntakal railway route, Vinukonda serves as a vibrant trading bridge connecting Palnadu with Rayalaseema markets.',
    keyIndustries: [
      'Agricultural Commodity Trading',
      'Granite & Mining Quarry Supplies',
      'Retail Trade & Distribution',
      'Healthcare Facilities',
    ],
    commonPainPoints: [
      'Distance from big IT centers making it hard to get reliable software developers',
      'Overpaying for rigid metropolitan software that doesn’t work offline or on low bandwidth',
    ],
    popularServices: [
      'Quarry & Material Dispatch Web Software',
      'Mobile-Friendly Merchant Billing Systems',
      'SEO-Optimized Business Websites',
    ],
    faq: [
      {
        q: 'Does Palnadu.dev support businesses located in Vinukonda?',
        a: 'Yes. We are dedicated to empowering regional commercial businesses across Vinukonda with modern engineering and direct developer support.',
      },
    ],
  },
  {
    slug: 'macherla',
    name: 'Macherla',
    district: 'Palnadu District',
    revenueDivision: 'Gurazala Revenue Division',
    surroundingMandals: [
      'Macherla', 'Gurazala', 'Dachepalle', 'Durgi', 'Karempudi',
      'Machavaram', 'Piduguralla', 'Rentachintala', 'Veldurthi', 'Nagarjuna Sagar',
    ],
    tagline: 'Industrial, Cement & Commercial Technology Solutions in Macherla',
    economicProfile: 'Historically significant and industrially rich, Macherla borders the Nagarjuna Sagar project with thriving cement factories, limestone deposits, and tourism commerce.',
    keyIndustries: [
      'Cement & Mineral Ancillary Suppliers',
      'Tourism & Hospitality',
      'Heavy Transport & Mining Services',
      'Local Commercial Trading',
    ],
    commonPainPoints: [
      'Tracking weighbridge tickets and industrial supply contracts across disparate spreadsheets',
      'Outdated static websites that fail to attract modern commercial clients',
    ],
    popularServices: [
      'Contract & Gate Pass Management Software',
      'Hospitality & Hotel Web Platforms',
      'Industrial Supplier Corporate Websites',
    ],
    faq: [
      {
        q: 'Can we integrate weighbridge or gate entry records into our custom web portal?',
        a: 'Yes. We build APIs and data ingestion connectors that sync gate passes, weigh slips, and vendor invoices into your centralized dashboard.',
      },
    ],
  },
];

// ─── Sitemap Pages (SSOT) ─────────────────────────────────────
// Every public page must be registered here.
// sitemap.ts, canonical URLs, and future audits all read from this list.
// When you add a new page, add it here — everything else is automatic.

export interface SitemapPage {
  /** Route path relative to site root, e.g. '/about' (use '' for homepage) */
  path: string;
  /** How often the content changes */
  changeFrequency: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never';
  /** Priority 0.0 – 1.0 */
  priority: number;
}

export const sitemapPages: SitemapPage[] = [
  // ── Core ──
  { path: '',            changeFrequency: 'weekly',  priority: 1.0 },
  { path: '/about',      changeFrequency: 'monthly', priority: 0.7 },
  { path: '/services',   changeFrequency: 'monthly', priority: 0.9 },
  { path: '/work',       changeFrequency: 'monthly', priority: 0.7 },
  { path: '/blog',       changeFrequency: 'weekly',  priority: 0.8 },
  { path: '/contact',    changeFrequency: 'monthly', priority: 0.7 },
  // ── SEO / Local Directory ──
  { path: '/industries', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/locations',  changeFrequency: 'monthly', priority: 0.7 },
  // ── Core Location Hubs (Genuine Topical Authority) ──
  { path: '/locations/guntur',         changeFrequency: 'monthly', priority: 0.8 },
  { path: '/locations/palnadu',        changeFrequency: 'monthly', priority: 0.8 },
  { path: '/locations/narasaraopet',   changeFrequency: 'monthly', priority: 0.8 },
  { path: '/locations/chilakaluripet', changeFrequency: 'monthly', priority: 0.7 },
  { path: '/locations/sattenapalle',   changeFrequency: 'monthly', priority: 0.7 },
  { path: '/locations/vinukonda',      changeFrequency: 'monthly', priority: 0.7 },
  { path: '/locations/macherla',       changeFrequency: 'monthly', priority: 0.7 },
  // ── Legal ──
  { path: '/privacy',    changeFrequency: 'yearly',  priority: 0.3 },
  { path: '/terms',      changeFrequency: 'yearly',  priority: 0.3 },
];

// ─── Admin Navigation ─────────────────────────────────────────

export const adminNavItems: NavItem[] = [
  { title: 'Dashboard', href: '/admin/dashboard' },
  { title: 'Leads', href: '/admin/leads' },
  { title: 'Clients', href: '/admin/clients' },
  { title: 'Projects', href: '/admin/projects' },
  { title: 'Services', href: '/admin/services' },
  { title: 'Case Studies', href: '/admin/case-studies' },
  { title: 'Blog', href: '/admin/blog' },
  { title: 'Media', href: '/admin/media' },
  { title: 'Users', href: '/admin/users' },
  { title: 'Settings', href: '/admin/settings' },
];
