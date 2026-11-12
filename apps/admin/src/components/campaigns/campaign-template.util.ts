import type { WhatsAppTemplateParameterSpec } from '@palnadu/types';
import type { CreateCampaignFormData, WhatsAppTemplateDefinition } from './types';

function sortTemplateSpecs(
  template?: Pick<WhatsAppTemplateDefinition, 'requiredParameters'>,
): WhatsAppTemplateParameterSpec[] {
  if (!template?.requiredParameters?.length) return [];
  return [...template.requiredParameters].sort((a, b) => a.index - b.index);
}

export const CAMPAIGN_SELECT_CLASSES =
  'flex h-9 w-full rounded-md border border-palnadu-border bg-palnadu-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

export interface CampaignVariableMapping {
  key: string;
  label: string;
  mappingNote: string;
}

export function getCampaignVariableMappings(
  template?: Pick<WhatsAppTemplateDefinition, 'requiredParameters'>,
): CampaignVariableMapping[] {
  return sortTemplateSpecs(template).map((spec) => {
    if (spec.key === 'customer_name') {
      return {
        key: spec.key,
        label: spec.label,
        mappingNote:
          'Maps to each contact Contact Name (contacts missing Contact Name fail safely without business name fallback).',
      };
    }
    if (spec.key === 'business_name') {
      return {
        key: spec.key,
        label: spec.label,
        mappingNote: 'Maps automatically to each contact Business Name.',
      };
    }
    return {
      key: spec.key,
      label: spec.label,
      mappingNote: `Named variable {{${spec.key}}} required during campaign dispatch.`,
    };
  });
}

export function renderCampaignTemplatePreview(
  template?: Pick<WhatsAppTemplateDefinition, 'sampleText' | 'requiredParameters'>,
): string {
  if (!template) {
    return 'No Meta-approved template verified. Live template verification is required before creating campaigns.';
  }
  const tokenMap = new Map<string, string>();
  for (const spec of sortTemplateSpecs(template)) {
    const label = spec.key === 'customer_name' ? '[Contact Name]' : `[${spec.label}]`;
    tokenMap.set(spec.key, label);
    tokenMap.set(String(spec.index), label);
  }
  return template.sampleText.replace(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g, (_match, token: string) => {
    return tokenMap.get(token) ?? `[${token}]`;
  });
}

export function buildCreateCampaignPayload(input: {
  formData: CreateCampaignFormData;
  templates: WhatsAppTemplateDefinition[];
  templatesError?: string | null;
}): { error?: string; payload?: CreateCampaignFormData } {
  const { formData, templates, templatesError } = input;
  if (templatesError) {
    return { error: templatesError };
  }
  const cleanName = formData.name.trim();
  if (!cleanName) {
    return { error: 'Campaign name is required.' };
  }
  if (!templates.length) {
    return {
      error: 'No Meta-approved templates are currently verified. Refresh templates before creating a campaign.',
    };
  }

  const desiredName = formData.templateName.trim();
  const desiredLanguage = formData.languageCode.trim();
  let selected: WhatsAppTemplateDefinition | undefined;

  if (desiredName && desiredLanguage) {
    selected = templates.find(
      (item) => item.name === desiredName && item.languageCode === desiredLanguage,
    );
    if (!selected) {
      return {
        error: `Template "${desiredName}" with language "${desiredLanguage}" is not approved in Meta.`,
      };
    }
  } else if (desiredName) {
    selected = templates.find((item) => item.name === desiredName);
    if (!selected) {
      return { error: `Template "${desiredName}" is not approved in Meta.` };
    }
  } else {
    selected = templates[0];
  }

  return {
    payload: {
      name: cleanName,
      description: formData.description.trim(),
      templateName: selected.name,
      languageCode: selected.languageCode,
      targetAudience: formData.targetAudience.trim(),
    },
  };
}
