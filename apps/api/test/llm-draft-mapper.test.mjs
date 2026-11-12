import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Logger } from '@nestjs/common';
import {
  mapLlmDraftToBlogDraft,
  normalizeSearchIntent,
} from '../dist/automation/content-research/draft-mapper.util.js';
import { callLlmProviderDetailed } from '../dist/automation/content-research/llm-provider.js';
import { defaultStrategy, VALID_INTENTS } from '../dist/automation/seo-strategy.js';
import { ContentResearchService } from '../dist/automation/content-research.service.js';

describe('LLM Draft SearchIntent Normalization & Generation Config', () => {
  it('normalizes lowercase, spaced, hyphenated, and aliased searchIntent values to VALID_INTENTS', () => {
    assert.equal(normalizeSearchIntent('informational', 'LOCAL'), 'INFORMATIONAL');
    assert.equal(normalizeSearchIntent('Commercial Investigation', 'INFORMATIONAL'), 'COMMERCIAL_INVESTIGATION');
    assert.equal(normalizeSearchIntent('how-to', 'INFORMATIONAL'), 'HOW_TO');
    assert.equal(normalizeSearchIntent('problem_solving', 'INFORMATIONAL'), 'PROBLEM_SOLING');
    assert.equal(normalizeSearchIntent('Guide', 'INFORMATIONAL'), 'HOW_TO');
    assert.equal(normalizeSearchIntent('Product Research', 'INFORMATIONAL'), 'PRODUCT_SERVICE_RESEARCH');
  });

  it('falls back to strategy.searchIntent when LLM emits an unrecognized searchIntent', () => {
    assert.equal(normalizeSearchIntent('Thought Leadership', 'COMMERCIAL_INVESTIGATION'), 'COMMERCIAL_INVESTIGATION');
    assert.equal(normalizeSearchIntent('', 'LOCAL'), 'LOCAL');

    const strategy = defaultStrategy('Clinic management system in Vinukonda', 'website-development', 'Vinukonda');
    const draft = mapLlmDraftToBlogDraft({
      llmDraft: {
        title: 'How Clinic Management Systems Help Vinukonda Practices',
        slug: 'clinic-management-vinukonda',
        content: Array.from({ length: 700 }, (_, i) => `word${i}`).join(' '),
        searchIntent: 'educational-overview',
      },
      provider: 'gemini:gemini-3.8-flash',
      topicTitle: 'Clinic management system in Vinukonda',
      categorySlug: 'website-development',
      locationContext: 'Vinukonda',
      strategy,
      writeTelugu: false,
    });

    assert.ok(VALID_INTENTS.has(draft.searchIntent));
    assert.equal(draft.searchIntent, strategy.searchIntent);
  });

  it('includes maxOutputTokens 8192 and explicit VALID_INTENTS guidance during article generation', async () => {
    let capturedBody = null;
    const mockFetch = async (url, init) => {
      if (String(url).includes('suggestqueries.google.com')) {
        return { ok: true, json: async () => ['', []] };
      }
      capturedBody = JSON.parse(init.body);
      return {
        ok: true,
        status: 200,
        headers: new Headers(),
        json: async () => ({
          candidates: [
            {
              content: {
                parts: [
                  {
                    text: JSON.stringify({
                      title: 'Clinic Management Systems in Vinukonda Guide',
                      slug: 'clinic-management-systems-vinukonda-guide',
                      content: Array.from({ length: 750 }, (_, i) => `clinic${i}`).join(' '),
                      searchIntent: 'Commercial Investigation',
                    }),
                  },
                ],
              },
            },
          ],
        }),
      };
    };

    const configService = { get: (k) => (k === 'GEMINI_API_KEY' ? 'AIzaSyFakeTestKey1234567890' : undefined) };
    const research = new ContentResearchService(configService);
    const strategy = defaultStrategy('Clinic Management Systems in Vinukonda', 'website-development', 'Vinukonda');

    const draft = await research.generateArticle(
      'Clinic Management Systems in Vinukonda',
      'website-development',
      'Vinukonda',
      strategy,
      'en',
      { fetchFn: mockFetch },
    );

    assert.equal(capturedBody.generationConfig.maxOutputTokens, 8192);
    assert.equal(capturedBody.generationConfig.responseMimeType, 'application/json');
    const promptText = capturedBody.contents[0].parts[0].text;
    assert.match(promptText, /COMMERCIAL_INVESTIGATION/);
    assert.match(promptText, /800 to 1,200 words/);
    assert.equal(draft.searchIntent, 'COMMERCIAL_INVESTIGATION');

    const providerDirect = await callLlmProviderDetailed(
      'sys',
      'user',
      strategy,
      { geminiApiKey: 'AIzaSyFakeTestKey1234567890' },
      new Logger('test'),
      { fetchFn: mockFetch },
    );
    assert.ok(providerDirect.result);
    assert.equal(capturedBody.generationConfig.maxOutputTokens, 8192);
  });
});

