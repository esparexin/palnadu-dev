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
  {
    title: 'Services',
    href: '/services',
    children: [
      {
        title: 'Idea Validation',
        href: '/services/idea-validation',
        description: 'Validate your idea before building',
      },
      {
        title: 'Web Applications',
        href: '/services/web-development',
        description: 'Business platforms, SaaS, and custom web apps',
      },
      {
        title: 'Mobile Applications',
        href: '/services/mobile-app-development',
        description: 'iOS, Android, and cross-platform apps',
      },
      {
        title: 'MVP Development',
        href: '/services/mvp-development',
        description: 'Launch your minimum viable product',
      },
      {
        title: 'Custom Software',
        href: '/services/custom-software',
        description: 'Software built around your business',
      },
      {
        title: 'Business Automation',
        href: '/services/business-automation',
        description: 'Reduce manual processes with automation',
      },
      {
        title: 'Technical Consulting',
        href: '/services/technical-consulting',
        description: 'Architecture, feasibility, and tech guidance',
      },
    ],
  },
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
