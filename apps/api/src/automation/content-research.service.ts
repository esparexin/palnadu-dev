import { Injectable, Logger, Optional } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  SeoStrategy,
  INTENT_GUIDANCE,
  VALID_INTENTS,
  defaultStrategy,
  TELUGU_STYLE_GUIDANCE,
} from './seo-strategy';
import { BlogLanguage } from '@prisma/client';
import { GeneratedBlogDraft } from './content-research/types';
import { generateStructuredFallback } from './content-research/structured-fallback';
import {
  callLlmProviderDetailed,
  generateGeminiWithFallback,
  LlmCallOptions,
} from './content-research/llm-provider';
import { mapLlmDraftToBlogDraft } from './content-research/draft-mapper.util';
import { redactGeminiSecrets } from './gemini-verification/gemini-error-classifier.util';
import { GeminiKeyStoreService } from './gemini-verification/gemini-key-store.service';

export * from './content-research/types';
export * from './content-research/structured-fallback';
export * from './content-research/llm-provider';

export interface GenerateArticleOptions extends LlmCallOptions {
  allowTemplateFallback?: boolean;
}

@Injectable()
export class ContentResearchService {
  private readonly logger = new Logger(ContentResearchService.name);
  private readonly geminiApiKey: string | undefined;
  private readonly anthropicApiKey: string | undefined;
  private readonly openaiApiKey: string | undefined;
  private readonly tavilyApiKey: string | undefined;

  constructor(
    private configService: ConfigService,
    @Optional() private geminiKeyStore?: GeminiKeyStoreService,
  ) {
    this.geminiApiKey = this.configService.get<string>('GEMINI_API_KEY');
    this.anthropicApiKey = this.configService.get<string>('ANTHROPIC_API_KEY');
    this.openaiApiKey = this.configService.get<string>('OPENAI_API_KEY');
    this.tavilyApiKey = this.configService.get<string>('TAVILY_API_KEY');
  }

  async resolveGeminiKey(): Promise<string | undefined> {
    return (await this.geminiKeyStore?.getDecryptedActiveKey()) || this.geminiApiKey;
  }

  async resolveGeminiModel(): Promise<string | undefined> {
    return (await this.geminiKeyStore?.getActiveModel()) || process.env.GEMINI_MODEL;
  }

  async conductResearch(topic: string, locationContext?: string, options?: LlmCallOptions): Promise<string> {
    const loc = locationContext || 'Palnadu and Guntur, Andhra Pradesh';
    const googleQueries = await this.fetchGoogleSuggestions(topic);

    let externalSnippets = '';
    if (this.tavilyApiKey) {
      try {
        const res = await (options?.fetchFn || fetch)('https://api.tavily.com/search', {
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

    const aiAnalysis = await this.performAiSourceAnalysis(topic, loc, googleQueries, options);
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
      // ignore suggestion fetch errors
    }
    return [];
  }

  async performAiSourceAnalysis(
    topic: string,
    location: string,
    queries: string[],
    options?: LlmCallOptions,
  ): Promise<string> {
    const geminiKey = await this.resolveGeminiKey();
    if (!geminiKey && !this.anthropicApiKey && !this.openaiApiKey) {
      return `Foundational Analysis for: "${topic}" in ${location}.\nFocus on operational workflows, real data architectures, and practical business impact for growing regional enterprises.`;
    }
    try {
      if (geminiKey) {
        const preferredModel = await this.resolveGeminiModel();
        const prompt = `As a principal software architect, provide a factual technical and business briefing for an article about: "${topic}" in "${location}".
Real search queries identified: ${queries.slice(0, 4).join(', ') || 'N/A'}.

Provide 4 direct, candid sections without fluff or emojis:
1. Operational Workflows: Real day-to-day workflow problems faced by businesses in this region.
2. Architecture & Tech Stack: Realistic database/cloud architecture trade-offs and failure modes.
3. Cost Realities & Timelines: Honest budget ranges and implementation milestones.
4. Core Owner Questions: What business owners must verify before signing a development contract.`;

        const outcome = await generateGeminiWithFallback({
          geminiApiKey: geminiKey,
          preferredModel,
          contents: [{ role: 'user', parts: [{ text: prompt }] }],
          generationConfig: { temperature: 0.4 },
          logger: this.logger,
          options: { ...options, retry: { timeoutMs: 20000, ...options?.retry } },
        });
        if (outcome.ok && outcome.text) return outcome.text.trim();
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      this.logger.warn(`AI source analysis fallback: ${redactGeminiSecrets(msg, geminiKey)}`);
    }
    return `Operational realities and software engineering best practices for: "${topic}" in ${location}.\nEmphasis on practical operational workflow automation, robust data persistence, local network constraints, and measurable ROI.`;
  }

  async generateArticle(
    topicTitle: string,
    categorySlug: string,
    targetLocation?: string,
    strategy?: SeoStrategy,
    language: BlogLanguage = BlogLanguage.en,
    options?: GenerateArticleOptions,
  ): Promise<GeneratedBlogDraft> {
    const locationContext = targetLocation || 'Palnadu and Guntur, Andhra Pradesh';
    const researchContext = await this.conductResearch(topicTitle, locationContext, options);
    const s = strategy ?? defaultStrategy(topicTitle, categorySlug, locationContext);
    const writeTelugu = language === BlogLanguage.te;

    const systemPrompt = `You are a senior software engineer and technical writer at Palnadu.dev, an engineering studio in Palnadu and Guntur, Andhra Pradesh.
We build custom Next.js/TypeScript web applications, mobile apps, school portals, and business automation tools across Andhra Pradesh.
Brand principle: "Start with the problem. We build the solution." Avoid marketing fluff and emojis. Write in crisp, direct technical editorial language grounded in facts.${
      writeTelugu
        ? '\n\nLanguage: Telugu (te). Title, h1, meta tags, headings, content, FAQ and anchor texts MUST be written in natural Telugu script while keeping technical terms in English when clearer. Also ensure JSON slug field uses clean lowercase ASCII hyphenated words.'
        : ''
    }`;

    const userPrompt = `Write a comprehensive, deeply researched, SEO-ready technical guide (800-1200 words) for:
TOPIC: "${topicTitle}"
CATEGORY: ${categorySlug}
LOCATION CONTEXT: ${locationContext}
PRIMARY KEYWORD: "${s.primaryKeyword}"
SECONDARY KEYWORDS: ${s.secondaryKeywords.join(', ')}
SEARCH INTENT (${s.searchIntent}): ${INTENT_GUIDANCE[s.searchIntent]}
REQUIRED INTERNAL LINKS: ${s.internalLinks.map((l) => `[${l.anchor}](${l.url})`).join(', ')}${writeTelugu ? `\n${TELUGU_STYLE_GUIDANCE}` : ''}

RESEARCH DATA:
${researchContext}

LENGTH MANDATE: The "content" field MUST contain at least 800 to 1,200 words (never under 650 words; include 5-6 detailed H2 sections with real architectural and regional business detail).
Set "searchIntent" strictly to one of: ${Array.from(VALID_INTENTS).join(', ')} (prefer "${s.searchIntent}").
Output strictly valid JSON with keys:
title, slug, h1, excerpt, content, metaTitle, metaDescription, seoTitle, seoDescription, primaryKeyword, secondaryKeywords, relatedKeywords, longTailKeywords, searchIntent, h2Headings, h3Headings, internalLinks, externalReferences, imageSuggestions, faq, tags.`;

    const geminiApiKey = await this.resolveGeminiKey();
    const geminiModel = await this.resolveGeminiModel();
    const keys = {
      geminiApiKey,
      anthropicApiKey: this.anthropicApiKey,
      openaiApiKey: this.openaiApiKey,
      geminiModel,
    };
    const { result: llmResult, geminiFailure } = await callLlmProviderDetailed(
      systemPrompt,
      userPrompt,
      s,
      keys,
      this.logger,
      options,
    );

    if (llmResult) {
      const mapped = mapLlmDraftToBlogDraft({
        llmDraft: llmResult.draft,
        provider: llmResult.provider,
        topicTitle,
        categorySlug,
        locationContext,
        strategy: s,
        writeTelugu,
      });
      return { ...mapped, isTemplateFallback: false };
    }

    if (!writeTelugu && options?.allowTemplateFallback) {
      return generateStructuredFallback(topicTitle, categorySlug, locationContext, s, 'en');
    }

    const codeLabel = geminiFailure?.code || (geminiApiKey ? 'TEMPORARY_PROVIDER_ERROR' : 'UNCONFIGURED');
    const detail = redactGeminiSecrets(
      geminiFailure?.detail || 'No configured LLM provider produced a valid article draft.',
      geminiApiKey,
    );
    throw new Error(`LLM generation failed [${codeLabel}]: ${detail}; topic remains retryable.`);
  }
}
