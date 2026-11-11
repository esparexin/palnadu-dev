'use client';

import { useState } from 'react';
import { X, Send, ShieldAlert, Sparkles } from 'lucide-react';
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

interface IndividualOutreachModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (_data: SendIndividualOutreachInput) => Promise<void>;
  templates: WhatsAppTemplateDefinition[];
}

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

  const activeTemplate =
    templates.find((t) => t.name === formData.templateName) || templates[0];

  const previewBody = activeTemplate
    ? activeTemplate.sampleText.replace('{{1}}', formData.businessName.trim() || '[Business Name]')
    : 'Select a template to preview';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const cleanPhone = formData.phone.replace(/[^0-9+]/g, '');
    if (!cleanPhone || cleanPhone.length < 10) {
      setError('Please provide a valid phone number with country code (e.g. +91 98765 43210).');
      return;
    }

    if (!formData.businessName.trim()) {
      setError('Business name is required.');
      return;
    }

    if (!formData.consentEvidenceRef.trim()) {
      setError('A verifiable consent reference ID is required.');
      return;
    }

    setSubmitting(true);
    try {
      const payload: SendIndividualOutreachInput = {
        phone: cleanPhone,
        businessName: formData.businessName.trim(),
        contactName: formData.contactName.trim() || undefined,
        templateName: activeTemplate ? activeTemplate.name : formData.templateName,
        languageCode: activeTemplate ? activeTemplate.languageCode : formData.languageCode,
        parameters: { business_name: formData.businessName.trim() },
        consentEvidence: {
          consentType: formData.consentType,
          consentEvidenceRef: formData.consentEvidenceRef.trim(),
          consentTimestamp: new Date().toISOString(),
          recipientPhone: cleanPhone,
        },
        idempotencyKey: `idemp-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`,
        saveContact: formData.saveContact,
      };

      await onSubmit(payload);
      setFormData(initialOutreachFormData);
      onClose();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to dispatch individual outreach.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-palnadu-dark/40 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-palnadu-white p-6 shadow-xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
          <div className="flex items-center gap-2">
            <Send className="h-4 w-4 text-palnadu-teal" />
            <h3 className="text-sm font-bold text-palnadu-dark">Individual WhatsApp Outreach</h3>
          </div>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0 cursor-pointer">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ind-biz" className="text-xs font-semibold text-palnadu-dark">
                Business Name *
              </Label>
              <Input
                id="ind-biz"
                required
                value={formData.businessName}
                onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                placeholder="e.g. Sri Lakshmi Rice Mill"
                className="h-9 text-xs"
              />
            </div>

            <div className="space-y-1">
              <Label htmlFor="ind-phone" className="text-xs font-semibold text-palnadu-dark">
                Mobile Number (+91) *
              </Label>
              <Input
                id="ind-phone"
                required
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+91 98765 43210"
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="ind-template" className="text-xs font-semibold text-palnadu-dark">
              Meta-Approved Template *
            </Label>
            <select
              id="ind-template"
              value={formData.templateName}
              onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
              className="flex h-9 w-full rounded-md border border-palnadu-border bg-palnadu-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
            >
              {templates.map((t) => (
                <option key={`${t.name}_${t.languageCode}`} value={t.name}>
                  {t.displayTitle} ({t.languageCode})
                </option>
              ))}
            </select>
          </div>

          <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/60 p-3 space-y-1">
            <div className="flex items-center gap-1.5 text-xs font-bold text-palnadu-teal">
              <Sparkles className="h-3.5 w-3.5" />
              <span>Live Template Preview</span>
            </div>
            <p className="text-xs text-palnadu-body leading-relaxed whitespace-pre-wrap font-sans">
              {previewBody}
            </p>
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-1">
              <Label htmlFor="ind-consent-type" className="text-xs font-semibold text-palnadu-dark">
                Consent Type *
              </Label>
              <select
                id="ind-consent-type"
                value={formData.consentType}
                onChange={(e) => setFormData({ ...formData, consentType: e.target.value as WhatsAppConsentType })}
                className="flex h-9 w-full rounded-md border border-palnadu-border bg-palnadu-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
              >
                <option value="SIGNED_AGREEMENT">Signed Agreement / Order</option>
                <option value="WEBSITE_LEAD_FORM">Website Lead Form</option>
                <option value="INBOUND_WHATSAPP_INQUIRY">Inbound WhatsApp Inquiry</option>
                <option value="VERIFIED_CRM_LEAD">Verified CRM Lead</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label htmlFor="ind-consent-ref" className="text-xs font-semibold text-palnadu-dark">
                Evidence Reference ID *
              </Label>
              <Input
                id="ind-consent-ref"
                required
                value={formData.consentEvidenceRef}
                onChange={(e) => setFormData({ ...formData, consentEvidenceRef: e.target.value })}
                placeholder="e.g. AGR-2026-001 or Lead ID"
                className="h-9 font-mono text-xs"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 pt-1">
            <input
              type="checkbox"
              id="ind-save-contact"
              checked={formData.saveContact}
              onChange={(e) => setFormData({ ...formData, saveContact: e.target.checked })}
              className="h-4 w-4 rounded border-palnadu-border text-palnadu-teal focus:ring-palnadu-teal"
            />
            <Label htmlFor="ind-save-contact" className="text-xs font-normal text-palnadu-dark cursor-pointer">
              Save or update this business contact in directory for future campaigns
            </Label>
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-md border border-palnadu-error/30 bg-palnadu-error/5 p-2 text-xs text-palnadu-error">
              <ShieldAlert className="h-4 w-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="flex justify-end gap-2 border-t border-palnadu-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              disabled={submitting}
              className="bg-palnadu-teal hover:bg-palnadu-teal-dark text-white cursor-pointer"
            >
              {submitting ? 'Dispatching...' : 'Send WhatsApp Message'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

