/**
 * Canonical topic identity.
 */

import type { SearchIntent } from './seo-strategy';
export type { SearchIntent };
import {
  detectLanguage,
  foldTokenToConcept,
  isMeaninglessToken,
  detectScript,
  extractConcepts,
  extractLocation,
  detectIntentMultilingual,
  teluguToAscii,
  toAsciiSlug,
  ContentLanguage,
  ScriptKind,
} from './script-utils';
import {
  INTENT_ORDER,
  STOPWORDS,
  SYNONYMS,
  SERVICE_HINTS,
  SERVICE_WORDS,
  stableHash,
} from './topic-constants';

export { INTENT_ORDER };

export interface CanonicalTopic {
  /** Stable identity. Never derived from LLM output. */
  topicKey: string;
  /** Normalized, human-readable topic label for display and audit. */
  normalizedTopic: string;
  intent: SearchIntent;
  /** Detected location, if the topic is location-qualified. */
  location: string | null;
  /** Detected service/entity head term, if recognised. */
  service: string | null;
  /** Significant tokens, useful for keyword/similarity work. */
  tokens: string[];
  /** Publication language of the source phrase. */
  language: ContentLanguage;
  /** Dominant script of the source phrase. */
  script: ScriptKind;
  /** Language-neutral concept ids (subject/aspect). */
  concepts: string[];
}

function normaliseWhitespace(input: string): string {
  return input
    .replace(/[\u2018\u2019]/g, "'")
    .replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Detect the single strongest intent for a phrase, in either language. */
export function detectIntent(phrase: string): SearchIntent {
  return detectIntentMultilingual(phrase, detectLanguage(phrase)) as SearchIntent;
}

/**
 * Build the canonical, stable identity for a topic phrase.
 */
export function canonicalizeTopic(rawTopic: string): CanonicalTopic {
  const phrase = normaliseWhitespace(rawTopic);
  const script = detectScript(phrase);
  const language = detectLanguage(phrase);

  // 1. Language-neutral signals: these make cross-language keys converge.
  const concepts = extractConcepts(phrase);
  const location = extractLocation(phrase, language);
  const intent = detectIntentMultilingual(phrase, language) as SearchIntent;

  // 2. Fold the remaining text for sub-topic specificity.
  const folded = script === 'telugu' || script === 'mixed' ? teluguToAscii(phrase) : phrase;
  const lower = folded.toLowerCase();

  let working = lower;
  if (location) {
    working = working
      .split(location)
      .join(' ')
      .replace(/\s+(in|near|around|for|at|of|లో|ల)\s*$/i, '')
      .replace(/^\s*(in|near|around|for|at|of|లో|ల)\s+/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  }

  // 3. Detect the service/entity head term from the folded text.
  let service: string | null = null;
  let serviceWordSet = new Set<string>();
  for (const hint of SERVICE_HINTS) {
    if (working.includes(hint)) {
      service = hint.replace(/\s+/g, '-');
      serviceWordSet = new Set(hint.split(/\s+/));
      break;
    }
  }

  // 4. Residual tokens.
  const rawTokens = working
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  const significant = rawTokens.filter(
    (t) => !STOPWORDS.has(t) && !serviceWordSet.has(t) && !SERVICE_WORDS.has(t) && t.length > 1,
  );

  const base = (significant.length > 0 ? significant : rawTokens).slice(0, 8);

  // 5. Fold residual tokens to concept ids where the lexicon recognises them.
  const foldedConcepts: string[] = [];
  const literalTokens: string[] = [];

  for (const token of base) {
    const synonym = SYNONYMS[token];
    const candidate = synonym ?? token;

    const concept = foldTokenToConcept(candidate);
    if (concept) {
      foldedConcepts.push(concept);
      continue;
    }

    if (script === 'telugu' || script === 'mixed') {
      if (isMeaninglessToken(candidate)) continue;
    }

    literalTokens.push(candidate);
  }

  const tokens = base.map((t) => SYNONYMS[t] ?? t);

  const literalKey =
    concepts.length === 0
      ? [...new Set(literalTokens)].sort().join('-')
      : '';

  const PHASING_CONCEPTS = new Set(['aspect:howto']);
  const allConcepts = [...new Set([...concepts, ...foldedConcepts])].sort();
  const identityConcepts = allConcepts.filter((c) => !PHASING_CONCEPTS.has(c));
  const conceptKey = identityConcepts.join('+');

  // 6. Assemble topicKey
  const intentSlug = intent.toLowerCase().replace(/_/g, '-');
  const parts = [conceptKey || service, literalKey, location, intentSlug].filter(Boolean);

  const topicKey =
    parts
      .join('-')
      .replace(/[^a-z0-9+-]/g, '-')
      .replace(/-{2,}/g, '-')
      .replace(/^-|-$/g, '')
      .slice(0, 120) || `topic-${stableHash(phrase)}`;

  return {
    topicKey,
    normalizedTopic: tokens.join(' '),
    intent,
    location,
    service,
    tokens,
    language,
    script,
    concepts,
  };
}

/**
 * Deterministic ASCII slug for a topic, safe for any script.
 * Never returns an empty string.
 */
export function topicSlug(rawTopic: string): string {
  return toAsciiSlug(rawTopic);
}

/** Convenience: identity only. */
export function toTopicKey(rawTopic: string): string {
  return canonicalizeTopic(rawTopic).topicKey;
}

/**
 * Two phrases are "the same topic" when their canonical keys match.
 */
export function isSameTopic(a: string, b: string): boolean {
  return toTopicKey(a) === toTopicKey(b);
}

/** Jaccard overlap of significant tokens — used as a softer pre-filter. */
export function topicTokenOverlap(a: string, b: string): number {
  const ta = new Set(canonicalizeTopic(a).tokens);
  const tb = new Set(canonicalizeTopic(b).tokens);
  if (ta.size === 0 || tb.size === 0) return 0;
  let shared = 0;
  for (const t of ta) if (tb.has(t)) shared += 1;
  return shared / (ta.size + tb.size - shared);
}
