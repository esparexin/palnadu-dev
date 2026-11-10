/**
 * Single source of truth for blog publication dates, timezones, and display labels.
 *
 * Palnadu.dev jurisdiction & operations are anchored in Andhra Pradesh, India.
 * All blog publication dates and timestamps must be formatted using Asia/Kolkata
 * (IST, UTC+05:30) to eliminate server-vs-client hydration mismatches in Next.js SSR.
 */

export const PALNADU_TIMEZONE = 'Asia/Kolkata';
export const PALNADU_TIMEZONE_OFFSET = '+05:30';

export type BlogDateLocale = 'en' | 'te' | 'en-US' | 'te-IN' | string;

export interface BlogDateFormatOptions {
  monthFormat?: 'short' | 'long';
  includeTime?: boolean;
}

export interface BlogDateStatus {
  label: 'Published' | 'Draft' | 'Archived' | string;
  date: string;
  iso: string;
}

/** Resolves an application locale string into an Intl BCP-47 language tag. */
export function resolveDateLocaleTag(locale?: BlogDateLocale): string {
  if (!locale) return 'en-US';
  if (locale === 'te' || locale === 'te-IN') return 'te-IN';
  if (locale === 'en' || locale === 'en-US') return 'en-US';
  if (locale === 'en-IN') return 'en-IN';
  return locale;
}

/** Parses any valid date input into a Date object or null if invalid. */
export function parseBlogDate(date: string | number | Date | null | undefined): Date | null {
  if (date === null || date === undefined || date === '') return null;
  const parsed = date instanceof Date ? date : new Date(date);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}

/** Converts date input to an ISO 8601 string or undefined if invalid. */
export function toIsoBlogDate(date: string | number | Date | null | undefined): string | undefined {
  const parsed = parseBlogDate(date);
  return parsed ? parsed.toISOString() : undefined;
}

/** Formats a blog date using the project timezone (Asia/Kolkata). */
export function formatBlogDate(
  date: string | number | Date | null | undefined,
  locale?: BlogDateLocale,
  options?: BlogDateFormatOptions,
): string {
  const parsed = parseBlogDate(date);
  if (!parsed) return '';

  const tag = resolveDateLocaleTag(locale);
  const month = options?.monthFormat ?? 'short';

  const formatOptions: Intl.DateTimeFormatOptions = {
    timeZone: PALNADU_TIMEZONE,
    year: 'numeric',
    month,
    day: 'numeric',
  };

  if (options?.includeTime) {
    formatOptions.hour = '2-digit';
    formatOptions.minute = '2-digit';
    formatOptions.hour12 = true;
  }

  return new Intl.DateTimeFormat(tag, formatOptions).format(parsed);
}

/** Returns status label, display date, and ISO string for admin and listing views. */
export function describeBlogDateStatus(post: {
  status?: string | null;
  publishDate?: string | Date | null;
  createdAt?: string | Date | null;
  updatedAt?: string | Date | null;
}): BlogDateStatus {
  const status = (post.status ?? 'DRAFT').toUpperCase();

  if (status === 'PUBLISHED') {
    const target = post.publishDate || post.createdAt;
    return {
      label: 'Published',
      date: formatBlogDate(target),
      iso: toIsoBlogDate(target) ?? '',
    };
  }

  if (status === 'DRAFT') {
    const target = post.createdAt;
    return {
      label: 'Draft',
      date: formatBlogDate(target),
      iso: toIsoBlogDate(target) ?? '',
    };
  }

  if (status === 'ARCHIVED') {
    const target = post.publishDate || post.createdAt;
    return {
      label: 'Archived',
      date: formatBlogDate(target),
      iso: toIsoBlogDate(target) ?? '',
    };
  }

  const target = post.publishDate || post.createdAt;
  return {
    label: post.status ?? 'Draft',
    date: formatBlogDate(target),
    iso: toIsoBlogDate(target) ?? '',
  };
}
