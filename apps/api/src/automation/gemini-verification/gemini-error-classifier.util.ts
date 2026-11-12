import {
  GeminiVerificationCode,
  GeminiVerificationStatus,
} from '@palnadu/types';

export type GeminiProbeStage = 'list_models' | 'generate';

export interface ParsedGoogleFailure {
  code: GeminiVerificationCode;
  status: GeminiVerificationStatus;
  quotaStatus: 'Active' | 'Quota Exceeded' | 'Billing Restricted' | 'Unknown';
  permissionStatus: 'Granted' | 'Restricted' | 'Denied';
  isTemporary: boolean;
  retryable: boolean;
  modelSpecific: boolean;
  stopAllModels: boolean;
  detail: string;
}

export const VERIFICATION_CODE_TO_LABEL: Record<GeminiVerificationCode, GeminiVerificationStatus> = {
  VERIFIED: 'Verified',
  PARTIALLY_VERIFIED: 'Partially Verified',
  PENDING_VERIFICATION: 'Pending Verification',
  INVALID_API_KEY: 'Invalid Key',
  PERMISSION_DENIED: 'Permission Denied',
  QUOTA_EXCEEDED: 'Quota Exceeded',
  MODEL_OVERLOADED: 'Model Overloaded',
  TEMPORARY_PROVIDER_ERROR: 'Temporary Provider Error',
  MODEL_ACCESS_DENIED: 'Model Access Denied',
};

export function maskSecretValue(apiKey: string): string {
  const trimmed = (apiKey || '').trim();
  if (!trimmed) return '';
  if (trimmed.length <= 12) return '****';
  return `${trimmed.slice(0, 7)}...${trimmed.slice(-4)}`;
}

export function redactGeminiSecrets(rawMessage: string, rawKey?: string): string {
  let clean = (rawMessage || 'Unknown error').toString();
  if (rawKey && rawKey.trim().length > 4) {
    clean = clean.replaceAll(rawKey.trim(), maskSecretValue(rawKey));
  }
  return clean
    .replace(/([?&]key=)[^&\s]+/gi, '$1[REDACTED]')
    .replace(/AIza[0-9A-Za-z-_]{20,}/g, '[REDACTED_KEY]')
    .replace(/AQ\.[0-9A-Za-z._-]{15,}/g, '[REDACTED_KEY]');
}

export function classifyGoogleError(
  httpStatus: number,
  responseBody: any,
  stage: GeminiProbeStage = 'generate',
): ParsedGoogleFailure {
  const errObj = responseBody?.error;
  const rawMsg =
    typeof errObj?.message === 'string' && errObj.message
      ? errObj.message
      : JSON.stringify(responseBody || {});
  const msg = rawMsg.toLowerCase();
  const statusStr = String(errObj?.status || '').toUpperCase();

  if (
    httpStatus === 401 ||
    statusStr === 'UNAUTHENTICATED' ||
    (httpStatus === 400 &&
      (statusStr === 'INVALID_ARGUMENT' ||
        msg.includes('api key not valid') ||
        msg.includes('api_key_invalid')))
  ) {
    return {
      code: 'INVALID_API_KEY',
      status: VERIFICATION_CODE_TO_LABEL.INVALID_API_KEY,
      quotaStatus: 'Unknown',
      permissionStatus: 'Denied',
      isTemporary: false,
      retryable: false,
      modelSpecific: false,
      stopAllModels: true,
      detail: 'Google rejected this API key as invalid or malformed.',
    };
  }

  if (httpStatus === 403 || statusStr === 'PERMISSION_DENIED') {
    if (msg.includes('billing')) {
      return {
        code: 'PERMISSION_DENIED',
        status: VERIFICATION_CODE_TO_LABEL.PERMISSION_DENIED,
        quotaStatus: 'Billing Restricted',
        permissionStatus: 'Denied',
        isTemporary: false,
        retryable: false,
        modelSpecific: false,
        stopAllModels: true,
        detail:
          'Billing restriction detected: Google Cloud billing is not enabled or restricted for this project.',
      };
    }
    const isGlobalRestriction =
      stage === 'list_models' ||
      msg.includes('api restriction') ||
      msg.includes('referer') ||
      msg.includes('ip address') ||
      msg.includes('has not been used') ||
      msg.includes('disabled');
    if (isGlobalRestriction) {
      return {
        code: 'PERMISSION_DENIED',
        status: VERIFICATION_CODE_TO_LABEL.PERMISSION_DENIED,
        quotaStatus: 'Unknown',
        permissionStatus: 'Denied',
        isTemporary: false,
        retryable: false,
        modelSpecific: false,
        stopAllModels: true,
        detail: `Permission denied: ${rawMsg}`,
      };
    }
    return {
      code: 'MODEL_ACCESS_DENIED',
      status: VERIFICATION_CODE_TO_LABEL.MODEL_ACCESS_DENIED,
      quotaStatus: 'Active',
      permissionStatus: 'Restricted',
      isTemporary: false,
      retryable: false,
      modelSpecific: true,
      stopAllModels: false,
      detail: `Model access denied: ${rawMsg}`,
    };
  }

  if (httpStatus === 404 || statusStr === 'NOT_FOUND' || (httpStatus === 400 && msg.includes('not supported'))) {
    return {
      code: 'MODEL_ACCESS_DENIED',
      status: VERIFICATION_CODE_TO_LABEL.MODEL_ACCESS_DENIED,
      quotaStatus: 'Active',
      permissionStatus: 'Restricted',
      isTemporary: false,
      retryable: false,
      modelSpecific: true,
      stopAllModels: false,
      detail: `Model unavailable or unsupported: ${rawMsg}`,
    };
  }

  if (httpStatus === 429 || statusStr === 'RESOURCE_EXHAUSTED' || msg.includes('quota')) {
    const isShortRateBurst =
      (msg.includes('rate limit') || msg.includes('per minute') || msg.includes('requests per')) &&
      !msg.includes('exceeded your current quota');
    return {
      code: 'QUOTA_EXCEEDED',
      status: VERIFICATION_CODE_TO_LABEL.QUOTA_EXCEEDED,
      quotaStatus: 'Quota Exceeded',
      permissionStatus: 'Granted',
      isTemporary: true,
      retryable: isShortRateBurst,
      modelSpecific: true,
      stopAllModels: false,
      detail: `Quota exhausted or rate limit reached: ${rawMsg}`,
    };
  }

  if (
    httpStatus === 503 ||
    statusStr === 'UNAVAILABLE' ||
    msg.includes('high demand') ||
    msg.includes('spikes in demand') ||
    msg.includes('overloaded')
  ) {
    return {
      code: 'MODEL_OVERLOADED',
      status: VERIFICATION_CODE_TO_LABEL.MODEL_OVERLOADED,
      quotaStatus: 'Active',
      permissionStatus: 'Granted',
      isTemporary: true,
      retryable: true,
      modelSpecific: true,
      stopAllModels: false,
      detail: rawMsg || 'Model is temporarily experiencing high demand.',
    };
  }

  return {
    code: 'TEMPORARY_PROVIDER_ERROR',
    status: VERIFICATION_CODE_TO_LABEL.TEMPORARY_PROVIDER_ERROR,
    quotaStatus: httpStatus >= 500 || httpStatus === 408 ? 'Active' : 'Unknown',
    permissionStatus: 'Granted',
    isTemporary: httpStatus >= 500 || httpStatus === 408 || httpStatus === 0,
    retryable: httpStatus >= 500 || httpStatus === 408 || httpStatus === 0,
    modelSpecific: false,
    stopAllModels: false,
    detail: `Temporary provider error (HTTP ${httpStatus}): ${rawMsg}`,
  };
}

