import { BlogLanguage } from '@prisma/client';
import { toTopicKey } from '../topic-identity';
import { CURATED_TOPIC_QUEUE, DYNAMIC_LOCATIONS, DYNAMIC_SERVICES, QueueCandidate } from './types';

export function matrixCandidates(generatedKeys: Set<string>): QueueCandidate[] {
  const out: QueueCandidate[] = [];
  const seen = new Set<string>();

  for (const s of DYNAMIC_SERVICES) {
    for (const loc of DYNAMIC_LOCATIONS) {
      const verb = s.service.endsWith('s') ? 'Modernize' : 'Modernizes';
      const topic = `How ${s.service} ${verb} Growing Businesses in ${loc}`;
      const topicKey = toTopicKey(topic);
      if (generatedKeys.has(`${topicKey}::${BlogLanguage.en}`) || seen.has(topicKey)) continue;
      seen.add(topicKey);
      out.push({
        categorySlug: s.category,
        topic,
        targetLocation: `${loc}, Andhra Pradesh`,
        source: 'matrix',
      });
    }
  }
  return out;
}

export function getAllInitialSeeds(generatedKeys: Set<string>): QueueCandidate[] {
  return [
    ...CURATED_TOPIC_QUEUE.map((t): QueueCandidate => ({ ...t, source: 'curated-rotation' })),
    ...matrixCandidates(generatedKeys),
  ];
}

export function inferCategoryFromTopic(phrase: string, primaryKeyword = ''): string {
  const p = `${phrase} ${primaryKeyword}`.toLowerCase();
  if (/\bseo\b/.test(p)) return 'local-seo-business';
  if (/mobile app|android|ios|app development/.test(p)) return 'app-development';
  if (/school|admission|fee portal/.test(p)) return 'school-websites';
  if (/saas|mvp|startup|idea to/.test(p)) return 'startups';
  return 'website-development';
}
