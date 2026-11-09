import type { GoogleConsentSettings } from '@palnadu/types';

const CONSENT_STORAGE_KEY = 'palnadu_consent_v2';

export const DEFAULT_CONSENT_SETTINGS: GoogleConsentSettings = {
  analytics_storage: 'denied',
  ad_storage: 'denied',
  ad_user_data: 'denied',
  ad_personalization: 'denied',
  wait_for_update: 500,
};

export const GRANTED_CONSENT_SETTINGS: GoogleConsentSettings = {
  analytics_storage: 'granted',
  ad_storage: 'granted',
  ad_user_data: 'granted',
  ad_personalization: 'granted',
};

/**
 * Loads stored consent settings from browser storage.
 */
export function getStoredConsentPreferences(): GoogleConsentSettings | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    const raw = localStorage.getItem(CONSENT_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as GoogleConsentSettings;
  } catch {
    return null;
  }
}

/**
 * Updates Google Consent Mode v2 state and dispatches consent_update event.
 */
export function applyConsentUpdate(settings: GoogleConsentSettings): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.setItem(CONSENT_STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Storage quota or private browsing mode fallback
  }

  if (typeof window.gtag === 'function') {
    window.gtag('consent', 'update', {
      analytics_storage: settings.analytics_storage,
      ad_storage: settings.ad_storage,
      ad_user_data: settings.ad_user_data,
      ad_personalization: settings.ad_personalization,
    });
  }

  window.dataLayer = window.dataLayer || [];
  window.dataLayer.push({
    event: 'consent_update',
    ...settings,
  });
}
