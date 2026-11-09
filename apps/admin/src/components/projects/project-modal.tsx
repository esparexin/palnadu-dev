import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Client } from '@palnadu/types';
import type { ProjectFormData } from './types';

interface ProjectModalProps {
  open: boolean;
  editingProject: any | null;
  formData: ProjectFormData;
  clients: Client[];
  submitting: boolean;
  onClose: () => void;
  onChange: (_data: ProjectFormData) => void;
  onSubmit: (_e: React.FormEvent) => void;
}

export function ProjectModal({
  open,
  editingProject,
  formData,
  clients,
  submitting,
  onClose,
  onChange,
  onSubmit,
}: ProjectModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
      <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-white p-6 shadow-xl space-y-4 my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-palnadu-border/60 pb-3">
          <div>
            <h2 className="text-base font-bold text-palnadu-dark">
              {editingProject ? 'Edit Project' : 'Create New Project'}
            </h2>
            <p className="text-xs text-palnadu-secondary">
              {editingProject
                ? 'Update project scope, deliverables, or status.'
                : 'Register a new client engagement or software deliverable.'}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="h-7 w-7 text-palnadu-secondary hover:text-palnadu-dark"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <form onSubmit={onSubmit} className="space-y-3.5 text-xs">
          <div className="space-y-1">
            <Label>Project Name *</Label>
            <Input
              type="text"
              placeholder="e.g. Agritech Logistics Portal"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
              required
            />
          </div>

          <div className="space-y-1">
            <Label>Associated Client *</Label>
            {clients.length === 0 ? (
              <div className="p-2.5 rounded-md bg-palnadu-warning/10 border border-palnadu-warning/20 text-xs text-palnadu-warning">
                No clients exist yet. Please create a Client first in <a href="/clients" className="underline font-bold">Clients</a>.
              </div>
            ) : (
              <select
                value={formData.clientId}
                onChange={(e) => onChange({ ...formData, clientId: e.target.value })}
                required
                className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
              >
                {clients.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name} {c.company ? `(${c.company})` : ''}
                  </option>
                ))}
              </select>
            )}
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Status</Label>
              <select
                value={formData.status}
                onChange={(e) => onChange({ ...formData, status: e.target.value })}
                className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
              >
                <option value="PLANNING">Planning</option>
                <option value="ACTIVE">Active in Dev</option>
                <option value="ON_HOLD">On Hold</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>

            <div className="space-y-1">
              <Label>Budget / Value</Label>
              <Input
                type="text"
                placeholder="e.g. ₹2,50,000 / $3,000"
                value={formData.budget}
                onChange={(e) => onChange({ ...formData, budget: e.target.value })}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Start Date</Label>
              <Input
                type="date"
                value={formData.startDate}
                onChange={(e) => onChange({ ...formData, startDate: e.target.value })}
              />
            </div>

            <div className="space-y-1">
              <Label>Target Delivery</Label>
              <Input
                type="date"
                value={formData.expectedCompletion}
                onChange={(e) => onChange({ ...formData, expectedCompletion: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1">
            <Label>Technologies (comma separated)</Label>
            <Input
              type="text"
              placeholder="e.g. Next.js, TypeScript, Tailwind, MongoDB"
              value={formData.technology}
              onChange={(e) => onChange({ ...formData, technology: e.target.value })}
            />
          </div>

          <div className="space-y-1">
            <Label>Scope Description</Label>
            <Textarea
              rows={2}
              placeholder="Briefly state key deliverables or scope boundaries..."
              value={formData.description}
              onChange={(e) => onChange({ ...formData, description: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-palnadu-border/60">
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={submitting || clients.length === 0}>
              {submitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
