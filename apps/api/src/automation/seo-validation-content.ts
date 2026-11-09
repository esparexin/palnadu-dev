import { teluguScriptRatio } from './script-utils';
import type { GeneratedBlogDraft } from './content-research.service';
import type { CheckResult } from './seo-validation-types';

export function checkKeywordRelevance(d: GeneratedBlogDraft): CheckResult {
  const primary = (d.primaryKeyword ?? '').trim().toLowerCase();
  const body = d.content.toLowerCase();
  const title = (d.title ?? '').toLowerCase();
  const words = primary.split(/\s+/).filter((w) => w.length > 2);
  const allWordsPresent = words.length > 0 && words.every((w) => body.includes(w) || title.includes(w));
  const primaryInBody = primary.length > 0 && (body.includes(primary) || title.includes(primary) || allWordsPresent);
  const secondaryCount = d.secondaryKeywords?.length ?? 0;

  return {
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
  };
}

export function checkContentOriginality(
  d: GeneratedBlogDraft,
  wordCount: number,
  isTelugu = false,
): { originalityCheck: CheckResult; templateMarkerCheck: CheckResult } {
  const primary = (d.primaryKeyword ?? '').trim().toLowerCase();
  const body = d.content.toLowerCase();
  const occurrences = primary ? body.split(primary).length - 1 : 0;
  const density = wordCount > 0 ? occurrences / wordCount : 0;
  const stuffed = primary.length > 0 && density > 0.03;
  const minWords = isTelugu ? 400 : 600;
  const tooShort = wordCount < minWords;
  const isTemplate = d.isTemplateFallback === true;

  const originalityCheck: CheckResult = {
    name: 'content_originality',
    passed: !tooShort && !stuffed && !isTemplate,
    blocking: true,
    detail: isTemplate
      ? 'generated from the static fallback template (identical body for every topic) - must not be auto-published'
      : tooShort
        ? `article too short (${wordCount} words, minimum ${minWords})`
        : stuffed
          ? `keyword density ${(density * 100).toFixed(2)}% for "${primary}" exceeds 3% (stuffing)`
          : `${wordCount} words, primary keyword density ${(density * 100).toFixed(2)}%`,
  };

  const templateMarkerCheck: CheckResult = {
    name: 'template_fallback_marker',
    passed: !isTemplate,
    blocking: false,
    detail: isTemplate
      ? 'template fallback: forced to DRAFT regardless of the auto-publish setting'
      : 'LLM-generated original content',
  };

  return { originalityCheck, templateMarkerCheck };
}

export function checkTeluguScriptCoverage(d: GeneratedBlogDraft): CheckResult {
  const ratio = teluguScriptRatio(`${d.title}\n${d.content}`);
  return {
    name: 'telugu_script_coverage',
    passed: ratio >= 0.5,
    blocking: true,
    detail:
      ratio >= 0.5
        ? `Telugu script ratio ${(ratio * 100).toFixed(0)}%`
        : `only ${(ratio * 100).toFixed(0)}% Telugu script — body is not Telugu`,
  };
}
