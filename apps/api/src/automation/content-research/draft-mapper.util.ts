import {
  SearchIntent,
  SeoStrategy,
  VALID_INTENTS,
  str,
  arr,
  objArr,
  normaliseSlug,
  extractHeadings,
  cleanHeadingTitle,
} from '../seo-strategy';
import { toAsciiSlug } from '../script-utils';
import { buildFallbackTitle } from './structured-fallback';
import type { GeneratedBlogDraft } from './types';

const INTENT_ALIASES: Readonly<Record<string, SearchIntent>> = {
  INFO: 'INFORMATIONAL',
  GUIDE: 'HOW_TO',
  TUTORIAL: 'HOW_TO',
  COMMERCIAL: 'COMMERCIAL_INVESTIGATION',
  PROBLEM_SOLVING: 'PROBLEM_SOLING',
  PRODUCT_RESEARCH: 'PRODUCT_SERVICE_RESEARCH',
  SERVICE_RESEARCH: 'PRODUCT_SERVICE_RESEARCH',
};

/**
 * Normalizes LLM-supplied searchIntent values to canonical VALID_INTENTS tokens,
 * falling back to the pre-computed strategy intent when unrecognized.
 */
export function normalizeSearchIntent(rawIntent: unknown, fallback: SearchIntent): SearchIntent {
  const raw = str(rawIntent);
  if (raw) {
    const normalized = raw.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_|_$/g, '');
    const mapped = INTENT_ALIASES[normalized] ?? normalized;
    if (VALID_INTENTS.has(mapped)) return mapped as SearchIntent;
  }
  return VALID_INTENTS.has(fallback) ? fallback : 'INFORMATIONAL';
}

export function mapLlmDraftToBlogDraft(params: {
  llmDraft: any;
  provider: string;
  topicTitle: string;
  categorySlug: string;
  locationContext: string;
  strategy: SeoStrategy;
  writeTelugu: boolean;
}): GeneratedBlogDraft {
  const {
    llmDraft,
    provider,
    topicTitle,
    categorySlug,
    locationContext,
    strategy: s,
    writeTelugu,
  } = params;

  const cleanContent = (llmDraft.content || '')
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/\*\*/g, '');
  const words = cleanContent.split(/\s+/).filter(Boolean).length;
  const rawTitle = str(llmDraft.title) || topicTitle;
  const parsedTitle = cleanHeadingTitle(rawTitle);
  const title =
    parsedTitle.length < 15
      ? buildFallbackTitle(parsedTitle, locationContext)
      : parsedTitle.slice(0, 120);

  let slug = writeTelugu
    ? toAsciiSlug(str(llmDraft.slug) || topicTitle)
    : normaliseSlug(llmDraft.slug || topicTitle);
  if (/^\d+$/.test(slug)) {
    slug = `${categorySlug}-${slug}`;
  }

  const primaryKeyword = str(llmDraft.primaryKeyword) || s.primaryKeyword;
  const secondaryKeywords = arr(llmDraft.secondaryKeywords).length
    ? arr(llmDraft.secondaryKeywords)
    : s.secondaryKeywords;
  const metaTitle =
    str(llmDraft.metaTitle) || str(llmDraft.seoTitle) || `${primaryKeyword} | Palnadu.dev`;
  const parsedLinks = objArr<{ anchor: string; url: string }>(llmDraft.internalLinks, [
    'anchor',
    'url',
  ]);
  const validLinks = parsedLinks.filter(
    (l) => l.url.startsWith('/') && !l.url.endsWith(`/${slug}`),
  );
  const internalLinks = validLinks.length > 0 ? validLinks : s.internalLinks;

  return {
    isTemplateFallback: false,
    title,
    slug,
    h1: str(llmDraft.h1) ? cleanHeadingTitle(str(llmDraft.h1)) : title,
    excerpt: str(llmDraft.excerpt) || '',
    content: cleanContent,
    metaTitle: metaTitle.slice(0, 70),
    metaDescription: (
      str(llmDraft.metaDescription) ||
      str(llmDraft.seoDescription) ||
      ''
    ).slice(0, 175),
    seoTitle: (str(llmDraft.seoTitle) || metaTitle).slice(0, 70),
    seoDescription: (
      str(llmDraft.seoDescription) ||
      str(llmDraft.metaDescription) ||
      ''
    ).slice(0, 175),
    canonicalUrl: `/blog/${slug}`,
    keywords: arr(llmDraft.keywords),
    primaryKeyword,
    secondaryKeywords,
    relatedKeywords: arr(llmDraft.relatedKeywords).length
      ? arr(llmDraft.relatedKeywords)
      : s.relatedKeywords,
    longTailKeywords: arr(llmDraft.longTailKeywords).length
      ? arr(llmDraft.longTailKeywords)
      : s.longTailKeywords,
    searchIntent: normalizeSearchIntent(llmDraft.searchIntent, s.searchIntent),
    h2Headings: arr(llmDraft.h2Headings).length
      ? arr(llmDraft.h2Headings)
      : extractHeadings(cleanContent, 2),
    h3Headings: arr(llmDraft.h3Headings).length
      ? arr(llmDraft.h3Headings)
      : extractHeadings(cleanContent, 3),
    internalLinks,
    externalReferences: objArr<{ title: string; url: string }>(
      llmDraft.externalReferences,
      ['title', 'url'],
    ),
    imageSuggestions: objArr<{ alt: string; caption: string }>(
      llmDraft.imageSuggestions,
      ['alt', 'caption'],
    ),
    faq: objArr<{ q: string; a: string }>(llmDraft.faq, ['q', 'a']),
    tags: arr(llmDraft.tags).length ? arr(llmDraft.tags) : s.tags,
    categorySlug,
    readingMinutes: Math.max(1, Math.ceil(words / 220)),
    llmProvider: provider,
  };
}

