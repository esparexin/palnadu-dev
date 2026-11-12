import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import {
  acquireDailyCronLock,
  DAILY_CRON_EXPRESSION,
  DAILY_CRON_SCHEDULE,
  getDailyCronLockKey,
  getIstDateKey,
  readDailyCronStatus,
  SETTING_KEY_LAST_CRON_RUN,
} from '../dist/automation/blog/blog-cron-lock.util.js';
import {
  runDailyCronBatch,
  startDailyCronInBackground,
} from '../dist/automation/blog/blog-cron-runner.util.js';
import { CronOrAdminGuard } from '../dist/automation/blog/cron-or-admin.guard.js';
import { AutomationCronController } from '../dist/automation/blog/automation-cron.controller.js';
import { BlogAutomationService } from '../dist/automation/blog-automation.service.js';
import { BlogStatusService } from '../dist/automation/blog/blog-status.service.js';
import { JwtAuthGuard } from '../dist/auth/jwt-auth.guard.js';

function createAtomicSiteSettingPrisma() {
  const store = new Map();
  let tick = 1;
  return {
    store,
    siteSetting: {
      async findUnique({ where: { key } }) {
        return store.get(key) ?? null;
      },
      async create({ data }) {
        if (store.has(data.key)) {
          const err = new Error('Unique constraint failed');
          err.code = 'P2002';
          throw err;
        }
        const row = { ...data, updatedAt: new Date(1700000000000 + tick++ * 1000) };
        store.set(data.key, row);
        return row;
      },
      async updateMany({ where, data }) {
        const existing = store.get(where.key);
        if (!existing) return { count: 0 };
        if (where.updatedAt && existing.updatedAt.getTime() !== where.updatedAt.getTime()) {
          return { count: 0 };
        }
        const updated = { ...existing, ...data, updatedAt: new Date(1700000000000 + tick++ * 1000) };
        store.set(where.key, updated);
        return { count: 1 };
      },
      async upsert({ where: { key }, update, create }) {
        const existing = store.get(key);
        const row = existing
          ? { ...existing, ...update, updatedAt: new Date(1700000000000 + tick++ * 1000) }
          : { ...create, updatedAt: new Date(1700000000000 + tick++ * 1000) };
        store.set(key, row);
        return row;
      },
    },
    blogPost: { count: async () => 0 },
    blogTopic: { count: async () => 0, findMany: async () => [] },
  };
}

function makeHttpContext(headers = {}, user = undefined) {
  const req = { headers, user };
  return {
    req,
    switchToHttp: () => ({ getRequest: () => req }),
  };
}

describe('PR2 Daily Auto-Blogging Cron Reliability & Protection', () => {
  const silentLogger = new Logger('DailyCronTest');
  silentLogger.log = () => {};
  silentLogger.warn = () => {};
  silentLogger.error = () => {};

  it('computes canonical YYYY-MM-DD IST date keys across UTC midnight boundaries', () => {
    assert.equal(getIstDateKey(new Date('2026-11-12T18:29:00.000Z')), '2026-11-12');
    assert.equal(getIstDateKey(new Date('2026-11-12T18:30:00.000Z')), '2026-11-13');
    assert.equal(getIstDateKey(new Date('2026-11-12T23:30:00.000Z')), '2026-11-13');
  });

  it('prevents duplicate same-day execution unless force=true is specified', async () => {
    const prisma = createAtomicSiteSettingPrisma();
    let executions = 0;
    const runBatch = async () => {
      executions += 1;
      return { results: [{ id: 'p-1', title: 'Article' }], rejected: [] };
    };

    const first = await runDailyCronBatch(prisma, silentLogger, 'external', false, runBatch);
    assert.equal(first.skipped, false);
    assert.equal(first.status, 'COMPLETED');
    assert.equal(first.generatedCount, 1);

    const second = await runDailyCronBatch(prisma, silentLogger, 'cron', false, runBatch);
    assert.equal(second.skipped, true);
    assert.equal(second.reason, 'already_completed');
    assert.equal(executions, 1);

    const forced = await runDailyCronBatch(prisma, silentLogger, 'manual', true, runBatch);
    assert.equal(forced.skipped, false);
    assert.equal(executions, 2);
  });

  it('allows parallel callers only one execution when lock is freshly RUNNING', async () => {
    const prisma = createAtomicSiteSettingPrisma();
    const now = new Date('2026-11-12T23:30:00.000Z');
    const [a, b] = await Promise.all([
      acquireDailyCronLock(prisma, 'cron', false, now),
      acquireDailyCronLock(prisma, 'external', false, now),
    ]);

    assert.equal([a.acquired, b.acquired].filter(Boolean).length, 1);
    const loser = a.acquired ? b : a;
    assert.equal(loser.reason, 'already_running');
  });

  it('records sanitized FAILED outcome on total rejection and permits later retry on same day', async () => {
    const prisma = createAtomicSiteSettingPrisma();
    let attempt = 0;

    const failed = await runDailyCronBatch(prisma, silentLogger, 'cron', false, async () => {
      attempt += 1;
      return {
        results: [],
        rejected: [{ topic: 't1', reason: 'Upstream key AIzaSySecretKey1234567890 failed' }],
      };
    });

    assert.equal(failed.status, 'FAILED');
    assert.ok(!failed.error?.includes('AIzaSySecretKey1234567890'));
    const telemetry = prisma.store.get(SETTING_KEY_LAST_CRON_RUN);
    assert.equal(telemetry.value.status, 'FAILED');
    assert.ok(!JSON.stringify(telemetry.value).includes('AIzaSySecretKey1234567890'));

    const retried = await runDailyCronBatch(prisma, silentLogger, 'external', false, async () => {
      attempt += 1;
      return { results: [{ id: 'p-2' }], rejected: [] };
    });
    assert.equal(attempt, 2);
    assert.equal(retried.status, 'COMPLETED');
    assert.equal(retried.generatedCount, 1);
  });

  it('reclaims stale RUNNING locks older than 2 hours', async () => {
    const prisma = createAtomicSiteSettingPrisma();
    const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
    await acquireDailyCronLock(prisma, 'cron', false, threeHoursAgo);
    const staleDateKey = getIstDateKey(threeHoursAgo);
    const todayDateKey = getIstDateKey(new Date());

    // Simulate same IST day by placing stale lock on today's key
    const lockKey = getDailyCronLockKey(todayDateKey);
    if (staleDateKey !== todayDateKey) {
      await prisma.siteSetting.upsert({
        where: { key: lockKey },
        update: { value: { dateKey: todayDateKey, status: 'RUNNING', source: 'cron', lockToken: 'old', startedAt: threeHoursAgo.toISOString() } },
        create: { key: lockKey, value: { dateKey: todayDateKey, status: 'RUNNING', source: 'cron', lockToken: 'old', startedAt: threeHoursAgo.toISOString() } },
      });
    }

    const reclaimed = await acquireDailyCronLock(prisma, 'external', false, new Date());
    assert.equal(reclaimed.acquired, true);
  });

  it('supports non-blocking background execution and updates cron telemetry', async () => {
    const prisma = createAtomicSiteSettingPrisma();
    const bg = await startDailyCronInBackground(prisma, silentLogger, 'external', false, async () => ({
      results: [{ id: 'bg-1' }, { id: 'bg-2' }],
      rejected: [],
    }));
    assert.equal(bg.started, true);
    assert.equal(bg.status, 'RUNNING');

    await new Promise((resolve) => setTimeout(resolve, 25));
    const status = await readDailyCronStatus(prisma);
    assert.equal(status.schedule, DAILY_CRON_SCHEDULE);
    assert.equal(status.todayRun?.status, 'COMPLETED');
    assert.equal(status.todayRun?.generatedCount, 2);
  });

  it('CronOrAdminGuard enforces timing-safe x-cron-secret and falls back to Admin JWT', async () => {
    const prevSecret = process.env.AUTOMATION_CRON_SECRET;
    const prevCanActivate = JwtAuthGuard.prototype.canActivate;
    const guard = new CronOrAdminGuard();
    try {
      process.env.AUTOMATION_CRON_SECRET = 'super-cron-secret-value';
      const validCtx = makeHttpContext({ 'x-cron-secret': 'super-cron-secret-value' });
      assert.equal(await guard.canActivate(validCtx), true);
      assert.equal(validCtx.req.cronAuthorized, true);
      await assert.rejects(() => guard.canActivate(makeHttpContext({ 'x-cron-secret': 'wrong-secret' })), UnauthorizedException);
      delete process.env.AUTOMATION_CRON_SECRET;
      await assert.rejects(() => guard.canActivate(makeHttpContext({ 'x-cron-secret': 'super-cron-secret-value' })), UnauthorizedException);
      JwtAuthGuard.prototype.canActivate = async () => true;
      assert.equal(await guard.canActivate(makeHttpContext({}, { role: UserRole.ADMIN })), true);
      await assert.rejects(() => guard.canActivate(makeHttpContext({}, { role: UserRole.EDITOR })), ForbiddenException);
    } finally {
      JwtAuthGuard.prototype.canActivate = prevCanActivate;
      if (prevSecret !== undefined) process.env.AUTOMATION_CRON_SECRET = prevSecret;
      else delete process.env.AUTOMATION_CRON_SECRET;
    }
  });

  it('aligns @Cron expression (30 23 * * *), BlogStatusService label, and controller trigger source', async () => {
    const cronMeta = Reflect.getMetadata('SCHEDULE_CRON_OPTIONS', BlogAutomationService.prototype.handleDailyCron);
    assert.equal(cronMeta?.cronTime, DAILY_CRON_EXPRESSION);
    assert.equal(DAILY_CRON_EXPRESSION, '30 23 * * *');

    const prisma = createAtomicSiteSettingPrisma();
    const statusService = new BlogStatusService(prisma, {
      coverageReport: async () => ({ topicsCovered: 0, keywordsCovered: 0, intentsCovered: {} }),
      sourceStatuses: () => [],
    });
    const status = await statusService.getStatus();
    assert.equal(status.schedule, 'Daily at 05:00 IST (23:30 UTC)');

    const calls = [];
    const controller = new AutomationCronController({
      getDailyCronStatus: async () => ({ schedule: DAILY_CRON_SCHEDULE }),
      startDailyAutomationInBackground: async (source, force) => {
        calls.push({ mode: 'bg', source, force });
        return { started: true, skipped: false, dateKey: '2026-11-13', status: 'RUNNING' };
      },
      runDailyAutomation: async (source, force) => {
        calls.push({ mode: 'sync', source, force });
        return {
          skipped: false, dateKey: '2026-11-13', status: 'COMPLETED', source,
          generatedCount: 1, rejectedCount: 0, results: [], rejected: [],
        };
      },
    });
    await controller.triggerDailyCron({ background: true, force: true }, undefined, undefined, { cronAuthorized: true });
    await controller.triggerDailyCron({}, undefined, undefined, {});
    assert.deepEqual(calls, [
      { mode: 'bg', source: 'external', force: true },
      { mode: 'sync', source: 'manual', force: false },
    ]);
  });
});
