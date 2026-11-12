import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {
  createLeadSchema,
  WHATSAPP_MARKETING_CONSENT_VERSION,
  WHATSAPP_MARKETING_CONSENT_WORDING,
} from '../../../../../packages/validation/dist/index.js';

describe('Web Contact Form WhatsApp Consent Contract', () => {
  it('defaults contact form consent state to false and requires explicit checked consent wording', () => {
    const contactFormSource = fs.readFileSync(
      path.resolve(import.meta.dirname, 'contact-form.tsx'),
      'utf-8',
    );
    const contactFieldsSource = fs.readFileSync(
      path.resolve(import.meta.dirname, 'contact-form-fields.tsx'),
      'utf-8',
    );

    assert.match(contactFormSource, /whatsappMarketingConsent:\s*false/);
    assert.match(contactFormSource, /WHATSAPP_MARKETING_CONSENT_VERSION/);
    assert.match(contactFieldsSource, /WHATSAPP_MARKETING_CONSENT_WORDING/);
    assert.match(contactFieldsSource, /checked=\{Boolean\(whatsappConsent\)\}/);
    assert.match(contactFieldsSource, /Optional/);
  });

  it('validates both ordinary unconsented submissions and explicit opt-in submissions', () => {
    const ordinary = createLeadSchema.safeParse({
      name: 'Venkat Rao',
      email: 'venkat@example.com',
      phone: '',
      problemDescription: 'Need an inquiry callback about custom web development.',
      projectStage: 'JUST_AN_IDEA',
      requiredHelp: 'WEB_APPLICATION',
      whatsappMarketingConsent: false,
    });
    assert.equal(ordinary.success, true);
    if (ordinary.success) {
      assert.equal(ordinary.data.whatsappMarketingConsent, false);
    }

    const optedIn = createLeadSchema.safeParse({
      name: 'Venkat Rao',
      email: 'venkat@example.com',
      phone: '+91 9876543210',
      problemDescription: 'Need a website and want WhatsApp updates.',
      projectStage: 'EXISTING_BUSINESS',
      requiredHelp: 'WEB_APPLICATION',
      whatsappMarketingConsent: true,
      whatsappConsentVersion: WHATSAPP_MARKETING_CONSENT_VERSION,
    });
    assert.equal(optedIn.success, true);
    assert.ok(WHATSAPP_MARKETING_CONSENT_WORDING.includes('WhatsApp'));
  });
});
