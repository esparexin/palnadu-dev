export interface GeneratedBlogDraft {
  /**
   * True when this draft came from the static fallback template rather than the
   * LLM. The fallback is the SAME body for every topic with only the title and
   * location substituted, which is precisely the bulk-generated pattern Google
   * treats as scaled content abuse. Such drafts are never auto-published; see
   * SeoValidationService `content_originality`.
   */
  isTemplateFallback: boolean;
  title: string;
  slug: string;
  // The H1 shown on the page. Usually equals title, but the requirement asks for
  // them to be separately validated, so they are tracked independently.
  h1: string;
  excerpt: string;
  content: string;
  metaTitle: string;
  metaDescription: string;
  seoTitle: string;
  seoDescription: string;
  canonicalUrl: string;
  keywords: string[];
  primaryKeyword: string;
  secondaryKeywords: string[];
  relatedKeywords: string[];
  longTailKeywords: string[];
  searchIntent: string;
  h2Headings: string[];
  h3Headings: string[];
  internalLinks: { anchor: string; url: string }[];
  externalReferences: { title: string; url: string }[];
  imageSuggestions: { alt: string; caption: string }[];
  faq: { q: string; a: string }[];
  tags: string[];
  categorySlug: string;
  readingMinutes: number;
  llmProvider?: string;
}
