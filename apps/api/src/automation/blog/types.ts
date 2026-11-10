import { BlogLanguage, PublishStatus, TopicStatus } from '@prisma/client';
import { SearchIntent } from '../topic-identity';

export interface GenerationResult {
  id: string;
  title: string;
  slug: string;
  category: string;
  status: PublishStatus;
  wordCount: number;
  imagesCount: number;
  url: string;
  topicKey: string;
}

/** A topic offered to the queue, before dedup is applied. */
export interface QueueCandidate {
  categorySlug: string;
  topic: string;
  targetLocation?: string;
  searchIntent?: SearchIntent;
  primaryKeyword?: string;
  keywords?: string[];
  referenceSources?: string[];
  source: 'curated-rotation' | 'matrix' | 'discovery' | 'manual';
  language?: BlogLanguage;
}

/** A queue row leased by one worker for the duration of a generation attempt. */
export type ClaimedTopic = {
  id: string;
  topicKey: string;
  topic: string;
  categorySlug: string;
  targetLocation: string | null;
  referenceSources: string[];
  status: TopicStatus;
  language: BlogLanguage;
  attempts?: number;
  primaryKeyword?: string | null;
  keywords?: string[];
  searchIntent?: string | null;
};

/** Why a candidate topic was not turned into a post. */
export type RejectionReason =
  | 'already_generated'
  | 'similar_to_existing'
  | 'validation_failed'
  | 'generation_failed'
  | 'no_category';

export interface RejectedTopic {
  topicKey: string;
  topic: string;
  reason: RejectionReason;
  detail: string;
}

export const CURATED_TOPIC_QUEUE = [
  {
    categorySlug: 'startups',
    topic: 'How to Build a SaaS Product in Guntur and Scale Nationally',
    targetLocation: 'Guntur and Palnadu, Andhra Pradesh',
  },
  {
    categorySlug: 'website-development',
    topic: 'Next.js vs Traditional PHP: Why Modern Businesses Are Upgrading in 2026',
    targetLocation: 'Andhra Pradesh',
  },
  {
    categorySlug: 'app-development',
    topic: 'Android and iOS App Development for Retail and Wholesale Businesses in Guntur',
    targetLocation: 'Guntur and Vijayawada',
  },
  {
    categorySlug: 'school-websites',
    topic: 'How Digital Admissions and Fee Portals Save 20+ Hours for Schools in Palnadu',
    targetLocation: 'Narasaraopet and Palnadu District',
  },
  {
    categorySlug: 'local-seo-business',
    topic: 'How to Get Your Guntur and Palnadu Business Found on Google (Local SEO Playbook)',
    targetLocation: 'Palnadu and Guntur',
  },
  {
    categorySlug: 'website-development',
    topic: 'Affordable Website Development for Small Businesses in Palnadu Without Hidden Costs',
    targetLocation: 'Palnadu District',
  },
  {
    categorySlug: 'app-development',
    topic: 'Progressive Web Apps vs Native Apps: Which Delivers Highest ROI for Regional Traders?',
    targetLocation: 'Chilakaluripet and Guntur',
  },
  {
    categorySlug: 'startups',
    topic: 'From Idea to MVP: A Step-by-Step Technical Guide for Andhra Pradesh Entrepreneurs',
    targetLocation: 'Andhra Pradesh',
  },
  {
    categorySlug: 'startups',
    topic: 'Startup MVP and Web Application Development: Essential Guide for New Businesses in Andhra Pradesh',
    targetLocation: 'Andhra Pradesh',
  },
  {
    categorySlug: 'website-development',
    topic: 'Why Retail Shops and Wholesale Traders in Chilakaluripet Need Custom Billing and POS Software',
    targetLocation: 'Chilakaluripet and NH-16 Corridor',
  },
  {
    categorySlug: 'app-development',
    topic: 'Building Mobile Apps and Online Storefronts for Wholesale Rice and Cotton Merchants in Sattenapalli',
    targetLocation: 'Sattenapalli and Palnadu',
  },
  {
    categorySlug: 'website-development',
    topic: 'How Hospital and Clinic Management Software Streamlines Patient Appointments in Guntur',
    targetLocation: 'Guntur and Coastal Andhra',
  },
  {
    categorySlug: 'local-seo-business',
    topic: 'Affordable Business Websites and Local Google Maps SEO for Growing Enterprises in Vinukonda',
    targetLocation: 'Vinukonda and Palnadu',
  },
  {
    categorySlug: 'website-development',
    topic: 'Weighbridge, Gate Pass, and Logistics Dispatch Software for Industrial Enterprises in Macherla',
    targetLocation: 'Macherla and Nagarjuna Sagar',
  },
  {
    categorySlug: 'startups',
    topic: 'From Idea to Scalable Web Platform: Tech Stack Guide for Startups in Tenali and Mangalagiri',
    targetLocation: 'Tenali, Mangalagiri, and Guntur',
  },
  {
    categorySlug: 'website-development',
    topic: 'Why Medical Shops and Pharmacies in Palnadu Are Upgrading to Cloud Billing Software in 2026',
    targetLocation: 'Palnadu and Narasaraopet',
  },
  {
    categorySlug: 'startups',
    topic: 'Digital Solutions for New Businesses: How Entrepreneurs in Palnadu Launch Modern Tech Platforms',
    targetLocation: 'Palnadu and Guntur',
  },
];
