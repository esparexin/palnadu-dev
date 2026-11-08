/**
 * Content-similarity scoring.
 */

import { canonicalizeTopic, topicTokenOverlap } from './topic-identity';
import type {
  ExistingArticle,
  SimilarityInput,
  SimilarityMatch,
  SimilarityResult,
  SimilarityThresholds,
} from './content-similarity-types';
import { DEFAULT_THRESHOLDS } from './content-similarity-types';
import {
  significantWords,
  jaccard,
  shingleSimilarity,
} from './content-similarity-shingles';

export type {
  ExistingArticle,
  SimilarityInput,
  SimilarityMatch,
  SimilarityResult,
  SimilarityThresholds,
};
export { DEFAULT_THRESHOLDS, significantWords, jaccard, shingleSimilarity };

/**
 * Scores a candidate topic against the existing corpus.
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

  const sameLanguageAs = (post: ExistingArticle): boolean | null => {
    if (!candidate.language || !post.language) return null;
    return candidate.language === post.language;
  };

  for (const post of corpus) {
    const reasons: string[] = [];
    const sameLang = sameLanguageAs(post);

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

    if (sameLang === false) continue;

    const otherTopic = post.topic ?? post.title;
    const otherCanonical = canonicalizeTopic(otherTopic);
    const distinctLocations = !!(
      candidateCanonical.location &&
      otherCanonical.location &&
      candidateCanonical.location !== otherCanonical.location
    );

    const topicSim = distinctLocations ? 0 : topicTokenOverlap(candidate.topic, otherTopic);
    if (topicSim >= thresholds.topicOverlap) reasons.push(`topic overlap ${topicSim.toFixed(2)}`);

    const otherKeywords = new Set(
      [post.primaryKeyword, ...post.secondaryKeywords]
        .filter((k): k is string => !!k)
        .flatMap((k) => [...significantWords(k)]),
    );
    const kwSim = jaccard(candidateKeywordWords, otherKeywords);
    if (kwSim >= thresholds.keywordOverlap) reasons.push(`keyword overlap ${kwSim.toFixed(2)}`);

    const sameIntent =
      !!candidate.searchIntent &&
      !!post.searchIntent &&
      candidate.searchIntent === post.searchIntent;
    if (!distinctLocations && sameIntent && topicSim >= 0.4) {
      reasons.push(`same intent (${candidate.searchIntent}) with topic overlap ${topicSim.toFixed(2)}`);
    }

    let contentSim = 0;
    if (candidate.content && candidate.content.length > 400) {
      contentSim = shingleSimilarity(candidate.content, post.content);
      if (contentSim >= thresholds.contentSimilarity) {
        reasons.push(`content similarity ${contentSim.toFixed(2)}`);
      }
    }

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
