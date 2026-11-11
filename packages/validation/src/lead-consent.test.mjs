import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  createLeadSchema,
  WHATSAPP_MARKETING_CONSENT_VERSION,
  WHATSAPP_MARKETING_CONSENT_WORDING,
} from '../dist/index.js';

describe('Lead WhatsApp Marketing Consent Validation', () => {
  const baseLead = {
    name: 'Kalyan Rao',
    email: 'kalyan@example.com',
    problemDescription: 'Need a business website and WhatsApp inquiry workflow.',
    projectStage: 'EXISTING_BUSINESS',
    requiredHelp: 'WEB_APPLICATION',
  };

  it('defaults whatsappMarketingConsent to false for ordinary enquiries', () => {
    const res = createLeadSchema.safeParse(baseLead);
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.whatsappMarketingConsent, false);
      assert.equal(res.data.whatsappConsentVersion, undefined);
    }
    assert.match(WHATSAPP_MARKETING_CONSENT_WORDING, /WhatsApp/);
  });

  it('accepts explicit WhatsApp opt-in when a valid phone number is supplied', () => {
    const res = createLeadSchema.safeParse({
      ...baseLead,
      phone: '+91 9876543210',
      whatsappMarketingConsent: true,
      whatsappConsentVersion: WHATSAPP_MARKETING_CONSENT_VERSION,
    });
    assert.equal(res.success, true);
    if (res.success) {
      assert.equal(res.data.whatsappMarketingConsent, true);
      assert.equal(res.data.whatsappConsentVersion, WHATSAPP_MARKETING_CONSENT_VERSION);
    }
  });

  it('rejects explicit WhatsApp opt-in when phone number is missing or too short', () => {
    const noPhone = createLeadSchema.safeParse({
      ...baseLead,
      phone: '',
      whatsappMarketingConsent: true,
    });
    assert.equal(noPhone.success, false);
    if (!noPhone.success) {
      assert.ok(noPhone.error.issues.some((i) => i.path.includes('phone')));
    }

    const shortPhone = createLeadSchema.safeParse({
      ...baseLead,
      phone: '12345',
      whatsappMarketingConsent: true,
    });
    assert.equal(shortPhone.success, false);
  });
});
