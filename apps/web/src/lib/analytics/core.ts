import type {
  AnalyticsDataLayerPayload,
  AnalyticsEventMap,
  AnalyticsEventName,
} from '@palnadu/types';
import { getStoredUtmParams } from './utm';

/* eslint-disable no-unused-vars */
declare global {
  interface Window {
    dataLayer?: unknown[];
    gtag?: (..._args: unknown[]) => void;
  }
}
/* eslint-enable no-unused-vars */

/**
 * Single Source of Truth for pushing telemetry events to Google Tag Manager dataLayer.
 * Automatically injects active UTM parameters when available.
 */
export function pushAnalyticsEvent<T extends AnalyticsEventName>(
  eventName: T,
  payload: AnalyticsEventMap[T],
): void {
  if (typeof window === 'undefined') {
    return;
  }

  window.dataLayer = window.dataLayer || [];

  const storedUtms = getStoredUtmParams();
  const eventPayload: AnalyticsDataLayerPayload<T> = {
    event: eventName,
    ...storedUtms,
    ...payload,
  };

  window.dataLayer.push(eventPayload);

  if (process.env.NODE_ENV === 'development' || process.env.NEXT_PUBLIC_ANALYTICS_DEBUG === 'true') {
    console.debug(`[Analytics GTM] ${eventName}`, eventPayload);
  }
}
