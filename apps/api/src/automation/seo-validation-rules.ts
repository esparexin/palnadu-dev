/**
 * The publish gate.
 *
 * Required order:
 *
 *   topic uniqueness -> search intent -> keyword relevance -> content
 *   originality -> title uniqueness -> slug uniqueness -> content similarity ->
 *   internal links -> SEO metadata -> category -> canonical URL ->
 *   final publishing validation
 *
 * Checks accumulate: all are evaluated so the audit log records every problem,
 * but publishing requires every blocking check to pass.
 *
 * This module is intentionally free of framework imports so the gate can be
 * unit tested directly.
 */

import { VALID_INTENTS } from './seo-strategy';
import type { GeneratedBlogDraft } from './content-research.service';
import type { SimilarityResult } from './content-similarity-rules';

/**
 * Emoji and legacy-symbol ranges the editorial standard forbids.
 *
 * Ranges are written with explicit \u escapes and grouped so no adjacent pair
 * forms a surrogate boundary: \u{1F300}-\u{1FAFF} are astral code points, so the
 * range must be expressed per code point rather than as raw characters.
 */
const EMOJI_RE =
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
  /**
   * Set when the draft came from the static fallback template. The caller must
   * force DRAFT status and surface a warning, even if auto-publish is enabled.
   */
  forceDraft: boolean;
}

export interface ValidationInput {
  topicKey: string;
  topic: string;
  draft: GeneratedBlogDraft & { llmProvider?: string };
  categorySlug: string;
  categoryExists: boolean;
  similarity: SimilarityResult;
  /** True when the topicKey already has a completed post. */
  topicKeyTaken: boolean;
  /** Existing slugs on the site, for slug collision detection. */
  existingSlugs: Set<string>;
  existingTitles: Set<string>;
  wordCount: number;
}

/**
 * Runs the full publish gate. Pure: no I/O, no framework, fully testable.
 */
export function validate(input: ValidationInput): ValidationOutcome {
  const checks: CheckResult[] = [];
  const d = input.draft;

  // 1. Topic uniqueness — the hard gate that fixed the original bug.
  checks.push({
    name: 'topic_uniqueness',
    passed: !input.topicKeyTaken && !!input.topicKey,
    blocking: true,
    detail: input.topicKeyTaken
      ? `topicKey "${input.topicKey}" already has a generated post`
      : `topicKey "${input.topicKey}" is unused`,
  });

  // 2. Search intent must be declared and recognised.
  const intentOk = VALID_INTENTS.has(d.searchIntent);
  checks.push({
    name: 'search_intent',
    passed: intentOk,
    blocking: true,
    detail: intentOk
      ? `intent "${d.searchIntent}"`
      : `missing or unknown searchIntent "${d.searchIntent ?? ''}"`,
  });

  // 3. Keyword relevance: a primary keyword that actually appears in the body.
  const primary = (d.primaryKeyword ?? '').trim().toLowerCase();
  const body = d.content.toLowerCase();
  const primaryInBody = primary.length > 0 && body.includes(primary);
  const secondaryCount = d.secondaryKeywords?.length ?? 0;
  checks.push({
    name: 'keyword_relevance',
    passed: primaryInBody && secondaryCount > 0,
    blocking: true,
    detail: !primary
      ? 'no primary keyword'
      : !primaryInBody
        ? `primary keyword "${primary}" does not appear in the article body`
        : secondaryCount === 0
          ? 'no secondary keywords'
          : `primary + ${secondaryCount} secondary keyword(s) present`,
  });

  // 4. Content originality: substantive length, no keyword stuffing, and not
  //    produced by the static fallback template.
  //
  //    A template-fallback draft is never original: the fallback body is
  //    byte-identical for every topic with only the title and location swapped,
  //    so many topics would yield many unique URLs carrying identical content.
  //    That is the bulk-generated pattern Google treats as scaled content abuse.
  const words = input.wordCount;
  const occurrences = primary ? body.split(primary).length - 1 : 0;
  const density = words > 0 ? occurrences / words : 0;
  const stuffed = primary.length > 0 && density > 0.03;
  const tooShort = words < 600;
  const isTemplate = d.isTemplateFallback === true;
  checks.push({
    name: 'content_originality',
    passed: !tooShort && !stuffed && !isTemplate,
    blocking: true,
    detail: isTemplate
      ? 'generated from the static fallback template (identical body for every topic) - must not be auto-published'
      : tooShort
        ? `article too short (${words} words, minimum 600)`
        : stuffed
          ? `keyword density ${(density * 100).toFixed(2)}% for "${primary}" exceeds 3% (stuffing)`
          : `${words} words, primary keyword density ${(density * 100).toFixed(2)}%`,
  });

  // 4b. Records the template decision for the publish step. Non-blocking on
  //     purpose: the draft is still created for human review instead of being
  //     discarded, but it can never become PUBLISHED automatically.
  checks.push({
    name: 'template_fallback_marker',
    passed: !isTemplate,
    blocking: false,
    detail: isTemplate
      ? 'template fallback: forced to DRAFT regardless of the auto-publish setting'
      : 'LLM-generated original content',
  });

  // 5. Title uniqueness and sanity.
  const titleNorm = d.title.toLowerCase().trim();
  const titleTaken = input.existingTitles.has(titleNorm);
  checks.push({
    name: 'title_uniqueness',
    passed: !titleTaken && d.title.length >= 15 && d.title.length <= 120 && !EMOJI_RE.test(d.title),
    blocking: true,
    detail: titleTaken
      ? `title "${d.title}" duplicates an existing article`
      : d.title.length < 15 || d.title.length > 120
        ? `title length ${d.title.length} outside 15-120`
        : EMOJI_RE.test(d.title)
          ? 'title contains emoji'
          : `unique title (${d.title.length} chars)`,
  });

  // 6. Slug uniqueness and format.
  const slugOk = /^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(d.slug);
  const slugTaken = input.existingSlugs.has(d.slug);
  checks.push({
    name: 'slug_uniqueness',
    passed: slugOk && !slugTaken,
    blocking: true,
    detail: !slugOk
      ? `slug "${d.slug}" is not clean kebab-case`
      : slugTaken
        ? `slug "${d.slug}" already exists`
        : `unique slug (${d.slug})`,
  });

  // 7. Content similarity against existing articles.
  checks.push({
    name: 'content_similarity',
    passed: !input.similarity.isDuplicate,
    blocking: true,
    detail: input.similarity.isDuplicate
      ? `overlaps existing article "${input.similarity.nearest?.title ?? 'unknown'}" ` +
        `(score ${input.similarity.nearest?.score.toFixed(2) ?? '-'}): ` +
        `${input.similarity.nearest?.reasons.join(', ') ?? ''}`
      : 'no substantial overlap with existing content',
  });

  // 8. Internal links must exist and point at real site paths.
  const internalLinks = d.internalLinks ?? [];
  const badLinks = internalLinks.filter((l) => !l.url.startsWith('/'));
  checks.push({
    name: 'internal_links',
    passed: internalLinks.length > 0 && badLinks.length === 0,
    blocking: true,
    detail:
      internalLinks.length === 0
        ? 'no internal links'
        : badLinks.length > 0
          ? `${badLinks.length} internal link(s) are not site-relative paths`
          : `${internalLinks.length} internal link(s), all site-relative`,
  });

  // 9. SEO metadata completeness and SERP-length discipline.
  const metaTitleOk = (d.metaTitle ?? '').length > 0 && (d.metaTitle ?? '').length <= 70;
  const metaDescOk = (d.metaDescription ?? '').length > 0 && (d.metaDescription ?? '').length <= 175;
  const hasH1 = !!d.h1 && d.h1.length > 0;
  const h2Count = (d.h2Headings ?? []).length;
  checks.push({
    name: 'seo_metadata',
    passed: metaTitleOk && metaDescOk && hasH1 && h2Count >= 2,
    blocking: true,
    detail: !metaTitleOk
      ? `meta title length ${(d.metaTitle ?? '').length} (need 1-70)`
      : !metaDescOk
        ? `meta description length ${(d.metaDescription ?? '').length} (need 1-175)`
        : !hasH1
          ? 'missing H1'
          : h2Count < 2
            ? `only ${h2Count} H2 heading(s), want at least 2`
            : `meta title ${(d.metaTitle ?? '').length}, description ${(d.metaDescription ?? '').length}, H1 + ${h2Count} H2s`,
  });

  // 10. Category must exist.
  checks.push({
    name: 'category',
    passed: input.categoryExists && !!input.categorySlug,
    blocking: true,
    detail: input.categoryExists
      ? `category "${input.categorySlug}"`
      : `category "${input.categorySlug}" does not exist`,
  });

  // 11. Canonical URL must match the slug.
  const expectedCanonical = `/blog/${d.slug}`;
  checks.push({
    name: 'canonical_url',
    passed: d.canonicalUrl === expectedCanonical,
    blocking: true,
    detail:
      d.canonicalUrl === expectedCanonical
        ? `canonical ${expectedCanonical}`
        : `canonical "${d.canonicalUrl}" does not match "${expectedCanonical}"`,
  });

  // 12. Final gate: everything blocking must have passed.
  const failures = checks.filter((c) => c.blocking && !c.passed);
  checks.push({
    name: 'final_publishing_validation',
    passed: failures.length === 0,
    blocking: true,
    detail:
      failures.length === 0
        ? `all ${checks.length} checks passed`
        : `${failures.length} blocking check(s) failed: ${failures.map((f) => f.name).join(', ')}`,
  });

  // The gate considers blocking checks only. A non-blocking advisory (the
  // template marker) must not fail an otherwise valid article, but it does force
  // DRAFT so template output can never reach the live site unattended.
  const passed = failures.length === 0;
  const summary = checks
    .map((c) => `${c.passed ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`)
    .join(' | ');

  return { passed, checks, failures, summary, forceDraft: isTemplate };
}
