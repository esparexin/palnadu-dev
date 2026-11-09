import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { CaseStudy } from '@palnadu/types';
import type { CaseStudyFormData } from './types';

interface CaseStudyModalProps {
  open: boolean;
  editingStudy: CaseStudy | null;
  formData: CaseStudyFormData;
  submitting: boolean;
  onClose: () => void;
  onTitleChange: (_title: string) => void;
  onChange: (_data: CaseStudyFormData) => void;
  onSubmit: (_e: React.FormEvent) => void;
}

export function CaseStudyModal({
  open,
  editingStudy,
  formData,
  submitting,
  onClose,
  onTitleChange,
  onChange,
  onSubmit,
}: CaseStudyModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8">
        <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
          <h2 className="text-sm font-bold text-palnadu-dark">
            {editingStudy ? 'Edit Case Study' : 'Add New Case Study'}
          </h2>
          <Button variant="ghost" size="icon" onClick={onClose} className="h-7 w-7 text-palnadu-secondary">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4 text-xs">
          <div>
            <Label className="block text-xs font-semibold text-palnadu-dark mb-1">Title *</Label>
            <Input
              type="text"
              value={formData.title}
              onChange={(e) => onTitleChange(e.target.value)}
              placeholder="e.g. Scaling AgriTech Cloud Platform for 50k Users"
              required
            />
          </div>

          <div>
            <Label className="block text-xs font-semibold text-palnadu-dark mb-1">Slug *</Label>
            <Input
              type="text"
              value={formData.slug}
              onChange={(e) => onChange({ ...formData, slug: e.target.value })}
              className="font-mono"
              required
            />
          </div>

          <div>
            <Label className="block text-xs font-semibold text-palnadu-dark mb-1">The Problem / Challenge *</Label>
            <Textarea
              value={formData.problem}
              onChange={(e) => onChange({ ...formData, problem: e.target.value })}
              rows={3}
              placeholder="Describe the client's initial bottleneck or architectural challenge..."
              required
            />
          </div>

          <div>
            <Label className="block text-xs font-semibold text-palnadu-dark mb-1">Our Engineered Solution *</Label>
            <Textarea
              value={formData.solution}
              onChange={(e) => onChange({ ...formData, solution: e.target.value })}
              rows={3}
              placeholder="Explain how Palnadu.dev designed and implemented the technical solution..."
              required
            />
          </div>

          <div>
            <Label className="block text-xs font-semibold text-palnadu-dark mb-1">Measurable Business Results *</Label>
            <Textarea
              value={formData.result}
              onChange={(e) => onChange({ ...formData, result: e.target.value })}
              rows={2}
              placeholder="e.g. 78% reduction in latency, 4.2x organic signups..."
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="block text-xs font-semibold text-palnadu-dark mb-1">Tech Stack (comma-separated)</Label>
              <Input
                type="text"
                value={formData.technology}
                onChange={(e) => onChange({ ...formData, technology: e.target.value })}
                placeholder="Next.js, NestJS, AWS"
              />
            </div>
            <div>
              <Label className="block text-xs font-semibold text-palnadu-dark mb-1">Status</Label>
              <select
                value={formData.status}
                onChange={(e) => onChange({ ...formData, status: e.target.value as any })}
                className="w-full h-9 rounded-md border border-palnadu-border bg-white px-2.5 text-xs text-palnadu-dark"
              >
                <option value="DRAFT">Draft</option>
                <option value="PUBLISHED">Published</option>
                <option value="ARCHIVED">Archived</option>
              </select>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-palnadu-border">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : editingStudy ? 'Update' : 'Create'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
