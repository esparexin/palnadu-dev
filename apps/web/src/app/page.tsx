import { ScrollGlobe } from '@/components/ui/landing-page';
import { siteConfig } from '@palnadu/config';

// Comprehensive Google SEO Structured Data (JSON-LD)
function JsonLd() {
  const professionalServiceSchema = {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    name: 'Palnadu.dev',
    url: siteConfig.url,
    logo: `${siteConfig.url}/footer_header-logo.png`,
    image: `${siteConfig.url}/og.png`,
    description: siteConfig.description,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: '₹₹ / $$',
    address: {
      '@type': 'PostalAddress',
      addressRegion: 'Andhra Pradesh',
      addressCountry: 'IN',
      addressLocality: 'Palnadu',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 16.2359,
      longitude: 80.0499,
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Palnadu' },
      { '@type': 'Country', name: 'India' },
      { '@type': 'Country', name: 'United States' },
      { '@type': 'Country', name: 'Worldwide' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.contact.email,
      contactType: 'customer service',
      availableLanguage: ['English', 'Telugu'],
    },
    sameAs: [siteConfig.links.github, siteConfig.links.twitter, siteConfig.links.linkedin],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'Palnadu.dev',
    url: siteConfig.url,
    description: siteConfig.description,
    publisher: {
      '@type': 'Organization',
      name: 'Palnadu.dev',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What does Palnadu.dev specialize in?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Palnadu.dev is a problem-first software studio specializing in web applications, mobile apps, custom business software, startup MVP development, business automation, and technical consulting.',
        },
      },
      {
        '@type': 'Question',
        name: 'What does "Start with the problem" mean?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Instead of pushing unnecessary frameworks or features, we diagnose what is broken in your workflow or idea first. We evaluate feasibility, limitations, and future costs before writing any code.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(professionalServiceSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

const palnaduHomeSections = [
  {
    id: "hero",
    badge: "Problem-First Studio",
    title: "Start With The Problem.",
    subtitle: "We Build The Solution.",
    description: "Palnadu.dev turns real-world challenges into practical, production-ready software. We validate ideas, eliminate manual business bottlenecks, and engineer what works.",
    align: "left" as const,
    actions: [
      { label: "Discuss Your Idea", variant: "primary" as const, href: "/contact" },
      { label: "Explore Services", variant: "secondary" as const, href: "/services" },
    ],
  },
  {
    id: "methodology",
    badge: "Standards",
    title: "Truth Before Code",
    description: "Before writing software, we diagnose where work gets stuck. We look at API dependencies, scalability risks, and realistic costs upfront. If a simple existing tool solves your problem, we tell you directly.",
    align: "center" as const,
  },
  {
    id: "capabilities",
    badge: "Capabilities",
    title: "Practical Engineering",
    subtitle: "Built Around Your Operations",
    description: "Software tailored to your actual business operations — eliminating messy spreadsheets, manual paper logs, and rigid off-the-shelf software.",
    align: "left" as const,
    features: [
      { title: "Web Applications", description: "Fast, reliable SaaS, internal management portals, and customer dashboards." },
      { title: "Mobile Applications", description: "iOS and Android apps designed for everyday field and business workflows." },
      { title: "Business Automation", description: "Connect orders, inventory, notifications, and repetitive manual tasks." },
    ],
  },
  {
    id: "cta",
    badge: "Get Started",
    title: "Ready To Build What Works?",
    subtitle: "Direct Access To Engineers",
    description: "Work directly with the software developers building your solution. Fixed price boundaries, honest engineering advice, and 100% code ownership.",
    align: "center" as const,
    actions: [
      { label: "Tell Us What You Want To Build", variant: "primary" as const, href: "/contact" },
      { label: "View All Services", variant: "secondary" as const, href: "/services" },
    ],
  },
];

export default function HomePage() {
  return (
    <>
      <JsonLd />
      <h1 className="sr-only">
        Palnadu.dev — Problem-First Software Studio, Web Applications & Development in Palnadu and Guntur
      </h1>
      <ScrollGlobe />
    </>
  );
}
