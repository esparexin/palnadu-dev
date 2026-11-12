import { DEFAULT_GEMINI_MODELS } from '@palnadu/types';
import {
  classifyGoogleError,
  GeminiProbeStage,
  ParsedGoogleFailure,
  redactGeminiSecrets,
  VERIFICATION_CODE_TO_LABEL,
} from './gemini-error-classifier.util';

export interface GeminiRetryConfig {
  timeoutMs?: number;
  maxRetries?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
  jitterRatio?: number;
  deadlineAt?: number;
  nowFn?: () => number;
  sleepFn?: (ms: number) => Promise<void>;
  randomFn?: () => number;
}

export const INTERACTIVE_VERIFY_OVERALL_TIMEOUT_MS = 26000;
export const INTERACTIVE_VERIFY_RETRY: GeminiRetryConfig = {
  timeoutMs: 7000,
  maxRetries: 1,
  baseDelayMs: 300,
  maxDelayMs: 1200,
};

export interface RetryAttemptOutcome<T = unknown> {
  ok: boolean;
  httpStatus: number;
  headers: Headers;
  body: T | null;
  latencyMs: number;
  attempts: number;
  failure?: ParsedGoogleFailure;
}

export function buildOrderedGeminiModels(
  preferredModel?: string,
  envModel = process.env.GEMINI_MODEL,
): string[] {
  const ordered = [preferredModel?.trim(), envModel?.trim(), ...DEFAULT_GEMINI_MODELS].filter(
    (m): m is string => Boolean(m && m.length > 0),
  );
  return [...new Set(ordered)];
}

/**
 * Bounds a single model probe within the shared deadline so slow earlier
 * models do not starve remaining fallback models inside interactive budgets.
 */
export function computeModelProbeDeadline(params: {
  deadlineAt?: number;
  nowMs: number;
  remainingModels: number;
  minSliceMs?: number;
}): number | undefined {
  const { deadlineAt, nowMs, remainingModels, minSliceMs = 2500 } = params;
  if (deadlineAt === undefined) return undefined;
  const remainingBudget = deadlineAt - nowMs;
  if (remainingBudget <= 0 || remainingModels <= 1) return deadlineAt;
  const sliceMs = Math.max(minSliceMs, Math.floor(remainingBudget / remainingModels));
  return Math.min(deadlineAt, nowMs + sliceMs);
}

export function resolveRetrySettings(cfg?: GeminiRetryConfig) {
  const envTimeout = Number(process.env.GEMINI_REQUEST_TIMEOUT_MS);
  const envRetries = Number(process.env.GEMINI_MAX_RETRIES);
  return {
    timeoutMs: clampNum(cfg?.timeoutMs ?? (Number.isFinite(envTimeout) ? envTimeout : 12000), 500, 60000),
    maxRetries: clampNum(cfg?.maxRetries ?? (Number.isFinite(envRetries) ? envRetries : 2), 0, 5),
    baseDelayMs: clampNum(cfg?.baseDelayMs ?? 450, 0, 10000),
    maxDelayMs: clampNum(cfg?.maxDelayMs ?? 4000, 0, 20000),
    jitterRatio: Math.min(Math.max(cfg?.jitterRatio ?? 0.25, 0), 0.5),
    deadlineAt: cfg?.deadlineAt,
    nowFn: cfg?.nowFn ?? Date.now,
    sleepFn: cfg?.sleepFn ?? ((ms: number) => new Promise<void>((resolve) => setTimeout(resolve, ms))),
    randomFn: cfg?.randomFn ?? Math.random,
  };
}

function clampNum(value: number, min: number, max: number): number {
  if (!Number.isFinite(value)) return min;
  return Math.min(Math.max(value, min), max);
}

export function computeBackoffDelayMs(
  retryAttemptIndex: number,
  settings: ReturnType<typeof resolveRetrySettings>,
): number {
  if (settings.baseDelayMs <= 0) return 0;
  const exponential = Math.min(settings.maxDelayMs, settings.baseDelayMs * Math.pow(2, retryAttemptIndex));
  const spread = exponential * settings.jitterRatio;
  const jitter = (settings.randomFn() * 2 - 1) * spread;
  return Math.max(0, Math.round(Math.min(settings.maxDelayMs, exponential + jitter)));
}

export async function executeWithGeminiRetry<T = any>(params: {
  fetchFn: typeof fetch;
  url: string;
  init: RequestInit;
  stage: GeminiProbeStage;
  rawSecretToRedact?: string;
  retry?: GeminiRetryConfig;
}): Promise<RetryAttemptOutcome<T>> {
  const settings = resolveRetrySettings(params.retry);
  const overallStart = settings.nowFn();
  let lastOutcome: RetryAttemptOutcome<T> | null = null;

  for (let attempt = 0; attempt <= settings.maxRetries; attempt++) {
    if (attempt > 0) {
      const delayMs = computeBackoffDelayMs(attempt - 1, settings);
      if (settings.deadlineAt !== undefined && settings.nowFn() + delayMs >= settings.deadlineAt - 200) {
        break;
      }
      if (delayMs > 0) await settings.sleepFn(delayMs);
    }

    const remainingMs = settings.deadlineAt !== undefined ? settings.deadlineAt - settings.nowFn() : settings.timeoutMs;
    if (settings.deadlineAt !== undefined && remainingMs < 200) {
      if (lastOutcome) return lastOutcome;
      return {
        ok: false,
        httpStatus: 408,
        headers: new Headers(),
        body: null,
        latencyMs: Math.max(0, settings.nowFn() - overallStart),
        attempts: attempt,
        failure: {
          code: 'TEMPORARY_PROVIDER_ERROR',
          status: VERIFICATION_CODE_TO_LABEL.TEMPORARY_PROVIDER_ERROR,
          quotaStatus: 'Unknown',
          permissionStatus: 'Granted',
          isTemporary: true,
          retryable: false,
          modelSpecific: false,
          stopAllModels: false,
          detail: 'Verification time budget exceeded before completing probe.',
        },
      };
    }

    const attemptTimeoutMs = Math.min(settings.timeoutMs, Math.max(200, remainingMs));
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), attemptTimeoutMs);
    try {
      const res = await params.fetchFn(params.url, { ...params.init, signal: controller.signal });
      const body = await res.json().catch(() => null);
      if (res.ok) {
        return {
          ok: true,
          httpStatus: res.status,
          headers: res.headers ?? new Headers(),
          body,
          latencyMs: Math.max(0, settings.nowFn() - overallStart),
          attempts: attempt + 1,
        };
      }

      const failure = classifyGoogleError(res.status, body, params.stage);
      failure.detail = redactGeminiSecrets(failure.detail, params.rawSecretToRedact);
      lastOutcome = {
        ok: false,
        httpStatus: res.status,
        headers: res.headers ?? new Headers(),
        body,
        latencyMs: Math.max(0, settings.nowFn() - overallStart),
        attempts: attempt + 1,
        failure,
      };
      if (!failure.retryable || failure.stopAllModels) return lastOutcome;
    } catch (err: any) {
      const isAbort = err?.name === 'AbortError' || String(err?.message || '').toLowerCase().includes('abort');
      const failure: ParsedGoogleFailure = {
        code: 'TEMPORARY_PROVIDER_ERROR',
        status: VERIFICATION_CODE_TO_LABEL.TEMPORARY_PROVIDER_ERROR,
        quotaStatus: 'Unknown',
        permissionStatus: 'Granted',
        isTemporary: true,
        retryable: true,
        modelSpecific: false,
        stopAllModels: false,
        detail: isAbort
          ? `Request timed out after ${attemptTimeoutMs}ms`
          : redactGeminiSecrets(err?.message || 'Network connection failed', params.rawSecretToRedact),
      };
      lastOutcome = {
        ok: false,
        httpStatus: isAbort ? 408 : 0,
        headers: new Headers(),
        body: null,
        latencyMs: Math.max(0, settings.nowFn() - overallStart),
        attempts: attempt + 1,
        failure,
      };
    } finally {
      clearTimeout(timer);
    }
  }

  return lastOutcome!;
}
