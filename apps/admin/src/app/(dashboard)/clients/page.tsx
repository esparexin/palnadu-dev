'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Client } from '@palnadu/types';
import { Plus, Search } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ClientTable } from '@/components/clients/client-table';
import { ClientModal } from '@/components/clients/client-modal';
import type { ClientFormData } from '@/components/clients/types';
import { initialFormData } from '@/components/clients/types';

export default function ClientsPage() {
  const { toast } = useToast();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formData, setFormData] = useState<ClientFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchClients = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;

    api.clients
      .list(params)
      .then((res: any) => setClients(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchClients();
  }, [search]);

  const openCreateModal = () => {
    setEditingClient(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const openEditModal = (client: Client) => {
    setEditingClient(client);
    setFormData({
      name: client.name,
      company: client.company || '',
      email: client.email,
      phone: client.phone || '',
      notes: client.notes || '',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.email) {
      toast.error('Please provide name and email.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingClient) {
        await api.clients.update(editingClient.id, formData);
        toast.success('Client updated successfully');
      } else {
        await api.clients.create(formData);
        toast.success('Client created successfully');
      }
      setModalOpen(false);
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.clients.delete(deleteTarget.id);
      toast.success('Client deleted successfully');
      setDeleteTarget(null);
      fetchClients();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete client');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Clients</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Manage your company client accounts, contacts, and historical project associations.
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm" className="gap-1.5 font-semibold text-xs h-9">
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-palnadu-secondary" />
          <Input
            type="text"
            placeholder="Search by client name, company, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
      </div>

      <ClientTable
        clients={clients}
        loading={loading}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
      />

      <ClientModal
        open={modalOpen}
        editingClient={editingClient}
        formData={formData}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onChange={setFormData}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Client?"
        message={deleteTarget ? `Are you sure you want to delete client "${deleteTarget.name}"?` : ''}
        confirmLabel="Delete Client"
      />
    </div>
  );
}
