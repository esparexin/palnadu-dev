import { Logger } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';

const logger = new Logger('WhatsAppDispatchLock');

export const DEFAULT_DISPATCH_LOCK_LEASE_MS = 10000;
export const DEFAULT_DRAIN_TIMEOUT_MS = 5000;
export const DEFAULT_DRAIN_POLL_MS = 50;

export interface AcquireLockResult {
  acquired: boolean;
  reason?: 'TAKEOVER_ACTIVE' | 'LEASE_BUSY';
  lockExpiresAt?: Date;
}

/**
 * Atomically acquires a distributed dispatch lease on a conversation.
 * Fails immediately if human takeover is active, or if another worker holds an active lease.
 */
export async function acquireDispatchLock(
  prisma: PrismaService,
  phone: string,
  workerId: string,
  leaseMs = DEFAULT_DISPATCH_LOCK_LEASE_MS,
): Promise<AcquireLockResult> {
  const now = new Date();
  const leaseExpiresAt = new Date(now.getTime() + leaseMs);

  if (!prisma?.whatsAppConversation || typeof prisma.whatsAppConversation.updateMany !== 'function') {
    return { acquired: true, lockExpiresAt: leaseExpiresAt };
  }

  // 1. Fast pre-check: verify conversation exists and human takeover is not active
  const existing = await prisma.whatsAppConversation.findUnique({
    where: { customerPhone: phone },
    select: { humanTakeover: true, dispatchLockOwner: true, dispatchLockExpiresAt: true },
  });

  if (existing?.humanTakeover) {
    logger.warn(`Dispatch lease rejected for ${phone}: human takeover is active.`);
    return { acquired: false, reason: 'TAKEOVER_ACTIVE' };
  }

  // 2. If conversation does not exist, initialize it with the lock held
  if (!existing) {
    try {
      await prisma.whatsAppConversation.create({
        data: {
          customerPhone: phone,
          humanTakeover: false,
          dispatchLockOwner: workerId,
          dispatchLockExpiresAt: leaseExpiresAt,
        },
      });
      return { acquired: true, lockExpiresAt: leaseExpiresAt };
    } catch {
      // Race: another worker created the record concurrently, fall through to updateMany
    }
  }

  // 3. Atomically acquire the lease using MongoDB single-document update atomicity
  const claim = await prisma.whatsAppConversation.updateMany({
    where: {
      customerPhone: phone,
      humanTakeover: false,
      OR: [
        { dispatchLockExpiresAt: null },
        { dispatchLockExpiresAt: { isSet: false } as any },
        { dispatchLockExpiresAt: { lt: now } },
      ],
    },
    data: {
      dispatchLockOwner: workerId,
      dispatchLockExpiresAt: leaseExpiresAt,
    },
  });

  if (claim.count === 0) {
    const recheck = await prisma.whatsAppConversation.findUnique({
      where: { customerPhone: phone },
      select: { humanTakeover: true },
    });
    const reason = recheck?.humanTakeover ? 'TAKEOVER_ACTIVE' : 'LEASE_BUSY';
    return { acquired: false, reason };
  }

  return { acquired: true, lockExpiresAt: leaseExpiresAt };
}

/**
 * Atomically releases the dispatch lease if owned by workerId.
 */
export async function releaseDispatchLock(
  prisma: PrismaService,
  phone: string,
  workerId: string,
): Promise<boolean> {
  if (!prisma?.whatsAppConversation || typeof prisma.whatsAppConversation.updateMany !== 'function') {
    return true;
  }
  const res = await prisma.whatsAppConversation.updateMany({
    where: {
      customerPhone: phone,
      dispatchLockOwner: workerId,
    },
    data: {
      dispatchLockOwner: null,
      dispatchLockExpiresAt: null,
    },
  });
  return res.count > 0;
}

/**
 * Waits for any in-flight automated dispatch on the conversation to complete.
 * Handles process crashes by releasing stale leases if dispatchLockExpiresAt has elapsed.
 */
export async function waitForDispatchDrain(
  prisma: PrismaService,
  phone: string,
  maxWaitMs = DEFAULT_DRAIN_TIMEOUT_MS,
  pollIntervalMs = DEFAULT_DRAIN_POLL_MS,
): Promise<{ drained: boolean; activeWorkerId?: string }> {
  if (!prisma?.whatsAppConversation || typeof prisma.whatsAppConversation.findUnique !== 'function') {
    return { drained: true };
  }
  const startTime = Date.now();

  while (Date.now() - startTime < maxWaitMs) {
    const conv = await prisma.whatsAppConversation.findUnique({
      where: { customerPhone: phone },
      select: { dispatchLockOwner: true, dispatchLockExpiresAt: true },
    });

    if (!conv?.dispatchLockOwner) {
      return { drained: true };
    }

    const now = new Date();
    if (conv.dispatchLockExpiresAt && conv.dispatchLockExpiresAt <= now) {
      // Stale lease from a crashed or unresponsive worker: safely break lease
      logger.warn(`Clearing expired dispatch lease for ${phone} held by ${conv.dispatchLockOwner}`);
      await prisma.whatsAppConversation.updateMany({
        where: {
          customerPhone: phone,
          dispatchLockOwner: conv.dispatchLockOwner,
          dispatchLockExpiresAt: { lte: now },
        },
        data: {
          dispatchLockOwner: null,
          dispatchLockExpiresAt: null,
        },
      });
      return { drained: true };
    }

    await new Promise((resolve) => setTimeout(resolve, pollIntervalMs));
  }

  logger.error(`Drain timeout exceeded for ${phone}. Force-clearing dispatch lease.`);
  await prisma.whatsAppConversation.updateMany({
    where: { customerPhone: phone },
    data: { dispatchLockOwner: null, dispatchLockExpiresAt: null },
  });

  return { drained: false };
}
