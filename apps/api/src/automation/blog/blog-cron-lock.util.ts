import * as crypto from 'crypto';
import { PrismaService } from '../../prisma.service';
import { sanitizeErrorMessage } from '../gemini-verification/gemini-verification.util';

export const DAILY_CRON_EXPRESSION = '30 23 * * *';
export const DAILY_CRON_TIMEZONE = 'Asia/Kolkata';
export const DAILY_CRON_SCHEDULE = 'Daily at 05:00 IST (23:30 UTC)';
export const SETTING_KEY_LAST_CRON_RUN = 'daily_blog_cron_last_run';
const DAILY_CRON_LOCK_PREFIX = 'daily_blog_cron_run:';
const STALE_LOCK_MS = 2 * 60 * 60 * 1000;

export type DailyCronTriggerSource = 'cron' | 'external' | 'manual';
export type DailyCronRunStatus = 'RUNNING' | 'COMPLETED' | 'FAILED';

export interface DailyCronRunRecord {
  dateKey: string;
  status: DailyCronRunStatus;
  source: DailyCronTriggerSource;
  lockToken: string;
  startedAt: string;
  finishedAt?: string;
  generatedCount?: number;
  rejectedCount?: number;
  error?: string;
}

export interface DailyCronLockAttempt {
  acquired: boolean;
  reason?: 'already_completed' | 'already_running';
  dateKey: string;
  lockKey: string;
  record?: DailyCronRunRecord;
}

/** Computes canonical YYYY-MM-DD key anchored in Asia/Kolkata (IST). */
export function getIstDateKey(now: Date = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: DAILY_CRON_TIMEZONE,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value ?? '1970';
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  const day = parts.find((p) => p.type === 'day')?.value ?? '01';
  return `${year}-${month}-${day}`;
}

export function getDailyCronLockKey(dateKey: string): string {
  return `${DAILY_CRON_LOCK_PREFIX}${dateKey}`;
}

function isLockFresh(startedAt: string | undefined, now: Date): boolean {
  if (!startedAt) return false;
  const parsed = Date.parse(startedAt);
  return !Number.isNaN(parsed) && now.getTime() - parsed < STALE_LOCK_MS;
}

function isUniqueConstraintError(err: unknown): boolean {
  return Boolean(err && typeof err === 'object' && 'code' in err && (err as { code?: string }).code === 'P2002');
}

export function toPublicCronSummary(record: DailyCronRunRecord | null | undefined) {
  if (!record) return null;
  return {
    dateKey: record.dateKey,
    status: record.status,
    source: record.source,
    startedAt: record.startedAt,
    finishedAt: record.finishedAt ?? null,
    generatedCount: record.generatedCount ?? 0,
    rejectedCount: record.rejectedCount ?? 0,
    error: record.error ? sanitizeErrorMessage(record.error) : null,
  };
}

/**
 * Atomically claims today's daily cron lock in SiteSetting.
 * Re-claims only when forced, previously FAILED, or stale (> 2h RUNNING).
 */
export async function acquireDailyCronLock(
  prisma: PrismaService,
  source: DailyCronTriggerSource,
  force: boolean = false,
  now: Date = new Date(),
): Promise<DailyCronLockAttempt> {
  const dateKey = getIstDateKey(now);
  const lockKey = getDailyCronLockKey(dateKey);
  const nextRecord: DailyCronRunRecord = {
    dateKey,
    status: 'RUNNING',
    source,
    lockToken: crypto.randomUUID(),
    startedAt: now.toISOString(),
  };

  try {
    await prisma.siteSetting.create({
      data: {
        key: lockKey,
        value: nextRecord as any,
        updatedBy: `cron:${source}`,
        description: `Daily blog automation lock for ${dateKey}`,
      },
    });
    return { acquired: true, dateKey, lockKey, record: nextRecord };
  } catch (err) {
    if (!isUniqueConstraintError(err)) throw err;
  }

  const existing = await prisma.siteSetting.findUnique({ where: { key: lockKey } });
  const prev = (existing?.value ?? undefined) as DailyCronRunRecord | undefined;
  if (!existing) {
    return { acquired: false, reason: 'already_running', dateKey, lockKey, record: prev };
  }

  const alreadyCompleted = prev?.status === 'COMPLETED';
  const freshRunning = prev?.status === 'RUNNING' && isLockFresh(prev.startedAt, now);
  if (!force && (alreadyCompleted || freshRunning)) {
    return {
      acquired: false,
      reason: alreadyCompleted ? 'already_completed' : 'already_running',
      dateKey,
      lockKey,
      record: prev,
    };
  }

  const claim = await prisma.siteSetting.updateMany({
    where: { key: lockKey, updatedAt: existing.updatedAt },
    data: { value: nextRecord as any, updatedBy: `cron:${source}` },
  });
  if (claim.count !== 1) {
    return { acquired: false, reason: 'already_running', dateKey, lockKey, record: prev };
  }

  return { acquired: true, dateKey, lockKey, record: nextRecord };
}

/** Records finalized outcome for the active lock holder and updates latest run telemetry. */
export async function finalizeDailyCronLock(
  prisma: PrismaService,
  lockKey: string,
  currentRecord: DailyCronRunRecord,
  outcome: { status: 'COMPLETED' | 'FAILED'; generatedCount: number; rejectedCount: number; error?: string },
  now: Date = new Date(),
): Promise<DailyCronRunRecord> {
  const finalRecord: DailyCronRunRecord = {
    ...currentRecord,
    status: outcome.status,
    finishedAt: now.toISOString(),
    generatedCount: outcome.generatedCount,
    rejectedCount: outcome.rejectedCount,
    ...(outcome.error ? { error: sanitizeErrorMessage(outcome.error) } : {}),
  };

  const existing = await prisma.siteSetting.findUnique({ where: { key: lockKey } });
  const existingVal = existing?.value as DailyCronRunRecord | undefined;
  if (existing && existingVal?.lockToken && existingVal.lockToken !== currentRecord.lockToken) {
    return finalRecord;
  }

  await prisma.siteSetting.upsert({
    where: { key: lockKey },
    update: { value: finalRecord as any, updatedBy: `cron:${currentRecord.source}` },
    create: {
      key: lockKey,
      value: finalRecord as any,
      updatedBy: `cron:${currentRecord.source}`,
      description: `Daily blog automation lock for ${currentRecord.dateKey}`,
    },
  });

  await prisma.siteSetting.upsert({
    where: { key: SETTING_KEY_LAST_CRON_RUN },
    update: { value: toPublicCronSummary(finalRecord) as any, updatedBy: `cron:${currentRecord.source}` },
    create: {
      key: SETTING_KEY_LAST_CRON_RUN,
      value: toPublicCronSummary(finalRecord) as any,
      updatedBy: `cron:${currentRecord.source}`,
      description: 'Latest daily auto-blogging execution telemetry',
    },
  });

  return finalRecord;
}

export async function readDailyCronStatus(prisma: PrismaService, now: Date = new Date()) {
  const todayDateKey = getIstDateKey(now);
  const [todayRow, lastRow] = await Promise.all([
    prisma.siteSetting.findUnique({ where: { key: getDailyCronLockKey(todayDateKey) } }),
    prisma.siteSetting.findUnique({ where: { key: SETTING_KEY_LAST_CRON_RUN } }),
  ]);

  return {
    schedule: DAILY_CRON_SCHEDULE,
    cronExpression: DAILY_CRON_EXPRESSION,
    timezone: DAILY_CRON_TIMEZONE,
    todayDateKey,
    cronSecretConfigured: Boolean(process.env.AUTOMATION_CRON_SECRET?.trim()),
    todayRun: toPublicCronSummary(todayRow?.value as DailyCronRunRecord | undefined),
    lastRun: toPublicCronSummary(lastRow?.value as DailyCronRunRecord | undefined),
  };
}
