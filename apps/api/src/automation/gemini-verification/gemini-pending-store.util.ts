import { DEFAULT_GEMINI_MODELS } from '@palnadu/types';
import { PrismaService } from '../../prisma.service';
import { decryptSecret, encryptSecret } from './gemini-crypto.util';
import {
  SETTING_KEY_PENDING_ENCRYPTED,
  type StoredPendingCandidateRecord,
} from './gemini-key-store.types';
import type {
  GeminiKeyVerificationResult,
  GeminiPendingCandidateSummary,
} from './gemini-verification.types';

export function toPendingCandidateSummary(
  raw: unknown,
): GeminiPendingCandidateSummary | null {
  const data = raw as StoredPendingCandidateRecord | null;
  if (!data || data.cleared || !data.encrypted || !data.maskedKey) return null;
  return {
    maskedKey: data.maskedKey,
    primaryModel: data.primaryModel || DEFAULT_GEMINI_MODELS[0],
    status: 'PENDING_VERIFICATION',
    lastFailureCode: data.lastFailureCode || 'TEMPORARY_PROVIDER_ERROR',
    lastFailureMessage:
      data.lastFailureMessage || 'Temporary model capacity error.',
    isTemporary: true,
    submittedBy: data.submittedBy || 'admin',
    submittedAt: data.submittedAt || new Date().toISOString(),
    lastCheckedAt: data.lastCheckedAt || new Date().toISOString(),
    attemptCount: data.attemptCount || 1,
  };
}

export async function readPendingCandidateRecord(
  prisma: PrismaService,
): Promise<StoredPendingCandidateRecord | null> {
  const row = await prisma.siteSetting.findUnique({
    where: { key: SETTING_KEY_PENDING_ENCRYPTED },
  });
  const val = row?.value as StoredPendingCandidateRecord | null;
  if (!val || val.cleared || !val.encrypted) return null;
  return val;
}

export async function savePendingCandidate(params: {
  prisma: PrismaService;
  apiKey: string;
  actor: string;
  primaryModel?: string;
  result: GeminiKeyVerificationResult;
  previousAttempts?: number;
  previousSubmittedAt?: string;
}): Promise<GeminiPendingCandidateSummary> {
  const encrypted = encryptSecret(params.apiKey);
  const now = new Date().toISOString();
  const payload: StoredPendingCandidateRecord = {
    cleared: false,
    encrypted,
    maskedKey: params.result.maskedKey,
    primaryModel: params.primaryModel || DEFAULT_GEMINI_MODELS[0],
    status: 'PENDING_VERIFICATION',
    lastFailureCode: params.result.verificationCode,
    lastFailureMessage:
      params.result.errorMessage || 'Temporary capacity issue; ready for retry.',
    verificationSnapshot: params.result,
    submittedBy: params.actor,
    submittedAt: params.previousSubmittedAt || now,
    lastCheckedAt: now,
    attemptCount: (params.previousAttempts ?? 0) + 1,
  };

  await params.prisma.siteSetting.upsert({
    where: { key: SETTING_KEY_PENDING_ENCRYPTED },
    update: {
      value: payload as any,
      updatedBy: params.actor,
      description: 'Encrypted pending Gemini API key awaiting verification retry',
    },
    create: {
      key: SETTING_KEY_PENDING_ENCRYPTED,
      value: payload as any,
      updatedBy: params.actor,
      description: 'Encrypted pending Gemini API key awaiting verification retry',
    },
  });

  return toPendingCandidateSummary(payload)!;
}

export async function clearPendingCandidate(
  prisma: PrismaService,
  actor: string,
): Promise<void> {
  const cleared: StoredPendingCandidateRecord = {
    cleared: true,
    lastCheckedAt: new Date().toISOString(),
  };
  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEY_PENDING_ENCRYPTED },
    update: {
      value: cleared as any,
      updatedBy: actor,
      description: 'Cleared pending Gemini API candidate after resolution',
    },
    create: {
      key: SETTING_KEY_PENDING_ENCRYPTED,
      value: cleared as any,
      updatedBy: actor,
      description: 'Cleared pending Gemini API candidate after resolution',
    },
  });
}

export function decryptPendingRecord(
  record: StoredPendingCandidateRecord,
): string | null {
  if (!record.encrypted?.ciphertext || !record.encrypted?.iv || !record.encrypted?.authTag) {
    return null;
  }
  return decryptSecret(record.encrypted);
}

