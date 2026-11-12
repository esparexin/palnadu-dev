import { PrismaService } from '../../prisma.service';
import { BlogLanguage, TopicStatus } from '@prisma/client';
import { ClaimedTopic } from './types';

export const STALE_CLAIM_MS = 5 * 60 * 1000;

export function isTopicRetryReady(nextRetryAt: Date | null | undefined, now: Date): boolean {
  return !nextRetryAt || nextRetryAt <= now;
}

export function isClaimStale(claimedAt: Date | null | undefined, staleBefore: Date): boolean {
  return Boolean(claimedAt && claimedAt < staleBefore);
}

/**
 * Atomically transitions an eligible queue row to CLAIMED under lease protection
 * so two workers cannot generate the same topic concurrently.
 */
export async function atomicClaimTopic(params: {
  prisma: PrismaService;
  candidate: ClaimedTopic;
  workerId: string;
  now: Date;
  staleBefore: Date;
  allowedStatuses: TopicStatus[];
  maxAttempts?: number;
}): Promise<ClaimedTopic | null> {
  const { prisma, candidate, workerId, now, staleBefore, allowedStatuses, maxAttempts } = params;
  const claim = await prisma.blogTopic.updateMany({
    where: {
      id: candidate.id,
      status: { in: allowedStatuses },
      ...(maxAttempts !== undefined ? { attempts: { lt: maxAttempts } } : {}),
      OR: [
        { claimedAt: null },
        { claimedAt: { isSet: false } as any },
        { claimedAt: { lt: staleBefore } },
      ],
    },
    data: { status: TopicStatus.CLAIMED, claimedAt: now, claimedBy: workerId },
  });

  if (claim.count === 0) return null;
  return { ...candidate, status: TopicStatus.CLAIMED };
}

export async function claimAllocatedTopicRow(params: {
  prisma: PrismaService;
  workerId: string;
  target: { topicKey: string; language: BlogLanguage };
  maxAttempts: number;
}): Promise<ClaimedTopic | null> {
  const { prisma, workerId, target, maxAttempts } = params;
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);
  const candidate = await prisma.blogTopic.findUnique({
    where: { topicKey_language: { topicKey: target.topicKey, language: target.language } },
  });
  if (!candidate || candidate.attempts >= maxAttempts) return null;

  const pendingReady = candidate.status === TopicStatus.PENDING && isTopicRetryReady(candidate.nextRetryAt, now);
  const staleClaim = candidate.status === TopicStatus.CLAIMED && isClaimStale(candidate.claimedAt, staleBefore);
  if (!pendingReady && !staleClaim) return null;

  return atomicClaimTopic({
    prisma,
    candidate,
    workerId,
    now,
    staleBefore,
    allowedStatuses: [TopicStatus.PENDING, TopicStatus.CLAIMED],
    maxAttempts,
  });
}

export async function claimManualTopicByKey(params: {
  prisma: PrismaService;
  workerId: string;
  topicKey: string;
  language: BlogLanguage;
}): Promise<ClaimedTopic | null> {
  const { prisma, workerId, topicKey, language } = params;
  const now = new Date();
  const staleBefore = new Date(now.getTime() - STALE_CLAIM_MS);
  const candidate = await prisma.blogTopic.findUnique({
    where: { topicKey_language: { topicKey, language } },
  });
  if (!candidate || candidate.status === TopicStatus.COMPLETED) return null;
  if (candidate.status === TopicStatus.CLAIMED && !isClaimStale(candidate.claimedAt, staleBefore)) {
    return null;
  }

  return atomicClaimTopic({
    prisma,
    candidate,
    workerId,
    now,
    staleBefore,
    allowedStatuses: [TopicStatus.PENDING, TopicStatus.FAILED, TopicStatus.CLAIMED],
  });
}
