// ─── Color Palette & Media (SSOT) ────────────────────────────
export * from './colors';
export * from './media';

// ─── Site Configuration ───────────────────────────────────────

export const siteConfig = {
  name: 'Palnadu.dev',
  title: 'Palnadu.dev — Start with the problem. We build the solution.',
  description:
    'Palnadu.dev helps startups, businesses, and individuals turn real-world problems and ideas into practical digital solutions.',
  url: 'https://palnadu.dev',
  ogImage: 'https://palnadu.dev/og.png',
  creator: 'Palnadu.dev',
  keywords: [
    'software development',
    'web development',
    'mobile app development',
    'custom software',
    'MVP development',
    'startup technology partner',
    'SaaS development',
    'business automation',
    'technical consulting',
    'Palnadu',
  ],
  links: {
    github: 'https://github.com/palnadudev',
    twitter: 'https://twitter.com/palnadudev',
    linkedin: 'https://linkedin.com/company/palnadudev',
  },
  contact: {
    email: 'hello@palnadu.dev',
    phone: '',
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
    { title: 'Idea Validation', href: '/services/idea-validation' },
    { title: 'Web Applications', href: '/services/web-development' },
    { title: 'Mobile Applications', href: '/services/mobile-app-development' },
    { title: 'MVP Development', href: '/services/mvp-development' },
    { title: 'Custom Software', href: '/services/custom-software' },
    { title: 'Business Automation', href: '/services/business-automation' },
    { title: 'Technical Consulting', href: '/services/technical-consulting' },
  ],
  company: [
    { title: 'About', href: '/about' },
    { title: 'Work', href: '/work' },
    { title: 'Blog', href: '/blog' },
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
    title: 'Idea Validation',
    slug: 'idea-validation',
    shortDescription:
      'Validate the problem, customer, competition, market opportunity, feasibility, and MVP direction.',
    icon: 'Lightbulb',
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
  // ── SEO / Local ──
  { path: '/industries', changeFrequency: 'monthly', priority: 0.6 },
  { path: '/locations',  changeFrequency: 'monthly', priority: 0.6 },
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
