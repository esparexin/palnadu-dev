import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
import {
  buildIndividualOutreachPayload,
  getConsentCompatibilityWarning,
  getTemplateLanguages,
  renderTemplatePreview,
  resolveActiveTemplate,
} from './outreach-template.util.ts';

const require = createRequire(import.meta.url);
const { sendIndividualOutreachSchema } = require('@palnadu/validation');

const MOCK_TEMPLATES = [
  {
    name: 'b2b_website_outreach_v1',
    displayTitle: 'B2B Website Outreach (English)',
    languageCode: 'en_US',
    category: 'MARKETING',
    description: 'Initial outreach',
    sampleText: 'Hello {{1}}, we noticed your business in Palnadu does not have an official website yet.',
    requiredParameters: [
      { index: 1, key: 'business_name', label: 'Business Name', placeholder: 'e.g. Sri Lakshmi Rice Mill' },
    ],
  },
  {
    name: 'palnadu_customer_acknowledgement',
    displayTitle: 'Customer Acknowledgement',
    languageCode: 'en_IN',
    category: 'MARKETING',
    description: 'Marketing acknowledgement',
    sampleText: 'Hello {{customer_name}}, thank you for contacting Palnadu.dev.',
    requiredParameters: [
      { index: 1, key: 'customer_name', label: 'Customer Name', placeholder: 'e.g. Ramesh Kumar' },
    ],
  },
  {
    name: 'palnadu_customer_acknowledgement',
    displayTitle: 'Customer Acknowledgement (Telugu)',
    languageCode: 'te',
    category: 'MARKETING',
    description: 'Telugu acknowledgement',
    sampleText: 'నమస్కారం {{1}}, Palnadu.dev ను సంప్రదించినందుకు ధన్యవాదాలు.',
    requiredParameters: [
      { index: 1, key: 'customer_name', label: 'Customer Name', placeholder: 'e.g. Ramesh Kumar' },
    ],
  },
  {
    name: 'service_inquiry_reply_v1',
    displayTitle: 'Service Inquiry Reply',
    languageCode: 'en_US',
    category: 'UTILITY',
    description: 'Customer service reply',
    sampleText: 'Hi {{customer_name}}, our team will follow up shortly.',
    requiredParameters: [
      { index: 1, key: 'customer_name', label: 'Customer Name', placeholder: 'e.g. Ramesh Kumar' },
    ],
  },
];

const baseForm = (overrides = {}) => ({
  phone: '+91 98765 43210',
  businessName: 'Sri Lakshmi Rice Mill',
  contactName: '',
  templateName: 'palnadu_customer_acknowledgement',
  languageCode: 'en_IN',
  parameters: { customer_name: '  Ramesh Kumar  ' },
  consentType: 'SIGNED_AGREEMENT',
  consentEvidenceRef: '507f1f77bcf86cd799439011',
  saveContact: false,
  ...overrides,
});

describe('Admin Individual Outreach Template Helpers', () => {
  it('1. maps and trims customer_name cleanly and validates against shared backend Zod schema', () => {
    const built = buildIndividualOutreachPayload({
      formData: baseForm(),
      templates: MOCK_TEMPLATES,
      idempotencyKey: 'idemp-ui-test-001',
      timestamp: '2026-11-11T10:00:00.000Z',
    });

    assert.equal(built.error, undefined);
    assert.equal(built.payload.templateName, 'palnadu_customer_acknowledgement');
    assert.equal(built.payload.languageCode, 'en_IN');
    assert.equal(built.payload.contactName, 'Ramesh Kumar');
    assert.deepEqual(built.payload.parameters, { customer_name: 'Ramesh Kumar' });

    const schemaResult = sendIndividualOutreachSchema.safeParse(built.payload);
    assert.equal(schemaResult.success, true);
  });

  it('2. rejects missing or blank customer_name without falling back to businessName', () => {
    const missing = buildIndividualOutreachPayload({
      formData: baseForm({ parameters: {} }),
      templates: MOCK_TEMPLATES,
    });
    assert.match(missing.error, /customer_name/);

    const blank = buildIndividualOutreachPayload({
      formData: baseForm({ parameters: { customer_name: '   ' } }),
      templates: MOCK_TEMPLATES,
    });
    assert.match(blank.error, /customer_name/);
  });

  it('3. preserves legacy business_name fallback and override behavior', () => {
    const defaulted = buildIndividualOutreachPayload({
      formData: baseForm({
        templateName: 'b2b_website_outreach_v1',
        languageCode: 'en_US',
        parameters: {},
      }),
      templates: MOCK_TEMPLATES,
    });
    assert.equal(defaulted.error, undefined);
    assert.deepEqual(defaulted.payload.parameters, { business_name: 'Sri Lakshmi Rice Mill' });
    assert.equal(sendIndividualOutreachSchema.safeParse(defaulted.payload).success, true);

    const overridden = buildIndividualOutreachPayload({
      formData: baseForm({
        templateName: 'b2b_website_outreach_v1',
        languageCode: 'en_US',
        parameters: { business_name: '  Sri Lakshmi Exports  ' },
      }),
      templates: MOCK_TEMPLATES,
    });
    assert.deepEqual(overridden.payload.parameters, { business_name: 'Sri Lakshmi Exports' });
  });

  it('4. supports template-specific language selection without hardcoded en_US drift', () => {
    const langs = getTemplateLanguages(MOCK_TEMPLATES, 'palnadu_customer_acknowledgement');
    assert.deepEqual(
      langs.map((t) => t.languageCode),
      ['en_IN', 'te'],
    );

    const activeTe = resolveActiveTemplate(MOCK_TEMPLATES, 'palnadu_customer_acknowledgement', 'te');
    assert.equal(activeTe.languageCode, 'te');

    const pickedAck = resolveActiveTemplate([MOCK_TEMPLATES[1]], 'palnadu_customer_acknowledgement', 'en_US');
    assert.equal(pickedAck.languageCode, 'en_IN');

    const emptyCatalog = buildIndividualOutreachPayload({
      formData: baseForm(),
      templates: [],
    });
    assert.match(emptyCatalog.error, /No Meta-approved template/);
  });

  it('5. renders named and positional template previews accurately without businessName leak', () => {
    const namedFilled = renderTemplatePreview(
      MOCK_TEMPLATES[1],
      { customer_name: '  Ramesh Kumar  ' },
      'Sri Lakshmi Rice Mill',
    );
    assert.equal(namedFilled, 'Hello Ramesh Kumar, thank you for contacting Palnadu.dev.');

    const namedBlank = renderTemplatePreview(
      MOCK_TEMPLATES[1],
      { customer_name: '   ' },
      'Sri Lakshmi Rice Mill',
    );
    assert.equal(namedBlank, 'Hello [Customer Name], thank you for contacting Palnadu.dev.');

    const positionalAck = renderTemplatePreview(
      MOCK_TEMPLATES[2],
      { customer_name: 'Sita' },
      'Sri Lakshmi Rice Mill',
    );
    assert.equal(positionalAck, 'నమస్కారం Sita, Palnadu.dev ను సంప్రదించినందుకు ధన్యవాదాలు.');

    const positionalLegacy = renderTemplatePreview(
      MOCK_TEMPLATES[0],
      {},
      'Sri Lakshmi Rice Mill',
    );
    assert.equal(
      positionalLegacy,
      'Hello Sri Lakshmi Rice Mill, we noticed your business in Palnadu does not have an official website yet.',
    );
  });

  it('6. warns and blocks INBOUND_WHATSAPP_INQUIRY on MARKETING templates while allowing UTILITY', () => {
    const marketingWarning = getConsentCompatibilityWarning('MARKETING', 'INBOUND_WHATSAPP_INQUIRY');
    assert.ok(marketingWarning);

    const blockedMarketing = buildIndividualOutreachPayload({
      formData: baseForm({ consentType: 'INBOUND_WHATSAPP_INQUIRY' }),
      templates: MOCK_TEMPLATES,
    });
    assert.match(blockedMarketing.error, /customer service replies only/i);

    assert.equal(getConsentCompatibilityWarning('UTILITY', 'INBOUND_WHATSAPP_INQUIRY'), null);
    const allowedUtility = buildIndividualOutreachPayload({
      formData: baseForm({
        templateName: 'service_inquiry_reply_v1',
        languageCode: 'en_US',
        consentType: 'INBOUND_WHATSAPP_INQUIRY',
      }),
      templates: MOCK_TEMPLATES,
    });
    assert.equal(allowedUtility.error, undefined);
    assert.equal(allowedUtility.payload.languageCode, 'en_US');
  });
});
