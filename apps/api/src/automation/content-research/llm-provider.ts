import { Logger } from '@nestjs/common';
import { DEFAULT_GEMINI_MODELS } from '@palnadu/types';
import { SeoStrategy, parseLooseJson } from '../seo-strategy';
import {
  buildOrderedGeminiModels,
  executeWithGeminiRetry,
  GeminiRetryConfig,
} from '../gemini-verification/gemini-retry.util';
import {
  redactGeminiSecrets,
  type ParsedGoogleFailure,
} from '../gemini-verification/gemini-error-classifier.util';

export { DEFAULT_GEMINI_MODELS };

export interface LlmApiKeys {
  geminiApiKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
  geminiModel?: string;
}

export interface LlmCallOptions {
  fetchFn?: typeof fetch;
  retry?: GeminiRetryConfig;
}

export interface LlmCallDetailedResult {
  result: { draft: any; provider: string } | null;
  geminiFailure?: ParsedGoogleFailure | null;
}

export function getGeminiModelsToTry(preferredModel?: string): string[] {
  return buildOrderedGeminiModels(preferredModel);
}

export interface GeminiFallbackOutcome {
  ok: boolean;
  text?: string;
  model?: string;
  failure?: ParsedGoogleFailure | null;
}

export async function generateGeminiWithFallback(params: {
  geminiApiKey: string;
  preferredModel?: string;
  contents: any[];
  generationConfig: Record<string, any>;
  logger?: Logger;
  options?: LlmCallOptions;
}): Promise<GeminiFallbackOutcome> {
  const fetchFn = params.options?.fetchFn || globalThis.fetch;
  const geminiModels = getGeminiModelsToTry(params.preferredModel);
  const retryCfg: GeminiRetryConfig = { timeoutMs: 45000, maxRetries: 2, ...params.options?.retry };
  let lastFailure: ParsedGoogleFailure | null = null;

  for (const model of geminiModels) {
    const outcome = await executeWithGeminiRetry<any>({
      fetchFn,
      url: `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(params.geminiApiKey)}`,
      init: {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: params.contents, generationConfig: params.generationConfig }),
      },
      stage: 'generate',
      rawSecretToRedact: params.geminiApiKey,
      retry: retryCfg,
    });

    if (outcome.ok) {
      const rawText = outcome.body?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (typeof rawText === 'string' && rawText.trim().length > 0) {
        return { ok: true, text: rawText, model };
      }
      lastFailure = {
        code: 'TEMPORARY_PROVIDER_ERROR',
        status: 'Temporary Provider Error',
        quotaStatus: 'Active',
        permissionStatus: 'Granted',
        isTemporary: true,
        retryable: false,
        modelSpecific: true,
        stopAllModels: false,
        detail: `Gemini (${model}) returned an empty response payload.`,
      };
      continue;
    }

    if (outcome.failure) {
      lastFailure = outcome.failure;
      const safeDetail = redactGeminiSecrets(outcome.failure.detail, params.geminiApiKey);
      params.logger?.warn(
        `Gemini API (${model}) failed [${outcome.failure.code}, attempts=${outcome.attempts}, temporary=${outcome.failure.isTemporary}]: ${safeDetail}`,
      );
      if (outcome.failure.stopAllModels) break;
    }
  }

  return { ok: false, failure: lastFailure };
}

export async function callLlmProviderDetailed(
  systemPrompt: string,
  userPrompt: string,
  _strategy: SeoStrategy,
  keys: LlmApiKeys,
  logger: Logger,
  options?: LlmCallOptions,
): Promise<LlmCallDetailedResult> {
  const { geminiApiKey, anthropicApiKey, openaiApiKey, geminiModel } = keys;
  const fetchFn = options?.fetchFn || globalThis.fetch;
  let geminiFailure: ParsedGoogleFailure | null = null;

  if (geminiApiKey) {
    const gem = await generateGeminiWithFallback({
      geminiApiKey,
      preferredModel: geminiModel,
      contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
      generationConfig: { responseMimeType: 'application/json', temperature: 0.7, maxOutputTokens: 8192 },
      logger,
      options,
    });
    if (gem.ok && gem.text) {
      logger.log(`Successfully generated content via live Google Gemini (${gem.model})`);
      return { result: { draft: parseLooseJson(gem.text), provider: `gemini:${gem.model}` } };
    }
    geminiFailure = gem.failure ?? null;
  }

  if (anthropicApiKey) {
    try {
      const res = await fetchFn('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': anthropicApiKey,
          'anthropic-version': '2023-06-01',
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 4000,
          system: systemPrompt,
          messages: [{ role: 'user', content: `${userPrompt}\n\nOutput only valid JSON.` }],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.content?.[0]?.text;
        if (text) {
          return { result: { draft: parseLooseJson(text), provider: 'anthropic:claude-3-5-sonnet' }, geminiFailure };
        }
      }
    } catch (err) {
      logger.warn(`Claude generation failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  if (openaiApiKey) {
    try {
      const res = await fetchFn('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${openaiApiKey}` },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          response_format: { type: 'json_object' },
          messages: [{ role: 'system', content: systemPrompt }, { role: 'user', content: userPrompt }],
        }),
      });
      if (res.ok) {
        const json = await res.json();
        const text = json.choices?.[0]?.message?.content;
        if (text) {
          return { result: { draft: parseLooseJson(text), provider: 'openai:gpt-4o-mini' }, geminiFailure };
        }
      }
    } catch (err) {
      logger.warn(`OpenAI generation failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  return { result: null, geminiFailure };
}

export async function callLlmProvider(
  systemPrompt: string,
  userPrompt: string,
  strategy: SeoStrategy,
  keys: LlmApiKeys,
  logger: Logger,
  options?: LlmCallOptions,
): Promise<{ draft: any; provider: string } | null> {
  const { result } = await callLlmProviderDetailed(systemPrompt, userPrompt, strategy, keys, logger, options);
  return result;
}
