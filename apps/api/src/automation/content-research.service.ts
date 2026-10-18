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
  parseLooseJson,
  TELUGU_STYLE_GUIDANCE,
} from './seo-strategy';
import { toAsciiSlug } from './script-utils';
import { BlogLanguage } from '@prisma/client';

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
}

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

  /**
   * Conducts live web research via Tavily or returns foundational facts
   */
  async conductResearch(topic: string): Promise<string> {
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
          const snippets = data.results?.map((r: any) => `- ${r.title}: ${r.content}`).join('\n') || '';
          this.logger.log(`Tavily research gathered for: "${topic}"`);
          return `${data.answer || ''}\n\nKey Research Sources:\n${snippets}`;
        }
      } catch (err) {
        this.logger.warn(`Tavily research failed: ${err instanceof Error ? err.message : err}`);
      }
    }

    return `Synthesize latest best practices for: ${topic}. Focus on practical business impact, cost-efficiency, technical architecture, and real operational workflows.`;
  }

  /**
   * Synthesizes research into a complete, original, SEO-optimized blog draft
   */
  async generateArticle(
    topicTitle: string,
    categorySlug: string,
    targetLocation?: string,
    strategy?: SeoStrategy,
    language: BlogLanguage = BlogLanguage.en,
  ): Promise<GeneratedBlogDraft> {
    const researchContext = await this.conductResearch(topicTitle);
    const locationContext = targetLocation || 'Palnadu and Guntur, Andhra Pradesh';
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
8. SEO Keywords: Weave target keywords naturally into the title, the first 100 words, at least one H2 heading, and 2-3 body paragraphs without keyword stuffing.`;

    // Intent is the contract with the reader: the article must answer the
    // question that someone searching this way actually has.
    const intentGuidance = INTENT_GUIDANCE[s.searchIntent] ?? INTENT_GUIDANCE.INFORMATIONAL;

    // Telugu generation: the entire article — title, headings, body, excerpt,
    // meta fields, keywords, FAQ — must be written in Telugu script for
    // Telugu-speaking readers. Only the URL slug stays ASCII (transliterated),
    // because slugs must satisfy the kebab-case validator downstream.
    const languageDirective = writeTelugu
      ? `OUTPUT LANGUAGE: Telugu. Write every human-readable field (title, h1, excerpt, content, metaTitle, metaDescription, seoTitle, seoDescription, keywords, headings, faq, tags, image alt text and captions) entirely in Telugu script (తెలుగు).\n\n${TELUGU_STYLE_GUIDANCE}\n\nThe "slug" field must be ASCII kebab-case: transliterate the Telugu title (e.g. "వెబ్‌సైట్ ఖర్చు" -> "vebsait-kharchu").\n\n`
      : '';

    const userPrompt = `${languageDirective}Write an authentic, human-grade technical and business article about: "${topicTitle}".
Category: ${categorySlug}
Regional Context: ${locationContext}
Research background:
${researchContext}

SEARCH INTENT: ${s.searchIntent}
${intentGuidance}

KEYWORD STRATEGY (use naturally, never stuff):
- Primary keyword: ${s.primaryKeyword}
- Secondary keywords: ${s.secondaryKeywords.join(', ') || '(none)'}
- Related keywords: ${s.relatedKeywords.join(', ') || '(none)'}
- Long-tail keywords: ${s.longTailKeywords.join(', ') || '(none)'}
Target tags: ${s.tags.join(', ') || '(none)'}

INTERNAL LINKS TO INCLUDE (use these exact URLs):
${s.internalLinks.length ? s.internalLinks.map((l) => `- ${l.url} — anchor text: "${l.anchor}"`).join('\n') : '- (none required)'}

EXTERNAL REFERENCES (cite where genuinely useful):
${s.externalReferences.length ? s.externalReferences.map((r) => `- ${r.title} — ${r.url}`).join('\n') : '- (none required)'}

IMAGE SUGGESTIONS (the pipeline will source licensed images):
${s.imageSuggestions.length ? s.imageSuggestions.map((i) => `- alt: "${i.alt}" — caption: "${i.caption}"`).join('\n') : '- (none required)'}

FAQ OPPORTUNITIES (answer each in the body, and repeat in the faq array):
${s.faqOpportunities.map((q) => `- ${q}`).join('\n') || '- (none required)'}

Content Requirements:
- Length: 1,200 to 1,600 words of substantive, useful reading.
- Tone: Written by a seasoned developer talking directly to an intelligent business owner.
- Markdown: Proper H1 for title, clean H2/H3 headings, occasional code or architectural blocks, clean comparison table, and natural internal links.
- Zero robotic filler or decorative symbols.
- Open by answering the searcher's question directly. Do not open with generic scene-setting.

Return strictly a valid JSON object matching this schema:
{
  "title": "Clear, direct, human-written title",
  "slug": "kebab-case-url-slug",
  "excerpt": "Clear, grounded 2-sentence summary (140-160 characters, no emojis)",
  "content": "Full markdown text (minimum 1,200 words, clean paragraphs, zero emojis)",
  "h1": "The on-page H1 heading",
  "metaTitle": "Meta title under 60 characters including | Palnadu.dev",
  "metaDescription": "Meta description under 155 characters explaining the practical problem solved",
  "seoTitle": "SEO title under 60 characters with | Palnadu.dev",
  "seoDescription": "Meta description under 155 characters explaining the practical problem solved",
  "primaryKeyword": "the single main keyword",
  "secondaryKeywords": ["secondary keyword", "another secondary keyword"],
  "relatedKeywords": ["closely related keyword"],
  "longTailKeywords": ["a longer specific search phrase"],
  "searchIntent": "one of: ${Object.keys(INTENT_GUIDANCE).join(', ')}",
  "h2Headings": ["An H2 heading from the article"],
  "h3Headings": ["An H3 subheading from the article"],
  "internalLinks": [{ "anchor": "anchor text", "url": "/services/web-development" }],
  "externalReferences": [{ "title": "reference title", "url": "https://example.com" }],
  "imageSuggestions": [{ "alt": "descriptive alt text", "caption": "short caption" }],
  "faq": [
    { "q": "Practical question an owner would ask?", "a": "Direct, honest answer" },
    { "q": "Practical question about technical complexity?", "a": "Direct, honest answer" },
    { "q": "Practical question about cost or timeline?", "a": "Direct, honest answer" }
  ],
  "tags": ["short tag", "another tag"]
}`;

    // Attempt generation with the configured provider.
    const llmResult = await this.callLLM(systemPrompt, userPrompt, s);
    if (llmResult) {
      const { draft: llmDraft, provider } = llmResult;
      // Rigorously sanitize any stray asterisks (**bold** or *italic*)
      const cleanContent = (llmDraft.content || '')
        .replace(/\*\*([^*]+)\*\*/g, '$1')
        .replace(/\*([^*\n]+)\*/g, '$1')
        .replace(/\*\*/g, '');
      const words = cleanContent.split(/\s+/).length;
      // Telugu titles cannot survive the ASCII slug normalizer (it would strip
      // every character); transliterate instead. toAsciiSlug never returns an
      // empty string, so validation always receives a well-formed slug.
      const slug = writeTelugu
        ? toAsciiSlug(str(llmDraft.slug) || topicTitle)
        : normaliseSlug(llmDraft.slug || topicTitle);

      // The LLM may omit strategy fields; fall back to what we asked for so
      // downstream validation always has a complete SEO payload.
      const primaryKeyword = str(llmDraft.primaryKeyword) || s.primaryKeyword;
      const secondaryKeywords = arr(llmDraft.secondaryKeywords).length
        ? arr(llmDraft.secondaryKeywords)
        : s.secondaryKeywords;
      const metaTitle = str(llmDraft.metaTitle) || str(llmDraft.seoTitle) || `${primaryKeyword} | Palnadu.dev`;

      return {
        isTemplateFallback: false,
        title: str(llmDraft.title) || topicTitle,
        slug,
        h1: str(llmDraft.h1) || str(llmDraft.title) || topicTitle,
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
        internalLinks: objArr(llmDraft.internalLinks, ['anchor', 'url']).length
          ? objArr(llmDraft.internalLinks, ['anchor', 'url'])
          : s.internalLinks,
        externalReferences: objArr(llmDraft.externalReferences, ['title', 'url']),
        imageSuggestions: objArr(llmDraft.imageSuggestions, ['alt', 'caption']),
        faq: objArr(llmDraft.faq, ['q', 'a']),
        tags: arr(llmDraft.tags).length ? arr(llmDraft.tags) : s.tags,
        categorySlug,
        readingMinutes: Math.max(1, Math.ceil(words / 220)),
        // Provenance for the audit trail: which provider actually wrote this.
        llmProvider: provider,
      } as GeneratedBlogDraft & { llmProvider: string };
    }

    // High-quality structured fallback engine. English-only by construction:
    // its body is a fixed English template, so using it for a Telugu post
    // would persist English content under a `te` language tag. Fail loudly
    // instead so the topic stays retryable and no mixed-language row is born.
    if (writeTelugu) {
      throw new Error('LLM generation failed and no Telugu fallback template exists; topic remains retryable.');
    }
    return this.generateStructuredFallback(topicTitle, categorySlug, locationContext, s);
  }

  /**
   * Calls available LLM provider (Gemini, Claude, or OpenAI)
   */
  private async callLLM(
    systemPrompt: string,
    userPrompt: string,
    _strategy: SeoStrategy,
  ): Promise<{ draft: any; provider: string } | null> {
    // 1. Try Google Gemini if configured (with automatic model resilience fallback)
    if (this.geminiApiKey) {
      const geminiModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
      for (const model of geminiModels) {
        try {
          const res = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${this.geminiApiKey}`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                contents: [
                  {
                    role: 'user',
                    parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }],
                  },
                ],
                generationConfig: {
                  responseMimeType: 'application/json',
                  temperature: 0.7,
                },
              }),
            },
          );

          if (res.ok) {
            const json = await res.json();
            const rawText = json.candidates?.[0]?.content?.parts?.[0]?.text;
            if (rawText) {
              this.logger.log(`Successfully generated content via live Google Gemini (${model})`);
              return { draft: parseLooseJson(rawText), provider: `gemini:${model}` };
            }
          } else {
            const errText = await res.text();
            this.logger.warn(`Gemini API (${model}) returned ${res.status}: ${errText}`);
          }
        } catch (err) {
          this.logger.warn(`Gemini generation (${model}) failed: ${err instanceof Error ? err.message : err}`);
        }
      }
    }

    // 2. Try Anthropic Claude if configured
    if (this.anthropicApiKey) {
      try {
        const res = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': this.anthropicApiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model: 'claude-3-5-sonnet-20241022',
            max_tokens: 4000,
            system: systemPrompt,
            messages: [
              { role: 'user', content: `${userPrompt}\n\nOutput only valid JSON.` },
            ],
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.content?.[0]?.text;
          if (text) {
            return { draft: parseLooseJson(text), provider: 'anthropic:claude-3-5-sonnet' };
          }
        }
      } catch (err) {
        this.logger.warn(`Claude generation failed: ${err instanceof Error ? err.message : err}`);
      }
    }

    // 3. Try OpenAI if configured
    if (this.openaiApiKey) {
      try {
        const res = await fetch('https://api.openai.com/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.openaiApiKey}`,
          },
          body: JSON.stringify({
            model: 'gpt-4o-mini',
            response_format: { type: 'json_object' },
            messages: [
              { role: 'system', content: systemPrompt },
              { role: 'user', content: userPrompt },
            ],
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const text = json.choices?.[0]?.message?.content;
          if (text) {
            return { draft: parseLooseJson(text), provider: 'openai:gpt-4o-mini' };
          }
        }
      } catch (err) {
        this.logger.warn(`OpenAI generation failed: ${err instanceof Error ? err.message : err}`);
      }
    }

    return null;
  }

  /**
   * Generates a deep, original, long-form technical article using our problem-first framework
   */
  private generateStructuredFallback(
    topicTitle: string,
    categorySlug: string,
    locationContext: string,
    s: SeoStrategy,
  ): GeneratedBlogDraft {
    const slug = topicTitle
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/[\s_-]+/g, '-')
      .replace(/^-+|-+$/g, '');

    const content = `# ${topicTitle}

Every growing enterprise across ${locationContext} eventually reaches a point where informal operational methods stop working. When transaction volume expands, relying on fragmented WhatsApp chat threads, manual paper registers, and standalone Excel spreadsheets creates severe administrative bottlenecks.

At Palnadu.dev, our approach is direct: Start with the problem. We build the solution. In this engineering guide, we examine why traditional manual workflows break down under scale, how custom web applications solve operational drag, and how to execute a cost-effective implementation plan.

---

## 1. The Core Operational Challenge

When commercial trading agencies, clinics, schools, and growing enterprises in Andhra Pradesh start out, informal communication channels feel convenient. Orders arrive via WhatsApp voice notes, clerks update quantities on standalone desktop computers, and owners spend evening hours reconciling ledgers.

However, as order volume expands, this informal setup creates hidden operational drag:
- Data Fragmentation: Inventory figures in the godown fail to sync with sales reps in the field.
- Accidental Overselling: Two team members unknowingly commit the same stock batch to different customers.
- Lost Inquiries: Prospective client inquiries get buried under hundreds of personal chat messages.
- Single Point of Failure: Critical pricing rules and client histories live inside one employee's head rather than a secure, centralized database.

---

## 2. Why Generic Commercial SaaS Tools Fall Short

Many forward-thinking operators recognize these friction points and attempt to solve them by subscribing to off-the-shelf software tools. Within a few months, many abandon them because:

1. Inflexible Workflows: Foreign SaaS tools assume standardized Western transaction models. They fail to accommodate regional partial UPI/cash advances, seasonal mandi credit terms, or local transport carrier memos.
2. Exorbitant Per-User Monthly Fees: Paying $20 to $50 per staff member every month creates an ongoing cash drain for features regional teams will never utilize.
3. Zero Code or Data Ownership: Storing proprietary supplier lists and pricing tiers on closed third-party servers exposes businesses to sudden price hikes and vendor lock-in.

---

## 3. The Modern Solution: Next.js, TypeScript & Cloud Edge

Instead of forcing your business into rigid off-the-shelf molds, modern custom engineering delivers lightweight web applications tailored strictly around your real bottlenecks.

### Architectural Advantages:
- Sub-Second Performance: Utilizing Next.js (App Router) and React Server Components ensures dashboards load instantly, even over standard 4G mobile networks in regional hubs.
- Single Source of Truth Database: High-speed PostgreSQL or MongoDB databases unify warehouses, accounting desks, and mobile field staff in real time.
- Automated WhatsApp Integration: Verified orders trigger official PDF invoices directly to buyers, eliminating manual paper preparation.
- 100% Intellectual Property Ownership: You own the entire Git source code repository and cloud deployment infrastructure with zero recurring software licensing fees.

---

## 4. Feature Comparison: Legacy Workflows vs Palnadu.dev Web Platforms

| Workflow Dimension | Fragmented Excel & WhatsApp | Palnadu.dev Custom Web Platform |
|---|---|---|
| Data Sync Speed | Delayed / Evening Manual Reconciliations | Instant Real-Time Cloud Persistence |
| Mobile Accessibility | Awkward Pinch-to-Zoom Spreadsheets | Mobile-First Responsive Interface |
| Human Error Rate | High (accidental formula overwrites) | Built-in Form Validation Rules |
| Client Transparency | Informal Verbal Updates | Automated WhatsApp PDF Invoices |
| Long-Term Cost | Recurring Staff Hours Wasted | One-Time Investment, Zero Per-User Fees |

---

## 5. Actionable 3-Step Implementation Roadmap

If your business is ready to streamline operations, follow this practical approach:

### Step 1: Diagnose the Single Biggest Bottleneck
Do not attempt to automate everything at once. Identify the single process where staff spend the most wasted time—whether it is order entry, billing calculations, or student admissions.

### Step 2: Build a Focused MVP (3 to 6 Weeks)
Commission a lean Minimum Viable Product with fixed scope boundaries. Launch it to core staff, gather immediate feedback, and iron out operational edge cases.

### Step 3: Expand Incrementally
Once the primary workflow is operating smoothly, connect secondary integrations such as automated payment alerts, inventory deductions, and executive analytics summaries.

---

## Partner with Senior Software Engineers

Whether you are automating an established regional business or launching a brand-new digital startup, our team provides honest technical advice and clean code.

Explore our [Web Application Development Services](/services/web-development), learn about [Custom Software Solutions](/services/custom-software), or reach out directly through our [Contact Page](/contact) to discuss your project.`;

    const excerpt = `Discover how modern web applications and business automation eliminate operational bottlenecks, spreadsheet errors, and WhatsApp chaos for growing enterprises in ${locationContext}.`;

    const metaTitle = `${topicTitle.slice(0, 45)} | Palnadu.dev`;
    const metaDescription = excerpt.slice(0, 155);

    return {
      // Identical body for every topic except the title/location substitution.
      // Flagged so publishing validation can block auto-publication.
      isTemplateFallback: true,
      title: topicTitle,
      slug,
      h1: topicTitle,
      excerpt,
      content,
      metaTitle,
      metaDescription,
      seoTitle: metaTitle,
      seoDescription: metaDescription,
      canonicalUrl: `/blog/${slug}`,
      keywords: [
        'software development Palnadu',
        'web application development Guntur',
        'business automation software Andhra Pradesh',
        'custom software engineering',
      ],
      primaryKeyword: s.primaryKeyword,
      secondaryKeywords: s.secondaryKeywords,
      relatedKeywords: s.relatedKeywords,
      longTailKeywords: s.longTailKeywords,
      searchIntent: s.searchIntent,
      h2Headings: extractHeadings(content, 2),
      h3Headings: extractHeadings(content, 3),
      internalLinks: s.internalLinks,
      externalReferences: s.externalReferences,
      imageSuggestions: s.imageSuggestions,
      faq: [
        {
          q: `How does custom software benefit businesses in ${locationContext}?`,
          a: 'Custom software is engineered around your exact commercial workflow, eliminates recurring per-user monthly SaaS fees, and provides 100% code and data ownership.',
        },
        {
          q: 'Can our staff access the web application on smartphones?',
          a: 'Yes. All platforms built by Palnadu.dev are mobile-first, responsive, and optimized to run smoothly on standard 4G and 5G connections.',
        },
        {
          q: 'How long does development take?',
          a: 'We deliver focused, practical Minimum Viable Products (MVPs) in rapid 3-to-6-week sprints.',
        },
      ],
      categorySlug,
      tags: s.tags,
      readingMinutes: Math.ceil(content.split(/\s+/).length / 220),
      llmProvider: 'fallback:structured-template',
    } as GeneratedBlogDraft & { llmProvider: string };
  }
}
