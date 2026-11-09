import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('HealthController & PrismaService.ping()', () => {
  let HealthController;
  let PrismaService;

  before(() => {
    const outDir = join(process.cwd(), 'node_modules', '.cache', 'health-test');
    mkdirSync(outDir, { recursive: true });
    execFileSync(
      'npx',
      [
        'tsc',
        'src/health.controller.ts',
        'src/prisma.service.ts',
        '--outDir',
        outDir,
        '--module',
        'commonjs',
        '--target',
        'es2022',
        '--moduleResolution',
        'node',
        '--experimentalDecorators',
        '--emitDecoratorMetadata',
        '--skipLibCheck',
        '--esModuleInterop',
      ],
      { cwd: process.cwd(), stdio: 'pipe' },
    );
    HealthController = require(join(outDir, 'health.controller.js')).HealthController;
    PrismaService = require(join(outDir, 'prisma.service.js')).PrismaService;
  });

  it('HealthController returns ok when ping succeeds', async () => {
    const mockPrisma = {
      ping: async () => true,
    };
    const controller = new HealthController(mockPrisma);
    const result = await controller.check();

    assert.equal(result.status, 'ok');
    assert.equal(result.database, 'connected');
  });

  it('HealthController returns degraded when ping returns false', async () => {
    const mockPrisma = {
      ping: async () => false,
    };
    const controller = new HealthController(mockPrisma);
    const result = await controller.check();

    assert.equal(result.status, 'degraded');
    assert.equal(result.database, 'disconnected');
  });

  it('HealthController returns error when ping throws', async () => {
    const mockPrisma = {
      ping: async () => {
        throw new Error('Connection failed');
      },
    };
    const controller = new HealthController(mockPrisma);
    const result = await controller.check();

    assert.equal(result.status, 'error');
    assert.equal(result.errorMessage, 'Connection failed');
  });

  it('PrismaService.ping() calls $runCommandRaw and returns true on ok: 1', async () => {
    const service = new PrismaService();
    service.$runCommandRaw = async (cmd) => {
      assert.deepEqual(cmd, { ping: 1 });
      return { ok: 1 };
    };

    const isAlive = await service.ping();
    assert.equal(isAlive, true);
  });

  it('PrismaService.ping() returns false when $runCommandRaw fails', async () => {
    const service = new PrismaService();
    service.$runCommandRaw = async () => {
      throw new Error('Atlas timeout');
    };

    const isAlive = await service.ping();
    assert.equal(isAlive, false);
  });
});
