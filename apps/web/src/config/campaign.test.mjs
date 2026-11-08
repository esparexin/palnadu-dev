import { describe, it } from 'node:test';
import assert from 'node:assert/strict';

import {
  DIWALI_2026_CAMPAIGN,
  DIWALI_CAMPAIGN_EXPIRY_IST,
  isDiwaliCampaignActive,
  getCampaignRemainingMs,
} from './campaign.ts';

describe('Palnadu.dev Diwali 2026 Campaign Configuration', () => {
  it('should have exact brand name Palnadu.dev', () => {
    assert.equal(DIWALI_2026_CAMPAIGN.brand, 'Palnadu.dev');
  });

  it('should have exact attribution by Kalyan V Medaboina', () => {
    assert.equal(DIWALI_2026_CAMPAIGN.attribution, 'by Kalyan V Medaboina');
  });

  it('should have festive greeting 🪔 Happy Diwali! 🪔', () => {
    assert.equal(DIWALI_2026_CAMPAIGN.greeting, '🪔 Happy Diwali! 🪔');
  });

  it('should have exact supporting message', () => {
    assert.equal(
      DIWALI_2026_CAMPAIGN.supportingMessage,
      'May the festival of lights illuminate new ideas, inspire innovation, and bring prosperity and success.'
    );
  });

  it('should have exact brand signature Building Ideas. Engineering Solutions.', () => {
    assert.equal(
      DIWALI_2026_CAMPAIGN.brandSignature,
      'Building Ideas. Engineering Solutions.'
    );
  });

  it('should enforce event-driven visitor dismissal with isEventDriven flag', () => {
    assert.equal(DIWALI_2026_CAMPAIGN.isEventDriven, true);
  });

  it('should enforce duration of at least 40 seconds (50000ms / 50s)', () => {
    assert.ok(DIWALI_2026_CAMPAIGN.durationMs >= 40000);
    assert.equal(DIWALI_2026_CAMPAIGN.durationMs, 50000);
  });

  it('should have expiry ISO string in IST (+05:30) ending Nov 8, 2026 at 23:59:59', () => {
    assert.equal(DIWALI_CAMPAIGN_EXPIRY_IST, '2026-11-08T23:59:59+05:30');
    assert.equal(DIWALI_2026_CAMPAIGN.expiryIST, '2026-11-08T23:59:59+05:30');
  });

  it('should evaluate as ACTIVE before expiry time', () => {
    // Nov 8, 2026 at 08:00:00 AM IST
    const morningTime = new Date('2026-11-08T08:00:00+05:30').getTime();
    assert.equal(isDiwaliCampaignActive(morningTime), true);

    // 1 minute before expiry: Nov 8, 2026 at 11:58:59 PM IST
    const oneMinBefore = new Date('2026-11-08T23:58:59+05:30').getTime();
    assert.equal(isDiwaliCampaignActive(oneMinBefore), true);

    // Exact expiry timestamp
    const exactExpiry = new Date('2026-11-08T23:59:59+05:30').getTime();
    assert.equal(isDiwaliCampaignActive(exactExpiry), true);
  });

  it('should evaluate as INACTIVE after expiry time (auto-expire without manual intervention)', () => {
    // 1 millisecond after expiry
    const oneMsAfter = new Date('2026-11-08T23:59:59+05:30').getTime() + 1;
    assert.equal(isDiwaliCampaignActive(oneMsAfter), false);

    // 1 second after expiry: Nov 9, 2026 at 00:00:00 IST
    const midnightAfter = new Date('2026-11-09T00:00:00+05:30').getTime();
    assert.equal(isDiwaliCampaignActive(midnightAfter), false);

    // Days/months after
    const futureTime = new Date('2026-11-10T12:00:00+05:30').getTime();
    assert.equal(isDiwaliCampaignActive(futureTime), false);
  });

  it('should correctly calculate remaining milliseconds', () => {
    const expiryTime = new Date('2026-11-08T23:59:59+05:30').getTime();
    const tenSecondsBefore = expiryTime - 10000;
    assert.equal(getCampaignRemainingMs(tenSecondsBefore), 10000);

    const pastTime = expiryTime + 5000;
    assert.equal(getCampaignRemainingMs(pastTime), 0);
  });

  it('should fail safely when evaluated with invalid input', () => {
    assert.equal(isDiwaliCampaignActive(NaN), false);
  });
});

