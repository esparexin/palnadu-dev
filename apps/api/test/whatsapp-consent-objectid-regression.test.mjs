import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { verifyConsentEvidence } = require('../dist/whatsapp/whatsapp-outreach-consent.util.js');

describe('WhatsApp Outreach Consent - MongoDB ObjectId & Evidence Reference Regression', () => {
  const validHexId = '507f1f77bcf86cd799439011';
  const recipientPhone = '+919876543210';

  const makeEvidence = (consentType, ref, phone = recipientPhone) => ({
    consentType,
    consentEvidenceRef: ref,
    consentTimestamp: new Date().toISOString(),
    recipientPhone: phone,
  });

  it('1. rejects arbitrary non-hex text for WEBSITE_LEAD_FORM with BadRequestException', async () => {
    const mockPrisma = {
      lead: {
        findUnique: async () => {
          throw new Error('Should not reach database query for invalid ObjectId');
        },
      },
    };

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, recipientPhone, makeEvidence('WEBSITE_LEAD_FORM', 'arbitrary text'), 'MARKETING'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /valid 24-character hexadecimal ID/);
        return true;
      },
    );
  });

  it('2. rejects arbitrary non-hex text for VERIFIED_CRM_LEAD with BadRequestException', async () => {
    const mockPrisma = {
      lead: {
        findUnique: async () => {
          throw new Error('Should not reach database query for invalid ObjectId');
        },
      },
    };

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, recipientPhone, makeEvidence('VERIFIED_CRM_LEAD', 'LEAD-REF-999'), 'UTILITY'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /valid 24-character hexadecimal ID/);
        return true;
      },
    );
  });

  it('3. rejects empty or whitespace-only evidence reference with BadRequestException', async () => {
    const mockPrisma = {
      lead: { findUnique: async () => null },
    };

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, recipientPhone, makeEvidence('WEBSITE_LEAD_FORM', '   '), 'MARKETING'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /valid 24-character hexadecimal ID/);
        return true;
      },
    );
  });

  it('4. rejects nonexistent lead (valid 24-hex ObjectId that returns null in DB) with 400', async () => {
    const mockPrisma = {
      lead: { findUnique: async () => null },
    };

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, recipientPhone, makeEvidence('WEBSITE_LEAD_FORM', validHexId), 'MARKETING'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /Referenced consent lead record not found/);
        return true;
      },
    );
  });

  it('5. handles simulated Prisma engine ObjectId parsing errors gracefully without 500', async () => {
    const mockPrisma = {
      lead: {
        findUnique: async () => {
          const prismaErr = new Error('Inconsistent column data: Malformed ObjectID');
          prismaErr.code = 'P2023';
          throw prismaErr;
        },
      },
    };

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, recipientPhone, makeEvidence('WEBSITE_LEAD_FORM', validHexId), 'MARKETING'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /Referenced consent lead record not found/);
        return true;
      },
    );
  });

  it('6. rejects lead when lead phone does not match recipient phone', async () => {
    const mockPrisma = {
      lead: {
        findUnique: async () => ({
          id: validHexId,
          phone: '+919876599999',
          whatsappMarketingConsent: true,
          createdAt: new Date(),
        }),
      },
    };

    await assert.rejects(
      () => verifyConsentEvidence(mockPrisma, recipientPhone, makeEvidence('WEBSITE_LEAD_FORM', validHexId), 'MARKETING'),
      (err) => {
        assert.equal(err.status, 400);
        assert.match(err.message, /Consent lead record phone does not match recipient/);
        return true;
      },
    );
  });

  it('7. successfully verifies consent for valid ObjectId with matching opt-in lead', async () => {
    const leadTime = new Date();
    const mockPrisma = {
      lead: {
        findUnique: async () => ({
          id: validHexId,
          phone: '9876543210',
          whatsappMarketingConsent: true,
          whatsappConsentSource: 'WEBSITE_LEAD_FORM',
          whatsappConsentVersion: 'v2026_11',
          whatsappConsentAt: leadTime,
          createdAt: leadTime,
        }),
      },
    };

    const verified = await verifyConsentEvidence(
      mockPrisma,
      recipientPhone,
      makeEvidence('WEBSITE_LEAD_FORM', validHexId),
      'MARKETING',
    );

    assert.equal(verified.consentType, 'WEBSITE_LEAD_FORM');
    assert.equal(verified.consentEvidenceRef, validHexId);
    assert.equal(verified.consentSource, 'WEBSITE_LEAD_FORM');
    assert.equal(verified.consentVersion, 'v2026_11');
    assert.equal(verified.consentTimestamp.getTime(), leadTime.getTime());
  });

  it('8. preserves SIGNED_AGREEMENT verification for both filename and ObjectId references', async () => {
    const mockDoc = {
      id: validHexId,
      filename: 'b2b-agreement.pdf',
      createdAt: new Date(),
      metadata: {
        authorizesWhatsAppMarketing: true,
        phone: recipientPhone,
      },
    };

    const mockPrisma = {
      media: {
        findUnique: async ({ where }) => (where.id === validHexId ? mockDoc : null),
        findFirst: async ({ where }) => {
          if (where.OR?.some((o) => o.filename === 'b2b-agreement.pdf')) return mockDoc;
          return null;
        },
      },
    };

    const verifiedById = await verifyConsentEvidence(
      mockPrisma,
      recipientPhone,
      makeEvidence('SIGNED_AGREEMENT', validHexId),
      'MARKETING',
    );
    assert.equal(verifiedById.consentType, 'SIGNED_AGREEMENT');
    assert.equal(verifiedById.consentEvidenceRef, validHexId);

    const verifiedByName = await verifyConsentEvidence(
      mockPrisma,
      recipientPhone,
      makeEvidence('SIGNED_AGREEMENT', 'b2b-agreement.pdf'),
      'MARKETING',
    );
    assert.equal(verifiedByName.consentType, 'SIGNED_AGREEMENT');
  });
});
