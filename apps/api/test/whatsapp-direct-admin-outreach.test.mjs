import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { verifyConsentEvidence } = require('../dist/whatsapp/whatsapp-outreach-consent.util.js');
const { sendIndividualOutreachSchema } = require('@palnadu/validation');

describe('WhatsApp Direct Administrator Outreach Consent Verification', () => {
  const recipientPhone = '+919876543210';
  const cleanPhone = '919876543210';
  const documentedBasis = 'In-person meeting at mill; authorized introductory WhatsApp brochure';
  const mockPrisma = {};

  const makeEvidence = (overrides = {}) => ({
    consentType: 'DIRECT_ADMIN_OUTREACH',
    consentEvidenceRef: documentedBasis,
    consentTimestamp: new Date().toISOString(),
    recipientPhone,
    ...overrides,
  });

  it('1. successfully verifies DIRECT_ADMIN_OUTREACH with valid documented consent basis', async () => {
    const evidence = makeEvidence();
    const verified = await verifyConsentEvidence(mockPrisma, cleanPhone, evidence, 'MARKETING');

    assert.equal(verified.consentType, 'DIRECT_ADMIN_OUTREACH');
    assert.equal(verified.consentEvidenceRef, documentedBasis);
    assert.equal(verified.consentSource, 'DIRECT_ADMIN_OUTREACH');
    assert.equal(verified.consentVersion, 'v1');
    assert.ok(verified.consentTimestamp instanceof Date);
  });

  it('2. rejects DIRECT_ADMIN_OUTREACH when consentEvidenceRef is shorter than 10 characters', async () => {
    const evidence = makeEvidence({ consentEvidenceRef: 'Too short' });

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, cleanPhone, evidence, 'MARKETING'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /at least 10 characters/);
        return true;
      },
    );
  });

  it('3. rejects DIRECT_ADMIN_OUTREACH when recipient phone does not match evidence phone', async () => {
    const evidence = makeEvidence({ recipientPhone: '+919876500000' });

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, cleanPhone, evidence, 'MARKETING'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /phone number does not match recipient/);
        return true;
      },
    );
  });

  it('4. rejects DIRECT_ADMIN_OUTREACH when consent timestamp is older than 180 days', async () => {
    const staleTime = new Date(Date.now() - 181 * 24 * 60 * 60 * 1000).toISOString();
    const evidence = makeEvidence({ consentTimestamp: staleTime });

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, cleanPhone, evidence, 'MARKETING'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /older than 180 days/);
        return true;
      },
    );
  });

  it('5. rejects DIRECT_ADMIN_OUTREACH when consent purpose is CUSTOMER_SERVICE for MARKETING template', async () => {
    const evidence = makeEvidence({ consentPurpose: 'CUSTOMER_SERVICE' });

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, cleanPhone, evidence, 'MARKETING'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /Customer-service consent evidence cannot be used for promotional marketing/);
        return true;
      },
    );
  });

  it('6. sendIndividualOutreachSchema validates DIRECT_ADMIN_OUTREACH payload', () => {
    const validPayload = {
      phone: recipientPhone,
      businessName: 'Sri Lakshmi Rice Mill',
      templateName: 'b2b_website_outreach_v1',
      languageCode: 'en_US',
      consentEvidence: makeEvidence(),
    };

    const parsed = sendIndividualOutreachSchema.safeParse(validPayload);
    assert.equal(parsed.success, true);

    const invalidShortRef = {
      ...validPayload,
      consentEvidence: makeEvidence({ consentEvidenceRef: 'Spoke' }),
    };
    const invalidParsed = sendIndividualOutreachSchema.safeParse(invalidShortRef);
    assert.equal(invalidParsed.success, false);
    assert.match(
      invalidParsed.error.issues[0].message,
      /at least 10 characters/,
    );
  });
});
