// ─── Site Configuration (SSOT) ──────────────────────────────────────

export const siteConfig = {
  name: 'Palnadu.dev',
  brandName: 'Palnadu.dev',
  title: 'Palnadu.dev | Web Development, Software & Digital Marketing Studio',
  description:
    'Palnadu.dev is a technology, software engineering, and advanced digital growth studio in Palnadu. We engineer high-performance websites, custom web applications, mobile apps, software testing, SEO, AEO, GEO, and real-time practical training for businesses in Narasaraopet, Guntur, and Andhra Pradesh.',
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
    whatsapp: '+91-9030787819',
    whatsappDestination: 'https://wa.me/919030787819',
    whatsappUrl:
      'https://wa.me/919030787819?text=Hello%20Palnadu.dev%2C%20I%20would%20like%20to%20discuss%20a%20project',
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
    title: 'Website Development & UI/UX Design',
    slug: 'website-development',
    shortDescription:
      'High-performance corporate websites, modern UI/UX design, school platforms, and institutional portals engineered with Next.js.',
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
    title: 'Custom Software Engineering',
    slug: 'custom-software',
    shortDescription:
      'Custom software engineering built around specific business operations, godown workflows, and inventory systems.',
    icon: 'Code',
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
    title: 'Advanced Digital Marketing & Content Strategy',
    slug: 'digital-marketing',
    shortDescription:
      'Data-driven digital marketing, content strategy, brand authority building, and high-converting acquisition funnels.',
    icon: 'BarChart',
  },
  {
    title: 'Technical SEO, AEO & GEO',
    slug: 'seo-aeo-geo',
    shortDescription:
      'Technical SEO, Local Google Maps optimization, Answer Engine Optimization (AEO), and Generative Engine Optimization (GEO).',
    icon: 'Search',
  },
  {
    title: 'Software Testing & Quality Assurance',
    slug: 'software-testing-qa',
    shortDescription:
      'Automated and manual testing, performance benchmarking, security audits, and end-to-end quality assurance.',
    icon: 'CheckSquare',
  },
  {
    title: 'Real-Time Practical Software & Digital Training',
    slug: 'practical-training',
    shortDescription:
      'Hands-on practical training in web development, software engineering, UI/UX design, QA testing, and digital marketing.',
    icon: 'GraduationCap',
  },
  {
    title: 'Business Automation',
    slug: 'business-automation',
    shortDescription:
      'Reduce repetitive manual processes through practical automation.',
    icon: 'Zap',
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
