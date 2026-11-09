import type { GeneratedBlogDraft } from './content-research.service';
import type { SimilarityResult } from './content-similarity-rules';

export const EMOJI_RE =
  /[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]|\u{FE0F}/u;

export type CheckName =
  | 'topic_uniqueness'
  | 'search_intent'
  | 'keyword_relevance'
  | 'content_originality'
  | 'title_uniqueness'
  | 'slug_uniqueness'
  | 'content_similarity'
  | 'internal_links'
  | 'seo_metadata'
  | 'category'
  | 'canonical_url'
  | 'template_fallback_marker'
  | 'telugu_script_coverage'
  | 'final_publishing_validation';

export interface CheckResult {
  name: CheckName;
  passed: boolean;
  /** Blocking checks must pass before an article may be published. */
  blocking: boolean;
  detail: string;
}

export interface ValidationOutcome {
  passed: boolean;
  checks: CheckResult[];
  failures: CheckResult[];
  /** Compact, storable summary for the audit trail. */
  summary: string;
  forceDraft: boolean;
}

export interface ValidationInput {
  topicKey: string;
  topic: string;
  draft: GeneratedBlogDraft & { llmProvider?: string };
  categorySlug: string;
  categoryExists: boolean;
  similarity: SimilarityResult;
  topicKeyTaken: boolean;
  existingSlugs: Set<string>;
  existingTitles: Set<string>;
  wordCount: number;
  language?: 'en' | 'te';
}
