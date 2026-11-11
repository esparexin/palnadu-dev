import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createMarketingCampaignSchema } from '../dist/index.js';

describe('Marketing Campaign Validation - Explicit Template & Language', () => {
  it('rejects campaign creation when languageCode is omitted instead of defaulting to en_US', () => {
    const missingLang = createMarketingCampaignSchema.safeParse({
      name: 'Customer Acknowledgement Run',
      templateName: 'palnadu_customer_acknowledgement',
    });
    assert.equal(missingLang.success, false);

    const blankLang = createMarketingCampaignSchema.safeParse({
      name: 'Customer Acknowledgement Run',
      templateName: 'palnadu_customer_acknowledgement',
      languageCode: '  ',
    });
    assert.equal(blankLang.success, false);
  });

  it('accepts and trims explicit Meta-approved templateName and languageCode', () => {
    const valid = createMarketingCampaignSchema.safeParse({
      name: '  Palnadu Customer Ack  ',
      templateName: '  palnadu_customer_acknowledgement  ',
      languageCode: '  en_IN  ',
      targetAudience: 'NO_WEBSITE',
    });
    assert.equal(valid.success, true);
    if (valid.success) {
      assert.equal(valid.data.name, 'Palnadu Customer Ack');
      assert.equal(valid.data.templateName, 'palnadu_customer_acknowledgement');
      assert.equal(valid.data.languageCode, 'en_IN');
    }
  });
});

