import { geminiKeyInputSchema, type GeminiKeyInput } from '@palnadu/validation';

export type GeminiActivationTarget = 'candidate' | 'pending' | 'none';

export type CandidateValidationOutcome =
  | { ok: true; data: GeminiKeyInput }
  | { ok: false; error: string };

/**
 * Validates candidate Gemini key and optional model using the shared SSOT Zod schema.
 */
export function validateCandidateGeminiInput(
  apiKey: string,
  primaryModel?: string,
): CandidateValidationOutcome {
  const trimmedKey = apiKey.trim();
  if (!trimmedKey) {
    return { ok: false, error: 'Please enter a Gemini API Key to verify.' };
  }

  const trimmedModel = primaryModel?.trim() || undefined;
  const parsed = geminiKeyInputSchema.safeParse({
    apiKey: trimmedKey,
    ...(trimmedModel ? { primaryModel: trimmedModel } : {}),
  });

  if (!parsed.success) {
    return {
      ok: false,
      error: parsed.error.issues[0]?.message || 'Invalid Gemini API key format.',
    };
  }

  return { ok: true, data: parsed.data };
}

/**
 * Resolves whether modal activation targets the typed candidate key or a preserved pending key.
 */
export function resolveActivationTarget(
  candidateKey: string,
  hasPendingCandidate: boolean,
): GeminiActivationTarget {
  if (candidateKey.trim().length > 0) return 'candidate';
  if (hasPendingCandidate) return 'pending';
  return 'none';
}
