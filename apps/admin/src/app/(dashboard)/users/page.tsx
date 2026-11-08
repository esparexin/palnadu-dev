'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { User } from '@palnadu/types';
import { Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { UserTable } from '@/components/users/user-table';
import { UserModal } from '@/components/users/user-modal';
import type { UserFormData } from '@/components/users/types';
import { initialFormData } from '@/components/users/types';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">System Users & Roles</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Manage admin users, internal developers, and role-based access permissions.
          </p>
        </div>
        <Button onClick={() => setModalOpen(true)} size="sm" className="gap-1.5 font-semibold text-xs h-9">
          <Plus className="h-4 w-4" />
          <span>Add User</span>
        </Button>
      </div>

      <UserTable
        users={users}
        loading={loading}
        onRoleChange={handleRoleChange}
        onStatusClick={setStatusTarget}
      />

      <UserModal
        open={modalOpen}
        formData={formData}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onChange={setFormData}
        onSubmit={handleCreateUser}
      />

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
