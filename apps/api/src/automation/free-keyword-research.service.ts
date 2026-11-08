import { Injectable, Logger } from '@nestjs/common';
import { SourceConfidence, TopicMetrics } from './seo-sources';
import { BacklinkOpportunity } from './seo-strategy';

export interface KeywordSuggestion {
  keyword: string;
  relevanceScore: number;
  intent: 'transactional' | 'informational' | 'commercial' | 'local';
  source: string;
  confidence: SourceConfidence;
  metrics: TopicMetrics;
}

@Injectable()
export class FreeKeywordResearchService {
  private readonly logger = new Logger(FreeKeywordResearchService.name);

  /**
   * Fetches real-time suggestions from Google's public India search engine
   */
  async getGoogleSuggestions(seed: string): Promise<string[]> {
    for (const client of ['firefox', 'chrome']) {
      try {
        const url = `https://suggestqueries.google.com/complete/search?client=${client}&q=${encodeURIComponent(seed)}&gl=in&hl=en`;
        const res = await fetch(url, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
          },
        });

        if (res.ok) {
          const json = await res.json();
          if (Array.isArray(json[1]) && json[1].length > 0) {
            return json[1];
          }
        }
      } catch (err) {
        this.logger.warn(`Google Suggest lookup failed for "${seed}" (${client}): ${err instanceof Error ? err.message : err}`);
      }
    }
    return [];
  }

  /**
   * Explores seed topics across locations and intent modifiers
   * Produces a clean, deduplicated list of real-world Google search terms
   */
  async discoverKeywords(
    seedTopic: string,
    location?: string,
  ): Promise<KeywordSuggestion[]> {
    const rawSuggestions = new Set<string>();
    const searchSeeds = [
      seedTopic,
      `${seedTopic} in ${location || 'Guntur'}`,
      `${seedTopic} in ${location || 'Palnadu'}`,
      `${seedTopic} cost`,
      `${seedTopic} price`,
    ];

    // Query Google suggestions in parallel
    const batches = await Promise.all(
      searchSeeds.map((seed) => this.getGoogleSuggestions(seed)),
    );

    batches.forEach((list) => {
      list.forEach((kw) => {
        const cleaned = kw.trim().toLowerCase();
        if (cleaned && cleaned.length > 3) {
          rawSuggestions.add(cleaned);
        }
      });
    });

    // Score and classify intent
    const results: KeywordSuggestion[] = Array.from(rawSuggestions).map((kw, index) => {
      let intent: KeywordSuggestion['intent'] = 'commercial';
      if (kw.includes('cost') || kw.includes('price') || kw.includes('buy') || kw.includes('charges')) {
        intent = 'transactional';
      } else if (kw.includes('near me') || kw.includes('in guntur') || kw.includes('in palnadu') || kw.includes('narasaraopet')) {
        intent = 'local';
      } else if (kw.includes('how') || kw.includes('what') || kw.includes('meaning') || kw.includes('free')) {
        intent = 'informational';
      }

      return {
        keyword: kw,
        relevanceScore: Math.max(10, 100 - index * 3),
        intent,
        source: 'Google Live Autocomplete (India)',
        confidence: 'verified_google',
        metrics: {
          searchVolume: null,
          keywordDifficulty: null,
          cpc: null,
          domainAuthority: null,
          backlinks: null,
          status: 'unavailable',
          notes: 'Search volume & CPC metrics unavailable without Google Ads API; suggestions verified via Google Suggest.',
        },
      };
    });

    return results;
  }

  /**
   * Discovers customer questions and long-tail FAQs using Google question patterns
   * (Replaces AnswerThePublic subscription).
   */
  async discoverCustomerQuestions(seedTopic: string, location?: string): Promise<KeywordSuggestion[]> {
    const loc = location || 'Palnadu and Guntur';
    const starters = [
      `how much does ${seedTopic} cost in ${loc}`,
      `how to choose ${seedTopic} for business`,
      `why do businesses need ${seedTopic}`,
      `what is the best ${seedTopic} in ${loc}`,
      `is ${seedTopic} worth it for small business`,
    ];

    const batches = await Promise.all(starters.map((s) => this.getGoogleSuggestions(s)));
    const out: KeywordSuggestion[] = [];
    const seen = new Set<string>();

    batches.forEach((list, starterIdx) => {
      const parent = starters[starterIdx];
      list.forEach((kw) => {
        const cleaned = kw.trim();
        if (cleaned.length > 5 && !seen.has(cleaned.toLowerCase())) {
          seen.add(cleaned.toLowerCase());
          out.push({
            keyword: cleaned,
            relevanceScore: 90,
            intent: 'informational',
            source: 'Google Live Question Autocomplete',
            confidence: 'verified_google',
            metrics: {
              searchVolume: null,
              keywordDifficulty: null,
              cpc: null,
              domainAuthority: null,
              backlinks: null,
              status: 'unavailable',
              notes: 'Question suggestions verified via Google Suggest.',
            },
          });
        }
      });
      if (parent && !seen.has(parent.toLowerCase())) {
        seen.add(parent.toLowerCase());
        out.push({
          keyword: parent,
          relevanceScore: 85,
          intent: 'informational',
          source: 'AI-Generated Question Pattern',
          confidence: 'ai_suggestion',
          metrics: {
            searchVolume: null,
            keywordDifficulty: null,
            cpc: null,
            domainAuthority: null,
            backlinks: null,
            status: 'unavailable',
            notes: 'AI-assisted customer question pattern.',
          },
        });
      }
    });

    return out.slice(0, 20);
  }

  /**
   * Discovers competitor queries and commercial comparison gaps
   * (Replaces SEMrush subscription).
   */
  async discoverCompetitorQueries(seedTopic: string, location?: string): Promise<KeywordSuggestion[]> {
    const loc = location || 'Guntur';
    const comparisonSeeds = [
      `${seedTopic} vs`,
      `${seedTopic} alternatives`,
      `best ${seedTopic} company in ${loc}`,
      `${seedTopic} pricing in ${loc}`,
    ];

    const batches = await Promise.all(comparisonSeeds.map((s) => this.getGoogleSuggestions(s)));
    const out: KeywordSuggestion[] = [];
    const seen = new Set<string>();

    batches.forEach((list) => {
      list.forEach((kw) => {
        const cleaned = kw.trim();
        if (cleaned.length > 4 && !seen.has(cleaned.toLowerCase())) {
          seen.add(cleaned.toLowerCase());
          out.push({
            keyword: cleaned,
            relevanceScore: 85,
            intent: 'commercial',
            source: 'Google Competitor Autocomplete',
            confidence: 'verified_google',
            metrics: {
              searchVolume: null,
              keywordDifficulty: null,
              cpc: null,
              domainAuthority: null,
              backlinks: null,
              status: 'unavailable',
              notes: 'Competitor comparison queries verified via Google Suggest.',
            },
          });
        }
      });
    });

    return out;
  }

  /**
   * Discovers realistic regional backlink and directory outreach opportunities
   * (Replaces Ahrefs backlink recommendation subscription).
   *
   * Crucially: Never fabricates DR, DA, or backlink counts.
   */
  async discoverBacklinkOpportunities(topic: string, location?: string): Promise<BacklinkOpportunity[]> {
    const loc = location || 'Palnadu and Guntur, Andhra Pradesh';
    return [
      {
        sourceName: 'Andhra Pradesh MSME & Industry Directory',
        category: 'business_directory',
        urlHint: 'https://msme.ap.gov.in',
        outreachAngle: `Listing Palnadu.dev as a verified technology and ${topic} service provider in ${loc}`,
        confidence: 'ai_suggestion',
      },
      {
        sourceName: 'Guntur District Chamber of Commerce and Industry',
        category: 'regional_chamber',
        outreachAngle: `Co-authoring regional digital transformation guide for business owners regarding ${topic}`,
        confidence: 'ai_suggestion',
      },
      {
        sourceName: 'Andhra Chamber of Commerce & Trade Associations',
        category: 'industry_association',
        outreachAngle: `Vendor case study on cost-effective regional software modernization and ${topic}`,
        confidence: 'ai_suggestion',
      },
      {
        sourceName: 'IndiaMart & TradeIndia Regional Tech Profiles',
        category: 'business_directory',
        outreachAngle: `Verified local engineering supplier registration for enterprises in ${loc}`,
        confidence: 'ai_suggestion',
      },
      {
        sourceName: 'Regional Business & Tech Resource Guides',
        category: 'resource_page',
        outreachAngle: `Educational resource citations explaining ${topic} implementation architectures`,
        confidence: 'ai_suggestion',
      },
    ];
  }
}
