'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { User, UserRole } from '@palnadu/types';
import { Plus, X, UserCheck, UserX } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-palnadu-error/10 text-palnadu-error border-palnadu-error/20',
  ADMIN: 'bg-palnadu-blue/10 text-palnadu-blue border-palnadu-blue/20',
  EDITOR: 'bg-palnadu-light-blue text-palnadu-blue border-palnadu-blue/20',
  PROJECT_MANAGER: 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/20',
  DEVELOPER: 'bg-palnadu-off-white text-palnadu-dark border-palnadu-border',
};

interface UserFormData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
}

const initialFormData: UserFormData = {
  name: '',
  email: '',
  password: '',
  role: 'DEVELOPER' as UserRole,
};

export default function UsersPage() {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [statusTarget, setStatusTarget] = useState<User | null>(null);
  const [statusLoading, setStatusLoading] = useState(false);
  const [formData, setFormData] = useState<UserFormData>(initialFormData);

  const fetchUsers = () => {
    setLoading(true);
    api.users
      .list()
      .then((res: any) => setUsers(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email || !formData.password) {
      toast.error('Please fill all required fields.');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Password must be at least 8 characters.');
      return;
    }

    setSubmitting(true);
    try {
      await api.users.create(formData);
      setModalOpen(false);
      setFormData(initialFormData);
      toast.success('User account created successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmToggleActive = async () => {
    if (!statusTarget) return;
    try {
      setStatusLoading(true);
      await api.users.update(statusTarget.id, { isActive: !statusTarget.isActive });
      toast.success(statusTarget.isActive ? 'User deactivated successfully' : 'User activated successfully');
      setStatusTarget(null);
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update user status');
    } finally {
      setStatusLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await api.users.update(userId, { role: newRole });
      toast.success('User role updated successfully');
      fetchUsers();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to change role');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">System Users & Roles</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Manage admin users, internal developers, and role-based access permissions.
          </p>
        </div>
        <Button
          onClick={() => setModalOpen(true)}
          size="sm"
          className="gap-1.5 font-semibold text-xs h-9"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
                <th className="px-4 py-3">User Name</th>
                <th className="px-4 py-3">Email Address</th>
                <th className="px-4 py-3">Assigned Role</th>
                <th className="px-4 py-3">Account Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-palnadu-secondary">
                    Loading users...
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-palnadu-secondary">
                    No users found.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-palnadu-dark">{user.name}</td>
                    <td className="px-4 py-3 text-palnadu-body font-mono">{user.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id, e.target.value)}
                        className={cn(
                          'rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider cursor-pointer focus-visible:outline-none',
                          roleColors[user.role] || 'bg-palnadu-off-white text-palnadu-dark border-palnadu-border'
                        )}
                      >
                        <option value="SUPER_ADMIN">Super Admin</option>
                        <option value="ADMIN">Admin</option>
                        <option value="PROJECT_MANAGER">Project Manager</option>
                        <option value="EDITOR">Editor</option>
                        <option value="DEVELOPER">Developer</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                          user.isActive
                            ? 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/20'
                            : 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border'
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', user.isActive ? 'bg-palnadu-teal' : 'bg-palnadu-secondary')} />
                        <span>{user.isActive ? 'Active' : 'Deactivated'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setStatusTarget(user)}
                        className={cn(
                          'h-7 px-2.5 text-xs font-semibold gap-1 transition-colors',
                          user.isActive
                            ? 'border-palnadu-border text-palnadu-secondary hover:bg-palnadu-error/10 hover:text-palnadu-error hover:border-palnadu-error/30'
                            : 'border-palnadu-teal/30 text-palnadu-teal bg-palnadu-teal/5 hover:bg-palnadu-teal/15'
                        )}
                      >
                        {user.isActive ? (
                          <>
                            <UserX className="h-3 w-3" />
                            <span>Deactivate</span>
                          </>
                        ) : (
                          <>
                            <UserCheck className="h-3 w-3" />
                            <span>Activate</span>
                          </>
                        )}
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add User Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
              <h2 className="text-sm font-bold text-palnadu-dark">Add New Team Member</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                className="h-7 w-7 text-palnadu-secondary hover:text-palnadu-dark"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5 text-xs">
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="user-role" className="text-xs font-semibold text-palnadu-dark block">Access Role</Label>
                <select
                  id="user-role"
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
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
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'Adding...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Status Toggle Web Dialog */}
      <ConfirmDialog
        open={Boolean(statusTarget)}
        onCancel={() => setStatusTarget(null)}
        onConfirm={confirmToggleActive}
        loading={statusLoading}
        title={statusTarget?.isActive ? 'Deactivate User Account?' : 'Activate User Account?'}
        message={statusTarget ? `Are you sure you want to ${statusTarget.isActive ? 'deactivate' : 'activate'} ${statusTarget.name}'s account?` : ''}
        confirmLabel={statusTarget?.isActive ? 'Deactivate User' : 'Activate User'}
        variant={statusTarget?.isActive ? 'danger' : 'default'}
      />
    </div>
  );
}
