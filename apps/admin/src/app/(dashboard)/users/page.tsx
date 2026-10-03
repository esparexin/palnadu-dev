'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { User, UserRole } from '@palnadu/types';
import { Plus, X, UserCheck, UserX, Shield, Edit2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';

const roleColors: Record<string, string> = {
  SUPER_ADMIN: 'bg-red-100 text-red-800 border-red-200',
  ADMIN: 'bg-purple-100 text-purple-800 border-purple-200',
  EDITOR: 'bg-blue-100 text-blue-800 border-blue-200',
  PROJECT_MANAGER: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  DEVELOPER: 'bg-teal-100 text-teal-800 border-teal-200',
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
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-palnadu-blue px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#12487e] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </button>
      </div>

      {/* Users Table */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-2xs overflow-hidden">
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
                          'rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider cursor-pointer focus-visible:outline-none',
                          roleColors[user.role] || 'bg-gray-100 text-gray-800 border-gray-200'
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
                          'inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          user.isActive
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-gray-100 text-gray-600 border-gray-200'
                        )}
                      >
                        <span className={cn('h-1.5 w-1.5 rounded-full', user.isActive ? 'bg-emerald-500' : 'bg-gray-400')} />
                        <span>{user.isActive ? 'Active' : 'Deactivated'}</span>
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        onClick={() => setStatusTarget(user)}
                        className={cn(
                          'inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-semibold border transition-colors cursor-pointer',
                          user.isActive
                            ? 'border-palnadu-border text-palnadu-secondary hover:bg-red-50 hover:text-palnadu-error hover:border-red-200'
                            : 'border-emerald-200 text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
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
                      </button>
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
            <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5">
              <h2 className="text-sm font-bold text-palnadu-dark">Add New Team Member</h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-palnadu-secondary hover:text-palnadu-dark transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="p-5 space-y-3.5">
              <div className="space-y-1">
                <label className="text-xs font-semibold text-palnadu-dark">
                  Full Name <span className="text-palnadu-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Anand Varma"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-palnadu-dark">
                  Email Address <span className="text-palnadu-error">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="e.g. anand@palnadu.dev"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-palnadu-dark">
                  Initial Password <span className="text-palnadu-error">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Minimum 8 characters"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-palnadu-dark">Access Role</label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData({ ...formData, role: e.target.value as UserRole })}
                  className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                >
                  <option value="DEVELOPER">Developer (Read & dev tasks)</option>
                  <option value="EDITOR">Editor (Blog & case studies)</option>
                  <option value="PROJECT_MANAGER">Project Manager (Leads & projects)</option>
                  <option value="ADMIN">Admin (Full operations)</option>
                  <option value="SUPER_ADMIN">Super Admin (All permissions + user mgmt)</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-palnadu-border/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border border-palnadu-border bg-white px-3.5 py-1.5 text-xs font-semibold text-palnadu-dark hover:bg-palnadu-off-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-palnadu-blue px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#12487e] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Adding...' : 'Create Account'}
                </button>
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
