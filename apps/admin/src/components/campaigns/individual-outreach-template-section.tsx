'use client';

import { Sparkles } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { WhatsAppTemplateDefinition } from './types';
import {
  allowsBusinessNameFallback,
  getSortedTemplateParameters,
  getTemplateLanguages,
  getUniqueTemplateSummaries,
  renderTemplatePreview,
} from './outreach-template.util';

interface IndividualOutreachTemplateSectionProps {
  templates: WhatsAppTemplateDefinition[];
  activeTemplate?: WhatsAppTemplateDefinition;
  selectedLanguageCode: string;
  businessName: string;
  parameters: Record<string, string>;
  selectClasses: string;
  onTemplateChange: (_templateName: string) => void;
  onLanguageChange: (_languageCode: string) => void;
  onParameterChange: (_key: string, _value: string) => void;
}

export function IndividualOutreachTemplateSection({
  templates,
  activeTemplate,
  selectedLanguageCode,
  businessName,
  parameters,
  selectClasses,
  onTemplateChange,
  onLanguageChange,
  onParameterChange,
}: IndividualOutreachTemplateSectionProps) {
  const templateOptions = getUniqueTemplateSummaries(templates);
  const languageOptions = activeTemplate ? getTemplateLanguages(templates, activeTemplate.name) : [];
  const requiredParams = getSortedTemplateParameters(activeTemplate);
  const previewBody = renderTemplatePreview(activeTemplate, parameters, businessName);

  return (
    <>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="space-y-1.5 sm:col-span-2">
          <Label htmlFor="ind-template">Meta-Approved Template *</Label>
          <select
            id="ind-template"
            value={activeTemplate?.name || ''}
            onChange={(e) => onTemplateChange(e.target.value)}
            disabled={templateOptions.length === 0}
            className={selectClasses}
          >
            {templateOptions.length === 0 ? (
              <option value="">No approved templates loaded</option>
            ) : (
              templateOptions.map((t) => (
                <option key={t.name} value={t.name}>
                  {t.displayTitle} ({t.category})
                </option>
              ))
            )}
          </select>
        </div>

        <div className="space-y-1.5">
          <Label htmlFor="ind-template-lang">Language *</Label>
          <select
            id="ind-template-lang"
            value={activeTemplate?.languageCode || selectedLanguageCode}
            onChange={(e) => onLanguageChange(e.target.value)}
            disabled={languageOptions.length <= 1}
            className={`${selectClasses} font-mono`}
          >
            {languageOptions.length === 0 ? (
              <option value="">—</option>
            ) : (
              languageOptions.map((t) => (
                <option key={`${t.name}_${t.languageCode}`} value={t.languageCode}>
                  {t.languageCode}
                </option>
              ))
            )}
          </select>
        </div>
      </div>

      {requiredParams.length > 0 && (
        <div className="space-y-3 rounded-xl border border-palnadu-border bg-palnadu-off-white/50 p-3.5">
          <p className="text-xs font-semibold text-palnadu-dark">Template Variables</p>
          {requiredParams.map((spec) => {
            const usesFallback = allowsBusinessNameFallback(activeTemplate?.name, spec.key);
            const fallbackPreview = businessName.trim();
            return (
              <div key={spec.key} className="space-y-1.5">
                <div className="flex items-center justify-between gap-2">
                  <Label htmlFor={`ind-param-${spec.key}`}>
                    {spec.label} {usesFallback ? '(defaults to Business Name)' : '*'}
                  </Label>
                  <span className="font-mono text-xs text-palnadu-secondary">{`{{${spec.key}}}`}</span>
                </div>
                <Input
                  id={`ind-param-${spec.key}`}
                  required={!usesFallback}
                  value={parameters[spec.key] ?? ''}
                  onChange={(e) => onParameterChange(spec.key, e.target.value)}
                  placeholder={
                    usesFallback && fallbackPreview
                      ? `Uses "${fallbackPreview}" unless overridden`
                      : spec.placeholder
                  }
                />
              </div>
            );
          })}
        </div>
      )}

      <div className="rounded-xl border border-palnadu-border bg-palnadu-off-white/50 p-3.5 space-y-1.5">
        <div className="flex items-center justify-between gap-2 text-xs font-bold text-palnadu-teal">
          <div className="flex items-center gap-1.5">
            <Sparkles className="h-3.5 w-3.5" />
            <span>Live Template Preview</span>
          </div>
          {activeTemplate && (
            <span className="font-mono text-xs font-normal text-palnadu-secondary">
              {activeTemplate.languageCode} · {activeTemplate.category}
            </span>
          )}
        </div>
        <p className="text-xs text-palnadu-body leading-relaxed whitespace-pre-wrap font-sans">
          {previewBody}
        </p>
      </div>
    </>
  );
}

