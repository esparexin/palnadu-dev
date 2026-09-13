import { Injectable, Logger } from '@nestjs/common';

export interface KeywordSuggestion {
  keyword: string;
  relevanceScore: number;
  intent: 'transactional' | 'informational' | 'commercial' | 'local';
  source: string;
}

@Injectable()
export class FreeKeywordResearchService {
  private readonly logger = new Logger(FreeKeywordResearchService.name);

  // Common high-intent modifiers used by regional Indian searchers
  private readonly intentModifiers = [
    'cost',
    'price',
    'near me',
    'for shop',
    'for business',
    'for school',
    'for retail',
    'best',
    'affordable',
    'low cost',
  ];

  // Core regional locations in Andhra Pradesh
  private readonly defaultLocations = [
    'Guntur',
    'Palnadu',
    'Narasaraopet',
    'Chilakaluripet',
    'Andhra Pradesh',
  ];

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
      };
    });

    return results;
  }
}
