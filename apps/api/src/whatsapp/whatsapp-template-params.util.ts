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
import {
  inspectTemplateBodyVariables,
  type InspectedBodyTemplate,
  type InspectedBodyVariable,
} from './whatsapp-template-inspect.util';

export { inspectTemplateBodyVariables, type InspectedBodyTemplate, type InspectedBodyVariable };

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
      const isUnspeccedSinglePositional =
        !spec &&
        !variable.named &&
        inspected.variables.length === 1 &&
        variable.index === 1 &&
        templateName !== PALNADU_CUSTOMER_ACKNOWLEDGEMENT_TEMPLATE;
      const specParam = spec?.requiredParameters.find((p) => p.index === variable.index);
      const paramKey = variable.named
        ? variable.key
        : specParam?.key ||
          (isUnspeccedSinglePositional && !parameters?.[variable.key]
            ? 'business_name'
            : variable.key);
      const allowFallback =
        (Boolean(spec?.allowBusinessNameFallback) || isUnspeccedSinglePositional) &&
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
