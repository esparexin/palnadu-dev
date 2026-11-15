import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const {
  validateTemplateAgainstMeta,
  mapMetaTemplatesToDefinitions,
  isEligibleOutreachCategory,
} = require('../dist/whatsapp/whatsapp-template.util.js');

describe('WhatsApp Meta Template Filtering & Category Eligibility', () => {
  const sampleTemplates = [
    {
      name: 'b2b_website_outreach_v1',
      status: 'APPROVED',
      language: 'en_US',
      category: 'MARKETING',
      components: [{ type: 'BODY', text: 'Hello {{1}}' }],
    },
    {
      name: 'customer_service_update_v1',
      status: 'APPROVED',
      language: 'en_US',
      category: 'UTILITY',
      components: [{ type: 'BODY', text: 'Update regarding your inquiry' }],
    },
    {
      name: 'esparex_auth_otp',
      status: 'APPROVED',
      language: 'en',
      category: 'AUTHENTICATION',
      components: [{ type: 'BODY', text: '{{1}} is your verification code' }],
    },
    {
      name: 'pending_campaign_template',
      status: 'PENDING',
      language: 'en_US',
      category: 'MARKETING',
      components: [{ type: 'BODY', text: 'Coming soon' }],
    },
    {
      name: 'rejected_promo_template',
      status: 'REJECTED',
      language: 'en_US',
      category: 'MARKETING',
      components: [{ type: 'BODY', text: 'Discount code' }],
    },
    {
      name: 'unknown_category_template',
      status: 'APPROVED',
      language: 'en_US',
      category: 'TRANSACTIONAL_OBSOLETE',
      components: [{ type: 'BODY', text: 'Legacy notice' }],
    },
  ];

  it('1. isEligibleOutreachCategory permits only MARKETING and UTILITY', () => {
    assert.equal(isEligibleOutreachCategory('MARKETING'), true);
    assert.equal(isEligibleOutreachCategory('marketing'), true);
    assert.equal(isEligibleOutreachCategory('UTILITY'), true);
    assert.equal(isEligibleOutreachCategory('utility'), true);
    assert.equal(isEligibleOutreachCategory('AUTHENTICATION'), false);
    assert.equal(isEligibleOutreachCategory('TRANSACTIONAL'), false);
    assert.equal(isEligibleOutreachCategory(''), false);
    assert.equal(isEligibleOutreachCategory(undefined), false);
  });

  it('2. mapMetaTemplatesToDefinitions excludes AUTHENTICATION, PENDING, REJECTED, and UNKNOWN templates', () => {
    const definitions = mapMetaTemplatesToDefinitions(sampleTemplates);
    const names = definitions.map((d) => d.name);

    assert.ok(names.includes('b2b_website_outreach_v1'), 'Must include approved MARKETING template');
    assert.ok(names.includes('customer_service_update_v1'), 'Must include approved UTILITY template');
    assert.equal(names.includes('esparex_auth_otp'), false, 'Must EXCLUDE AUTHENTICATION template');
    assert.equal(names.includes('pending_campaign_template'), false, 'Must EXCLUDE PENDING template');
    assert.equal(names.includes('rejected_promo_template'), false, 'Must EXCLUDE REJECTED template');
    assert.equal(names.includes('unknown_category_template'), false, 'Must EXCLUDE unknown category');
    assert.equal(definitions.length, 2);
  });

  it('3. validateTemplateAgainstMeta accepts approved MARKETING template', () => {
    const matched = validateTemplateAgainstMeta('b2b_website_outreach_v1', 'en_US', sampleTemplates);
    assert.equal(matched.name, 'b2b_website_outreach_v1');
    assert.equal(matched.category, 'MARKETING');
  });

  it('4. validateTemplateAgainstMeta accepts approved UTILITY template', () => {
    const matched = validateTemplateAgainstMeta('customer_service_update_v1', 'en_US', sampleTemplates);
    assert.equal(matched.name, 'customer_service_update_v1');
    assert.equal(matched.category, 'UTILITY');
  });

  it('5. validateTemplateAgainstMeta rejects AUTHENTICATION template with 400', () => {
    assert.throws(
      () => validateTemplateAgainstMeta('esparex_auth_otp', 'en', sampleTemplates),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /AUTHENTICATION template and cannot be used for business outreach/);
        return true;
      },
    );
  });

  it('6. validateTemplateAgainstMeta rejects unapproved templates (PENDING or REJECTED)', () => {
    assert.throws(
      () => validateTemplateAgainstMeta('pending_campaign_template', 'en_US', sampleTemplates),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /not currently approved in Meta Business Account/);
        return true;
      },
    );
    assert.throws(
      () => validateTemplateAgainstMeta('rejected_promo_template', 'en_US', sampleTemplates),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /not currently approved in Meta Business Account/);
        return true;
      },
    );
  });

  it('7. validateTemplateAgainstMeta rejects unknown categories with 400', () => {
    assert.throws(
      () => validateTemplateAgainstMeta('unknown_category_template', 'en_US', sampleTemplates),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /not eligible for business outreach/);
        return true;
      },
    );
  });

  it('8. validateTemplateAgainstMeta rejects non-existent template name or language mismatch', () => {
    assert.throws(
      () => validateTemplateAgainstMeta('non_existent_template', 'en_US', sampleTemplates),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /not currently approved in Meta Business Account/);
        return true;
      },
    );
    assert.throws(
      () => validateTemplateAgainstMeta('b2b_website_outreach_v1', 'te', sampleTemplates),
      (err) => {
        assert.equal(err.statusCode, 400);
        assert.match(err.message, /not currently approved in Meta Business Account/);
        return true;
      },
    );
  });
});
