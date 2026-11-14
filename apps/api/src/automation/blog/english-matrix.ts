import type { BlogLanguage } from '@prisma/client';
import { CURATED_TOPIC_QUEUE, type QueueCandidate } from './types';
import { toTopicKey } from '../topic-identity';

type CuratedSeedEntry = Omit<QueueCandidate, 'source'>;

const EN_LANG = 'en' as BlogLanguage;

/**
 * Extended regional English seeds across Palnadu, Guntur, and Andhra Pradesh
 * providing sustainable topic supply beyond the initial 17 seeds across all 5 categories.
 */
export const EXTENDED_ENGLISH_SEEDS: readonly CuratedSeedEntry[] = [
  // Website Development
  {
    categorySlug: 'website-development',
    language: EN_LANG,
    topic: 'Cloud POS and Inventory Management Web Apps for Wholesalers in Chilakaluripet',
    targetLocation: 'Chilakaluripet, Palnadu, Andhra Pradesh',
    primaryKeyword: 'cloud pos inventory chilakaluripet',
  },
  {
    categorySlug: 'website-development',
    language: EN_LANG,
    topic: 'Multi-Chamber Cold Storage Stock and Commodity Dispatch Systems in Tenali',
    targetLocation: 'Tenali, Guntur, Andhra Pradesh',
    primaryKeyword: 'cold storage stock systems tenali',
  },
  {
    categorySlug: 'website-development',
    language: EN_LANG,
    topic: 'How Hospital and Diagnostic Patient Portals Reduce Lobby Wait Times in Guntur',
    targetLocation: 'Guntur, Andhra Pradesh',
    primaryKeyword: 'hospital patient portal guntur',
  },
  {
    categorySlug: 'website-development',
    language: EN_LANG,
    topic: 'Weighbridge Gate Pass and Fleet Dispatch Automation for Macherla Industrial Units',
    targetLocation: 'Macherla, Palnadu, Andhra Pradesh',
    primaryKeyword: 'weighbridge gate pass software macherla',
  },
  {
    categorySlug: 'website-development',
    language: EN_LANG,
    topic: 'Modernizing Kirana and Retail Billing Systems with Fast Thermal Printing in Vinukonda',
    targetLocation: 'Vinukonda, Palnadu, Andhra Pradesh',
    primaryKeyword: 'kirana retail billing vinukonda',
  },
  {
    categorySlug: 'website-development',
    language: EN_LANG,
    topic: 'B2B Wholesale Ordering Web Portals for Agro-Traders in Sattenapalle',
    targetLocation: 'Sattenapalle, Palnadu, Andhra Pradesh',
    primaryKeyword: 'b2b wholesale portal sattenapalle',
  },
  // App Development
  {
    categorySlug: 'app-development',
    language: EN_LANG,
    topic: 'Field Sales and Delivery Agent Tracking Mobile Apps for Narasaraopet Distributors',
    targetLocation: 'Narasaraopet, Palnadu, Andhra Pradesh',
    primaryKeyword: 'field sales tracking app narasaraopet',
  },
  {
    categorySlug: 'app-development',
    language: EN_LANG,
    topic: 'Cotton and Chilli Commodity Trading Mobile Apps for Merchants in Guntur and Chilakaluripet',
    targetLocation: 'Guntur and Chilakaluripet, Andhra Pradesh',
    primaryKeyword: 'chilli trading mobile app guntur',
  },
  {
    categorySlug: 'app-development',
    language: EN_LANG,
    topic: 'Direct Customer Ordering Mobile Apps for Handloom Weavers in Mangalagiri',
    targetLocation: 'Mangalagiri, Guntur, Andhra Pradesh',
    primaryKeyword: 'handloom ordering app mangalagiri',
  },
  {
    categorySlug: 'app-development',
    language: EN_LANG,
    topic: 'Progressive Web Apps vs Native Android Apps: Cost and ROI for Vijayawada Retailers',
    targetLocation: 'Vijayawada, Andhra Pradesh',
    primaryKeyword: 'pwa vs native app vijayawada',
  },
  // School Websites
  {
    categorySlug: 'school-websites',
    language: EN_LANG,
    topic: 'How Online Admission and Fee Portals Streamline Operations for Narasaraopet Schools',
    targetLocation: 'Narasaraopet, Palnadu, Andhra Pradesh',
    primaryKeyword: 'school admission portal narasaraopet',
  },
  {
    categorySlug: 'school-websites',
    language: EN_LANG,
    topic: 'Student Attendance and WhatsApp Grade Notification Portals for Colleges in Sattenapalle',
    targetLocation: 'Sattenapalle, Palnadu, Andhra Pradesh',
    primaryKeyword: 'college attendance notification portal sattenapalle',
  },
  {
    categorySlug: 'school-websites',
    language: EN_LANG,
    topic: 'Automated Fee Reconciliation and UPI Receipts for Private Schools in Guntur',
    targetLocation: 'Guntur, Andhra Pradesh',
    primaryKeyword: 'school fee reconciliation guntur',
  },
  {
    categorySlug: 'school-websites',
    language: EN_LANG,
    topic: 'Digital Student Portals and Parent Dashboards for Institutions in Tenali',
    targetLocation: 'Tenali, Guntur, Andhra Pradesh',
    primaryKeyword: 'student parent dashboard tenali',
  },
  // Startups & MVPs
  {
    categorySlug: 'startups',
    language: EN_LANG,
    topic: 'How to Build and Launch a Minimum Viable Product in Andhra Pradesh (Technical Playbook)',
    targetLocation: 'Andhra Pradesh',
    primaryKeyword: 'launch mvp andhra pradesh',
  },
  {
    categorySlug: 'startups',
    language: EN_LANG,
    topic: 'Next.js and Cloud Database Architectures for Scalable SaaS Startups in Vijayawada',
    targetLocation: 'Vijayawada, Andhra Pradesh',
    primaryKeyword: 'saas architecture vijayawada',
  },
  {
    categorySlug: 'startups',
    language: EN_LANG,
    topic: 'Product Launch Timelines and Cost Estimation for Early-Stage Startups in Amaravati',
    targetLocation: 'Amaravati, Andhra Pradesh',
    primaryKeyword: 'startup cost estimation amaravati',
  },
  // Local SEO & Business
  {
    categorySlug: 'local-seo-business',
    language: EN_LANG,
    topic: 'How Local Businesses in Vinukonda Can Rank #1 on Google Maps Search',
    targetLocation: 'Vinukonda, Palnadu, Andhra Pradesh',
    primaryKeyword: 'rank google maps vinukonda',
  },
  {
    categorySlug: 'local-seo-business',
    language: EN_LANG,
    topic: 'Local SEO vs Google Ads: Highest ROI Strategy for Enterprises in Narasaraopet',
    targetLocation: 'Narasaraopet, Palnadu, Andhra Pradesh',
    primaryKeyword: 'local seo vs google ads narasaraopet',
  },
  {
    categorySlug: 'local-seo-business',
    language: EN_LANG,
    topic: 'Google Business Profile Optimization and Review Automation for Guntur Clinics',
    targetLocation: 'Guntur, Andhra Pradesh',
    primaryKeyword: 'google business profile guntur',
  },
  {
    categorySlug: 'local-seo-business',
    language: EN_LANG,
    topic: 'Hyperlocal SEO Strategies for Tourism and Hospitality Businesses in Bapatla',
    targetLocation: 'Bapatla, Andhra Pradesh',
    primaryKeyword: 'hyperlocal seo bapatla',
  },
];

/** Returns all curated and extended regional English seeds with deduplication against existing topicKeys. */
export function getAllEnglishSeeds(excludeKeys: Set<string> = new Set()): QueueCandidate[] {
  const seenKeys = new Set<string>();
  const candidates: QueueCandidate[] = [];

  const allSeeds = [...CURATED_TOPIC_QUEUE, ...EXTENDED_ENGLISH_SEEDS];

  for (const seed of allSeeds) {
    const key = toTopicKey(seed.topic);
    const compoundKey = `${key}::en`;
    if (!key || excludeKeys.has(compoundKey) || excludeKeys.has(key) || seenKeys.has(key)) {
      continue;
    }
    seenKeys.add(key);
    candidates.push({
      ...seed,
      language: EN_LANG,
      source: 'curated-rotation',
    });
  }

  return candidates;
}
