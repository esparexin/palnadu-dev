import { BadRequestException } from '@nestjs/common';
import type {
  WhatsAppMetaTemplate,
  WhatsAppTemplateComponent,
  WhatsAppTemplateParameter,
} from '@palnadu/types';
import {
  PALNADU_CUSTOMER_ACKNOWLEDGEMENT_TEMPLATE,
  WHATSAPP_TEMPLATE_PARAMETER_SPECS,
} from './whatsapp.constants';

export interface InspectedBodyVariable {
  key: string;
  index: number;
  named: boolean;
}

export interface InspectedBodyTemplate {
  parameterFormat: 'NAMED' | 'POSITIONAL';
  variables: InspectedBodyVariable[];
}

export interface BuildTemplateComponentsInput {
  templateName: string;
  matchedTemplate?: WhatsAppMetaTemplate;
  parameters?: Record<string, string>;
  fallbackBusinessName?: string;
}

export interface BuiltTemplateComponents {
  components: WhatsAppTemplateComponent[];
  resolvedParameters: Record<string, string>;
}

const MAX_TEMPLATE_PARAM_LENGTH = 1024;

export function inspectTemplateBodyVariables(
  matchedTemplate?: WhatsAppMetaTemplate,
): InspectedBodyTemplate | null {
  if (!matchedTemplate?.components?.length) {
    return null;
  }

  const bodyComponent = matchedTemplate.components.find((c) => c.type === 'BODY');
  if (!bodyComponent) {
    return null;
  }

  const hasNamedExamples = Boolean(bodyComponent.example?.body_text_named_params?.length);
  const isExplicitPositional = matchedTemplate.parameter_format === 'POSITIONAL';
  const isNamedFormat = matchedTemplate.parameter_format === 'NAMED' || hasNamedExamples;

  if (bodyComponent.text) {
    const matches = Array.from(bodyComponent.text.matchAll(/\{\{\s*([a-zA-Z0-9_]+)\s*\}\}/g));
    if (matches.length > 0) {
      const rawTokens = matches.map((m) => m[1]);
      const allNumeric = rawTokens.every((token) => /^\d+$/.test(token));

      if (allNumeric && !isNamedFormat) {
        const uniqueIndices = Array.from(new Set(rawTokens.map((t) => Number.parseInt(t, 10))))
          .filter((n) => Number.isFinite(n) && n > 0)
          .sort((a, b) => a - b);
        return {
          parameterFormat: 'POSITIONAL',
          variables: uniqueIndices.map((index) => ({
            key: String(index),
            index,
            named: false,
          })),
        };
      }

      const seen = new Set<string>();
      const variables: InspectedBodyVariable[] = [];
      for (const token of rawTokens) {
        if (!seen.has(token)) {
          seen.add(token);
          variables.push({
            key: token,
            index: variables.length + 1,
            named: true,
          });
        }
      }
      return {
        parameterFormat: isExplicitPositional ? 'POSITIONAL' : 'NAMED',
        variables,
      };
    }
  }

  if (hasNamedExamples && bodyComponent.example?.body_text_named_params) {
    return {
      parameterFormat: 'NAMED',
      variables: bodyComponent.example.body_text_named_params.map((item, idx) => ({
        key: item.param_name,
        index: idx + 1,
        named: true,
      })),
    };
  }

  const positionalExamples = bodyComponent.example?.body_text?.[0];
  if (Array.isArray(positionalExamples) && positionalExamples.length > 0) {
    return {
      parameterFormat: 'POSITIONAL',
      variables: positionalExamples.map((_, idx) => ({
        key: String(idx + 1),
        index: idx + 1,
        named: false,
      })),
    };
  }

  return {
    parameterFormat: isNamedFormat ? 'NAMED' : 'POSITIONAL',
    variables: [],
  };
}

function resolveParameterValue(
  templateName: string,
  paramKey: string,
  parameters: Record<string, string> | undefined,
  fallbackBusinessName: string | undefined,
  allowBusinessFallback: boolean,
): string {
  const hasExplicitKey = Boolean(
    parameters && Object.prototype.hasOwnProperty.call(parameters, paramKey),
  );
  let rawValue = hasExplicitKey ? parameters?.[paramKey] : undefined;

  if (
    !hasExplicitKey &&
    rawValue === undefined &&
    allowBusinessFallback &&
    paramKey === 'business_name' &&
    templateName !== PALNADU_CUSTOMER_ACKNOWLEDGEMENT_TEMPLATE
  ) {
    rawValue = fallbackBusinessName;
  }

  const trimmed = typeof rawValue === 'string' ? rawValue.trim() : '';
  if (!trimmed) {
    throw new BadRequestException(
      `Missing or blank required template parameter "${paramKey}" for template "${templateName}".`,
    );
  }

  if (trimmed.length > MAX_TEMPLATE_PARAM_LENGTH) {
    throw new BadRequestException(
      `Template parameter "${paramKey}" exceeds maximum allowed length (${MAX_TEMPLATE_PARAM_LENGTH}).`,
    );
  }

  return trimmed;
}

export function buildTemplateComponents(
  input: BuildTemplateComponentsInput,
): BuiltTemplateComponents {
  const { templateName, matchedTemplate, parameters, fallbackBusinessName } = input;
  const spec = WHATSAPP_TEMPLATE_PARAMETER_SPECS[templateName];
  const inspected = inspectTemplateBodyVariables(matchedTemplate);

  if (inspected !== null) {
    if (inspected.variables.length === 0) {
      return { components: [], resolvedParameters: {} };
    }

    const builtParameters: WhatsAppTemplateParameter[] = [];
    const resolvedParameters: Record<string, string> = {};

    for (const variable of inspected.variables) {
      const specParam = spec?.requiredParameters.find((p) => p.index === variable.index);
      const paramKey = variable.named ? variable.key : specParam?.key || variable.key;
      const allowFallback =
        Boolean(spec?.allowBusinessNameFallback) &&
        paramKey === 'business_name';

      const textValue = resolveParameterValue(
        templateName,
        paramKey,
        parameters,
        fallbackBusinessName,
        allowFallback,
      );

      resolvedParameters[paramKey] = textValue;
      builtParameters.push({
        type: 'text',
        ...(inspected.parameterFormat === 'NAMED' ? { parameter_name: paramKey } : {}),
        text: textValue,
      });
    }

    return {
      components: [{ type: 'body', parameters: builtParameters }],
      resolvedParameters,
    };
  }

  if (spec) {
    const sortedSpecs = [...spec.requiredParameters].sort((a, b) => a.index - b.index);
    const builtParameters: WhatsAppTemplateParameter[] = [];
    const resolvedParameters: Record<string, string> = {};

    for (const reqParam of sortedSpecs) {
      const textValue = resolveParameterValue(
        templateName,
        reqParam.key,
        parameters,
        fallbackBusinessName,
        Boolean(spec.allowBusinessNameFallback),
      );
      resolvedParameters[reqParam.key] = textValue;
      builtParameters.push({
        type: 'text',
        ...(matchedTemplate?.parameter_format === 'NAMED'
          ? { parameter_name: reqParam.key }
          : {}),
        text: textValue,
      });
    }

    return {
      components: [{ type: 'body', parameters: builtParameters }],
      resolvedParameters,
    };
  }

  const fallbackParam = parameters?.business_name?.trim() || fallbackBusinessName?.trim();
  if (!fallbackParam) {
    return { components: [], resolvedParameters: {} };
  }

  return {
    components: [{ type: 'body', parameters: [{ type: 'text', text: fallbackParam }] }],
    resolvedParameters: { business_name: fallbackParam },
  };
}
