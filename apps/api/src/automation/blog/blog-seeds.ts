import { BlogLanguage } from '@prisma/client';
import { toTopicKey } from '../topic-identity';
import { CURATED_TOPIC_QUEUE, DYNAMIC_LOCATIONS, DYNAMIC_SERVICES, QueueCandidate } from './types';

/**
 * Programmatic location-service matrix generator.
 * Disabled by default to comply with Google Helpful Content & Scaled Spam policies (anti-doorway safeguards).
 */
export function matrixCandidates(_generatedKeys: Set<string>): QueueCandidate[] {
  return [];
}

export function getAllInitialSeeds(_generatedKeys: Set<string>): QueueCandidate[] {
  return CURATED_TOPIC_QUEUE.map((t): QueueCandidate => ({ ...t, source: 'curated-rotation' }));
}

export function inferCategoryFromTopic(phrase: string, primaryKeyword = ''): string {
  const p = `${phrase} ${primaryKeyword}`.toLowerCase();
  if (/\bseo\b/.test(p)) return 'local-seo-business';
  if (/mobile app|android|ios|app development/.test(p)) return 'app-development';
  if (/school|admission|fee portal/.test(p)) return 'school-websites';
  if (/saas|mvp|startup|idea to/.test(p)) return 'startups';
  return 'website-development';
}
