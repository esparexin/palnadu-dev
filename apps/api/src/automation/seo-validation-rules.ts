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
  checkContentOriginality,
  checkKeywordRelevance,
  checkTeluguScriptCoverage,
} from './seo-validation-content';
import { validateArticleBacklinks } from './blog/backlink-policy';
import { buildLanguageCanonicalUrl } from './blog/blog-url.util';

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

  // 4. Content originality + 4b. Template fallback marker
  const { originalityCheck, templateMarkerCheck } = checkContentOriginality(
    d,
    input.wordCount,
    String(input.language) === 'te',
  );
  checks.push(originalityCheck, templateMarkerCheck);

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

  // 8. Internal links (Mandatory Policy: verified in-body backlinks)
  const declaredEmpty = Array.isArray(d.internalLinks) && d.internalLinks.length === 0;
  const backlinkOutcome = validateArticleBacklinks(
    d.content,
    d.slug,
    input.language === 'te' ? 'te' : 'en',
  );
  if (backlinkOutcome.validLinks.length > 0 && !declaredEmpty) {
    d.internalLinks = backlinkOutcome.validLinks;
  }
  const linksPassed = !declaredEmpty && backlinkOutcome.passed;
  checks.push({
    name: 'internal_links',
    passed: linksPassed,
    blocking: true,
    detail: declaredEmpty
      ? 'Backlink policy violation: Missing mandatory internal backlink (declared internalLinks is empty)'
      : backlinkOutcome.detail,
  });

  // 9. SEO metadata completeness
  const metaTitleOk = (d.metaTitle ?? '').length > 0 && (d.metaTitle ?? '').length <= 70;
  const metaDescLen = (d.metaDescription ?? '').length;
  const seoDescLen = (d.seoDescription ?? d.metaDescription ?? '').length;
  const metaDescOk = metaDescLen > 0 && metaDescLen <= 160 && seoDescLen <= 160;
  const hasH1 = !!d.h1 && d.h1.length > 0;
  const h2Count = (d.h2Headings ?? []).length;
  checks.push({
    name: 'seo_metadata',
    passed: metaTitleOk && metaDescOk && hasH1 && h2Count >= 2,
    blocking: true,
    detail: !metaTitleOk
      ? `meta title length ${(d.metaTitle ?? '').length} (need 1-70)`
      : !metaDescOk
        ? `meta/seo description length ${Math.max(metaDescLen, seoDescLen)} (need 1-160)`
        : !hasH1
          ? 'missing H1'
          : h2Count < 2
            ? `only ${h2Count} H2 heading(s), want at least 2`
            : `meta title ${(d.metaTitle ?? '').length}, description ${metaDescLen}, H1 + ${h2Count} H2s`,
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
  const expectedCanonical = buildLanguageCanonicalUrl(d.slug, input.language);
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

  return { passed, checks, failures, summary, forceDraft: !templateMarkerCheck.passed };
}
