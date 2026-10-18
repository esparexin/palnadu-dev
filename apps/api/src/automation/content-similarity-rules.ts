/**
 * Content-similarity scoring.
 *
 * Guards against "same subject, different words" duplication, which a topicKey
 * check cannot catch: a new topic phrased differently but covering the same
 * search intent must be rejected rather than re-titled into a second article.
 *
 * This module is intentionally free of framework imports so the scoring can be
 * unit tested directly.
 */

import { canonicalizeTopic, topicTokenOverlap } from './topic-identity';
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
  /** Language of the existing post. Absent on legacy callers: unknown language
   *  never suppresses a match, it only disables the cross-language exemption. */
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
  /** Language being generated. When set, same-topicKey matches in another
   *  language are reported as translation candidates, not duplicates. */
  language?: string | null;
}

export interface SimilarityMatch {
  postId: string;
  title: string;
  slug: string;
  /** 0..1 */
  score: number;
  reasons: string[];
}

export interface SimilarityResult {
  /** Highest-scoring existing article, if any. */
  nearest: SimilarityMatch | null;
  /** True when the candidate should be rejected as too close to existing work. */
  isDuplicate: boolean;
  matches: SimilarityMatch[];
}

export interface SimilarityThresholds {
  /** Reject when token overlap alone reaches this. */
  topicOverlap: number;
  /** Reject when content shingle similarity reaches this. */
  contentSimilarity: number;
  /** Reject when keyword overlap reaches this. */
  keywordOverlap: number;
}

export const DEFAULT_THRESHOLDS: SimilarityThresholds = {
  topicOverlap: 0.7,
  contentSimilarity: 0.55,
  keywordOverlap: 0.75,
};

/**
 * Words too common in this domain to distinguish one article from another.
 * Without this, every article about "software in Guntur" scores high overlap.
 */
const DOMAIN_NOISE = new Set([
  'business', 'businesses', 'software', 'system', 'systems', 'solution', 'solutions',
  'company', 'companies', 'service', 'services', 'development', 'website', 'app',
  'apps', 'gunter', 'guntur', 'palnadu', 'andhra', 'pradesh', 'india', 'modern',
  'growing', 'enterprise', 'enterprises', 'team', 'work', 'time', 'need', 'help',
  'best', 'good', 'use', 'using', 'used', 'make', 'makes', 'made', 'get', 'gets',
]);

export function significantWords(text: string): Set<string> {
  return new Set(
    text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .map((w) => w.trim())
      .filter((w) => w.length > 2 && !DOMAIN_NOISE.has(w)),
  );
}

/** Jaccard similarity of two word sets. */
export function jaccard(a: Set<string>, b: Set<string>): number {
  if (a.size === 0 || b.size === 0) return 0;
  let shared = 0;
  for (const w of a) if (b.has(w)) shared += 1;
  return shared / (a.size + b.size - shared);
}

/**
 * Word-level shingle (3-gram) Jaccard over normalised text.
 * More robust than raw word Jaccard for detecting rewritten boilerplate, which
 * is exactly what a templated generator produces.
 */
export function shingleSimilarity(a: string, b: string, shingleSize = 3): number {
  const shingles = (text: string): Set<string> => {
    const words = text
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, ' ')
      .split(/\s+/)
      .filter(Boolean);
    const out = new Set<string>();
    for (let i = 0; i + shingleSize <= words.length; i++) {
      out.add(words.slice(i, i + shingleSize).join(' '));
    }
    return out;
  };
  return jaccard(shingles(a), shingles(b));
}


/**
 * Scores a candidate topic against the existing corpus.
 *
 * Pure: no I/O, so it can be tested without Prisma. ContentSimilarityService is
 * a thin wrapper that loads the corpus and calls this.
 */
export function scoreAgainstCorpus(
  candidate: SimilarityInput,
  corpus: ExistingArticle[],
  thresholds: SimilarityThresholds = DEFAULT_THRESHOLDS,
): SimilarityResult {
  const candidateCanonical = canonicalizeTopic(candidate.topic);
  const candidateKey = candidateCanonical.topicKey;
  const candidateTopicWords = significantWords(candidate.topic);
  const candidateKeywordWords = new Set(
    [candidate.primaryKeyword, ...(candidate.secondaryKeywords ?? [])]
      .filter((k): k is string => !!k)
      .flatMap((k) => [...significantWords(k)]),
  );

  const matches: SimilarityMatch[] = [];

  // Text-overlap rules below compare words, which are script-bound: Telugu and
  // English text essentially never overlap meaningfully. Cross-language
  // duplication is therefore governed by topicKey identity (concept-based and
  // script-independent), not by text scores. When both languages are known and
  // differ, only the topicKey rule runs.
  const sameLanguageAs = (post: ExistingArticle): boolean | null => {
    if (!candidate.language || !post.language) return null;
    return candidate.language === post.language;
  };

  for (const post of corpus) {
    const reasons: string[] = [];
    const sameLang = sameLanguageAs(post);

    // 1. Identical stable identity — decisive within a language, informational
    //    across languages. A Telugu article on the same topicKey as an English
    //    post is a translation candidate: it must be linked explicitly via
    //    linkTranslations, never inferred from this score, and never blocked.
    if (post.topicKey && post.topicKey === candidateKey) {
      if (sameLang === false) {
        matches.push({
          postId: post.id,
          title: post.title,
          slug: post.slug,
          score: 1,
          reasons: ['translation candidate: same topicKey in another language'],
        });
        continue;
      }
      matches.push({
        postId: post.id,
        title: post.title,
        slug: post.slug,
        score: 1,
        reasons: ['identical topicKey'],
      });
      continue;
    }

    // Cross-language text comparison is noise (different scripts share almost
    // no tokens); skip rules 2-6 and let topicKey identity decide.
    if (sameLang === false) continue;

    // 2. Topic text overlap (symmetric, order-insensitive).
    // If both topics specify distinct, non-matching locations, they represent distinct
    // regional landing topics rather than text duplicates.
    const otherTopic = post.topic ?? post.title;
    const otherCanonical = canonicalizeTopic(otherTopic);
    const distinctLocations = !!(
      candidateCanonical.location &&
      otherCanonical.location &&
      candidateCanonical.location !== otherCanonical.location
    );

    const topicSim = distinctLocations ? 0 : topicTokenOverlap(candidate.topic, otherTopic);
    if (topicSim >= thresholds.topicOverlap) reasons.push(`topic overlap ${topicSim.toFixed(2)}`);

    // 3. Keyword overlap.
    const otherKeywords = new Set(
      [post.primaryKeyword, ...post.secondaryKeywords]
        .filter((k): k is string => !!k)
        .flatMap((k) => [...significantWords(k)]),
    );
    const kwSim = jaccard(candidateKeywordWords, otherKeywords);
    if (kwSim >= thresholds.keywordOverlap) reasons.push(`keyword overlap ${kwSim.toFixed(2)}`);

    // 4. Intent match strengthens the signal.
    const sameIntent =
      !!candidate.searchIntent &&
      !!post.searchIntent &&
      candidate.searchIntent === post.searchIntent;
    if (!distinctLocations && sameIntent && topicSim >= 0.4) {
      reasons.push(`same intent (${candidate.searchIntent}) with topic overlap ${topicSim.toFixed(2)}`);
    }

    // 5. Content similarity, only when we have content to compare.
    let contentSim = 0;
    if (candidate.content && candidate.content.length > 400) {
      contentSim = shingleSimilarity(candidate.content, post.content);
      if (contentSim >= thresholds.contentSimilarity) {
        reasons.push(`content similarity ${contentSim.toFixed(2)}`);
      }
    }

    // 6. Title/slug near-duplicate (same words, cosmetic reorder).
    const titleSim = distinctLocations ? 0 : Math.max(
      jaccard(candidateTopicWords, significantWords(post.title)),
      jaccard(candidateTopicWords, significantWords(post.slug.replace(/-/g, ' '))),
    );
    if (titleSim >= 0.8) reasons.push(`title/slug overlap ${titleSim.toFixed(2)}`);

    if (reasons.length > 0) {
      const score = Math.min(
        1,
        Math.max(topicSim, kwSim, contentSim, titleSim) +
          (sameIntent && topicSim >= 0.4 ? 0.15 : 0),
      );
      matches.push({ postId: post.id, title: post.title, slug: post.slug, score, reasons });
    }
  }

  matches.sort((a, b) => b.score - a.score);
  const nearest = matches[0] ?? null;
  const isDuplicate = matches.some((m) => m.reasons.includes('identical topicKey'));

  return { nearest, isDuplicate, matches };
}
