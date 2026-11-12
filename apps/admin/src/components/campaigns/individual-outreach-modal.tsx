'use client';

import { useState } from 'react';
import { X, Send, ShieldAlert, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type {
  IndividualOutreachFormData,
  SendIndividualOutreachInput,
  WhatsAppTemplateDefinition,
  WhatsAppConsentType,
} from './types';
import { initialOutreachFormData } from './types';
import {
  buildIndividualOutreachPayload,
  getConsentCompatibilityWarning,
  resolveActiveTemplate,
} from './outreach-template.util';
import { IndividualOutreachTemplateSection } from './individual-outreach-template-section';

interface IndividualOutreachModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (_data: SendIndividualOutreachInput) => Promise<void>;
  templates: WhatsAppTemplateDefinition[];
}

const SELECT_CLASSES =
  'flex h-9 w-full rounded-md border border-palnadu-border bg-palnadu-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer';

export function IndividualOutreachModal({
  open,
  onClose,
  onSubmit,
  templates,
}: IndividualOutreachModalProps) {
  const [formData, setFormData] = useState<IndividualOutreachFormData>(initialOutreachFormData);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!open) return null;

  const activeTemplate = resolveActiveTemplate(templates, formData.templateName, formData.languageCode);
  const consentWarning = getConsentCompatibilityWarning(activeTemplate?.category, formData.consentType);
  const isMarketing = (activeTemplate?.category || 'MARKETING').toUpperCase() === 'MARKETING';

  const handleTemplateChange = (nextTemplateName: string) => {
    const picked = resolveActiveTemplate(templates, nextTemplateName, activeTemplate?.languageCode);
    setError(null);
    setFormData((prev) => ({
      ...prev,
      templateName: picked?.name || nextTemplateName,
      languageCode: picked?.languageCode || prev.languageCode,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const built = buildIndividualOutreachPayload({ formData, templates });
    if (built.error || !built.payload) {
      setError(built.error || 'Please check the outreach details.');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmit(built.payload);
      setFormData(initialOutreachFormData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch individual outreach.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-palnadu-dark/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-palnadu-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-palnadu-teal" />
            <h3 className="text-sm font-bold text-palnadu-dark">Individual WhatsApp Outreach</h3>
          </div>
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="h-9 w-9 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ind-biz">Business Name *</Label>
              <Input
                id="ind-biz"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Sri Lakshmi Rice Mill"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ind-phone">Mobile Number (+91) *</Label>
              <Input
                id="ind-phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="font-mono"
              />
            </div>
          </div>

          <IndividualOutreachTemplateSection
            templates={templates}
            activeTemplate={activeTemplate}
            selectedLanguageCode={formData.languageCode}
            businessName={formData.businessName}
            parameters={formData.parameters}
            selectClasses={SELECT_CLASSES}
            onTemplateChange={handleTemplateChange}
            onLanguageChange={(languageCode) =>
              setFormData((prev) => ({
                ...prev,
                templateName: activeTemplate?.name || prev.templateName,
                languageCode,
              }))
            }
            onParameterChange={(key, value) =>
              setFormData((prev) => ({
                ...prev,
                parameters: { ...prev.parameters, [key]: value },
              }))
            }
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="ind-consent-type">Consent Type *</Label>
              <select
                id="ind-consent-type"
                value={formData.consentType}
                onChange={(e) =>
                  setFormData({ ...formData, consentType: e.target.value as WhatsAppConsentType })
                }
                className={SELECT_CLASSES}
              >
                <option value="SIGNED_AGREEMENT">Signed Agreement / Order</option>
                <option value="WEBSITE_LEAD_FORM">Website Lead Form</option>
                <option value="INBOUND_WHATSAPP_INQUIRY">Inbound WhatsApp Inquiry (Utility Only)</option>
                <option value="VERIFIED_CRM_LEAD">Verified CRM Lead</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="ind-consent-ref">Evidence Reference ID *</Label>
              <Input
                id="ind-consent-ref"
                required
                value={formData.consentEvidenceRef}
                onChange={(e) => setFormData({ ...formData, consentEvidenceRef: e.target.value })}
                placeholder="Lead ID, Inbound WamID, or Media ID"
                className="font-mono"
              />
            </div>
          </div>

          {consentWarning ? (
            <div className="flex items-start gap-2 rounded-md border border-palnadu-warning/30 bg-palnadu-warning/10 p-2.5 text-xs text-palnadu-dark">
              <AlertTriangle className="h-4 w-4 shrink-0 text-palnadu-warning" />
              <span>{consentWarning}</span>
            </div>
          ) : (
            isMarketing && (
              <p className="text-xs text-palnadu-secondary">
                Marketing templates require verified opt-in consent; inbound WhatsApp inquiries cover 24-hour customer service replies only.
              </p>
            )
          )}

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ind-save-contact"
              checked={formData.saveContact}
              onChange={(e) => setFormData({ ...formData, saveContact: e.target.checked })}
              className="h-4 w-4 rounded border-palnadu-border text-palnadu-teal focus:ring-palnadu-teal cursor-pointer"
            />
            <Label htmlFor="ind-save-contact" className="font-normal cursor-pointer">
              Save or update this contact in directory for future campaigns
            </Label>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-palnadu-error/30 bg-palnadu-error/5 p-2.5 text-xs text-palnadu-error">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-palnadu-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" variant="secondary" size="sm" disabled={submitting || !activeTemplate}>
              {submitting ? 'Dispatching...' : 'Send WhatsApp Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
