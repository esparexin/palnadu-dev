import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { Client } from '@palnadu/types';
import type { ClientFormData } from './types';

interface ClientModalProps {
  open: boolean;
  editingClient: Client | null;
  formData: ClientFormData;
  submitting: boolean;
  onClose: () => void;
  onChange: (_data: ClientFormData) => void;
  onSubmit: (_e: React.FormEvent) => void;
}

export function ClientModal({
  open,
  editingClient,
  formData,
  submitting,
  onClose,
  onChange,
  onSubmit,
}: ClientModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
          <h2 className="text-sm font-bold text-palnadu-dark">
            {editingClient ? 'Edit Client Details' : 'Add New Client'}
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
            <Label htmlFor="client-name" className="text-xs font-semibold text-palnadu-dark block">
              Client Name <span className="text-palnadu-error">*</span>
            </Label>
            <Input
              id="client-name"
              type="text"
              required
              placeholder="e.g. Rajesh Kumar"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-email" className="text-xs font-semibold text-palnadu-dark block">
              Email Address <span className="text-palnadu-error">*</span>
            </Label>
            <Input
              id="client-email"
              type="email"
              required
              placeholder="e.g. rajesh@example.com"
              value={formData.email}
              onChange={(e) => onChange({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="client-company" className="text-xs font-semibold text-palnadu-dark block">
                Company Name
              </Label>
              <Input
                id="client-company"
                type="text"
                placeholder="e.g. Acme Corp"
                value={formData.company}
                onChange={(e) => onChange({ ...formData, company: e.target.value })}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="client-phone" className="text-xs font-semibold text-palnadu-dark block">
                Phone / WhatsApp
              </Label>
              <Input
                id="client-phone"
                type="tel"
                placeholder="+91 98765 43210"
                value={formData.phone}
                onChange={(e) => onChange({ ...formData, phone: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="client-notes" className="text-xs font-semibold text-palnadu-dark block">
              Internal Notes
            </Label>
            <Textarea
              id="client-notes"
              rows={3}
              placeholder="Client requirements, payment terms, or engagement history..."
              value={formData.notes}
              onChange={(e) => onChange({ ...formData, notes: e.target.value })}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-palnadu-border/60">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Saving...' : editingClient ? 'Save Changes' : 'Create Client'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
