import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import { initialCampaignFormData, initialOutreachFormData } from './types.ts';
import {
  buildCreateCampaignPayload,
  getCampaignVariableMappings,
  renderCampaignTemplatePreview,
} from './campaign-template.util.ts';

const require = createRequire(import.meta.url);
const { createMarketingCampaignSchema } = require('@palnadu/validation');

const META_TEMPLATES = [
  {
    name: 'palnadu_customer_acknowledgement',
    displayTitle: 'Customer Acknowledgement',
    languageCode: 'en_IN',
    category: 'MARKETING',
    description: 'Acknowledgement template',
    sampleText: 'Hello {{customer_name}}, thank you for contacting Palnadu.dev.',
    requiredParameters: [
      { index: 1, key: 'customer_name', label: 'Customer Name', placeholder: 'e.g. Kalyan' },
    ],
  },
  {
    name: 'b2b_website_outreach_te',
    displayTitle: 'B2B Outreach (Telugu)',
    languageCode: 'te',
    category: 'MARKETING',
    description: 'Telugu outreach',
    sampleText: 'నమస్కారం {{1}}, పల్నాడులో మీ వ్యాపారానికి వెబ్‌సైట్ ఉందా?',
    requiredParameters: [
      { index: 1, key: 'business_name', label: 'Business Name', placeholder: 'Sri Lakshmi Rice Mill' },
    ],
  },
];

describe('Admin Campaign Modal Template Safety Helpers', () => {
  it('1. removes hardcoded en_US defaults from initial campaign and outreach states', () => {
    assert.equal(initialCampaignFormData.templateName, '');
    assert.equal(initialCampaignFormData.languageCode, '');
    assert.equal(initialOutreachFormData.templateName, '');
    assert.equal(initialOutreachFormData.languageCode, '');
  });

  it('2. selects Meta-approved palnadu_customer_acknowledgement (en_IN) cleanly and passes Zod validation', () => {
    const built = buildCreateCampaignPayload({
      formData: {
        name: '  Macherla Acknowledgement Run  ',
        description: 'Authorized customers',
        templateName: 'palnadu_customer_acknowledgement',
        languageCode: 'en_IN',
        targetAudience: 'ALL',
      },
      templates: META_TEMPLATES,
    });

    assert.equal(built.error, undefined);
    assert.equal(built.payload.templateName, 'palnadu_customer_acknowledgement');
    assert.equal(built.payload.languageCode, 'en_IN');
    assert.equal(createMarketingCampaignSchema.safeParse(built.payload).success, true);
  });

  it('3. fails closed when Meta template verification fails or template list is empty', () => {
    const withError = buildCreateCampaignPayload({
      formData: { ...initialCampaignFormData, name: 'Test Campaign' },
      templates: META_TEMPLATES,
      templatesError: 'Live Meta template verification failed',
    });
    assert.match(withError.error, /Live Meta template verification failed/);
    assert.equal(withError.payload, undefined);

    const empty = buildCreateCampaignPayload({
      formData: { ...initialCampaignFormData, name: 'Test Campaign' },
      templates: [],
    });
    assert.match(empty.error, /No Meta-approved templates/);
    assert.equal(empty.payload, undefined);
  });

  it('4. rejects unapproved or mismatched languageCode for selected template', () => {
    const wrongLang = buildCreateCampaignPayload({
      formData: {
        name: 'Wrong Language Run',
        description: '',
        templateName: 'palnadu_customer_acknowledgement',
        languageCode: 'en_US',
        targetAudience: 'NO_WEBSITE',
      },
      templates: META_TEMPLATES,
    });
    assert.match(wrongLang.error, /not approved in Meta/);
    assert.equal(wrongLang.payload, undefined);
  });

  it('5. describes named customer_name mapping to Contact Name without Business Name fallback', () => {
    const mappings = getCampaignVariableMappings(META_TEMPLATES[0]);
    assert.equal(mappings[0].key, 'customer_name');
    assert.match(mappings[0].mappingNote, /Contact Name/);
    assert.match(mappings[0].mappingNote, /without business name fallback/);
    assert.match(renderCampaignTemplatePreview(META_TEMPLATES[0]), /\[Contact Name\]/);
  });
});

