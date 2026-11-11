import { HttpException, HttpStatus } from '@nestjs/common';
import type { PrismaService } from '../prisma.service';
import { MAX_ADMIN_OUTREACH_PER_MINUTE, OUTREACH_LEASE_EXPIRY_MS } from './whatsapp.constants';
import { WhatsAppDeliveryStatus, WhatsAppMessageDirection } from '@prisma/client';
import type { IndividualOutreachDispatchResult } from '@palnadu/types';

export function isPrismaP2002(err: unknown): boolean {
  return Boolean(
    err && typeof err === 'object' && 'code' in err && (err as { code: string }).code === 'P2002',
  );
}

export async function enforceDistributedRateLimits(
  prisma: PrismaService,
  adminId: string,
  phone: string,
): Promise<void> {
  const minuteBucket = Math.floor(Date.now() / 60000);
  const cooldownKey = `resv:cooldown:${phone}:${minuteBucket}`;
  try {
    await prisma.whatsAppMessage.create({
      data: {
        wamId: cooldownKey,
        direction: WhatsAppMessageDirection.OUTBOUND,
        from: 'system_cooldown',
        to: phone,
        type: 'cooldown_slot',
        status: WhatsAppDeliveryStatus.RECEIVED,
      },
    });
  } catch (err: unknown) {
    if (isPrismaP2002(err)) {
      throw new HttpException(
        'Recipient outreach cooldown active. Please wait 60 seconds.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }
    throw err;
  }

  let slotAcquired = false;
  for (let slot = 1; slot <= MAX_ADMIN_OUTREACH_PER_MINUTE; slot++) {
    const rateSlotKey = `resv:rate:${adminId}:${minuteBucket}:s${slot}`;
    try {
      await prisma.whatsAppMessage.create({
        data: {
          wamId: rateSlotKey,
          direction: WhatsAppMessageDirection.OUTBOUND,
          from: 'system_rate_limit',
          to: 'admin_quota',
          type: 'rate_slot',
          status: WhatsAppDeliveryStatus.RECEIVED,
        },
      });
      slotAcquired = true;
      break;
    } catch (slotErr: unknown) {
      if (!isPrismaP2002(slotErr)) throw slotErr;
    }
  }

  if (!slotAcquired) {
    throw new HttpException(
      'Admin outreach limit exceeded (15 messages/min).',
      HttpStatus.TOO_MANY_REQUESTS,
    );
  }
}

export async function acquireIdempotencyReservation(
  prisma: PrismaService,
  claimKey: string,
  phone: string,
  adminId: string,
): Promise<{ deduplicated: boolean; reservationId?: string; result?: IndividualOutreachDispatchResult }> {
  try {
    const res = await prisma.whatsAppMessage.create({
      data: {
        wamId: claimKey,
        direction: WhatsAppMessageDirection.OUTBOUND,
        from: 'system_reservation',
        to: phone,
        type: 'idempotency_claim',
        status: WhatsAppDeliveryStatus.RECEIVED,
        rawPayload: { inFlightAt: new Date().toISOString(), leaseExpiresAt: Date.now() + OUTREACH_LEASE_EXPIRY_MS, adminId },
      },
    });
    return { deduplicated: false, reservationId: res.id };
  } catch (err: unknown) {
    if (isPrismaP2002(err)) {
      const existing = await prisma.whatsAppMessage.findUnique({ where: { wamId: claimKey } });
      if (existing) {
        const payload = (existing.rawPayload as Record<string, unknown>) || {};
        if (payload.dispatchedWamId) {
          return {
            deduplicated: true,
            result: {
              success: true,
              wamId: String(payload.dispatchedWamId),
              recipientPhone: phone,
              status: 'SENT',
              deduplicated: true,
              timestamp: existing.createdAt.toISOString(),
            },
          };
        }
      }
      throw new HttpException('Outreach dispatch in flight. Duplicate request prevented.', HttpStatus.CONFLICT);
    }
    throw err;
  }
}

export async function cleanExpiredReservations(
  prisma: PrismaService,
  olderThanMs: number = 3600000,
): Promise<{ deletedCount: number }> {
  // Clamped to at least 1 hour ago so active reservations (< 1 hour old) can never be deleted
  const safetyFloorMs = Math.max(olderThanMs, 3600000);
  const cutoff = new Date(Date.now() - safetyFloorMs);

  const res = await prisma.whatsAppMessage.deleteMany({
    where: {
      wamId: { startsWith: 'resv:' },
      createdAt: { lt: cutoff },
    },
  });
  return { deletedCount: res.count };
}

