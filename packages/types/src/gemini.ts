export const DEFAULT_GEMINI_MODELS = [
  'gemini-3.8-flash',
  'gemini-3.6-flash',
  'gemini-3.5-flash',
  'gemini-3.1-flash-lite',
] as const;

export type GeminiVerificationCode =
  | 'VERIFIED'
  | 'PARTIALLY_VERIFIED'
  | 'PENDING_VERIFICATION'
  | 'INVALID_API_KEY'
  | 'PERMISSION_DENIED'
  | 'QUOTA_EXCEEDED'
  | 'MODEL_OVERLOADED'
  | 'TEMPORARY_PROVIDER_ERROR'
  | 'MODEL_ACCESS_DENIED';

export type GeminiFailureCategory = GeminiVerificationCode;

export type GeminiAuthenticationStatus =
  | 'AUTHENTICATED'
  | 'INVALID_KEY'
  | 'PERMISSION_DENIED'
  | 'TEMPORARY_ERROR'
  | 'UNVERIFIED';

export type GeminiVerificationStatus =
  | 'Verified'
  | 'Partially Verified'
  | 'Pending Verification'
  | 'Invalid Key'
  | 'Permission Denied'
  | 'Quota Exceeded'
  | 'Model Overloaded'
  | 'Temporary Provider Error'
  | 'Model Access Denied'
  | 'Verification Failed';

export interface ModelAccessStatus {
  model: string;
  accessible: boolean;
  latencyMs: number;
  attempts?: number;
  statusCode?: GeminiVerificationCode | 'NOT_TESTED';
  failureCategory?: GeminiFailureCategory;
  isTemporary?: boolean;
  error?: string;
}

export interface GeminiPendingCandidateSummary {
  maskedKey: string;
  primaryModel: string;
  status: 'PENDING_VERIFICATION';
  lastFailureCode: GeminiVerificationCode;
  lastFailureMessage: string;
  isTemporary: true;
  submittedBy: string;
  submittedAt: string;
  lastCheckedAt: string;
  attemptCount: number;
}

export interface GeminiKeyVerificationResult {
  isValid: boolean;
  isUsableForGeneration: boolean;
  verificationCode: GeminiVerificationCode;
  verificationStatus: GeminiVerificationStatus;
  authenticationStatus: GeminiAuthenticationStatus;
  failureCategory?: GeminiFailureCategory;
  isTemporary: boolean;
  fallbackUsed: boolean;
  activeUsableModel: string | null;
  availableModels?: string[];
  pendingPreserved?: boolean;
  maskedKey: string;
  project: {
    id: string | null;
    name: string | null;
    status: 'Verified' | 'Inferred' | 'Project Not Identified' | 'Unavailable';
  };
  account: {
    email: string | null;
    status: 'Account Identity Unavailable';
  };
  models: {
    tested: ModelAccessStatus[];
    supportedCount: number;
  };
  quota: {
    status: 'Active' | 'Quota Exceeded' | 'Billing Restricted' | 'Unknown';
    detail?: string;
  };
  permissions: {
    status: 'Granted' | 'Restricted' | 'Denied';
    detail?: string;
  };
  verifiedAt: string;
  errorMessage?: string;
}

export interface GeminiKeyAuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action:
    | 'VERIFICATION_PROBE'
    | 'KEY_ACTIVATED'
    | 'KEY_ACTIVATION_SUCCESS'
    | 'KEY_ACTIVATION_REJECTED'
    | 'KEY_PENDING_VERIFICATION'
    | 'PENDING_VERIFICATION_RETRIED'
    | 'ROTATION_TEST';
  maskedKey: string;
  projectId: string | null;
  status: string;
  verificationCode?: GeminiVerificationCode;
  isTemporary?: boolean;
  reason?: string;
}

export interface ActiveGeminiKeySummary {
  configured: boolean;
  source: 'database' | 'environment' | 'none';
  maskedKey: string | null;
  primaryModel?: string | null;
  activeUsableModel?: string | null;
  availableModels?: string[];
  fallbackUsed?: boolean;
  isValid: boolean;
  isUsableForGeneration: boolean;
  verificationCode?: GeminiVerificationCode;
  verificationStatus: GeminiVerificationStatus;
  authenticationStatus?: GeminiAuthenticationStatus;
  failureCategory?: GeminiFailureCategory;
  isTemporary?: boolean;
  project: GeminiKeyVerificationResult['project'];
  account: GeminiKeyVerificationResult['account'];
  models?: GeminiKeyVerificationResult['models'];
  quota?: GeminiKeyVerificationResult['quota'];
  permissions?: GeminiKeyVerificationResult['permissions'];
  pendingCandidate?: GeminiPendingCandidateSummary | null;
  verifiedAt: string | null;
  activatedAt?: string | null;
  activatedBy?: string | null;
}
