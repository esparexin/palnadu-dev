import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { UserRole } from '@palnadu/types';
import type { UserFormData } from './types';

interface UserModalProps {
  open: boolean;
  formData: UserFormData;
  submitting: boolean;
  onClose: () => void;
  onChange: (_data: UserFormData) => void;
  onSubmit: (_e: React.FormEvent) => void;
}

export function UserModal({
  open,
  formData,
  submitting,
  onClose,
  onChange,
  onSubmit,
}: UserModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="w-full max-w-md rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
          <h2 className="text-sm font-bold text-palnadu-dark">Add New Team Member</h2>
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
            <Label htmlFor="user-name" className="text-xs font-semibold text-palnadu-dark block">
              Full Name <span className="text-palnadu-error">*</span>
            </Label>
            <Input
              id="user-name"
              type="text"
              required
              placeholder="e.g. Anand Varma"
              value={formData.name}
              onChange={(e) => onChange({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-email" className="text-xs font-semibold text-palnadu-dark block">
              Email Address <span className="text-palnadu-error">*</span>
            </Label>
            <Input
              id="user-email"
              type="email"
              required
              placeholder="e.g. anand@palnadu.dev"
              value={formData.email}
              onChange={(e) => onChange({ ...formData, email: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-pass" className="text-xs font-semibold text-palnadu-dark block">
              Initial Password <span className="text-palnadu-error">*</span>
            </Label>
            <Input
              id="user-pass"
              type="password"
              required
              placeholder="Minimum 8 characters"
              value={formData.password}
              onChange={(e) => onChange({ ...formData, password: e.target.value })}
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="user-role" className="text-xs font-semibold text-palnadu-dark block">
              Access Role
            </Label>
            <select
              id="user-role"
              value={formData.role}
              onChange={(e) => onChange({ ...formData, role: e.target.value as UserRole })}
              className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
            >
              <option value="DEVELOPER">Developer (Read & dev tasks)</option>
              <option value="EDITOR">Editor (Blog & case studies)</option>
              <option value="PROJECT_MANAGER">Project Manager (Leads & projects)</option>
              <option value="ADMIN">Admin (Full operations)</option>
              <option value="SUPER_ADMIN">Super Admin (All permissions + user mgmt)</option>
            </select>
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-palnadu-border/60">
            <Button type="button" variant="outline" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" size="sm" disabled={submitting}>
              {submitting ? 'Adding...' : 'Create Account'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
