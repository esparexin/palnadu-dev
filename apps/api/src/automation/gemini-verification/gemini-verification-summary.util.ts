import {
  DEFAULT_GEMINI_MODELS,
  GeminiAuthenticationStatus,
  GeminiKeyVerificationResult,
  GeminiVerificationCode,
  ModelAccessStatus,
} from './gemini-verification.types';
import {
  ParsedGoogleFailure,
  VERIFICATION_CODE_TO_LABEL,
} from './gemini-error-classifier.util';
import {
  extractAccountIdentity,
  extractProjectIdentity,
  maskApiKey,
} from './gemini-verification.util';

export function resolveOverallFailureCode(
  failures: ParsedGoogleFailure[],
): ParsedGoogleFailure | null {
  if (failures.length === 0) return null;
  const priority: GeminiVerificationCode[] = [
    'INVALID_API_KEY',
    'PERMISSION_DENIED',
    'MODEL_OVERLOADED',
    'TEMPORARY_PROVIDER_ERROR',
    'QUOTA_EXCEEDED',
    'MODEL_ACCESS_DENIED',
  ];
  for (const code of priority) {
    const match = failures.find((f) => f.code === code);
    if (match) return match;
  }
  return failures[0];
}

export function buildEmptyKeyResult(): GeminiKeyVerificationResult {
  return {
    isValid: false,
    isUsableForGeneration: false,
    verificationCode: 'INVALID_API_KEY',
    verificationStatus: 'Invalid Key',
    authenticationStatus: 'INVALID_KEY',
    failureCategory: 'INVALID_API_KEY',
    isTemporary: false,
    fallbackUsed: false,
    activeUsableModel: null,
    availableModels: [...DEFAULT_GEMINI_MODELS],
    maskedKey: '',
    project: { id: null, name: null, status: 'Unavailable' },
    account: { email: null, status: 'Account Identity Unavailable' },
    models: { tested: [], supportedCount: 0 },
    quota: { status: 'Unknown' },
    permissions: { status: 'Denied', detail: 'API key cannot be empty.' },
    verifiedAt: new Date().toISOString(),
    errorMessage: 'Gemini API key is required.',
  };
}

export function mergeProjectIdentity(
  candidates: Array<{ headers?: Headers; body?: any }>,
): GeminiKeyVerificationResult['project'] {
  for (const c of candidates) {
    const extracted = extractProjectIdentity(c.headers, c.body);
    if (extracted.status === 'Verified') return extracted;
  }
  for (const c of candidates) {
    const extracted = extractProjectIdentity(c.headers, c.body);
    if (extracted.status === 'Inferred') return extracted;
  }
  return { id: null, name: null, status: 'Project Not Identified' };
}

export function buildVerificationResult(params: {
  trimmedKey: string;
  atLeastOneModelUsable: boolean;
  authenticationStatus: GeminiAuthenticationStatus;
  isValid: boolean;
  project: GeminiKeyVerificationResult['project'];
  testedModels: ModelAccessStatus[];
  supportedModelsCount: number;
  fallbackUsed: boolean;
  activeUsableModel: string | null;
  dominantFailure: ParsedGoogleFailure | null;
}): GeminiKeyVerificationResult {
  const {
    trimmedKey,
    atLeastOneModelUsable,
    authenticationStatus,
    isValid,
    project,
    testedModels,
    supportedModelsCount,
    fallbackUsed,
    activeUsableModel,
    dominantFailure,
  } = params;

  const account = extractAccountIdentity(trimmedKey);

  if (atLeastOneModelUsable) {
    const verificationCode: GeminiVerificationCode =
      project.status === 'Project Not Identified' ? 'PARTIALLY_VERIFIED' : 'VERIFIED';
    return {
      isValid: true,
      isUsableForGeneration: true,
      verificationCode,
      verificationStatus: VERIFICATION_CODE_TO_LABEL[verificationCode],
      authenticationStatus: 'AUTHENTICATED',
      isTemporary: false,
      fallbackUsed,
      activeUsableModel,
      availableModels: [...DEFAULT_GEMINI_MODELS],
      maskedKey: maskApiKey(trimmedKey),
      project,
      account,
      models: {
        tested: testedModels,
        supportedCount: Math.max(supportedModelsCount, testedModels.filter((m) => m.accessible).length),
      },
      quota: { status: 'Active' },
      permissions: { status: 'Granted' },
      verifiedAt: new Date().toISOString(),
    };
  }

  const code: GeminiVerificationCode = dominantFailure?.code || 'TEMPORARY_PROVIDER_ERROR';
  return {
    isValid,
    isUsableForGeneration: false,
    verificationCode: code,
    verificationStatus: VERIFICATION_CODE_TO_LABEL[code],
    authenticationStatus,
    failureCategory: code,
    isTemporary: dominantFailure?.isTemporary ?? false,
    fallbackUsed: false,
    activeUsableModel: null,
    availableModels: [...DEFAULT_GEMINI_MODELS],
    maskedKey: maskApiKey(trimmedKey),
    project: code === 'INVALID_API_KEY' ? { id: null, name: null, status: 'Unavailable' } : project,
    account,
    models: {
      tested: testedModels,
      supportedCount: supportedModelsCount,
    },
    quota: { status: dominantFailure?.quotaStatus ?? 'Unknown', detail: dominantFailure?.detail },
    permissions: { status: dominantFailure?.permissionStatus ?? 'Denied', detail: dominantFailure?.detail },
    verifiedAt: new Date().toISOString(),
    errorMessage: dominantFailure?.detail || 'Gemini verification failed.',
  };
}
