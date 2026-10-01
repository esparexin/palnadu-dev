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

export type SearchIntent =
  | 'INFORMATIONAL'
  | 'HOW_TO'
  | 'COMMERCIAL_INVESTIGATION'
  | 'COMPARISON'
  | 'LOCAL'
  | 'PROBLEM_SOLING'
  | 'PRODUCT_SERVICE_RESEARCH'
  | 'FAQ';

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
}

function normaliseWhitespace(input: string): string {
  return input
    .replace(/[‘’“”]/g, "'")
    .replace(/[–—]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Detect the single strongest intent for a phrase. */
export function detectIntent(phrase: string): SearchIntent {
  const lower = ` ${phrase.toLowerCase()} `;

  // Comparison is checked first: "how to compare X vs Y" is still a comparison.
  for (const { intent, patterns } of INTENT_PATTERNS) {
    if (patterns.some((p) => p.test(lower))) return intent;
  }
  return 'INFORMATIONAL';
}

/**
 * Build the canonical, stable identity for a topic phrase.
 *
 * Deterministic and pure: the same phrase always yields the same key, and two
 * differently-worded phrases covering the same search topic collapse to one key
 * because filler words are removed and the remaining significant tokens are
 * sorted before hashing into the key.
 */
export function canonicalizeTopic(rawTopic: string): CanonicalTopic {
  const phrase = normaliseWhitespace(rawTopic);
  const lower = phrase.toLowerCase();

  // 1. Detect and strip location so it becomes a structured part of the key.
  let location: string | null = null;
  let working = lower;
  for (const hint of LOCATION_HINTS) {
    const idx = working.indexOf(hint);
    if (idx !== -1) {
      location = hint.replace(/\s+/g, '-');
      // remove the location phrase plus a trailing/leading preposition
      working = `${working.slice(0, idx)} ${working.slice(idx + hint.length)}`
        .replace(/\s+(in|near|around|for|at|of)\s*$/, '')
        .replace(/^\s*(in|near|around|for|at|of)\s+/, '')
        .replace(/\s+/g, ' ')
        .trim();
      break;
    }
  }

  // 2. Detect the service/entity head term. This becomes its own key segment,
  //    so its individual words are excluded from the distinguishing tokens.
  let service: string | null = null;
  let serviceWordSet = new Set<string>();
  for (const hint of SERVICE_HINTS) {
    if (working.includes(hint)) {
      service = hint.replace(/\s+/g, '-');
      serviceWordSet = new Set(hint.split(/\s+/));
      break;
    }
  }

  // 3. Strip filler, keep significant tokens.
  const rawTokens = working
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/[\s-]+/)
    .map((t) => t.trim())
    .filter(Boolean);

  // 3a. Drop filler, and drop the service words (already represented by the
  //     `service` segment) so they cannot fragment the key.
  const significant = rawTokens.filter(
    (t) => !STOPWORDS.has(t) && !serviceWordSet.has(t) && !SERVICE_WORDS.has(t) && t.length > 1,
  );

  // Fall back to raw tokens if a phrase was all filler.
  const base = (significant.length > 0 ? significant : rawTokens).slice(0, 8);

  // 4. Apply semantic normalisation so synonyms of one concept collapse
  //    ("pricing" and "cost" are the same search topic).
  const tokens = base.map((t) => SYNONYMS[t] ?? t);

  // 5. Sorted, de-duplicated tokens make word order and repetition irrelevant:
  //    "cost website development" and "website development cost" collapse, and
  //    a token repeated for emphasis does not fragment the key.
  const tokenKey = [...new Set(tokens)].sort().join('-');

  const parts = [service, tokenKey, location].filter(Boolean);
  const topicKey = parts.join('-')
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 120);

  return {
    topicKey,
    normalizedTopic: tokens.join(' '),
    intent: detectIntent(phrase),
    location,
    service,
    tokens,
  };
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