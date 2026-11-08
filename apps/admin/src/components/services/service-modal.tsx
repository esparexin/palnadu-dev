import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { slugify } from '@palnadu/config';
import type { Service } from '@palnadu/types';
import type { ServiceFormData } from './types';

interface ServiceModalProps {
  open: boolean;
  editingService: Service | null;
  formData: ServiceFormData;
  submitting: boolean;
  onClose: () => void;
  onTitleChange: (_title: string) => void;
  onChange: (_data: ServiceFormData) => void;
  onSubmit: (_e: React.FormEvent) => void;
}

export function ServiceModal({
  open,
  editingService,
  formData,
  submitting,
  onClose,
  onTitleChange,
  onChange,
  onSubmit,
}: ServiceModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8">
        <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
          <h2 className="text-sm font-bold text-palnadu-dark">
            {editingService ? 'Edit Engineering Service' : 'Add New Service Capability'}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-palnadu-secondary hover:text-palnadu-dark"
            aria-label="Close dialog"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-3.5 text-xs">
          <div className="space-y-1.5">
            <Label htmlFor="service-title" className="text-xs font-semibold text-palnadu-dark block">
              Service Title <span className="text-palnadu-error">*</span>
            </Label>
            <Input
              id="service-title"
              type="text"
              required
              placeholder="e.g. AI Workflow Automation"
              value={formData.title}
              onChange={(e) => onTitleChange(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-1.5">
              <Label htmlFor="service-slug" className="text-xs font-semibold text-palnadu-dark block">
                URL Slug <span className="text-palnadu-error">*</span>
              </Label>
              <Input
                id="service-slug"
                type="text"
                required
                value={formData.slug}
                onChange={(e) => onChange({ ...formData, slug: slugify(e.target.value) })}
                className="font-mono text-xs"
              />
            </div>

            <div className="col-span-1 space-y-1.5">
              <Label htmlFor="service-order" className="text-xs font-semibold text-palnadu-dark block">
                Display Order
              </Label>
              <Input
                id="service-order"
                type="number"
                min="1"
                value={formData.order}
                onChange={(e) => onChange({ ...formData, order: parseInt(e.target.value, 10) || 1 })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-status" className="text-xs font-semibold text-palnadu-dark block">
              Publication Status
            </Label>
            <select
              id="service-status"
              value={formData.status}
              onChange={(e) => onChange({ ...formData, status: e.target.value as any })}
              className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <option value="PUBLISHED">Published (Visible on site)</option>
              <option value="DRAFT">Draft (Internal)</option>
              <option value="ARCHIVED">Archived</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-desc" className="text-xs font-semibold text-palnadu-dark block">
              Short Deliverables Summary <span className="text-palnadu-error">*</span>
            </Label>
            <Textarea
              id="service-desc"
              rows={2}
              required
              placeholder="2-sentence description for cards and search snippets..."
              value={formData.shortDescription}
              onChange={(e) => onChange({ ...formData, shortDescription: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="service-content" className="text-xs font-semibold text-palnadu-dark block">
              Full Service Page Content <span className="text-palnadu-error">*</span>
            </Label>
            <Textarea
              id="service-content"
              rows={5}
              required
              placeholder="Detailed breakdown of problems solved, deliverables, and technical architecture..."
              value={formData.content}
              onChange={(e) => onChange({ ...formData, content: e.target.value })}
              className="font-mono"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-palnadu-border/60">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
