import { existsSync } from 'node:fs';
import { join } from 'node:path';
import type { BlogLocale } from '../../../../../packages/config/dist/index';

interface PalnaduConfigModule {
  siteConfig: { url: string };
  blogPostPath: (post: { slug: string; language: BlogLocale }) => string;
  blogCanonicalUrl: (baseUrl: string, post: { slug: string; language: BlogLocale }) => string;
}

function loadConfigModule(): PalnaduConfigModule {
  const candidates = [
    join(__dirname, '../../../../../packages/config/dist/index.js'),
    join(process.cwd(), '../../packages/config/dist/index.js'),
    join(process.cwd(), 'packages/config/dist/index.js'),
  ];
  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      // eslint-disable-next-line @typescript-eslint/no-require-imports
      return require(candidate) as PalnaduConfigModule;
    }
  }
  throw new Error('Unable to locate built @palnadu/config module');
}

const configMod = loadConfigModule();

/** Authoritative site origin sourced from @palnadu/config SSOT. */
export const AUTHORITATIVE_SITE_ORIGIN = configMod.siteConfig.url;

/** Authoritative hostname sourced from @palnadu/config SSOT. */
export const AUTHORITATIVE_SITE_HOST = new URL(configMod.siteConfig.url).host;

function toBlogLocale(language?: BlogLocale | string): BlogLocale {
  return language === 'te' ? 'te' : 'en';
}

/** Language-aware relative blog path (/blog/:slug or /te/blog/:slug). */
export function buildLanguageBlogPath(slug: string, language?: BlogLocale | string): string {
  return configMod.blogPostPath({ slug, language: toBlogLocale(language) });
}

/** Language-aware full canonical URL matching shared Zod url() contract. */
export function buildLanguageCanonicalUrl(slug: string, language?: BlogLocale | string): string {
  return configMod.blogCanonicalUrl(configMod.siteConfig.url, {
    slug,
    language: toBlogLocale(language),
  });
}
