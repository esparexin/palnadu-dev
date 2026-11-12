import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { sanitizeErrorMessage } from '../gemini-verification/gemini-verification.util';
import {
  acquireDailyCronLock,
  DailyCronLockAttempt,
  DailyCronRunStatus,
  DailyCronTriggerSource,
  finalizeDailyCronLock,
} from './blog-cron-lock.util';

export interface DailyCronBatchOutput {
  results: Array<{ id?: string; title?: string; slug?: string }>;
  rejected: Array<{ topic?: string; reason?: string }>;
}

export interface DailyCronPipelineDeps {
  discoverAndEnqueue: () => Promise<unknown>;
  replenishQueueIfLow: (minPending: number) => Promise<unknown>;
  readBilingualSwitch: () => Promise<{ enabled: boolean; quota: { te: number; en: number } }>;
  generateBilingualBatch: (
    quota: { te: number; en: number },
    forcePublish: boolean,
    workerId: string,
  ) => Promise<DailyCronBatchOutput>;
  generateBatch: (
    count: number,
    forcePublish: boolean,
    workerId: string,
  ) => Promise<DailyCronBatchOutput>;
}

export interface DailyCronExecutionResult {
  skipped: boolean;
  reason?: 'already_completed' | 'already_running';
  dateKey: string;
  status: DailyCronRunStatus;
  source: DailyCronTriggerSource;
  generatedCount: number;
  rejectedCount: number;
  error?: string;
  results: DailyCronBatchOutput['results'];
  rejected: DailyCronBatchOutput['rejected'];
}

export interface DailyCronBackgroundResult {
  started: boolean;
  skipped: boolean;
  reason?: 'already_completed' | 'already_running';
  dateKey: string;
  status: DailyCronRunStatus;
}

/** Runs discovery, queue replenishment, and bilingual/standard batch without failing the whole pipeline on non-fatal prep errors. */
export async function executeDailyPipelineSteps(
  logger: Logger,
  source: DailyCronTriggerSource,
  deps: DailyCronPipelineDeps,
): Promise<DailyCronBatchOutput> {
  const workerId = `${source}:${process.pid}`;
  try {
    await deps.discoverAndEnqueue();
  } catch (err) {
    logger.warn(`discovery step failed: ${String(err)}`);
  }

  try {
    await deps.replenishQueueIfLow(10);
  } catch (err) {
    logger.warn(`queue replenishment failed: ${String(err)}`);
  }

  const bilingual = await deps.readBilingualSwitch();
  return bilingual.enabled
    ? deps.generateBilingualBatch(bilingual.quota, false, workerId)
    : deps.generateBatch(5, false, workerId);
}

async function executeAcquiredDailyBatch(
  prisma: PrismaService,
  logger: Logger,
  lock: DailyCronLockAttempt,
  executeBatch: () => Promise<DailyCronBatchOutput>,
): Promise<DailyCronExecutionResult> {
  const record = lock.record!;
  try {
    const batch = await executeBatch();
    const results = batch.results ?? [];
    const rejected = batch.rejected ?? [];
    const allRejected = results.length === 0 && rejected.length > 0;
    const status: 'COMPLETED' | 'FAILED' = allRejected ? 'FAILED' : 'COMPLETED';
    const error = allRejected
      ? sanitizeErrorMessage(rejected[0]?.reason || 'All attempted topics rejected or failed')
      : undefined;

    await finalizeDailyCronLock(prisma, lock.lockKey, record, {
      status,
      generatedCount: results.length,
      rejectedCount: rejected.length,
      error,
    });
    logger.log(
      `Daily blog batch [${record.source}] for ${record.dateKey} -> ${status}: ${results.length} generated, ${rejected.length} rejected.`,
    );
    return {
      skipped: false,
      dateKey: record.dateKey,
      status,
      source: record.source,
      generatedCount: results.length,
      rejectedCount: rejected.length,
      ...(error ? { error } : {}),
      results,
      rejected,
    };
  } catch (err) {
    const error = sanitizeErrorMessage(err instanceof Error ? err.message : String(err));
    try {
      await finalizeDailyCronLock(prisma, lock.lockKey, record, {
        status: 'FAILED',
        generatedCount: 0,
        rejectedCount: 0,
        error,
      });
    } catch (finalizeErr) {
      logger.error(`Failed to finalize daily cron lock: ${sanitizeErrorMessage(String(finalizeErr))}`);
    }
    logger.error(`Daily blog cron [${record.source}] failed for ${record.dateKey}: ${error}`);
    return {
      skipped: false,
      dateKey: record.dateKey,
      status: 'FAILED',
      source: record.source,
      generatedCount: 0,
      rejectedCount: 0,
      error,
      results: [],
      rejected: [],
    };
  }
}

export async function runDailyCronBatch(
  prisma: PrismaService,
  logger: Logger,
  source: DailyCronTriggerSource,
  force: boolean,
  executeBatch: () => Promise<DailyCronBatchOutput>,
): Promise<DailyCronExecutionResult> {
  const lock = await acquireDailyCronLock(prisma, source, force);
  if (!lock.acquired) {
    logger.log(`Skipping daily blog cron [${source}] for ${lock.dateKey}: ${lock.reason}`);
    return {
      skipped: true,
      reason: lock.reason,
      dateKey: lock.dateKey,
      status: lock.record?.status ?? 'COMPLETED',
      source,
      generatedCount: lock.record?.generatedCount ?? 0,
      rejectedCount: lock.record?.rejectedCount ?? 0,
      results: [],
      rejected: [],
    };
  }
  return executeAcquiredDailyBatch(prisma, logger, lock, executeBatch);
}

export async function startDailyCronInBackground(
  prisma: PrismaService,
  logger: Logger,
  source: DailyCronTriggerSource,
  force: boolean,
  executeBatch: () => Promise<DailyCronBatchOutput>,
): Promise<DailyCronBackgroundResult> {
  const lock = await acquireDailyCronLock(prisma, source, force);
  if (!lock.acquired) {
    logger.log(`Skipping background daily blog cron [${source}] for ${lock.dateKey}: ${lock.reason}`);
    return {
      started: false,
      skipped: true,
      reason: lock.reason,
      dateKey: lock.dateKey,
      status: lock.record?.status ?? 'COMPLETED',
    };
  }

  setImmediate(() => {
    void executeAcquiredDailyBatch(prisma, logger, lock, executeBatch);
  });
  return {
    started: true,
    skipped: false,
    dateKey: lock.dateKey,
    status: 'RUNNING',
  };
}
