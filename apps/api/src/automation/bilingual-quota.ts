/**
 * Per-cycle bilingual quota allocator (3 Telugu + 2 English).
 *
 * Pure module: no Nest, no Prisma, fully unit-testable. The allocator decides
 * *which* pending topics a cycle may claim; claiming itself stays in the
 * service so the lease/race semantics remain in one place.
 *
 * Two deliberate guards:
 * 1. The allocator never enables itself. `readBilingualConfig` returns
 *    `enabled: false` unless the `bilingual_generation_enabled` setting is
 *    explicitly true. Absent, malformed, or falsy settings all mean
 *    English-only current behavior.
 * 2. Anti-clustering: within one cycle, a candidate whose subject concepts
 *    are all already covered by selected topics is deferred, so five posts
 *    cannot cluster around one subject even when the queue is full of it.
 */
import { canonicalizeTopic } from './topic-identity';
import type { BlogLanguage } from '@prisma/client';
import type { BilingualQuota, BilingualConfig } from '@palnadu/types';

export type { BilingualQuota, BilingualConfig };

export const BILINGUAL_QUOTA_DEFAULT: BilingualQuota = { te: 3, en: 2 };

/** Hard ceiling so a misconfigured quota cannot drain the queue in one run. */
export const BILINGUAL_QUOTA_MAX_TOTAL = 10;

/** Minimal shape the allocator needs from a queued topic row. */
export interface QuotableTopic {
  topicKey: string;
  topic: string;
  language: BlogLanguage | 'en' | 'te';
  createdAt: Date | string | number;
}

/**
 * Read the bilingual switch + quota from site settings.
 * `get` is the prisma `siteSetting.findUnique` lookup injected by the caller,
 * which keeps this function pure and testable.
 */
export function readBilingualConfig(
  get: (key: string) => unknown,
): BilingualConfig {
  const enabled = get('bilingual_generation_enabled') === true;
  return { enabled, quota: readQuota(get) };
}

function readQuota(get: (key: string) => unknown): BilingualQuota {
  const te = sanitizeCount(get('bilingual_quota_te'), BILINGUAL_QUOTA_DEFAULT.te);
  const en = sanitizeCount(get('bilingual_quota_en'), BILINGUAL_QUOTA_DEFAULT.en);
  const total = te + en;
  if (total > BILINGUAL_QUOTA_MAX_TOTAL || total <= 0) {
    return { ...BILINGUAL_QUOTA_DEFAULT };
  }
  return { te, en };
}

function sanitizeCount(value: unknown, fallback: number): number {
  const n = typeof value === 'string' ? Number.parseInt(value, 10) : (value as number);
  if (!Number.isInteger(n) || n < 0) return fallback;
  return n;
}

/**
 * Select up to quota.te Telugu + quota.en English topics, oldest-first per
 * language, skipping candidates whose subject is already covered this cycle.
 */
export function allocateQuota<T extends QuotableTopic>(pending: T[], quota: BilingualQuota): T[] {
  const selected: T[] = [];
  for (const language of ['te', 'en'] as const) {
    const want = Math.max(0, quota[language] | 0);
    if (want === 0) continue;
    const covered = new Set<string>();
    for (const t of selected) {
      for (const c of subjectConcepts(t.topic)) covered.add(c);
    }
    const candidates = pending
      .filter((t) => t.language === language)
      .sort((a, b) => +new Date(a.createdAt) - +new Date(b.createdAt));
    for (const c of candidates) {
      if (selected.filter((t) => t.language === language).length >= want) break;
      const concepts = subjectConcepts(c.topic);
      // A topic with no recognisable subject never clusters by definition.
      if (concepts.length > 0 && concepts.every((cpt) => covered.has(cpt))) continue;
      for (const cpt of concepts) covered.add(cpt);
      selected.push(c);
    }
  }
  return selected;
}

/** Subject-level concept ids, used only for anti-clustering. */
function subjectConcepts(topic: string): string[] {
  try {
    return canonicalizeTopic(topic).concepts.filter((c) => c.startsWith('subject:'));
  } catch {
    return [];
  }
}
