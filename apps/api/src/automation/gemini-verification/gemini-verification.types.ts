import type { GeminiRetryConfig } from './gemini-retry.util';

export {
  DEFAULT_GEMINI_MODELS,
  type GeminiVerificationCode,
  type GeminiFailureCategory,
  type GeminiAuthenticationStatus,
  type GeminiVerificationStatus,
  type ModelAccessStatus,
  type GeminiPendingCandidateSummary,
  type GeminiKeyVerificationResult,
  type GeminiKeyAuditEntry,
  type ActiveGeminiKeySummary,
} from '@palnadu/types';

export interface VerifyKeyOptions {
  primaryModel?: string;
  testModels?: string[];
  overallTimeoutMs?: number;
  fetchFn?: typeof fetch;
  retry?: GeminiRetryConfig;
}
