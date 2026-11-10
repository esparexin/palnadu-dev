import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SeoStrategy,
  INTENT_GUIDANCE,
  defaultStrategy,
  str,
  arr,
  objArr,
  normaliseSlug,
  extractHeadings,
  TELUGU_STYLE_GUIDANCE,
  cleanHeadingTitle,
} from './seo-strategy';
import { toAsciiSlug } from './script-utils';
import { BlogLanguage } from '@prisma/client';
import { GeneratedBlogDraft } from './content-research/types';
import { generateStructuredFallback, buildFallbackTitle } from './content-research/structured-fallback';
import { callLlmProvider, getGeminiModelsToTry } from './content-research/llm-provider';

export * from './content-research/types';
export * from './content-research/structured-fallback';
export * from './content-research/llm-provider';

@Injectable()
export class ContentResearchService {
  private readonly logger = new Logger(ContentResearchService.name);
  private readonly geminiApiKey: string | undefined;
  private readonly anthropicApiKey: string | undefined;
  private readonly openaiApiKey: string | undefined;
  private readonly tavilyApiKey: string | undefined;

  constructor(private configService: ConfigService) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.tavilyApiKey = this.configService.get<string>('TAVILY_API_KEY');
  }

  async conductResearch(topic: string, locationContext?: string): Promise<string> {
    const loc = locationContext || 'Palnadu and Guntur, Andhra Pradesh';
    const googleQueries = await this.fetchGoogleSuggestions(topic);

    let externalSnippets = '';
    if (this.tavilyApiKey) {
      try {
        const res = await fetch('https://api.tavily.com/search', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: this.tavilyApiKey,
            query: `${topic} software development technology trends`,
            search_depth: 'advanced',
            include_answer: true,
            max_results: 5,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          externalSnippets = data.results?.map((r: any) => `- ${r.title}: ${r.content}`).join('\n') || '';
        }
      } catch (err) {
        this.logger.warn(`Optional Tavily research skipped: ${err instanceof Error ? err.message : err}`);
      }
    }

    const aiAnalysis = await this.performAiSourceAnalysis(topic, loc, googleQueries);
    const verifiedSection = googleQueries.length > 0
      ? `=== VERIFIED GOOGLE SEARCH DEMAND (Source: Google Live Suggest) ===\n${googleQueries.map((q) => `- "${q}"`).join('\n')}\n\n`
      : '';
    const webSection = externalSnippets
      ? `=== EXTERNAL WEB RESEARCH (Source: Web Snippets) ===\n${externalSnippets}\n\n`
      : '';

    return `${verifiedSection}${webSection}=== TECHNICAL & OPERATIONAL SOURCE ANALYSIS (Source: AI Research Engine) ===\n${aiAnalysis}`;
  }

  async fetchGoogleSuggestions(query: string): Promise<string[]> {
    try {
      const url = `https://suggestqueries.google.com/complete/search?client=firefox&hl=en&gl=in&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, {
        headers: { Accept: 'application/json', 'User-Agent': 'Mozilla/5.0' },
        signal: AbortSignal.timeout(6000),
      });
      if (res.ok) {
        const json = await res.json();
        if (Array.isArray(json[1])) {
          return json[1].slice(0, 6).filter((q: unknown): q is string => typeof q === 'string');
        }
      }
    } catch {
      // ignore
    }
    return [];
  }

  async performAiSourceAnalysis(topic: string, location: string, queries: string[]): Promise<string> {
    if (!this.geminiApiKey && !this.anthropicApiKey && !this.openaiApiKey) {
      return `Foundational Analysis for: "${topic}" in ${location}.\nFocus on operational workflows, real data architectures, and practical business impact for growing regional enterprises.`;
    }
    try {
      if (this.geminiApiKey) {
        const prompt = `As a principal software architect, provide a factual technical and business briefing for an article about: "${topic}" in "${location}".
Real search queries identified: ${queries.slice(0, 4).join(', ') || 'N/A'}.

Provide 4 direct, candid sections without fluff or emojis:
1. Operational Workflows: Real day-to-day workflow problems faced by businesses in this region.
2. Architecture & Tech Stack: Realistic database/cloud architecture trade-offs and failure modes.
3. Cost Realities & Timelines: Honest budget ranges and implementation milestones.
4. Core Owner Questions: What business owners must verify before signing a development contract.`;

        const model = getGeminiModelsToTry()[0];
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(20000),
            body: JSON.stringify({
              contents: [{ role: 'user', parts: [{ text: prompt }] }],
              generationConfig: { temperature: 0.4 },
            }),
          },
        );
        if (res.ok) {
          const json = await res.json();
          const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) return text.trim();
        }
      }
    } catch (err) {
      this.logger.warn(`AI source analysis fallback: ${err instanceof Error ? err.message : err}`);
    }
    return `Operational realities and software engineering best practices for: "${topic}" in ${location}.\nEmphasis on practical operational workflow automation, robust data persistence, local network constraints, and measurable ROI.`;
  }

  async generateArticle(
    topicTitle: string,
    categorySlug: string,
    targetLocation?: string,
    strategy?: SeoStrategy,
    language: BlogLanguage = BlogLanguage.en,
  ): Promise<GeneratedBlogDraft> {
    const locationContext = targetLocation || 'Palnadu and Guntur, Andhra Pradesh';
    const researchContext = await this.conductResearch(topicTitle, locationContext);
    const s = strategy ?? defaultStrategy(topicTitle, categorySlug, locationContext);
    const writeTelugu = language === BlogLanguage.te;

    const systemPrompt = `You are a senior software engineer and technical writer at Palnadu.dev, an engineering studio in Palnadu and Guntur, Andhra Pradesh.
Core engineering principles:
1. "Start with the problem. We build the solution."
2. Write with direct human experience, practical trade anecdotes, and candid developer advice.
3. No AI fluff: Never use clichés like "In today's fast-paced digital world", "In the realm of", "tapestry", "game-changer", "beacon", "delve into", "testament", "revolutionize", "elevate", "harness the power of".
4. Zero emojis: Do NOT use decorative emojis (no 🚀, 💡, 🔥, 📈, ✨) anywhere in titles, headings, or body text. Maintain clean, professional editorial typography.
5. Zero asterisks: Do NOT use bold asterisks (**text**) or italic asterisks (*text*) anywhere in headings, paragraphs, bullet lists, or tables. Write clean, natural prose using standard sentences. Never decorate words with double or single asterisks.
6. Formatting: Write clean, readable paragraphs. Use bullet points or comparison tables only where structurally necessary for technical specifications or checklists.
7. Zero plagiarism: Formulate 100% original sentence structures and real practical examples from ${locationContext}.
8. SEO Keywords: Weave target keywords naturally into the title, the first 100 words, at least one H2 heading, and 2-3 body paragraphs without keyword stuffing.
9. Length & Depth Requirement: The "content" body must be at least 750 words (aim for 850-1100 words) with deep, practical operational advice across at least 5 distinct sections with H2 headings (## Heading).
10. Contextual Links: Naturally incorporate provided internal links into body prose as markdown links [Anchor Text](url) within relevant sentences.`;

    const intentGuidance = INTENT_GUIDANCE[s.searchIntent] ?? INTENT_GUIDANCE.INFORMATIONAL;
    const languageDirective = writeTelugu
      ? `OUTPUT LANGUAGE: Telugu. Write every human-readable field entirely in Telugu script (తెలుగు).\n\n${TELUGU_STYLE_GUIDANCE}\n\nThe "slug" field must be ASCII kebab-case: transliterate the Telugu title.\n\n`
      : '';

    const userPrompt = `${languageDirective}Write an authentic, human-grade technical and business article about: "${topicTitle}".
Category: ${categorySlug}
Regional Context: ${locationContext}
Research background:\n${researchContext}
SEARCH INTENT: ${s.searchIntent}\n${intentGuidance}
KEYWORD STRATEGY: Primary: ${s.primaryKeyword}; Secondary: ${s.secondaryKeywords.join(', ')}; Related: ${s.relatedKeywords.join(', ')}; LongTail: ${s.longTailKeywords.join(', ')}; Tags: ${s.tags.join(', ')}
INTERNAL LINKS (weave contextually into markdown): ${s.internalLinks.map((l) => `${l.url} ("${l.anchor}")`).join(', ') || 'none'}
EXTERNAL REFERENCES: ${s.externalReferences.map((r) => `${r.title} (${r.url})`).join(', ') || 'none'}
IMAGE SUGGESTIONS: ${s.imageSuggestions.map((i) => `"${i.alt}"`).join(', ') || 'none'}
FAQ: ${s.faqOpportunities.join(', ') || 'none'}
LENGTH MANDATE: The "content" field must contain at least 750 words (comprehensive in-depth technical guide with at least 4 to 6 H2 sections). Do not shorten or truncate.
Return strictly a valid JSON object with title, slug, excerpt, content, h1, metaTitle, metaDescription, seoTitle, seoDescription, primaryKeyword, secondaryKeywords, relatedKeywords, longTailKeywords, searchIntent, h2Headings, h3Headings, internalLinks, externalReferences, imageSuggestions, faq, tags.`;

    const keys = { geminiApiKey: this.geminiApiKey, anthropicApiKey: this.anthropicApiKey, openaiApiKey: this.openaiApiKey };
    const llmResult = await callLlmProvider(systemPrompt, userPrompt, s, keys, this.logger);
    if (llmResult) {
      const { draft: llmDraft, provider } = llmResult;
      const cleanContent = (llmDraft.content || '').replace(/\*\*([^*]+)\*\*/g, '$1').replace(/\*([^*\n]+)\*/g, '$1').replace(/\*\*/g, '');
      const words = cleanContent.split(/\s+/).length;
      const rawTitle = str(llmDraft.title) || topicTitle;
      const parsedTitle = cleanHeadingTitle(rawTitle);
      const title =
        parsedTitle.length < 15
          ? buildFallbackTitle(parsedTitle, locationContext)
          : parsedTitle.slice(0, 120);
      let slug = writeTelugu ? toAsciiSlug(str(llmDraft.slug) || topicTitle) : normaliseSlug(llmDraft.slug || topicTitle);
      if (/^\d+$/.test(slug)) {
        slug = `${categorySlug}-${slug}`;
      }
      const primaryKeyword = str(llmDraft.primaryKeyword) || s.primaryKeyword;
      const secondaryKeywords = arr(llmDraft.secondaryKeywords).length ? arr(llmDraft.secondaryKeywords) : s.secondaryKeywords;
      const metaTitle = str(llmDraft.metaTitle) || str(llmDraft.seoTitle) || `${primaryKeyword} | Palnadu.dev`;
      const parsedLinks = objArr<{ anchor: string; url: string }>(llmDraft.internalLinks, ['anchor', 'url']);
      const validLinks = parsedLinks.filter((l) => l.url.startsWith('/') && !l.url.endsWith(`/${slug}`));
      const internalLinks = validLinks.length > 0 ? validLinks : s.internalLinks;

      return {
        isTemplateFallback: false,
        title,
        slug,
        h1: str(llmDraft.h1) ? cleanHeadingTitle(str(llmDraft.h1)) : title,
        excerpt: str(llmDraft.excerpt) || '',
        content: cleanContent,
        metaTitle: metaTitle.slice(0, 70),
        metaDescription: (str(llmDraft.metaDescription) || str(llmDraft.seoDescription) || '').slice(0, 175),
        seoTitle: (str(llmDraft.seoTitle) || metaTitle).slice(0, 70),
        seoDescription: (str(llmDraft.seoDescription) || str(llmDraft.metaDescription) || '').slice(0, 175),
        canonicalUrl: `/blog/${slug}`,
        keywords: arr(llmDraft.keywords),
        primaryKeyword,
        secondaryKeywords,
        relatedKeywords: arr(llmDraft.relatedKeywords).length ? arr(llmDraft.relatedKeywords) : s.relatedKeywords,
        longTailKeywords: arr(llmDraft.longTailKeywords).length ? arr(llmDraft.longTailKeywords) : s.longTailKeywords,
        searchIntent: str(llmDraft.searchIntent) || s.searchIntent,
        h2Headings: arr(llmDraft.h2Headings).length ? arr(llmDraft.h2Headings) : extractHeadings(cleanContent, 2),
        h3Headings: arr(llmDraft.h3Headings).length ? arr(llmDraft.h3Headings) : extractHeadings(cleanContent, 3),
        internalLinks,
        externalReferences: objArr<{ title: string; url: string }>(llmDraft.externalReferences, ['title', 'url']),
        imageSuggestions: objArr<{ alt: string; caption: string }>(llmDraft.imageSuggestions, ['alt', 'caption']),
        faq: objArr<{ q: string; a: string }>(llmDraft.faq, ['q', 'a']),
        tags: arr(llmDraft.tags).length ? arr(llmDraft.tags) : s.tags,
        categorySlug,
        readingMinutes: Math.max(1, Math.ceil(words / 220)),
        llmProvider: provider,
      };
    }

    if (writeTelugu) {
      throw new Error('LLM generation failed and no Telugu fallback template exists; topic remains retryable.');
    }
    return generateStructuredFallback(topicTitle, categorySlug, locationContext, s);
  }
}
