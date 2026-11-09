import type { UtmParameters } from '@palnadu/types';

const UTM_STORAGE_KEY = 'palnadu_utm_params';

const UTM_KEYS: (keyof UtmParameters)[] = [
  'utm_source',
  'utm_medium',
  'utm_campaign',
  'utm_term',
  'utm_content',
  'gclid',
];

/**
 * Retrieves persisted UTM campaign parameters from browser session storage.
 */
export function getStoredUtmParams(): UtmParameters {
  if (typeof window === 'undefined') {
    return {};
  }

  try {
    const raw = sessionStorage.getItem(UTM_STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as UtmParameters;
  } catch {
    return {};
  }
}

/**
 * Extracts UTM and click ID parameters from search query string and saves to session storage.
 */
export function captureUtmFromSearch(searchParams: URLSearchParams): UtmParameters | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const found: UtmParameters = {};
  let hasUtm = false;

  for (const key of UTM_KEYS) {
    const value = searchParams.get(key);
    if (value && value.trim()) {
      found[key] = value.trim();
      hasUtm = true;
    }
  }

  if (hasUtm) {
    try {
      const existing = getStoredUtmParams();
      const merged = { ...existing, ...found };
      sessionStorage.setItem(UTM_STORAGE_KEY, JSON.stringify(merged));
      return merged;
    } catch {
      return found;
    }
  }

  return null;
}

