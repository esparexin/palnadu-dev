import { Logger } from '@nestjs/common';
import { SeoStrategy, parseLooseJson } from '../seo-strategy';

export interface LlmApiKeys {
  geminiApiKey?: string;
  anthropicApiKey?: string;
  openaiApiKey?: string;
}

export async function callLlmProvider(
  systemPrompt: string,
  userPrompt: string,
  _strategy: SeoStrategy,
  keys: LlmApiKeys,
  logger: Logger,
): Promise<{ draft: any; provider: string } | null> {
  const { geminiApiKey, anthropicApiKey, openaiApiKey } = keys;

  // 1. Try Google Gemini if configured (with automatic model resilience fallback)
  if (geminiApiKey) {
    const geminiModels = ['gemini-3.6-flash', 'gemini-3.5-flash', 'gemini-3.8-flash'];
    for (const model of geminiModels) {
      try {
        const res = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`,
          {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            signal: AbortSignal.timeout(45000),
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
            logger.log(`Successfully generated content via live Google Gemini (${model})`);
            return { draft: parseLooseJson(rawText), provider: `gemini:${model}` };
          }
        } else {
          const errText = await res.text();
          logger.warn(`Gemini API (${model}) returned ${res.status}: ${errText}`);
        }
      } catch (err) {
        logger.warn(`Gemini generation (${model}) failed: ${err instanceof Error ? err.message : err}`);
      }
    }
  }

  // 2. Try Anthropic Claude if configured
  if (anthropicApiKey) {
    try {
      const res = await fetch('https://api.anthropic.com/v1/messages', {
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
      logger.warn(`Claude generation failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  // 3. Try OpenAI if configured
  if (openaiApiKey) {
    try {
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
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
      logger.warn(`OpenAI generation failed: ${err instanceof Error ? err.message : err}`);
    }
  }

  return null;
}
