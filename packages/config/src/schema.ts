import { siteConfig } from './index';

/**
 * Authoritative Organization Schema for Palnadu.dev
 * Used as the single source of truth for Knowledge Graph identity.
 */
export function getOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
    legalName: 'Palnadu.dev',
    url: siteConfig.url,
    logo: {
      '@type': 'ImageObject',
      '@id': `${siteConfig.url}/#logo`,
      url: `${siteConfig.url}/logo.png`,
      caption: 'Palnadu.dev — Technology & Digital Solutions',
    },
    image: `${siteConfig.url}/og.png`,
    description: siteConfig.description,
    email: siteConfig.contact.email,
    telephone: siteConfig.contact.phone,
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Main Road, Near Municipal Office',
      addressLocality: 'Macherla',
      addressRegion: 'Andhra Pradesh',
      postalCode: '522426',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 16.4807,
      longitude: 79.2965,
    },
    sameAs: [
      siteConfig.links.github,
      siteConfig.links.twitter,
      siteConfig.links.linkedin,
    ],
    knowsAbout: [
      'Website Development',
      'Website Design & UI/UX',
      'Web Application Development',
      'Full-Stack Development',
      'Custom Software Engineering',
      'Android Application Development',
      'iOS Application Development',
      'Advanced Digital Marketing',
      'Content Strategy & Digital Growth',
      'Technical SEO & Local SEO',
      'Answer Engine Optimization (AEO)',
      'Generative Engine Optimization (GEO)',
      'Digital Entity Building & Brand Authority',
      'Web Application & Website Testing',
      'Software Quality Assurance',
      'Real-Time Practical Software Training',
      'Business Automation',
      'Technical Consulting',
      'Minimum Viable Product (MVP) Development',
    ],
  };
}

/**
 * Authoritative ProfessionalService (LocalBusiness) schema generator
 */
export function getProfessionalServiceSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'ProfessionalService',
    '@id': `${siteConfig.url}/#service`,
    name: siteConfig.name,
    url: siteConfig.url,
    parentOrganization: getOrganizationRef(),
    logo: `${siteConfig.url}/logo.png`,
    image: `${siteConfig.url}/og.png`,
    description: siteConfig.description,
    telephone: siteConfig.contact.phone,
    email: siteConfig.contact.email,
    priceRange: '₹₹ / $$',
    currenciesAccepted: 'INR, USD',
    paymentAccepted: 'Cash, Credit Card, Bank Transfer, UPI',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Technology, Software & Digital Services',
      itemListElement: [
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Website Development & UI/UX Design' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Web Applications & Full-Stack Development' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Custom Software Engineering' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Mobile Applications' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Advanced Digital Marketing & Content Strategy' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Technical SEO, AEO & GEO' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Software Testing & Quality Assurance' } },
        { '@type': 'Offer', itemOffered: { '@type': 'Service', name: 'Real-Time Practical Software & Digital Training' } },
      ],
    },
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: [
          'Monday',
          'Tuesday',
          'Wednesday',
          'Thursday',
          'Friday',
          'Saturday',
        ],
        opens: '09:00',
        closes: '19:00',
      },
    ],
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Main Road, Near Municipal Office',
      addressLocality: 'Macherla',
      addressRegion: 'Andhra Pradesh',
      postalCode: '522426',
      addressCountry: 'IN',
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 16.4807,
      longitude: 79.2965,
    },
    areaServed: [
      { '@type': 'AdministrativeArea', name: 'Palnadu District' },
      { '@type': 'AdministrativeArea', name: 'Narasaraopet' },
      { '@type': 'AdministrativeArea', name: 'Guntur' },
      { '@type': 'AdministrativeArea', name: 'Chilakaluripet' },
      { '@type': 'AdministrativeArea', name: 'Sattenapalle' },
      { '@type': 'AdministrativeArea', name: 'Vinukonda' },
      { '@type': 'AdministrativeArea', name: 'Macherla' },
      { '@type': 'AdministrativeArea', name: 'Andhra Pradesh' },
      { '@type': 'Country', name: 'India' },
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      email: siteConfig.contact.email,
      telephone: siteConfig.contact.phone,
      contactType: 'customer service',
      availableLanguage: ['English', 'Telugu'],
    },
    sameAs: [siteConfig.links.github, siteConfig.links.twitter, siteConfig.links.linkedin],
  };
}

/**
 * Lightweight reference pointer to the authoritative Organization entity
 */
export function getOrganizationRef() {
  return {
    '@type': 'Organization',
    '@id': `${siteConfig.url}/#organization`,
    name: siteConfig.name,
  };
}

/**
 * Authoritative WebSite Schema linking publisher to #organization
 */
export function getWebsiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': `${siteConfig.url}/#website`,
    url: siteConfig.url,
    name: siteConfig.name,
    description: siteConfig.description,
    publisher: getOrganizationRef(),
  };
}

/**
 * BreadcrumbList schema generator
 */
export function getBreadcrumbSchema(items: { name: string; path: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteConfig.url}${item.path}`,
    })),
  };
}
