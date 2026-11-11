export type GeminiVerificationStatus =
  | 'Verified'
  | 'Partially Verified'
  | 'Invalid Key'
  | 'Permission Denied'
  | 'Quota Exceeded'
  | 'Project Not Identified'
  | 'Account Identity Unavailable'
  | 'Verification Failed';

export type ProjectVerificationStatus =
  | 'Verified'
  | 'Inferred'
  | 'Project Not Identified'
  | 'Unavailable';

export type AccountVerificationStatus =
  | 'Verified'
  | 'Account Identity Unavailable';

export interface ModelAccessStatus {
  model: string;
  accessible: boolean;
  latencyMs?: number;
  error?: string;
}

export interface ActiveGeminiKeySummary {
  configured: boolean;
  source: 'database' | 'environment' | 'none';
  maskedKey: string | null;
  verificationStatus: GeminiVerificationStatus;
  isValid: boolean;
  isUsableForGeneration: boolean;
  project: {
    id: string | null;
    name: string | null;
    status: ProjectVerificationStatus;
  };
  account: {
    email: string | null;
    status: AccountVerificationStatus;
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
  verifiedAt: string | null;
  primaryModel?: string;
  activatedAt?: string | null;
  activatedBy?: string | null;
}

export interface GeminiKeyVerificationResult {
  isValid: boolean;
  isUsableForGeneration: boolean;
  verificationStatus: GeminiVerificationStatus;
  maskedKey: string;
  project: {
    id: string | null;
    name: string | null;
    status: ProjectVerificationStatus;
  };
  account: {
    email: string | null;
    status: AccountVerificationStatus;
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
  action:
    | 'VERIFICATION_PROBE'
    | 'KEY_ACTIVATION_SUCCESS'
    | 'KEY_ACTIVATION_REJECTED'
    | 'KEY_DEACTIVATION';
  actor: string;
  maskedKey: string;
  status: GeminiVerificationStatus;
  projectId?: string | null;
  reason?: string;
}

