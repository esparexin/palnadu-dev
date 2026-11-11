import type { EncryptedPayload } from './gemini-crypto.util';
import type {
  ActiveGeminiKeySummary,
  GeminiKeyAuditEntry,
  GeminiKeyVerificationResult,
} from './gemini-verification.types';
import { maskApiKey } from './gemini-verification.util';

export const SETTING_KEY_ENCRYPTED = 'gemini_api_key_encrypted';
export const SETTING_KEY_AUDIT_LOG = 'gemini_api_key_audit_log';
export const MAX_AUDIT_ENTRIES = 50;

export interface StoredEncryptedRecord extends EncryptedPayload {
  maskedKey: string;
  verificationResult: GeminiKeyVerificationResult;
  primaryModel?: string;
  activatedAt: string;
  activatedBy: string;
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

export function buildDatabaseKeyStatus(data: StoredEncryptedRecord): ActiveGeminiKeySummary {
  const v = data.verificationResult;
  return {
    configured: true,
    source: 'database',
    maskedKey: data.maskedKey,
    verificationStatus: v?.verificationStatus || 'Verified',
    isValid: Boolean(v?.isValid),
    isUsableForGeneration: Boolean(v?.isUsableForGeneration),
    project: v?.project || { id: null, name: null, status: 'Project Not Identified' },
    account: v?.account || { email: null, status: 'Account Identity Unavailable' },
    models: v?.models || { tested: [], supportedCount: 0 },
    quota: v?.quota || { status: 'Unknown' },
    permissions: v?.permissions || { status: 'Granted' },
    verifiedAt: v?.verifiedAt || null,
    primaryModel: data.primaryModel || v?.models?.tested?.[0]?.model || 'gemini-3.8-flash',
    activatedAt: data.activatedAt || null,
    activatedBy: data.activatedBy || null,
  };
}

export function buildEnvKeyStatus(envKey: string): ActiveGeminiKeySummary {
  return {
    configured: true,
    source: 'environment',
    maskedKey: maskApiKey(envKey),
    verificationStatus: 'Partially Verified',
    isValid: true,
    isUsableForGeneration: true,
    project: { id: null, name: null, status: 'Project Not Identified' },
    account: { email: null, status: 'Account Identity Unavailable' },
    models: { tested: [], supportedCount: 0 },
    quota: { status: 'Unknown' },
    permissions: { status: 'Granted' },
    verifiedAt: null,
  };
}

export function buildUnconfiguredKeyStatus(): ActiveGeminiKeySummary {
  return {
    configured: false,
    source: 'none',
    maskedKey: null,
    verificationStatus: 'Invalid Key',
    isValid: false,
    isUsableForGeneration: false,
    project: { id: null, name: null, status: 'Unavailable' },
    account: { email: null, status: 'Account Identity Unavailable' },
    models: { tested: [], supportedCount: 0 },
    quota: { status: 'Unknown' },
    permissions: { status: 'Denied' },
    verifiedAt: null,
  };
}
