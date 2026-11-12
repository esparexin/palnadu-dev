import { BlogLanguage, TopicStatus } from '@prisma/client';
import { Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma.service';
import { DiscoveredTopic } from '../seo-sources';
import { canonicalizeTopic } from '../topic-identity';
import { inferCategoryFromTopic } from './blog-seeds';
import { QueueCandidate } from './types';

export const DEFAULT_TRANSIENT_FAILURE_COOLDOWN_MS = 12 * 60 * 60 * 1000;
const DEFAULT_DISCOVERY_TARGET_LOCATION = 'Palnadu and Guntur, Andhra Pradesh';
const DISCOVERY_LOCATION_LABELS: Record<string, string> = {
  guntur: 'Guntur, Andhra Pradesh',
  palnadu: 'Palnadu, Andhra Pradesh',
  narasaraopet: 'Narasaraopet, Palnadu, Andhra Pradesh',
  chilakaluripet: 'Chilakaluripet, Palnadu, Andhra Pradesh',
  vinukonda: 'Vinukonda, Palnadu, Andhra Pradesh',
  sattenapalle: 'Sattenapalle, Palnadu, Andhra Pradesh',
  macherla: 'Macherla, Palnadu, Andhra Pradesh',
  piduguralla: 'Piduguralla, Palnadu, Andhra Pradesh',
  tenali: 'Tenali, Guntur, Andhra Pradesh',
  mangalagiri: 'Mangalagiri, Guntur, Andhra Pradesh',
  bapatla: 'Bapatla, Andhra Pradesh',
  amaravati: 'Amaravati, Andhra Pradesh',
  vijayawada: 'Vijayawada, Andhra Pradesh',
  rajahmundry: 'Rajahmundry, Andhra Pradesh',
  kakinada: 'Kakinada, Andhra Pradesh',
  'andhra-pradesh': 'Andhra Pradesh',
  telangana: 'Telangana',
};

const PERMANENT_FAILURE_PATTERNS = [
  'validation:',
  'validation_failed',
  'content_originality',
  'internal_links',
  'no_category',
  'invalid_api_key',
  'permission_denied',
  'model_access_denied',
];

const TRANSIENT_FAILURE_PATTERNS = [
  'model_overloaded',
  'temporary_provider_error',
  'quota_exceeded',
  'high demand',
  'temporarily unavailable',
  'rate limit',
  'timeout',
  'timed out',
  'aborted',
  'fetch failed',
  'econn',
  'enotfound',
  'no usable gemini',
  'all configured gemini models',
  'http 503',
  'http 429',
  'http 502',
  'http 504',
  '[503]',
  '[429]',
  '503 ',
  '429 ',
];

export function isPermanentFailureError(lastError?: string | null): boolean {
  if (!lastError) return true;
  const lower = lastError.toLowerCase();
  return PERMANENT_FAILURE_PATTERNS.some((pattern) => lower.includes(pattern));
}

export function isTransientFailureError(lastError?: string | null): boolean {
  if (!lastError || isPermanentFailureError(lastError)) return false;
  const lower = lastError.toLowerCase();
  return TRANSIENT_FAILURE_PATTERNS.some((pattern) => lower.includes(pattern));
}

/**
 * Safely re-queues FAILED topics whose failure reason indicates a transient upstream outage
 * (e.g. Gemini 503/429 overload or network timeout) after a cooldown period.
 * Permanent validation/credential failures are never auto-retried.
 */
export async function recoverTransientFailedTopics(
  prisma: PrismaService,
  options: {
    language: BlogLanguage;
    maxAttempts: number;
    cooldownMs?: number;
    limit?: number;
    now?: Date;
  },
): Promise<number> {
  const limit = options.limit ?? 3;
  if (limit <= 0) return 0;

  const now = options.now ?? new Date();
  const cooldownMs = options.cooldownMs ?? DEFAULT_TRANSIENT_FAILURE_COOLDOWN_MS;
  const eligibleBefore = now.getTime() - cooldownMs;

  const failedRows = await prisma.blogTopic.findMany({
    where: { status: TopicStatus.FAILED, language: options.language },
    orderBy: { updatedAt: 'asc' },
    take: limit * 4,
  });

  let recovered = 0;
  for (const row of failedRows) {
    if (recovered >= limit) break;
    if (row.postId) continue;
    if (!isTransientFailureError(row.lastError)) continue;

    const updatedMs = row.updatedAt ? new Date(row.updatedAt).getTime() : 0;
    if (updatedMs > eligibleBefore) continue;

    const resetAttempts = Math.max(0, options.maxAttempts - 1);
    const updated = await prisma.blogTopic.updateMany({
      where: { id: row.id, status: TopicStatus.FAILED },
      data: {
        status: TopicStatus.PENDING,
        attempts: resetAttempts,
        nextRetryAt: now,
        claimedAt: null,
        claimedBy: null,
      },
    });
    recovered += updated.count;
  }

  return recovered;
}

function resolveDiscoveryTargetLocation(topic: DiscoveredTopic): string {
  const detected =
    canonicalizeTopic(topic.phrase).location ??
    canonicalizeTopic(topic.primaryKeyword).location;
  if (!detected) return DEFAULT_DISCOVERY_TARGET_LOCATION;
  return DISCOVERY_LOCATION_LABELS[detected] ?? DEFAULT_DISCOVERY_TARGET_LOCATION;
}

export function toDiscoveryQueueCandidate(
  topic: DiscoveredTopic,
  language: BlogLanguage,
): QueueCandidate {
  return {
    categorySlug: inferCategoryFromTopic(topic.phrase, topic.primaryKeyword),
    topic: topic.phrase,
    targetLocation: resolveDiscoveryTargetLocation(topic),
    searchIntent: topic.intent,
    primaryKeyword: topic.primaryKeyword,
    keywords: [...topic.secondaryKeywords, ...topic.longTailKeywords],
    referenceSources: topic.sources,
    source: 'discovery',
    language,
  };
}

export async function enqueueDiscoveredTopicsForLanguages(params: {
  logger: Logger;
  discoveryService: {
    discover: (limit?: number, language?: BlogLanguage) => Promise<DiscoveredTopic[]>;
    discoverForLanguages?: (
      limit?: number,
      languages?: BlogLanguage[],
    ) => Promise<Array<{ language: BlogLanguage; topics: DiscoveredTopic[] }>>;
  };
  enqueueTopic: (candidate: QueueCandidate) => Promise<{ enqueued: boolean; reason?: string }>;
  languages: BlogLanguage[];
  limit: number;
}): Promise<{ discovered: number; enqueued: number; rejected: string[] }> {
  const targets = [...new Set(params.languages)];
  const batches =
    typeof params.discoveryService.discoverForLanguages === 'function'
      ? await params.discoveryService.discoverForLanguages(params.limit, targets)
      : await Promise.all(
          targets.map(async (language) => ({
            language,
            topics: await params.discoveryService.discover(params.limit, language),
          })),
        );

  let discovered = 0;
  let enqueued = 0;
  const rejected: string[] = [];

  for (const batch of batches) {
    discovered += batch.topics.length;
    for (const c of batch.topics) {
      const res = await params.enqueueTopic(toDiscoveryQueueCandidate(c, batch.language));
      if (res.enqueued) enqueued += 1;
      else rejected.push(`${c.phrase} [${batch.language}]: ${res.reason}`);
    }
  }

  params.logger.log(
    `discovery [${targets.join(',')}]: ${discovered} candidates, ${enqueued} enqueued, ${rejected.length} rejected`,
  );
  return { discovered, enqueued, rejected };
}
