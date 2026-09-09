/**
 * ==============================================================================
 * PALNADU.DEV — SHARED MEDIA & ASSETS SSOT
 * ==============================================================================
 * Centralized Single Source of Truth for brand assets, Cloudinary transformations,
 * and media URLs across apps/web and apps/admin without duplication.
 */

export const brandAssets = {
  // Cloudinary Hosted CDN Assets (SSOT with auto-format & auto-quality)
  cloudinary: {
    logoHorizontal: 'https://res.cloudinary.com/jescuj9a/image/upload/f_auto,q_auto/v1788959247/palnadu/brand/logo-horizontal.png',
    logoWhite: 'https://res.cloudinary.com/jescuj9a/image/upload/f_auto,q_auto/v1788959246/palnadu/brand/logo-white.png',
    faviconMaster: 'https://res.cloudinary.com/jescuj9a/image/upload/f_auto,q_auto/v1788959187/palnadu/brand/favicon-master.png',
    ogImage: 'https://res.cloudinary.com/jescuj9a/image/upload/f_auto,q_auto/v1788959247/palnadu/brand/og-image.png',
    coverBanner: 'https://res.cloudinary.com/jescuj9a/image/upload/f_auto,q_auto/v1788959195/palnadu/brand/cover-transparent.png',
  },
  // Local static paths (Fast local cache)
  logoHorizontal: '/palnadu-logo-horizontal.png',
  logoWhite: '/palnadu-logo-white.png',
  logoDarkText: '/palnadu-logo-horizontal.png',
  defaultOgImage: 'https://res.cloudinary.com/jescuj9a/image/upload/f_auto,q_auto/v1788959247/palnadu/brand/og-image.png',
} as const;

export interface ImageTransformOptions {
  width?: number;
  height?: number;
  crop?: 'fill' | 'fit' | 'thumb' | 'scale' | 'limit';
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | number;
  format?: 'auto' | 'webp' | 'avif' | 'png' | 'jpg';
}

/**
 * Returns an optimized Cloudinary delivery URL with on-the-fly transformations.
 * If the URL is not from Cloudinary, returns the original URL safely.
 *
 * Example:
 *   getOptimizedImageUrl(post.coverImage, { width: 800, height: 450 })
 *   -> "https://res.cloudinary.com/.../image/upload/w_800,h_450,c_fill,q_auto,f_auto/v123/..."
 */
export function getOptimizedImageUrl(
  url?: string | null,
  options: ImageTransformOptions = {},
): string {
  if (!url) return '';

  // Only transform Cloudinary URLs
  if (!url.includes('res.cloudinary.com') || !url.includes('/upload/')) {
    return url;
  }

  const {
    width,
    height,
    crop = 'fill',
    quality = 'auto',
    format = 'auto',
  } = options;

  const transformations: string[] = [];

  if (width) transformations.push(`w_${width}`);
  if (height) transformations.push(`h_${height}`);
  if (width || height) transformations.push(`c_${crop}`);
  if (quality) transformations.push(`q_${quality}`);
  if (format) transformations.push(`f_${format}`);

  if (transformations.length === 0) {
    transformations.push('q_auto', 'f_auto');
  }

  const transformString = transformations.join(',');

  // Insert transformation after "/upload/"
  return url.replace('/upload/', `/upload/${transformString}/`);
}

/**
 * Standard responsive presets
 */
export const imagePresets = {
  thumbnail: (url: string) =>
    getOptimizedImageUrl(url, { width: 200, height: 200, crop: 'thumb' }),
  avatar: (url: string) =>
    getOptimizedImageUrl(url, { width: 96, height: 96, crop: 'thumb' }),
  blogCard: (url: string) =>
    getOptimizedImageUrl(url, { width: 640, height: 360, crop: 'fill' }),
  blogHero: (url: string) =>
    getOptimizedImageUrl(url, { width: 1200, height: 630, crop: 'fill' }),
  caseStudyScreenshot: (url: string) =>
    getOptimizedImageUrl(url, { width: 1000, crop: 'limit' }),
};
