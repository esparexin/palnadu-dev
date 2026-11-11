import type { WhatsAppMetaTemplate } from '@palnadu/types';

export interface InspectedBodyVariable {
  key: string;
  index: number;
  named: boolean;
}

export interface InspectedBodyTemplate {
  parameterFormat: 'NAMED' | 'POSITIONAL';
  variables: InspectedBodyVariable[];
}

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

