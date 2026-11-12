'use client';

import { useState } from 'react';
import { X, AlertTriangle, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateCampaignFormData, WhatsAppTemplateDefinition } from './types';
import { initialCampaignFormData } from './types';
import {
  getTemplateLanguages,
  getUniqueTemplateSummaries,
  resolveActiveTemplate,
} from './outreach-template.util';
import {
  CAMPAIGN_SELECT_CLASSES,
  buildCreateCampaignPayload,
  getCampaignVariableMappings,
  renderCampaignTemplatePreview,
} from './campaign-template.util';

interface CampaignModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (_data: CreateCampaignFormData) => Promise<void>;
  templates: WhatsAppTemplateDefinition[];
  templatesError?: string | null;
}

export function CampaignModal({
  open,
  onClose,
  onSubmit,
  templates,
  templatesError,
}: CampaignModalProps) {
  const [formData, setFormData] = useState<CreateCampaignFormData>(initialCampaignFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const templateOptions = getUniqueTemplateSummaries(templates);
  const activeTemplate = templatesError
    ? undefined
    : resolveActiveTemplate(templates, formData.templateName, formData.languageCode);
  const languageOptions = activeTemplate
    ? getTemplateLanguages(templates, activeTemplate.name)
    : [];
  const variableMappings = getCampaignVariableMappings(activeTemplate);
  const previewBody = renderCampaignTemplatePreview(activeTemplate);

  const handleTemplateChange = (nextName: string) => {
    const picked = resolveActiveTemplate(templates, nextName, activeTemplate?.languageCode);
    setError(null);
    setFormData((prev) => ({
      ...prev,
      templateName: picked?.name || nextName,
      languageCode: picked?.languageCode || '',
    }));
  };

  const handleLanguageChange = (nextLang: string) => {
    setError(null);
    setFormData((prev) => ({
      ...prev,
      templateName: activeTemplate?.name || prev.templateName,
      languageCode: nextLang,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const built = buildCreateCampaignPayload({
      formData: {
        ...formData,
        templateName: activeTemplate?.name || formData.templateName,
        languageCode: activeTemplate?.languageCode || formData.languageCode,
      },
      templates,
      templatesError,
    });
    if (built.error || !built.payload) {
      setError(built.error || 'Cannot create campaign without Meta template verification.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(built.payload);
      setFormData(initialCampaignFormData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create campaign.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-palnadu-dark/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-palnadu-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
          <h3 className="text-sm font-bold text-palnadu-dark">Create Marketing Campaign</h3>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {(templatesError || error || !activeTemplate) && (
            <div className="flex items-start gap-2 rounded-md border border-palnadu-error/30 bg-palnadu-error/5 p-3 text-xs text-palnadu-error">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <span>
                {error ||
                  templatesError ||
                  'No Meta-approved templates are currently loaded. Live Meta verification is required.'}
              </span>
            </div>
          )}

          <div className="space-y-1.5">
            <Label htmlFor="camp-name">Campaign Name *</Label>
            <Input
              id="camp-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Narasaraopet Retailers Outreach"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="camp-template">Meta-Approved Template *</Label>
              <select
                id="camp-template"
                value={activeTemplate?.name || ''}
                onChange={(e) => handleTemplateChange(e.target.value)}
                disabled={Boolean(templatesError) || templateOptions.length === 0}
                className={CAMPAIGN_SELECT_CLASSES}
              >
                {templateOptions.length === 0 || templatesError ? (
                  <option value="">No approved templates verified</option>
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
              <Label htmlFor="camp-lang">Language *</Label>
              <select
                id="camp-lang"
                value={activeTemplate?.languageCode || ''}
                onChange={(e) => handleLanguageChange(e.target.value)}
                disabled={Boolean(templatesError) || languageOptions.length <= 1}
                className={`${CAMPAIGN_SELECT_CLASSES} font-mono`}
              >
                {languageOptions.length === 0 || templatesError ? (
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

          <div className="rounded-xl border border-palnadu-border bg-palnadu-off-white/50 p-3.5 space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs font-bold text-palnadu-teal">
              <div className="flex items-center gap-1.5">
                <Sparkles className="h-3.5 w-3.5" />
                <span>Meta Template Preview</span>
              </div>
              {activeTemplate && (
                <span className="font-mono text-xs font-normal text-palnadu-secondary">
                  {activeTemplate.languageCode} · {activeTemplate.category}
                </span>
              )}
            </div>
            <p className="whitespace-pre-wrap text-xs leading-relaxed text-palnadu-dark">
              {previewBody}
            </p>
            {variableMappings.map((item) => (
              <p key={item.key} className="text-xs text-palnadu-secondary">
                <span className="font-mono text-palnadu-dark">{`{{${item.key}}}`}</span>: {item.mappingNote}
              </p>
            ))}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-audience">Target Audience</Label>
            <Input
              id="camp-audience"
              value={formData.targetAudience}
              onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
              placeholder="NO_WEBSITE"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="camp-desc">Description (Optional)</Label>
            <Textarea
              id="camp-desc"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Notes on this marketing run..."
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-palnadu-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="secondary"
              size="sm"
              disabled={submitting || Boolean(templatesError) || !activeTemplate}
            >
              {submitting ? 'Verifying & Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
