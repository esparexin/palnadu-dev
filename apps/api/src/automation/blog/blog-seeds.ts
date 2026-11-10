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

export interface CanonicalCategoryDefinition {
  name: string;
  slug: string;
  description: string;
}

export const CANONICAL_BLOG_CATEGORIES: readonly CanonicalCategoryDefinition[] = [
  {
    name: 'Website Development',
    slug: 'website-development',
    description: 'Modern corporate websites, web applications, and digital platforms.',
  },
  {
    name: 'App Development',
    slug: 'app-development',
    description: 'Android, iOS, and progressive web application development guides.',
  },
  {
    name: 'School Websites',
    slug: 'school-websites',
    description: 'Digital admissions, fee portals, and academic institution technology.',
  },
  {
    name: 'Startups & MVPs',
    slug: 'startups',
    description: 'MVP development, software architecture, and product launch strategy.',
  },
  {
    name: 'Local SEO & Business',
    slug: 'local-seo-business',
    description: 'Local Google search optimization, business automation, and digital presence.',
  },
] as const;

export async function resolveOrEnsureCategory(
  prisma: { blogCategory: any },
  categorySlug: string,
): Promise<{ id: string; name: string; slug: string } | null> {
  const existing = await prisma.blogCategory.findUnique({ where: { slug: categorySlug } });
  if (existing) return existing;

  const canonical = CANONICAL_BLOG_CATEGORIES.find((c) => c.slug === categorySlug);
  if (canonical) {
    return prisma.blogCategory.upsert({
      where: { slug: canonical.slug },
      update: {},
      create: { name: canonical.name, slug: canonical.slug, description: canonical.description },
    });
  }

  return null;
}

