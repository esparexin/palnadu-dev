import { GeminiKeyVerificationResult } from './gemini-verification.types';
import {
  classifyGoogleError,
  GeminiProbeStage,
  maskSecretValue,
  ParsedGoogleFailure,
  redactGeminiSecrets,
} from './gemini-error-classifier.util';

export type { ParsedGoogleFailure };

export function maskApiKey(apiKey: string): string {
  return maskSecretValue(apiKey);
}

export function sanitizeErrorMessage(rawMessage: string, rawKey?: string): string {
  return redactGeminiSecrets(rawMessage, rawKey);
}

export function parseGoogleError(
  httpStatus: number,
  responseBody: any,
  stage: GeminiProbeStage = 'generate',
): ParsedGoogleFailure {
  return classifyGoogleError(httpStatus, responseBody, stage);
}

export function extractProjectIdentity(
  headers?: Headers,
  responseBody?: any,
): GeminiKeyVerificationResult['project'] {
  const headerProjectId =
    headers?.get('x-goog-project-id') ||
    headers?.get('x-goog-user-project') ||
    headers?.get('x-cloud-trace-context')?.split('/')?.[0];

  if (headerProjectId && /^[a-z0-9-]{4,64}$/i.test(headerProjectId)) {
    return { id: headerProjectId, name: null, status: 'Verified' };
  }

  const details = responseBody?.error?.details;
  if (Array.isArray(details)) {
    for (const item of details) {
      const consumer = item?.metadata?.consumer;
      if (typeof consumer === 'string' && consumer.startsWith('projects/')) {
        return {
          id: consumer.replace('projects/', '').trim(),
          name: null,
          status: 'Inferred',
        };
      }
      if (typeof item?.metadata?.project === 'string') {
        return {
          id: item.metadata.project.trim(),
          name: null,
          status: 'Inferred',
        };
      }
    }
  }

  const rawText = responseBody?.error?.message || '';
  const projectMatch = rawText.match(/projects\/([a-z0-9-]{4,64})/i);
  if (projectMatch?.[1]) {
    return { id: projectMatch[1], name: null, status: 'Inferred' };
  }

  return { id: null, name: null, status: 'Project Not Identified' };
}

export function extractAccountIdentity(
  _apiKey: string,
): GeminiKeyVerificationResult['account'] {
  return { email: null, status: 'Account Identity Unavailable' };
}
