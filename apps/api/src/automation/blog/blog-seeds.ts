import type { BlogLanguage } from '@prisma/client';
import { CURATED_TOPIC_QUEUE, type QueueCandidate } from './types';
import { TELUGU_CURATED_TOPIC_QUEUE } from './telugu-seeds';

/**
 * Programmatic location-service matrix generator.
 * Disabled by default to comply with Google Helpful Content & Scaled Spam policies (anti-doorway safeguards).
 */
export function matrixCandidates(_generatedKeys: Set<string>): QueueCandidate[] {
  return [];
}

export function getAllInitialSeeds(
  _generatedKeys: Set<string>,
  language: BlogLanguage = 'en' as BlogLanguage,
): QueueCandidate[] {
  if (language === ('te' as BlogLanguage)) {
    return TELUGU_CURATED_TOPIC_QUEUE.map((t): QueueCandidate => ({
      ...t,
      language: 'te' as BlogLanguage,
      source: 'curated-rotation',
    }));
  }

  return CURATED_TOPIC_QUEUE.map((t): QueueCandidate => ({
    ...t,
    language: 'en' as BlogLanguage,
    source: 'curated-rotation',
  }));
}

export function inferCategoryFromTopic(phrase: string, primaryKeyword = ''): string {
  const p = `${phrase} ${primaryKeyword}`.toLowerCase();
  if (/\bseo\b/.test(p)) return 'local-seo-business';
  if (/mobile app|android|ios|app development/.test(p)) return 'app-development';
  if (/school|admission|fee portal/.test(p)) return 'school-websites';
  if (/saas|mvp|startup|entrepreneur|new business|business launch|idea to/.test(p)) return 'startups';
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

export interface CategoryInternalLink {
  anchor: string;
  url: string;
}

export const CANONICAL_CATEGORY_INTERNAL_LINKS: Record<
  string,
  { en: CategoryInternalLink[]; te: CategoryInternalLink[] }
> = {
  'app-development': {
    en: [
      { anchor: 'Android App Development', url: '/services/android-app-development' },
      { anchor: 'Mobile Applications Services', url: '/services/mobile-app-development' },
      { anchor: 'Contact Us', url: '/contact' },
    ],
    te: [
      { anchor: 'ఆండ్రాయిడ్ యాప్ డెవలప్‌మెంట్', url: '/services/android-app-development' },
      { anchor: 'మొబైల్ అప్లికేషన్ల సేవలు', url: '/services/mobile-app-development' },
      { anchor: 'మమ్మల్ని సంప్రదించండి', url: '/contact' },
    ],
  },
  'school-websites': {
    en: [
      { anchor: 'Website Development Services', url: '/services/website-development' },
      { anchor: 'Business Automation Systems', url: '/services/business-automation' },
      { anchor: 'Contact Us', url: '/contact' },
    ],
    te: [
      { anchor: 'వెబ్‌సైట్ డెవలప్‌మెంట్ సేవలు', url: '/services/website-development' },
      { anchor: 'బిజినెస్ ఆటోమేషన్ సిస్టమ్స్', url: '/services/business-automation' },
      { anchor: 'మమ్మల్ని సంప్రదించండి', url: '/contact' },
    ],
  },
  startups: {
    en: [
      { anchor: 'MVP Development Services', url: '/services/mvp-development' },
      { anchor: 'Idea Validation Services', url: '/services/idea-validation' },
      { anchor: 'Contact Us', url: '/contact' },
    ],
    te: [
      { anchor: 'MVP డెవలప్‌మెంట్ సేవలు', url: '/services/mvp-development' },
      { anchor: 'ఐడియా వాలిడేషన్', url: '/services/idea-validation' },
      { anchor: 'మమ్మల్ని సంప్రదించండి', url: '/contact' },
    ],
  },
  'local-seo-business': {
    en: [
      { anchor: 'Technical SEO, AEO & GEO', url: '/services/seo-aeo-geo' },
      { anchor: 'Digital Marketing Services', url: '/services/digital-marketing' },
      { anchor: 'Contact Us', url: '/contact' },
    ],
    te: [
      { anchor: 'టెక్నికల్ SEO మరియు లోకల్ సెర్చ్', url: '/services/seo-aeo-geo' },
      { anchor: 'డిజిటల్ మార్కెటింగ్ సేవలు', url: '/services/digital-marketing' },
      { anchor: 'మమ్మల్ని సంప్రదించండి', url: '/contact' },
    ],
  },
  'website-development': {
    en: [
      { anchor: 'Website Development & UI/UX', url: '/services/website-development' },
      { anchor: 'Web Applications & Full-Stack', url: '/services/web-development' },
      { anchor: 'Contact Us', url: '/contact' },
    ],
    te: [
      { anchor: 'వెబ్‌సైట్ డెవలప్‌మెంట్ సేవలు', url: '/services/website-development' },
      { anchor: 'వెబ్ అప్లికేషన్ల డెవలప్‌మెంట్', url: '/services/web-development' },
      { anchor: 'మమ్మల్ని సంప్రదించండి', url: '/contact' },
    ],
  },
};

export function getCategoryInternalLinks(
  categorySlug: string,
  language: 'en' | 'te' = 'en',
): CategoryInternalLink[] {
  const mapping =
    CANONICAL_CATEGORY_INTERNAL_LINKS[categorySlug] ??
    CANONICAL_CATEGORY_INTERNAL_LINKS['website-development'];
  return language === 'te' ? mapping.te : mapping.en;
}

