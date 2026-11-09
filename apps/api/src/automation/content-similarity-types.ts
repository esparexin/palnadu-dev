import type { SearchIntent } from './seo-strategy';

export interface ExistingArticle {
  id: string;
  topicKey: string | null;
  title: string;
  slug: string;
  topic?: string | null;
  primaryKeyword?: string | null;
  secondaryKeywords: string[];
  searchIntent?: string | null;
  content: string;
  language?: string | null;
}

export interface SimilarityInput {
  topic: string;
  title?: string;
  slug?: string;
  primaryKeyword?: string;
  secondaryKeywords?: string[];
  searchIntent?: SearchIntent | string | null;
  content?: string;
  language?: string | null;
}

export interface SimilarityMatch {
  postId: string;
  title: string;
  slug: string;
  score: number;
  reasons: string[];
}

export interface SimilarityResult {
  nearest: SimilarityMatch | null;
  isDuplicate: boolean;
  matches: SimilarityMatch[];
}

export interface SimilarityThresholds {
  topicOverlap: number;
  contentSimilarity: number;
  keywordOverlap: number;
}

export const DEFAULT_THRESHOLDS: SimilarityThresholds = {
  topicOverlap: 0.7,
  contentSimilarity: 0.55,
  keywordOverlap: 0.75,
};
