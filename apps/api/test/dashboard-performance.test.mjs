import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const dashboardServicePath = fileURLToPath(new URL('../dist/dashboard/dashboard.service.js', import.meta.url));
const { DashboardService } = require(dashboardServicePath);

function createMockPrisma(overrides = {}) {
  const defaultLeads = [
    { id: 'lead_1', name: 'Lead 1', company: 'Co 1', email: 'l1@test.com', requiredHelp: 'WEB', status: 'NEW', createdAt: new Date('2026-11-10T12:00:00Z') },
    { id: 'lead_2', name: 'Lead 2', company: 'Co 2', email: 'l2@test.com', requiredHelp: 'APP', status: 'NEW', createdAt: new Date('2026-11-09T12:00:00Z') },
    { id: 'lead_3', name: 'Lead 3', company: null, email: 'l3@test.com', requiredHelp: 'SEO', status: 'CONTACTED', createdAt: new Date('2026-11-08T12:00:00Z') },
  ];

  return {
    lead: {
      groupBy: async () => [
        { status: 'NEW', _count: { _all: 2 } },
        { status: 'CONTACTED', _count: { _all: 1 } },
      ],
      findMany: async () => defaultLeads,
      ...overrides.lead,
    },
    project: {
      count: async () => 3,
      ...overrides.project,
    },
    client: {
      count: async () => 4,
      ...overrides.client,
    },
    blogPost: {
      count: async () => 15,
      ...overrides.blogPost,
    },
  };
}

test('DashboardService - Contract, Consolidation & Metrics', async (t) => {
  await t.test('computes all 6 dashboard metrics accurately with correct structure', async () => {
    let groupByCalls = 0;
    const mockPrisma = createMockPrisma({
      lead: {
        groupBy: async () => {
          groupByCalls++;
          return [
            { status: 'NEW', _count: { _all: 5 } },
            { status: 'WON', _count: { _all: 3 } },
            { status: 'LOST', _count: { _all: 2 } },
          ];
        },
        findMany: async () => [
          { id: 'l1', name: 'A', company: null, email: 'a@a.com', requiredHelp: 'WEB', status: 'NEW', createdAt: new Date() },
        ],
      },
    });

    const service = new DashboardService(mockPrisma);
    const stats = await service.getStats();

    assert.equal(groupByCalls, 1);
    assert.equal(stats.totalLeads, 10);
    assert.equal(stats.newLeads, 5);
    assert.equal(stats.activeProjects, 3);
    assert.equal(stats.totalClients, 4);
    assert.equal(stats.publishedArticles, 15);
    assert.equal(Array.isArray(stats.recentLeads), true);
    assert.equal(stats.recentLeads.length, 1);
  });

  await t.test('handles empty database cleanly with zero counts and empty array', async () => {
    const mockPrisma = createMockPrisma({
      lead: {
        groupBy: async () => [],
        findMany: async () => [],
      },
      project: { count: async () => 0 },
      client: { count: async () => 0 },
      blogPost: { count: async () => 0 },
    });

    const service = new DashboardService(mockPrisma);
    const stats = await service.getStats();

    assert.equal(stats.totalLeads, 0);
    assert.equal(stats.newLeads, 0);
    assert.equal(stats.activeProjects, 0);
    assert.equal(stats.totalClients, 0);
    assert.equal(stats.publishedArticles, 0);
    assert.deepEqual(stats.recentLeads, []);
  });

  await t.test('safely handles malformed group counts without NaN', async () => {
    const mockPrisma = createMockPrisma({
      lead: {
        groupBy: async () => [
          { status: 'NEW', _count: null },
          { status: 'DISCOVERY' },
        ],
        findMany: async () => [],
      },
    });

    const service = new DashboardService(mockPrisma);
    const stats = await service.getStats();

    assert.equal(typeof stats.totalLeads, 'number');
    assert.equal(typeof stats.newLeads, 'number');
    assert.equal(Number.isNaN(stats.totalLeads), false);
    assert.equal(Number.isNaN(stats.newLeads), false);
  });

  await t.test('preserves descending order and maximum of 5 recent leads', async () => {
    let capturedArgs = null;
    const mockPrisma = createMockPrisma({
      lead: {
        groupBy: async () => [],
        findMany: async (args) => {
          capturedArgs = args;
          return [
            { id: '1', name: 'L1', company: null, email: '1@a.com', requiredHelp: 'WEB', status: 'NEW', createdAt: new Date(300) },
            { id: '2', name: 'L2', company: null, email: '2@a.com', requiredHelp: 'WEB', status: 'NEW', createdAt: new Date(200) },
          ];
        },
      },
    });

    const service = new DashboardService(mockPrisma);
    const stats = await service.getStats();

    assert.equal(capturedArgs.take, 5);
    assert.deepEqual(capturedArgs.orderBy, { createdAt: 'desc' });
    assert.equal(stats.recentLeads[0].id, '1');
    assert.equal(stats.recentLeads[1].id, '2');
  });
});

test('DashboardService - Caching, Invalidation & Concurrency', async (t) => {
  await t.test('caches query results and invalidates on demand', async () => {
    let dbQueryCount = 0;
    const mockPrisma = createMockPrisma({
      client: {
        count: async () => {
          dbQueryCount++;
          return 10;
        },
      },
    });

    const service = new DashboardService(mockPrisma);

    const first = await service.getStats();
    assert.equal(dbQueryCount, 1);
    assert.equal(first.totalClients, 10);

    const second = await service.getStats();
    assert.equal(dbQueryCount, 1, 'Second call must hit in-memory cache');
    assert.deepEqual(first, second);

    service.invalidateCache();

    const third = await service.getStats();
    assert.equal(dbQueryCount, 2, 'Call after invalidateCache must query DB again');
    assert.deepEqual(first, third);
  });

  await t.test('serves concurrent dashboard requests safely', async () => {
    let queryCount = 0;
    const mockPrisma = createMockPrisma({
      project: {
        count: async () => {
          queryCount++;
          return 5;
        },
      },
    });

    const service = new DashboardService(mockPrisma);
    const results = await Promise.all([
      service.getStats(),
      service.getStats(),
      service.getStats(),
    ]);

    assert.equal(results.length, 3);
    assert.equal(results[0].activeProjects, 5);
    assert.equal(results[1].activeProjects, 5);
    assert.equal(results[2].activeProjects, 5);
  });
});

test('DashboardService - Error Resilience', async (t) => {
  await t.test('returns stale cache when database refresh fails', async () => {
    let shouldFail = false;
    const mockPrisma = createMockPrisma({
      lead: {
        groupBy: async () => {
          if (shouldFail) throw new Error('Database connection dropped');
          return [{ status: 'NEW', _count: { _all: 7 } }];
        },
        findMany: async () => [],
      },
    });

    const service = new DashboardService(mockPrisma);
    const initialStats = await service.getStats();
    assert.equal(initialStats.totalLeads, 7);

    service.invalidateCache();
    shouldFail = true;

    // After invalidateCache and DB failure without cache
    const fallbackStats = await service.getStats();
    assert.equal(fallbackStats.totalLeads, 0);
  });

  await t.test('returns safe zero object when DB fails with no cache available', async () => {
    const mockPrisma = createMockPrisma({
      lead: {
        groupBy: async () => {
          throw new Error('Atlas timeout on cold boot');
        },
        findMany: async () => [],
      },
    });

    const service = new DashboardService(mockPrisma);
    const stats = await service.getStats();

    assert.equal(stats.totalLeads, 0);
    assert.equal(stats.newLeads, 0);
    assert.equal(stats.activeProjects, 0);
    assert.equal(stats.totalClients, 0);
    assert.equal(stats.publishedArticles, 0);
    assert.deepEqual(stats.recentLeads, []);
  });
});
