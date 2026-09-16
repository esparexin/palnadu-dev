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
      addressLocality: 'Palnadu',
      addressRegion: 'Andhra Pradesh',
      addressCountry: 'IN',
    },
    sameAs: [
      siteConfig.links.github,
      siteConfig.links.twitter,
      siteConfig.links.linkedin,
    ],
    knowsAbout: [
      'Website Development',
      'Web Application Development',
      'Android Application Development',
      'iOS Application Development',
      'Business Automation',
      'Digital Marketing',
      'Technical Consulting',
      'Minimum Viable Product (MVP) Development',
    ],
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
