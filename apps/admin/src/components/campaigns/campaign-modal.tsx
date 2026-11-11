'use client';

import { useState } from 'react';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CreateCampaignFormData } from './types';
import { initialCampaignFormData } from './types';

interface CampaignModalProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (_data: CreateCampaignFormData) => Promise<void>;
}

export function CampaignModal({ open, onClose, onSubmit }: CampaignModalProps) {
  const [formData, setFormData] = useState<CreateCampaignFormData>(initialCampaignFormData);
  const [submitting, setSubmitting] = useState(false);

  if (!open) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await onSubmit(formData);
      setFormData(initialCampaignFormData);
      onClose();
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-palnadu-dark/40 backdrop-blur-xs">
      <div className="w-full max-w-md rounded-lg border border-palnadu-border bg-palnadu-white p-6 shadow-lg">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
          <h3 className="text-sm font-semibold text-palnadu-dark">Create Marketing Campaign</h3>
          <Button variant="ghost" size="sm" onClick={onClose} className="h-7 w-7 p-0">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="space-y-1">
            <Label htmlFor="camp-name" className="text-xs font-medium text-palnadu-dark">Campaign Name</Label>
            <Input
              id="camp-name"
              required
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g. Narasaraopet Retailers Outreach"
              className="h-9 text-xs"
            />
          </div>

          <div className="space-y-1">
            <Label htmlFor="camp-template" className="text-xs font-medium text-palnadu-dark">Meta Template Name</Label>
            <Input
              id="camp-template"
              required
              value={formData.templateName}
              onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
              placeholder="e.g. b2b_website_outreach_v1"
              className="h-9 text-xs"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="camp-lang" className="text-xs font-medium text-palnadu-dark">Language</Label>
              <Input
                id="camp-lang"
                required
                value={formData.languageCode}
                onChange={(e) => setFormData({ ...formData, languageCode: e.target.value })}
                placeholder="en_US or te"
                className="h-9 text-xs"
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="camp-audience" className="text-xs font-medium text-palnadu-dark">Target Audience</Label>
              <Input
                id="camp-audience"
                value={formData.targetAudience}
                onChange={(e) => setFormData({ ...formData, targetAudience: e.target.value })}
                placeholder="NO_WEBSITE"
                className="h-9 text-xs"
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="camp-desc" className="text-xs font-medium text-palnadu-dark">Description (Optional)</Label>
            <Textarea
              id="camp-desc"
              rows={2}
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Notes on this marketing run..."
              className="text-xs"
            />
          </div>

          <div className="flex justify-end gap-2 border-t border-palnadu-border pt-4">
            <Button type="button" variant="outline" size="sm" onClick={onClose} disabled={submitting}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting} className="bg-palnadu-teal hover:bg-palnadu-teal-dark text-white">
              {submitting ? 'Creating...' : 'Create Campaign'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
