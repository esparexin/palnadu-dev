/**
 * Palnadu.dev — Festive Campaign Configuration
 * Centralized configuration for time-sensitive marketing & celebratory experiences.
 */

export const DIWALI_CAMPAIGN_EXPIRY_IST = '2026-11-08T23:59:59+05:30';

export interface CampaignConfig {
  id: string;
  name: string;
  brand: string;
  attribution: string;
  greeting: string;
  supportingMessage: string;
  brandSignature: string;
  expiryIST: string;
  durationMs: number;
  isEventDriven?: boolean;
}

export const DIWALI_2026_CAMPAIGN: CampaignConfig = {
  id: 'diwali-2026',
  name: 'Palnadu.dev Happy Diwali 2026 Special Experience',
  brand: 'Palnadu.dev',
  attribution: 'by Kalyan V Medaboina',
  greeting: '🪔 Happy Diwali! 🪔',
  supportingMessage:
    'May the festival of lights illuminate new ideas, inspire innovation, and bring prosperity and success.',
  brandSignature: 'Building Ideas. Engineering Solutions.',
  expiryIST: DIWALI_CAMPAIGN_EXPIRY_IST,
  durationMs: 50000, // 50 seconds celebratory introduction with progress bar
  isEventDriven: true, // Dismissal is visitor-driven ("Enter Website") or after 50s
};

/**
 * Evaluates whether the Diwali campaign is currently active.
 *
 * Rules:
 * - Expiration is strictly anchored to Indian Standard Time (IST / UTC+05:30).
 * - At or after the expiry timestamp, returns false (skips intro automatically).
 * - Fails safely (returns false) if time or configuration cannot be validated.
 */
export function isDiwaliCampaignActive(now: number = Date.now()): boolean {
  try {
    const expiryTimestamp = new Date(DIWALI_2026_CAMPAIGN.expiryIST).getTime();
    if (Number.isNaN(expiryTimestamp)) {
      return false;
    }
    return now <= expiryTimestamp;
  } catch {
    // Fail safely on any runtime or parsing anomaly
    return false;
  }
}

/**
 * Returns remaining milliseconds until the campaign expires.
 * Returns 0 if already expired.
 */
export function getCampaignRemainingMs(now: number = Date.now()): number {
  try {
    const expiryTimestamp = new Date(DIWALI_2026_CAMPAIGN.expiryIST).getTime();
    if (Number.isNaN(expiryTimestamp)) return 0;
    return Math.max(0, expiryTimestamp - now);
  } catch {
    return 0;
  }
}

