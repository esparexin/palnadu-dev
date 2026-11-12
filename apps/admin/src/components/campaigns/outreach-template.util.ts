import type {
  SendIndividualOutreachInput,
  WhatsAppConsentType,
  WhatsAppTemplateDefinition,
  WhatsAppTemplateParameterSpec,
} from '@palnadu/types';

export interface OutreachTemplateFormState {
  phone: string;
  businessName: string;
  contactName: string;
  templateName: string;
  languageCode: string;
  parameters: Record<string, string>;
  consentType: WhatsAppConsentType;
  consentEvidenceRef: string;
  saveContact: boolean;
}

const MAX_CUSTOMER_PARAM_LENGTH = 100;

export function getSortedTemplateParameters(
  template?: Pick<WhatsAppTemplateDefinition, 'requiredParameters'>,
): WhatsAppTemplateParameterSpec[] {
  if (!template?.requiredParameters?.length) return [];
  return [...template.requiredParameters].sort((a, b) => a.index - b.index);
}

export function getUniqueTemplateSummaries(
  templates: WhatsAppTemplateDefinition[],
): WhatsAppTemplateDefinition[] {
  const seen = new Set<string>();
  const unique: WhatsAppTemplateDefinition[] = [];
  for (const item of templates) {
    if (!seen.has(item.name)) {
      seen.add(item.name);
      unique.push(item);
    }
  }
  return unique;
}

export function getTemplateLanguages(
  templates: WhatsAppTemplateDefinition[],
  templateName: string,
): WhatsAppTemplateDefinition[] {
  return templates.filter((item) => item.name === templateName);
}

export function resolveActiveTemplate(
  templates: WhatsAppTemplateDefinition[],
  templateName: string,
  languageCode?: string,
): WhatsAppTemplateDefinition | undefined {
  if (!templates.length) return undefined;
  if (languageCode) {
    const exactMatch = templates.find(
      (item) => item.name === templateName && item.languageCode === languageCode,
    );
    if (exactMatch) return exactMatch;
  }
  return templates.find((item) => item.name === templateName) || templates[0];
}

export function allowsBusinessNameFallback(templateName: string | undefined, paramKey: string): boolean {
  return paramKey === 'business_name' && templateName !== 'palnadu_customer_acknowledgement';
}

function resolveSingleParamValue(
  templateName: string | undefined,
  paramKey: string,
  parameterInputs: Record<string, string>,
  businessName: string,
): string {
  const explicit = parameterInputs[paramKey]?.trim() || '';
  if (explicit) return explicit;
  return allowsBusinessNameFallback(templateName, paramKey) ? businessName.trim() : '';
}

export function resolveOutreachParameters(
  template: Pick<WhatsAppTemplateDefinition, 'name' | 'requiredParameters'> | undefined,
  parameterInputs: Record<string, string>,
  businessName: string,
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const spec of getSortedTemplateParameters(template)) {
    const value = resolveSingleParamValue(template?.name, spec.key, parameterInputs, businessName);
    if (value) resolved[spec.key] = value;
  }
  return resolved;
}

export function renderTemplatePreview(
  template: Pick<WhatsAppTemplateDefinition, 'name' | 'sampleText' | 'requiredParameters'> | undefined,
  parameterInputs: Record<string, string>,
  businessName: string,
): string {
  if (!template) return 'No Meta-approved template loaded to preview.';

  const tokenValues = new Map<string, string>();
  const specs = getSortedTemplateParameters(template);

  for (const spec of specs) {
    const resolved = resolveSingleParamValue(template.name, spec.key, parameterInputs, businessName);
    const displayValue = resolved || `[${spec.label}]`;
    tokenValues.set(spec.key, displayValue);
    tokenValues.set(String(spec.index), displayValue);
  }

  if (specs.length === 0 && !tokenValues.has('1') && businessName.trim()) {
    tokenValues.set('1', businessName.trim());
  }

  return template.sampleText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, token: string) => {
    return tokenValues.get(token) ?? `[${token}]`;
  });
}

export function getConsentCompatibilityWarning(
  templateCategory: string | undefined,
  consentType: WhatsAppConsentType,
): string | null {
  const isMarketing = (templateCategory || 'MARKETING').toUpperCase() === 'MARKETING';
  if (isMarketing && consentType === 'INBOUND_WHATSAPP_INQUIRY') {
    return 'Inbound WhatsApp enquiries authorize 24-hour customer service replies only. Marketing templates require explicit marketing opt-in consent (e.g., Signed Agreement or opted-in Lead ID).';
  }
  return null;
}

export function buildIndividualOutreachPayload(input: {
  formData: OutreachTemplateFormState;
  templates: WhatsAppTemplateDefinition[];
  idempotencyKey?: string;
  timestamp?: string;
}): { error?: string; payload?: SendIndividualOutreachInput } {
  const { formData, templates, idempotencyKey, timestamp } = input;
  const cleanPhone = formData.phone.replace(/[^0-9+]/g, '');
  if (!cleanPhone || cleanPhone.length < 10) {
    return { error: 'Please provide a valid phone number with country code (e.g. +91 98765 43210).' };
  }

  const trimmedBusinessName = formData.businessName.trim();
  if (!trimmedBusinessName) return { error: 'Business name is required.' };

  const targetTemplate = resolveActiveTemplate(templates, formData.templateName, formData.languageCode);
  if (!targetTemplate) {
    return { error: 'No Meta-approved template is currently loaded. Please refresh and try again.' };
  }

  const resolvedParameters = resolveOutreachParameters(targetTemplate, formData.parameters, trimmedBusinessName);
  for (const spec of getSortedTemplateParameters(targetTemplate)) {
    const val = resolvedParameters[spec.key];
    if (!val) return { error: `${spec.label} (${spec.key}) is required and cannot be blank.` };
    if (val.length > MAX_CUSTOMER_PARAM_LENGTH) {
      return { error: `${spec.label} (${spec.key}) must not exceed ${MAX_CUSTOMER_PARAM_LENGTH} characters.` };
    }
  }

  const consentRef = formData.consentEvidenceRef.trim();
  if (!consentRef) return { error: 'A verifiable consent reference ID is required.' };

  const consentWarning = getConsentCompatibilityWarning(targetTemplate.category, formData.consentType);
  if (consentWarning) return { error: consentWarning };

  const resolvedContactName = formData.contactName.trim() || resolvedParameters.customer_name || undefined;

  return {
    payload: {
      phone: cleanPhone,
      businessName: trimmedBusinessName,
      contactName: resolvedContactName,
      templateName: targetTemplate.name,
      languageCode: targetTemplate.languageCode,
      ...(Object.keys(resolvedParameters).length > 0 ? { parameters: resolvedParameters } : {}),
      consentEvidence: {
        consentType: formData.consentType,
        consentEvidenceRef: consentRef,
        consentTimestamp: timestamp || new Date().toISOString(),
        recipientPhone: cleanPhone,
      },
      idempotencyKey: idempotencyKey || `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
      saveContact: formData.saveContact,
    },
  };
}
