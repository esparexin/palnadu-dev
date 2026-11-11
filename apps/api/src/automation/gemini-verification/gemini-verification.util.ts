/**
 * Utilities for API key masking, error sanitization, and Google API response parsing.
 */

import {
  GeminiVerificationStatus,
  ProjectVerificationStatus,
  AccountVerificationStatus,
} from './gemini-verification.types';

export function maskApiKey(apiKey: string): string {
  if (!apiKey || typeof apiKey !== 'string') return '';
  const trimmed = apiKey.trim();
  if (trimmed.length <= 8) return '****';
  const prefix = trimmed.slice(0, 7);
  const suffix = trimmed.slice(-4);
  return `${prefix}...${suffix}`;
}

export function sanitizeErrorMessage(message: unknown, rawKey?: string): string {
  if (!message) return 'Unknown error occurred during verification';
  let str = String(message);
  if (rawKey && rawKey.length > 5) {
    str = str.replaceAll(rawKey, maskApiKey(rawKey));
  }
  // Sanitize any generic key patterns in query params (key=...)
  return str.replace(/key=[a-zA-Z0-9_.-]{10,}/g, 'key=[REDACTED]');
}

export interface ParsedErrorStatus {
  status: GeminiVerificationStatus;
  quotaStatus: 'Active' | 'Quota Exceeded' | 'Billing Restricted' | 'Unknown';
  permissionStatus: 'Granted' | 'Restricted' | 'Denied';
  detail: string;
}

export function parseGoogleError(httpStatus: number, responseBody: any): ParsedErrorStatus {
  const errObj = responseBody?.error;
  const rawMsg = errObj?.message || JSON.stringify(responseBody || {});
  const msg = rawMsg.toLowerCase();
  const statusStr = (errObj?.status || '').toUpperCase();

  // 1. Invalid Key
  if (
    httpStatus === 400 &&
    (statusStr === 'INVALID_ARGUMENT' || msg.includes('api key not valid') || msg.includes('api_key_invalid'))
  ) {
    return {
      status: 'Invalid Key',
      quotaStatus: 'Unknown',
      permissionStatus: 'Denied',
      detail: 'The provided API key is invalid or unrecognized by Google API services.',
    };
  }

  // 2. Permission Denied / IP or API Restrictions
  if (httpStatus === 403 || statusStr === 'PERMISSION_DENIED') {
    if (msg.includes('billing') || msg.includes('enable billing')) {
      return {
        status: 'Permission Denied',
        quotaStatus: 'Billing Restricted',
        permissionStatus: 'Restricted',
        detail: 'API key is blocked due to billing requirements or disabled cloud billing.',
      };
    }
    return {
      status: 'Permission Denied',
      quotaStatus: 'Unknown',
      permissionStatus: 'Denied',
      detail: 'Permission denied. The key may be restricted by API, HTTP referrer, or IP constraints.',
    };
  }

  // 3. Quota Exceeded
  if (httpStatus === 429 || statusStr === 'RESOURCE_EXHAUSTED' || msg.includes('quota')) {
    return {
      status: 'Quota Exceeded',
      quotaStatus: 'Quota Exceeded',
      permissionStatus: 'Granted',
      detail: 'Rate limit or resource quota exhausted for this API key.',
    };
  }

  return {
    status: 'Verification Failed',
    quotaStatus: 'Unknown',
    permissionStatus: 'Unknown' as any,
    detail: errObj?.message || `Google API returned HTTP ${httpStatus}`,
  };
}

export function extractProjectIdentity(
  headers?: Headers,
  responseBody?: any,
): { id: string | null; name: string | null; status: ProjectVerificationStatus } {
  // Check for authoritative Google Cloud Project headers if present
  const headerProjectId =
    headers?.get('x-goog-project-id') ||
    headers?.get('x-goog-user-project');

  if (headerProjectId) {
    return {
      id: headerProjectId.trim(),
      name: null,
      status: 'Verified',
    };
  }

  // Check structured error or consumer metadata (e.g., project:123456789)
  const details = responseBody?.error?.details;
  if (Array.isArray(details)) {
    for (const d of details) {
      const consumer = d?.metadata?.consumer;
      if (typeof consumer === 'string' && consumer.startsWith('projects/')) {
        const id = consumer.replace('projects/', '').trim();
        return { id, name: null, status: 'Inferred' };
      }
      const service = d?.metadata?.service;
      if (typeof service === 'string' && d?.metadata?.project) {
        return { id: String(d.metadata.project).trim(), name: null, status: 'Inferred' };
      }
    }
  }

  return {
    id: null,
    name: null,
    status: 'Project Not Identified',
  };
}

export function extractAccountIdentity(
  _apiKey: string,
  _authMetadata?: any,
): { email: string | null; status: AccountVerificationStatus } {
  // Rule: Never infer Google account identity from the API key string or project ID.
  // Only report email if explicitly provided through verified Google auth mechanism.
  return {
    email: null,
    status: 'Account Identity Unavailable',
  };
}

