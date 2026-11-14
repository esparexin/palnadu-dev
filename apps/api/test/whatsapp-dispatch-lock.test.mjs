import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  acquireDispatchLock,
  releaseDispatchLock,
  waitForDispatchDrain,
} = require('../dist/whatsapp/whatsapp-dispatch-lock.util.js');

describe('WhatsApp Distributed Dispatch Lock & Takeover Serialization', () => {
  const createMockPrisma = () => {
    const conversations = new Map();

    return {
      conversations,
      prisma: {
        whatsAppConversation: {
          findUnique: async ({ where }) => conversations.get(where.customerPhone) || null,
          create: async ({ data }) => {
            const rec = { id: `c_${Date.now()}`, ...data };
            conversations.set(data.customerPhone, rec);
            return rec;
          },
          updateMany: async ({ where, data }) => {
            const rec = conversations.get(where.customerPhone);
            if (!rec) return { count: 0 };

            // Check humanTakeover requirement
            if (where.humanTakeover !== undefined && rec.humanTakeover !== where.humanTakeover) {
              return { count: 0 };
            }

            // Check lock ownership requirement
            if (where.dispatchLockOwner && rec.dispatchLockOwner !== where.dispatchLockOwner) {
              return { count: 0 };
            }

            // Check expiration / active lease conditions
            if (where.OR) {
              const now = new Date();
              const isNull = !rec.dispatchLockExpiresAt;
              const isExpired = rec.dispatchLockExpiresAt && rec.dispatchLockExpiresAt < now;
              if (!isNull && !isExpired) {
                return { count: 0 };
              }
            }

            if (where.dispatchLockExpiresAt?.lte) {
              if (!rec.dispatchLockExpiresAt || rec.dispatchLockExpiresAt > where.dispatchLockExpiresAt.lte) {
                return { count: 0 };
              }
            }

            Object.assign(rec, data);
            return { count: 1 };
          },
        },
      },
    };
  };

  it('1. successfully acquires dispatch lease when conversation is unlocked and takeover is false', async () => {
    const { prisma, conversations } = createMockPrisma();
    conversations.set('919030787819', {
      customerPhone: '919030787819',
      humanTakeover: false,
      dispatchLockOwner: null,
      dispatchLockExpiresAt: null,
    });

    const res = await acquireDispatchLock(prisma, '919030787819', 'worker_A', 5000);
    assert.equal(res.acquired, true);
    assert.ok(res.lockExpiresAt);

    const updated = conversations.get('919030787819');
    assert.equal(updated.dispatchLockOwner, 'worker_A');
    assert.ok(updated.dispatchLockExpiresAt > new Date());
  });

  it('2. rejects dispatch lease when human takeover is active', async () => {
    const { prisma, conversations } = createMockPrisma();
    conversations.set('919030787819', {
      customerPhone: '919030787819',
      humanTakeover: true,
      dispatchLockOwner: null,
      dispatchLockExpiresAt: null,
    });

    const res = await acquireDispatchLock(prisma, '919030787819', 'worker_A', 5000);
    assert.equal(res.acquired, false);
    assert.equal(res.reason, 'TAKEOVER_ACTIVE');
  });

  it('3. rejects second concurrent worker while active lease is held by another worker', async () => {
    const { prisma, conversations } = createMockPrisma();
    conversations.set('919030787819', {
      customerPhone: '919030787819',
      humanTakeover: false,
      dispatchLockOwner: 'worker_A',
      dispatchLockExpiresAt: new Date(Date.now() + 10000), // 10s in future
    });

    const res = await acquireDispatchLock(prisma, '919030787819', 'worker_B', 5000);
    assert.equal(res.acquired, false);
    assert.equal(res.reason, 'LEASE_BUSY');
  });

  it('4. reclaims stale dispatch lease automatically after worker crash/expiry', async () => {
    const { prisma, conversations } = createMockPrisma();
    conversations.set('919030787819', {
      customerPhone: '919030787819',
      humanTakeover: false,
      dispatchLockOwner: 'crashed_worker',
      dispatchLockExpiresAt: new Date(Date.now() - 2000), // expired 2 seconds ago
    });

    const res = await acquireDispatchLock(prisma, '919030787819', 'worker_new', 5000);
    assert.equal(res.acquired, true, 'Must reclaim expired lease safely');
    const updated = conversations.get('919030787819');
    assert.equal(updated.dispatchLockOwner, 'worker_new');
  });

  it('5. releases dispatch lease only if owner matches workerId', async () => {
    const { prisma, conversations } = createMockPrisma();
    conversations.set('919030787819', {
      customerPhone: '919030787819',
      humanTakeover: false,
      dispatchLockOwner: 'worker_A',
      dispatchLockExpiresAt: new Date(Date.now() + 5000),
    });

    // Mismatched worker cannot release
    const wrongRes = await releaseDispatchLock(prisma, '919030787819', 'worker_wrong');
    assert.equal(wrongRes, false);
    assert.equal(conversations.get('919030787819').dispatchLockOwner, 'worker_A');

    // Matching worker releases cleanly
    const okRes = await releaseDispatchLock(prisma, '919030787819', 'worker_A');
    assert.equal(okRes, true);
    assert.equal(conversations.get('919030787819').dispatchLockOwner, null);
  });

  it('6. waitForDispatchDrain waits for in-flight worker to finish before confirming', async () => {
    const { prisma, conversations } = createMockPrisma();
    conversations.set('919030787819', {
      customerPhone: '919030787819',
      humanTakeover: true,
      dispatchLockOwner: 'worker_in_flight',
      dispatchLockExpiresAt: new Date(Date.now() + 5000),
    });

    // Simulate in-flight worker finishing after 40ms
    setTimeout(() => {
      const rec = conversations.get('919030787819');
      rec.dispatchLockOwner = null;
      rec.dispatchLockExpiresAt = null;
    }, 40);

    const drainResult = await waitForDispatchDrain(prisma, '919030787819', 1000, 10);
    assert.equal(drainResult.drained, true);
  });

  it('7. waitForDispatchDrain clears expired lease when worker crashes and fails to release', async () => {
    const { prisma, conversations } = createMockPrisma();
    conversations.set('919030787819', {
      customerPhone: '919030787819',
      humanTakeover: true,
      dispatchLockOwner: 'crashed_worker',
      dispatchLockExpiresAt: new Date(Date.now() - 500), // already expired
    });

    const drainResult = await waitForDispatchDrain(prisma, '919030787819', 500, 10);
    assert.equal(drainResult.drained, true);
    assert.equal(conversations.get('919030787819').dispatchLockOwner, null);
  });
});
