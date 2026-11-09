import { PublishStatus } from './enums';
import { User } from './entities';

export type BlogLanguage = 'en' | 'te';

export interface BlogPostTranslation {
  id: string;
  slug: string;
  language: BlogLanguage;
  title: string;
}

export interface BlogCategory {
  id: string;
  name: string;
  slug: string;
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BlogPost {
  id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content: string;
  coverImage?: string;
  categoryId?: string;
  category?: BlogCategory;
  authorId: string;
  author?: User;
  seoTitle?: string;
  seoDescription?: string;
  canonicalUrl?: string;
  ogImage?: string;
  publishDate?: string;
  status: PublishStatus;
  language: BlogLanguage;
  topicKey?: string;
  translationGroupId?: string;
  translations?: BlogPostTranslation[];
  createdAt: string;
  updatedAt: string;
}

export type TopicStatus = 'PENDING' | 'CLAIMED' | 'COMPLETED' | 'FAILED';

export interface BlogTopic {
  id: string;
  topicKey: string;
  topic: string;
  language: BlogLanguage;
  categorySlug: string;
  targetLocation?: string | null;
  searchIntent?: string | null;
  primaryKeyword?: string | null;
  keywords: string[];
  referenceSources: string[];
  status: TopicStatus;
  attempts: number;
  lastError?: string | null;
  nextRetryAt?: string | null;
  claimedAt?: string | null;
  claimedBy?: string | null;
  postId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AutomationReferenceSource {
  source: string;
  availability: 'ready' | 'unconfigured' | 'error';
  note?: string;
}

export interface AutomationStatistics {
  totalPosts: number;
  draftPosts: number;
  publishedPosts: number;
  archivedPosts: number;
  queuePending: number;
  queueCompleted: number;
  queueInFlight: number;
  queueFailed: number;
}

export interface AutomationCoverage {
  topicsCovered: number;
  keywordsCovered: number;
  intentsCovered: Record<string, number>;
}

export interface AutomationStatus {
  engineStatus: string;
  schedule: string;
  autoPublishEnabled: boolean;
  referenceSources: AutomationReferenceSource[];
  statistics: AutomationStatistics;
  coverage: AutomationCoverage;
  upcomingQueue: BlogTopic[];
}

export interface BilingualQuota {
  te: number;
  en: number;
}

export interface BilingualConfig {
  enabled: boolean;
  quota: BilingualQuota;
}

export interface BilingualStatus extends BilingualConfig {
  pending: {
    te: number;
    en: number;
  };
}
