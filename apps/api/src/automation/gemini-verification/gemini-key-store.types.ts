import { DEFAULT_GEMINI_MODELS } from '@palnadu/types';
import type { EncryptedPayload } from './gemini-crypto.util';
import type {
  ActiveGeminiKeySummary,
  GeminiKeyAuditEntry,
  GeminiKeyVerificationResult,
  GeminiPendingCandidateSummary,
  GeminiVerificationCode,
} from './gemini-verification.types';
import { maskApiKey } from './gemini-verification.util';

export const SETTING_KEY_ENCRYPTED = 'gemini_api_key_encrypted';
export const SETTING_KEY_PENDING_ENCRYPTED = 'gemini_pending_candidate_encrypted';
export const SETTING_KEY_AUDIT_LOG = 'gemini_api_key_audit_log';
export const MAX_AUDIT_ENTRIES = 50;

export interface StoredEncryptedRecord extends EncryptedPayload {
  maskedKey: string;
  verificationResult: GeminiKeyVerificationResult;
  primaryModel?: string;
  activatedAt: string;
  activatedBy: string;
}

export interface StoredPendingCandidateRecord {
  cleared?: boolean;
  encrypted?: EncryptedPayload;
  maskedKey?: string;
  primaryModel?: string;
  status?: 'PENDING_VERIFICATION';
  lastFailureCode?: GeminiVerificationCode;
  lastFailureMessage?: string;
  verificationSnapshot?: GeminiKeyVerificationResult;
  submittedBy?: string;
  submittedAt?: string;
  lastCheckedAt?: string;
  attemptCount?: number;
}

export function buildAuditEntry(
  entry: Omit<GeminiKeyAuditEntry, 'id' | 'timestamp'>,
): GeminiKeyAuditEntry {
  const randomSuffix = Math.random().toString(36).slice(2, 7);
  return {
    id: `audit_${Date.now()}_${randomSuffix}`,
    timestamp: new Date().toISOString(),
    ...entry,
  };
}

export function buildDatabaseKeyStatus(
  data: StoredEncryptedRecord,
  pendingCandidate: GeminiPendingCandidateSummary | null = null,
): ActiveGeminiKeySummary {
  const v = data.verificationResult;
  const fallbackModel = data.primaryModel || v?.activeUsableModel || v?.models?.tested?.[0]?.model || DEFAULT_GEMINI_MODELS[0];
  return {
    configured: true,
    source: 'database',
    maskedKey: data.maskedKey,
    verificationCode: v?.verificationCode || 'VERIFIED',
    verificationStatus: v?.verificationStatus || 'Verified',
    authenticationStatus: v?.authenticationStatus || 'AUTHENTICATED',
    failureCategory: v?.failureCategory,
    isTemporary: Boolean(v?.isTemporary),
    fallbackUsed: Boolean(v?.fallbackUsed),
    activeUsableModel: v?.activeUsableModel || fallbackModel,
    availableModels: [...DEFAULT_GEMINI_MODELS],
    isValid: Boolean(v?.isValid),
    isUsableForGeneration: Boolean(v?.isUsableForGeneration),
    project: v?.project || { id: null, name: null, status: 'Project Not Identified' },
    account: v?.account || { email: null, status: 'Account Identity Unavailable' },
    models: v?.models || { tested: [], supportedCount: 0 },
    quota: v?.quota || { status: 'Unknown' },
    permissions: v?.permissions || { status: 'Granted' },
    pendingCandidate,
    verifiedAt: v?.verifiedAt || null,
    primaryModel: fallbackModel,
    activatedAt: data.activatedAt || null,
    activatedBy: data.activatedBy || null,
  };
}

export function buildEnvKeyStatus(
  envKey: string,
  pendingCandidate: GeminiPendingCandidateSummary | null = null,
): ActiveGeminiKeySummary {
  return {
    configured: true,
    source: 'environment',
    maskedKey: maskApiKey(envKey),
    primaryModel: process.env.GEMINI_MODEL?.trim() || DEFAULT_GEMINI_MODELS[0],
    activeUsableModel: null,
    availableModels: [...DEFAULT_GEMINI_MODELS],
    verificationCode: 'PARTIALLY_VERIFIED',
    verificationStatus: 'Partially Verified',
    authenticationStatus: 'UNVERIFIED',
    isValid: true,
    isUsableForGeneration: true,
    project: { id: null, name: null, status: 'Project Not Identified' },
    account: { email: null, status: 'Account Identity Unavailable' },
    models: { tested: [], supportedCount: 0 },
    quota: { status: 'Unknown' },
    permissions: { status: 'Granted' },
    pendingCandidate,
    verifiedAt: null,
  };
}

export function buildUnconfiguredKeyStatus(
  pendingCandidate: GeminiPendingCandidateSummary | null = null,
): ActiveGeminiKeySummary {
  return {
    configured: false,
    source: 'none',
    maskedKey: null,
    primaryModel: null,
    activeUsableModel: null,
    availableModels: [...DEFAULT_GEMINI_MODELS],
    verificationCode: pendingCandidate ? 'PENDING_VERIFICATION' : 'INVALID_API_KEY',
    verificationStatus: pendingCandidate ? 'Pending Verification' : 'Invalid Key',
    authenticationStatus: 'UNVERIFIED',
    isTemporary: Boolean(pendingCandidate),
    isValid: false,
    isUsableForGeneration: false,
    project: { id: null, name: null, status: 'Unavailable' },
    account: { email: null, status: 'Account Identity Unavailable' },
    models: { tested: [], supportedCount: 0 },
    quota: { status: 'Unknown' },
    permissions: { status: 'Denied' },
    pendingCandidate,
    verifiedAt: null,
  };
}
