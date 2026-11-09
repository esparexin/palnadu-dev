import { describe, it, before } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdirSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);

describe('LeadsService - Latency, Idempotency & Reliability', () => {
  let LeadsService;

  before(() => {
    const outDir = join(process.cwd(), 'node_modules', '.cache', 'leads-service-test');
    mkdirSync(outDir, { recursive: true });
    execFileSync(
      'npx',
      [
        'tsc',
        'src/leads/leads.service.ts',
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
    const mod = require(join(outDir, 'leads', 'leads.service.js'));
    LeadsService = mod.LeadsService;
  });

  it('creates lead and notification under normal conditions', async () => {
    let leadCreated = null;
    let notifCreated = null;

    const mockPrisma = {
      lead: {
        findFirst: async () => null,
        create: async ({ data }) => {
          leadCreated = { id: 'lead_123', ...data, createdAt: new Date() };
          return leadCreated;
        },
      },
      notification: {
        create: async ({ data }) => {
          notifCreated = { id: 'notif_123', ...data };
          return notifCreated;
        },
      },
    };

    const service = new LeadsService(mockPrisma);
    const result = await service.create({
      name: 'Ravi Teja',
      email: 'ravi@example.com',
      problemDescription: 'Need website development for agricultural trade in Narasaraopet',
      projectStage: 'JUST_AN_IDEA',
      requiredHelp: 'WEB_APPLICATION',
    });

    assert.equal(result.id, 'lead_123');
    assert.equal(result.email, 'ravi@example.com');
    assert.equal(leadCreated.id, 'lead_123');
    assert.equal(notifCreated.type, 'NEW_LEAD');
    assert.equal(notifCreated.data.leadId, 'lead_123');
  });

  it('prevents duplicate submission within 60s (idempotency)', async () => {
    const existing = {
      id: 'lead_existing_999',
      name: 'Ravi Teja',
      email: 'ravi@example.com',
      problemDescription: 'Need website development for agricultural trade in Narasaraopet',
      createdAt: new Date(),
    };

    let leadCreateCalled = false;
    let notifCreateCalled = false;

    const mockPrisma = {
      lead: {
        findFirst: async () => existing,
        create: async () => {
          leadCreateCalled = true;
          return {};
        },
      },
      notification: {
        create: async () => {
          notifCreateCalled = true;
          return {};
        },
      },
    };

    const service = new LeadsService(mockPrisma);
    const result = await service.create({
      name: 'Ravi Teja',
      email: 'ravi@example.com',
      problemDescription: 'Need website development for agricultural trade in Narasaraopet',
      projectStage: 'JUST_AN_IDEA',
      requiredHelp: 'WEB_APPLICATION',
    });

    assert.equal(result.id, 'lead_existing_999');
    assert.equal(leadCreateCalled, false, 'Should not create duplicate lead');
    assert.equal(notifCreateCalled, false, 'Should not create duplicate notification');
  });

  it('creates a new lead if problemDescription differs within 60s', async () => {
    const existing = {
      id: 'lead_existing_999',
      name: 'Ravi Teja',
      email: 'ravi@example.com',
      problemDescription: 'First inquiry about mobile app',
      createdAt: new Date(),
    };

    let leadCreateCalled = false;

    const mockPrisma = {
      lead: {
        findFirst: async () => existing,
        create: async ({ data }) => {
          leadCreateCalled = true;
          return { id: 'lead_new_100', ...data };
        },
      },
      notification: {
        create: async () => ({ id: 'notif_100' }),
      },
    };

    const service = new LeadsService(mockPrisma);
    const result = await service.create({
      name: 'Ravi Teja',
      email: 'ravi@example.com',
      problemDescription: 'Second different inquiry about SEO',
      projectStage: 'JUST_AN_IDEA',
      requiredHelp: 'IDEA_VALIDATION',
    });

    assert.equal(result.id, 'lead_new_100');
    assert.equal(leadCreateCalled, true);
  });

  it('handles notification failure safely without aborting lead creation', async () => {
    const mockPrisma = {
      lead: {
        findFirst: async () => null,
        create: async ({ data }) => ({ id: 'lead_survives', ...data }),
      },
      notification: {
        create: async () => {
          throw new Error('Notification collection network timeout');
        },
      },
    };

    const service = new LeadsService(mockPrisma);
    const result = await service.create({
      name: 'Anil Kumar',
      email: 'anil@example.com',
      problemDescription: 'Consultation for ERP system',
      projectStage: 'EXISTING_BUSINESS',
      requiredHelp: 'CUSTOM_SOFTWARE',
    });

    assert.equal(result.id, 'lead_survives');
  });
});
