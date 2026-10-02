/**
 * Pure SEO strategy helpers.
 *
 * Deliberately free of framework imports so the strategy, normalization, and
 * validation rules can be unit tested with `node --test` without booting Nest
 * or Prisma. The services in this directory are thin wrappers around these.
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

export const VALID_INTENTS: ReadonlySet<string> = new Set<SearchIntent>([
  'INFORMATIONAL',
  'HOW_TO',
  'COMMERCIAL_INVESTIGATION',
  'COMPARISON',
  'LOCAL',
  'PROBLEM_SOLING',
  'PRODUCT_SERVICE_RESEARCH',
  'FAQ',
]);

/** The SEO plan for one article: keywords, intent, links, FAQ and tags. */
export interface SeoStrategy {
  primaryKeyword: string;
  secondaryKeywords: string[];
  relatedKeywords: string[];
  longTailKeywords: string[];
  searchIntent: SearchIntent;
  tags: string[];
  internalLinks: { anchor: string; url: string }[];
  externalReferences: { title: string; url: string }[];
  imageSuggestions: { alt: string; caption: string }[];
  faqOpportunities: string[];
}

/** What a reader searching with this intent actually wants from the page. */
export const INTENT_GUIDANCE: Record<SearchIntent, string> = {
  INFORMATIONAL:
    'The reader wants to understand a concept. Explain plainly, define terms, and give context before advice.',
  HOW_TO:
    'The reader wants to accomplish a task. Give ordered, concrete steps they can follow, with realistic effort and time.',
  COMMERCIAL_INVESTIGATION:
    'The reader is shortlisting providers. Give honest cost ranges, what drives price, what to watch out for, and how to evaluate quotes.',
  COMPARISON:
    'The reader is choosing between options. Compare on explicit criteria with a table, state trade-offs, and recommend by use case.',
  LOCAL:
    'The reader wants a provider serving their area. Be specific about the location, local conditions, and what is realistically available nearby.',
  PROBLEM_SOLING:
    'The reader has a broken process. Diagnose the likely cause, give the fix, and explain how to confirm it worked.',
  PRODUCT_SERVICE_RESEARCH:
    'The reader is evaluating software or a service. Describe what it does, who it fits, integration and maintenance realities, and limitations.',
  FAQ:
    'The reader has a specific question. Answer it in the first paragraph, then expand with the detail needed to act.',
};

/**
 * Telugu writing guidance appended to the generation prompt for `te` drafts.
 *
 * Kept as a named export (not buried in a template literal) so tests can
 * assert on each requirement individually. Covers what the generic directive
 * does not: Telugu SEO conventions, sentence rhythm, and the exact boundary
 * between allowed English tokens and forbidden mixed-language body copy.
 */
export const TELUGU_STYLE_GUIDANCE = `TELUGU WRITING GUIDANCE:
- Tone: direct and practical, as if explaining to a shop owner in Guntur. Short sentences. No ornamental openings.
- Script discipline: body sentences in Telugu script. English is allowed ONLY for: proper nouns (Palnadu.dev, Next.js, WhatsApp, Google), technical terms with no common Telugu equivalent on first use — always followed immediately by the Telugu explanation in parentheses — and URLs. Never write whole English sentences or paragraphs.
- No romanized Telugu (no "website kharchu" written in Latin letters anywhere in human-readable fields).
- SEO in Telugu: place the primary keyword verbatim in the title, the first 100 words, and at least one H2. Telugu readers search in Telugu script, so transliterated or English keywords do not count toward placement.
- Meta title under 60 characters, meta description under 155 characters, counted in characters as displayed.
- Headings answer questions directly; the H1 states the topic, H2s state the key answers.
- FAQ answers must be complete in Telugu without requiring the reader to follow a link.`;

/** Conservative defaults, used when no discovery data is available. */
export function defaultStrategy(
  topicTitle: string,
  categorySlug: string,
  locationContext: string,
  language: 'en' | 'te' = 'en',
): SeoStrategy {
  // The English pipeline strips question openers and ASCII-folds; applied to
  // Telugu that would erase the entire keyword. Telugu keeps its own text.
  const primaryKeyword =
    language === 'te'
      ? topicTitle.replace(/\s+/g, ' ').trim().slice(0, 70)
      : topicTitle
          .toLowerCase()
          .replace(/^(how|what|why|when|which|the|a|an)\s+/, '')
          .replace(/[^\w\s-]/g, '')
          .trim()
          .slice(0, 70);

  const loc = locationContext.split(',')[0]?.trim() ?? 'Guntur';

  if (language === 'te') {
    return {
      primaryKeyword,
      secondaryKeywords: [`${primaryKeyword} ${loc}`, `${primaryKeyword} ఖర్చు`],
      relatedKeywords: [`ఉత్తమ ${primaryKeyword}`, `${primaryKeyword} గైడ్`],
      longTailKeywords: [`${primaryKeyword} ఎంత ఖర్చు అవుతుంది`],
      searchIntent: 'INFORMATIONAL',
      tags: [categorySlug, loc.toLowerCase()],
      internalLinks: [
        { anchor: 'Web Development Services', url: '/services/web-development' },
        { anchor: 'Custom Software', url: '/services/custom-software' },
        { anchor: 'Contact Page', url: '/contact' },
      ],
      externalReferences: [],
      imageSuggestions: [{ alt: primaryKeyword, caption: 'ఆచరణాత్మక అమలు' }],
      faqOpportunities: [
        `${primaryKeyword} ఖర్చు ఎంత?`,
        `${primaryKeyword} కు ఎంత సమయం పడుతుంది?`,
        `చిన్న వ్యాపారానికి ${primaryKeyword} అవసరమా?`,
      ],
    };
  }

  return {
    primaryKeyword,
    secondaryKeywords: [`${primaryKeyword} ${loc}`, `${primaryKeyword} for small business`],
    relatedKeywords: [`best ${primaryKeyword}`, `${primaryKeyword} checklist`],
    longTailKeywords: [`how much does ${primaryKeyword} cost in ${loc}`],
    searchIntent: 'INFORMATIONAL',
    tags: [categorySlug, loc.toLowerCase()],
    internalLinks: [
      { anchor: 'Web Development Services', url: '/services/web-development' },
      { anchor: 'Custom Software', url: '/services/custom-software' },
      { anchor: 'Contact Page', url: '/contact' },
    ],
    externalReferences: [],
    imageSuggestions: [{ alt: `${primaryKeyword} in practice`, caption: 'Practical implementation' }],
    faqOpportunities: [
      `What does ${primaryKeyword} cost?`,
      `How long does ${primaryKeyword} take?`,
      `Do I need ${primaryKeyword} for a small business?`,
    ],
  };
}

// ── Defensive parsing of LLM output ────────────────────────────────────────

export function str(v: unknown): string {
  return typeof v === 'string' ? v.trim() : '';
}

export function arr(v: unknown): string[] {
  return Array.isArray(v)
    ? v.filter((x): x is string => typeof x === 'string' && x.trim().length > 0)
    : [];
}

export function objArr(v: unknown, keys: string[]): Record<string, string>[] {
  if (!Array.isArray(v)) return [];
  return v
    .filter((x): x is Record<string, unknown> => !!x && typeof x === 'object')
    .map((x) => Object.fromEntries(keys.map((k) => [k, str(x[k])])) as Record<string, string>)
    .filter((x) => keys.every((k) => x[k].length > 0));
}

/** Slugify defensively: the LLM sometimes returns spaces, underscores or mixed case. */
export function normaliseSlug(input: string): string {
  return str(input)
    .toLowerCase()
    // Underscores are word separators, not junk: normalise them before the
    // "strip everything but alphanumerics" pass, which would otherwise eat them
    // and silently fuse words together ("a--b__c" -> "a-bc").
    .replace(/_/g, ' ')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/[\s-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 90);
}

/** Recovers headings when the LLM omits the structured arrays. */
export function extractHeadings(markdown: string, level: 2 | 3): string[] {
  const re = new RegExp(`^#{${level}}\\s+(.+)$`, 'gm');
  return [...markdown.matchAll(re)].map((m) => (m[1] ?? '').trim()).filter(Boolean);
}

/**
 * Tolerant JSON extraction. Models frequently wrap JSON in a ```json fence or
 * prepend prose; a bare JSON.parse would throw and silently drop the whole
 * generation into the fallback path.
 */
// The model's response shape is validated field-by-field at the call site via
// str()/arr()/objArr(), so an open object type is correct here rather than a
// hand-written interface that would still need defensive narrowing.
export function parseLooseJson(raw: string): Record<string, unknown> {
  const text = raw.trim();

  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = (fenced ? fenced[1] : text).trim();

  try {
    return JSON.parse(candidate);
  } catch {
    // fall through to brace matching
  }

  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start !== -1 && end > start) {
    return JSON.parse(candidate.slice(start, end + 1));
  }

  throw new Error('LLM response did not contain parseable JSON');
}