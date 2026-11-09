// ─── Site Configuration (SSOT) ──────────────────────────────────────

export const siteConfig = {
  name: 'Palnadu.dev',
  brandName: 'Palnadu.dev',
  title: 'Palnadu.dev — Web Developer & Software Development Studio in Palnadu',
  description:
    'Palnadu.dev is a web development and custom software engineering studio in Palnadu. We build high-performance websites, web applications, and mobile apps for regional businesses in Narasaraopet, Guntur, and Andhra Pradesh.',
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

// ─── Services Data ────────────────────────────────────────────

export const services = [
  {
    title: 'Website Development & Design',
    slug: 'website-development',
    shortDescription:
      'High-performance corporate websites, modern web design, school platforms, and institutional portals engineered with Next.js.',
    icon: 'Globe',
  },
  {
    title: 'Web Applications & Full-Stack Development',
    slug: 'web-development',
    shortDescription:
      'Build scalable web applications, full-stack portals, SaaS platforms, and custom business dashboards.',
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

// ─── String Utilities ─────────────────────────────────────────

/**
 * Normalizes text into a clean URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_]+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-/, '')
    .replace(/-$/, '');
}
