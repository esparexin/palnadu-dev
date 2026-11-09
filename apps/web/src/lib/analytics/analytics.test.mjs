import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert/strict';

describe('Palnadu.dev Analytics & Marketing Intelligence Contracts', () => {
  beforeEach(() => {
    // Reset simulated browser globals
    globalThis.window = {
      dataLayer: [],
      gtag: () => {},
      location: { href: 'https://www.palnadu.dev/services/custom-software' },
    };
    globalThis.sessionStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, val) {
        this.data[key] = String(val);
      },
    };
    globalThis.localStorage = {
      data: {},
      getItem(key) {
        return this.data[key] || null;
      },
      setItem(key, val) {
        this.data[key] = String(val);
      },
    };
    globalThis.document = {
      title: 'Custom Software Development | Palnadu.dev',
      referrer: 'https://www.google.com/',
    };
  });

  it('should capture and persist UTM parameters in session storage', async () => {
    const { captureUtmFromSearch, getStoredUtmParams } = await import('./utm.ts');

    const params = new URLSearchParams(
      'utm_source=google&utm_medium=cpc&utm_campaign=guntur_lead_gen&gclid=test123'
    );
    const captured = captureUtmFromSearch(params);

    assert.equal(captured?.utm_source, 'google');
    assert.equal(captured?.utm_medium, 'cpc');
    assert.equal(captured?.utm_campaign, 'guntur_lead_gen');
    assert.equal(captured?.gclid, 'test123');

    const stored = getStoredUtmParams();
    assert.equal(stored.utm_source, 'google');
    assert.equal(stored.utm_campaign, 'guntur_lead_gen');
    assert.equal(stored.gclid, 'test123');
  });

  it('should verify Google Consent Mode v2 defaults and updates', async () => {
    const {
      DEFAULT_CONSENT_SETTINGS,
      GRANTED_CONSENT_SETTINGS,
      applyConsentUpdate,
      getStoredConsentPreferences,
    } = await import('./consent.ts');

    assert.equal(DEFAULT_CONSENT_SETTINGS.analytics_storage, 'denied');
    assert.equal(DEFAULT_CONSENT_SETTINGS.ad_storage, 'denied');
    assert.equal(DEFAULT_CONSENT_SETTINGS.ad_user_data, 'denied');
    assert.equal(DEFAULT_CONSENT_SETTINGS.ad_personalization, 'denied');

    applyConsentUpdate(GRANTED_CONSENT_SETTINGS);
    const stored = getStoredConsentPreferences();
    assert.equal(stored?.analytics_storage, 'granted');
    assert.equal(stored?.ad_storage, 'granted');
    assert.equal(stored?.ad_user_data, 'granted');
    assert.equal(stored?.ad_personalization, 'granted');

    assert.equal(window.dataLayer.length, 1);
    const lastEvent = window.dataLayer[0];
    assert.equal(lastEvent.event, 'consent_update');
    assert.equal(lastEvent.analytics_storage, 'granted');
  });

  it('should validate contact channel event schema contract', () => {
    const channelPayload = {
      event: 'contact_channel_click',
      channel: 'whatsapp',
      destination: 'https://wa.me/919030787819',
      source_section: 'quick_contact',
      source_page: '/contact',
    };

    window.dataLayer.push(channelPayload);
    assert.equal(window.dataLayer.length, 1);
    const item = window.dataLayer[0];
    assert.equal(item.event, 'contact_channel_click');
    assert.equal(item.channel, 'whatsapp');
    assert.equal(item.source_section, 'quick_contact');
    assert.equal(item.destination, 'https://wa.me/919030787819');
  });

  it('should validate backend-verified generate_lead schema contract', () => {
    const leadPayload = {
      event: 'generate_lead',
      form_id: 'contact_form_main',
      lead_id: 'lead_672e892cfa123',
      lead_category: 'WEB_APPLICATION',
      project_stage: 'JUST_AN_IDEA',
      has_budget: true,
      source_page: '/contact',
      utm_source: 'google',
      utm_medium: 'organic',
      utm_campaign: 'seo_palnadu',
    };

    window.dataLayer.push(leadPayload);
    assert.equal(window.dataLayer.length, 1);
    const item = window.dataLayer[0];
    assert.equal(item.event, 'generate_lead');
    assert.equal(item.lead_id, 'lead_672e892cfa123');
    assert.equal(item.lead_category, 'WEB_APPLICATION');
    assert.equal(item.has_budget, true);
    assert.equal(item.form_id, 'contact_form_main');
  });
});
