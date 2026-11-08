/**
 * The publish gate.
 */

import { VALID_INTENTS } from './seo-strategy';
import type {
  CheckName,
  CheckResult,
  ValidationOutcome,
  ValidationInput,
} from './seo-validation-types';
import { EMOJI_RE } from './seo-validation-types';
import {
  checkKeywordRelevance,
  checkTeluguScriptCoverage,
} from './seo-validation-content';

export type { CheckName, CheckResult, ValidationOutcome, ValidationInput };

/**
 * Runs the full publish gate. Pure: no I/O, no framework, fully testable.
 */
export function validate(input: ValidationInput): ValidationOutcome {
  const checks: CheckResult[] = [];
  const d = input.draft;

  // 1. Topic uniqueness
  checks.push({
    name: 'topic_uniqueness',
    passed: !input.topicKeyTaken && !!input.topicKey,
    blocking: true,
    detail: input.topicKeyTaken
      ? `topicKey "${input.topicKey}" already has a generated post`
      : `topicKey "${input.topicKey}" is unused`,
  });

  // 2. Search intent
  const intentOk = VALID_INTENTS.has(d.searchIntent);
  checks.push({
    name: 'search_intent',
    passed: intentOk,
    blocking: true,
    detail: intentOk
      ? `intent "${d.searchIntent}"`
      : `missing or unknown searchIntent "${d.searchIntent ?? ''}"`,
  });

  // 3. Keyword relevance
  checks.push(checkKeywordRelevance(d));

  // 4. Content originality: substantive length, no keyword stuffing, and not
  //    produced by the static fallback template.
  const primary = (d.primaryKeyword ?? '').trim().toLowerCase();
  const body = d.content.toLowerCase();
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

  // 4b. Records the template decision for the publish step.
  checks.push({
    name: 'template_fallback_marker',
    passed: !isTemplate,
    blocking: false,
    detail: isTemplate
      ? 'template fallback: forced to DRAFT regardless of the auto-publish setting'
      : 'LLM-generated original content',
  });

  // 4c. Telugu script coverage
  if (input.language === 'te') {
    checks.push(checkTeluguScriptCoverage(d));
  }

  // 5. Title uniqueness and sanity
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

  // 6. Slug uniqueness and format
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

  // 7. Content similarity against existing articles
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

  // 8. Internal links
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

  // 9. SEO metadata completeness
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

  // 10. Category
  checks.push({
    name: 'category',
    passed: input.categoryExists && !!input.categorySlug,
    blocking: true,
    detail: input.categoryExists
      ? `category "${input.categorySlug}"`
      : `category "${input.categorySlug}" does not exist`,
  });

  // 11. Canonical URL
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

  // 12. Final gate
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

  const passed = failures.length === 0;
  const summary = checks
    .map((c) => `${c.passed ? 'PASS' : 'FAIL'} ${c.name}: ${c.detail}`)
    .join(' | ');

  return { passed, checks, failures, summary, forceDraft: isTemplate };
}
