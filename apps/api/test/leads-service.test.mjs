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

  it('persists server-side WhatsApp consent metadata when user explicitly opts in', async () => {
    let createdPayload = null;
    const mockPrisma = {
      lead: {
        findFirst: async () => null,
        create: async ({ data }) => {
          createdPayload = data;
          return { id: 'lead_consent_1', ...data, createdAt: new Date() };
        },
      },
      notification: { create: async () => ({ id: 'notif_c1' }) },
    };
    const lead = await new LeadsService(mockPrisma).create({
      name: 'Sita Devi',
      email: 'sita@example.com',
      phone: '+91 98765-43210',
      problemDescription: 'Requesting WhatsApp marketing and project updates.',
      projectStage: 'EXISTING_BUSINESS',
      requiredHelp: 'WEB_APPLICATION',
      whatsappMarketingConsent: true,
    });
    assert.equal(lead.whatsappMarketingConsent, true);
    assert.equal(createdPayload.whatsappConsentPhone, '919876543210');
    assert.equal(createdPayload.whatsappConsentSource, 'WEBSITE_LEAD_FORM');
    assert.ok(createdPayload.whatsappConsentAt instanceof Date);
    assert.ok(typeof createdPayload.whatsappConsentVersion === 'string' && createdPayload.whatsappConsentVersion.length > 0);
  });

  it('does not deduplicate within 60s when whatsappMarketingConsent preference changes', async () => {
    const existing = {
      id: 'lead_ordinary_1',
      email: 'sita@example.com',
      problemDescription: 'Inquiry about custom software.',
      whatsappMarketingConsent: false,
      createdAt: new Date(),
    };
    let createdNew = false;
    const mockPrisma = {
      lead: {
        findFirst: async () => existing,
        create: async ({ data }) => {
          createdNew = true;
          return { id: 'lead_opted_2', ...data };
        },
      },
      notification: { create: async () => ({ id: 'notif_c2' }) },
    };
    const result = await new LeadsService(mockPrisma).create({
      name: 'Sita Devi',
      email: 'sita@example.com',
      phone: '919876543210',
      problemDescription: 'Inquiry about custom software.',
      projectStage: 'EXISTING_BUSINESS',
      requiredHelp: 'WEB_APPLICATION',
      whatsappMarketingConsent: true,
    });
    assert.equal(createdNew, true);
    assert.equal(result.id, 'lead_opted_2');
    assert.equal(result.whatsappMarketingConsent, true);
  });
});
