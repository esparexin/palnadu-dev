/**
 * Canonical topic identity.
 *
 * The central rule of the automation: a topic's identity is derived ONLY from
 * the search topic itself (the query/phrase a person would type plus its
 * location and intent), never from LLM-authored title or slug text.
 *
 * This is what allows these two generations to resolve to one identity:
 *
 *   "How Much Does Website Development Cost in Guntur?"
 *   "Website Development Pricing in Guntur: Complete Guide"
 *   -> website-development-cost-guntur
 *
 * Two different titles, one topicKey, therefore never two posts.
 */

export type { SearchIntent } from './seo-strategy';
import type { SearchIntent } from './seo-strategy';
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


/** Intent ordered by commercial proximity — used for topic diversification. */
export const INTENT_ORDER: SearchIntent[] = [
  'INFORMATIONAL',
  'FAQ',
  'HOW_TO',
  'LOCAL',
  'PROBLEM_SOLING',
  'COMMERCIAL_INVESTIGATION',
  'COMPARISON',
  'PRODUCT_SERVICE_RESEARCH',
];

// Filler that carries no topical meaning. Stripped before keying so that
// "The Ultimate Guide to X" and "A Complete Guide About X" collapse together.
const STOPWORDS = new Set([
  'a', 'an', 'the', 'and', 'or', 'but', 'if', 'then', 'than', 'so', 'of', 'to', 'in', 'on',
  'at', 'by', 'for', 'with', 'about', 'into', 'from', 'up', 'down', 'out', 'over', 'under',
  'again', 'further', 'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'any',
  'both', 'each', 'few', 'more', 'most', 'other', 'some', 'such', 'no', 'nor', 'not', 'only',
  'own', 'same', 'too', 'very', 'can', 'will', 'just', 'should', 'now', 'is', 'are', 'was',
  'were', 'be', 'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'doing',
  // headline filler that varies without changing the topic
  'guide', 'ultimate', 'complete', 'comprehensive', 'best', 'top', 'everything', 'need',
  'know', 'tips', 'tricks', 'ways', 'things', 'actually', 'really', 'simply', 'easily',
  'step', 'steps', 'guide', 'introducing', 'understanding', 'explained', 'overview',
  'what', 'why', 'when', 'which', 'does', 'is', 'are',
  // quantifiers and intensifiers that vary per phrasing
  'much', 'many', 'long', 'average', 'typical', 'usual', 'exactly', 'really',
]);

/**
 * Semantic normalisation applied before keying.
 *
 * Searchers describe one topic with many words: "pricing", "rates", "charges"
 * and "cost" all mean the same commercial question. Without this map the same
 * search topic would produce several distinct topicKeys and therefore several
 * near-duplicate posts — which is exactly the class of bug this file exists to
 * prevent. Mapping is intentionally small and domain-specific rather than a
 * general thesaurus, so unrelated topics never collapse together.
 */
const SYNONYMS: Record<string, string> = {
  // money
  cost: 'cost', costs: 'cost', pricing: 'cost', price: 'cost', prices: 'cost',
  charges: 'cost', rates: 'cost', fee: 'cost', fees: 'cost', budget: 'cost',
  estimate: 'cost', quotes: 'cost', quote: 'cost', expensive: 'cost',
  cheap: 'cost', affordable: 'cost', budgeting: 'cost',
  // provider
  company: 'company', companies: 'company', agency: 'company', agencies: 'company',
  provider: 'company', providers: 'company', firm: 'company', vendor: 'company',
  developer: 'company', developers: 'company', freelancer: 'company',
  // building
  build: 'build', building: 'build', develop: 'build', developing: 'build',
  create: 'build', creating: 'build', make: 'build',
  // buying / acquiring
  buy: 'buy', purchase: 'buy', buying: 'buy', acquire: 'buy',
  // time
  time: 'time', timeline: 'time', duration: 'time', long: 'time',
  // amount of work
  team: 'team', people: 'team', staff: 'team',
  // systems
  system: 'system', systems: 'system', platform: 'system', software: 'system',
  tool: 'system', solution: 'system', solutions: 'system', app: 'system',
  applications: 'system', portal: 'system',
  // store
  store: 'ecommerce', shop: 'ecommerce', online: 'ecommerce',
};

/**
 * Locations that disambiguate a topic. Order matters only for readability.
 */
const LOCATION_HINTS = [
  'guntur', 'palnadu', 'narasaraopet', 'chilakaluripet', 'vinukonda', 'sattenapalli',
  'macherla', 'piduguralla', 'tenali', 'mangalagiri', 'bapatla', 'amaravati', 'vijayawada',
  'rajahmundry', 'kakinada', 'andhra pradesh', 'india', 'coastal andhra', 'telangana',
];

/**
 * Service/entity head terms. Recognised so a topic key reads as
 * `<service>-<modifier>-<location>` rather than an opaque hash of words.
 */
const SERVICE_HINTS = [
  'website development', 'web development', 'web design', 'app development',
  'android app development', 'ios app development', 'mobile app development',
  'ecommerce', 'e commerce', 'erp', 'crm', 'pos software', 'billing software',
  'school management software', 'admission portal', 'fee portal', 'clinic management',
  'hospital management', 'inventory software', 'accounting software', 'payroll software',
  'digital marketing', 'local seo', 'seo', 'cloud software', 'saas', 'custom software',
  'progressive web app', 'pwa', 'automation', 'gate pass software', 'weighbridge software',
  'cold storage software', 'loan accounting software', 'property portal',
];

/**
 * Words that describe the SERVICE rather than the topic's distinguishing
 * question. "website development" becomes the `service` segment of the key, so
 * repeating it in the token list only produces redundancy like
 * `website-development-build-cost-development-website`.
 */
const SERVICE_WORDS = new Set([
  'website', 'web', 'development', 'developing', 'design', 'app', 'android', 'ios',
  'mobile', 'software', 'system', 'systems', 'platform', 'tool', 'solution',
  'solutions', 'portal', 'management', 'erp', 'crm', 'saas', 'pwa', 'automation',
  'store', 'ecommerce', 'service', 'services', 'company', 'companies', 'agency',
]);

/**
 * Intent modifiers detected in the raw topic phrase.
 */
const INTENT_PATTERNS: { intent: SearchIntent; patterns: RegExp[] }[] = [
  { intent: 'COMPARISON', patterns: [/\bvs\.?\b/, /\bversus\b/, /\bcompare\b/, /\bcomparison\b/, /\bwhich is better\b/, /\bdifference between\b/, /\balternative(s)?\b/] },
  { intent: 'HOW_TO', patterns: [/\bhow to\b/, /\bhow do\b/, /\bhow can\b/, /\bsteps?\b/, /\bguide to\b/, /\btutorial\b/] },
  { intent: 'COMMERCIAL_INVESTIGATION', patterns: [/\bbest\b/, /\btop \d+\b/, /\breview\b/, /\bpricing\b/, /\bprice\b/, /\bcost\b/, /\baffordable\b/, /\bquotes?\b/, /\bbudget\b/] },
  { intent: 'LOCAL', patterns: [/\bin [a-z]+$/, /\bnear me\b/, /\blocal\b/] },
  { intent: 'PROBLEM_SOLING', patterns: [/\bfix\b/, /\bsolve\b/, /\btroubleshoot/, /\bproblem\b/, /\berror\b/, /\bbroken\b/, /\bnot working\b/, /\bfailing\b/] },
  { intent: 'FAQ', patterns: [/\bfaq\b/, /\bquestions?\b/, /\bq&a\b/, /\bmeaning of\b/, /\bwhat is\b/, /\bwhat are\b/, /\bwhy do\b/, /\bwhy does\b/] },
  { intent: 'PRODUCT_SERVICE_RESEARCH', patterns: [/\bsoftware\b/, /\bplatform\b/, /\bapp\b/, /\bsystem\b/, /\btool\b/, /\bsolution\b/, /\bcompany\b/, /\bagency\b/, /\bdeveloper/] },
];

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
  /**
   * Language-neutral concept ids (subject/aspect). These are what make
   * cross-language identity possible: a Telugu and an English article about
   * the same subject resolve to the same ids, so their keys collide by design.
   */
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
 *
 * Identity is concept-first and language-neutral:
 *
 *   title -> script/language detection -> concept + location + intent
 *         -> canonical topicKey
 *
 * Concept ids come from a curated bilingual lexicon, so a Telugu phrase and an
 * English phrase describing the same search subject produce the same ids without
 * any string comparison between the two languages. Transliteration is used only
 * to keep the *key itself* URL-safe and readable; it is never the sole basis for
 * deciding that two topics are the same.
 *
 * Within a language, remaining significant tokens (ASCII-folded) keep the key
 * specific to sub-topics the concept lexicon does not enumerate.
 */
export function canonicalizeTopic(rawTopic: string): CanonicalTopic {
  const phrase = normaliseWhitespace(rawTopic);
  const script = detectScript(phrase);
  const language = detectLanguage(phrase);

  // 1. Language-neutral signals: these make cross-language keys converge.
  const concepts = extractConcepts(phrase);
  const location = extractLocation(phrase, language);
  const intent = detectIntentMultilingual(phrase, language) as SearchIntent;

  // 2. Fold the remaining text for sub-topic specificity. Transliterate first so
  //    Telugu contributes ASCII tokens rather than disappearing.
  const folded = script === 'telugu' || script === 'mixed' ? teluguToAscii(phrase) : phrase;
  const lower = folded.toLowerCase();

  let working = lower;
  if (location) {
    // Remove the canonical location token and adjacent prepositions.
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
  //    This is what makes the key language-neutral: literal Telugu and English
  //    words are both replaced by a shared id, so only genuinely novel
  //    sub-topics survive as literal text.
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

    // Transliteration noise (postpositions, case endings) is not a sub-topic.
    if (script === 'telugu' || script === 'mixed') {
      if (isMeaninglessToken(candidate)) continue;
    }

    literalTokens.push(candidate);
  }

  const tokens = base.map((t) => SYNONYMS[t] ?? t);

  // Literal tokens only earn a place in the key when the lexicon could not
  // classify the topic at all. If concepts were found, an unrecognised word is
  // far more likely to be phrasing than a distinct subject, and including it
  // would break cross-language convergence.
  const literalKey =
    concepts.length === 0
      ? [...new Set(literalTokens)].sort().join('-')
      : '';

  // Concepts split into two kinds:
  //
  //   subject:* — WHAT the topic is about. Always part of identity.
  //   aspect:*  — WHICH commercial/transactional facet is asked about.
  //
  // Commercial facets (cost, comparison, best) genuinely distinguish different
  // searches and stay in the key, otherwise "website development cost in Guntur"
  // and "website development in Guntur" would collapse into one post and one
  // would never be published.
  //
  // Procedural facets (howto) are excluded: they describe how the question is
  // phrased rather than what is being asked, so including them would stop
  // "how much does a website cost" and "website pricing guide" from being
  // recognised as the same underlying subject.
  const PHASING_CONCEPTS = new Set(['aspect:howto']);
  const allConcepts = [...new Set([...concepts, ...foldedConcepts])].sort();
  const identityConcepts = allConcepts.filter((c) => !PHASING_CONCEPTS.has(c));
  const conceptKey = identityConcepts.join('+');

  // 6. Assemble: concept ids first (language-neutral), then location. Literal
  //    words appear only when nothing could be classified.
  const parts = [conceptKey || service, literalKey, location].filter(Boolean);

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

/** Stable FNV-1a hash, used only when no usable tokens could be derived. */
function stableHash(input: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 0x01000193) >>> 0;
  }
  return h.toString(36).slice(0, 10);
}

/** Convenience: identity only. */
export function toTopicKey(rawTopic: string): string {
  return canonicalizeTopic(rawTopic).topicKey;
}

/**
 * Two phrases are "the same topic" when their canonical keys match.
 * This is the check that stops one search topic producing many posts.
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