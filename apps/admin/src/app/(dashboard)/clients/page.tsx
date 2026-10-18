'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Client } from '@palnadu/types';
import { Plus, Search, Edit2, Trash2, X, Building } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';

interface ClientFormData {
  name: string;
  company: string;
  email: string;
  phone: string;
  notes: string;
}

const initialFormData: ClientFormData = {
  name: '',
  company: '',
  email: '',
  phone: '',
  notes: '',
};

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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Clients</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Manage your company client accounts, contacts, and historical project associations.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          size="sm"
          className="gap-1.5 font-semibold text-xs h-9"
        >
          <Plus className="h-4 w-4" />
          <span>Add Client</span>
        </Button>
      </div>

      {/* Filter Bar */}
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

      {/* Clients Table */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
                <th className="px-4 py-3">Client Name</th>
                <th className="px-4 py-3">Company</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Phone</th>
                <th className="px-4 py-3">Added Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center text-palnadu-secondary">
                    Loading clients...
                  </td>
                </tr>
              ) : clients.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-palnadu-secondary">
                    <p className="font-medium text-palnadu-dark">No clients found</p>
                    <p className="text-xs mt-1">Add a new client above or convert an inquiry from the Leads page.</p>
                  </td>
                </tr>
              ) : (
                clients.map((client) => (
                  <tr
                    key={client.id}
                    className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-bold text-palnadu-dark">{client.name}</td>
                    <td className="px-4 py-3 text-palnadu-body">
                      {client.company ? (
                        <span className="inline-flex items-center gap-1">
                          <Building className="h-3 w-3 text-palnadu-secondary" />
                          <span>{client.company}</span>
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="px-4 py-3 text-palnadu-body font-mono">
                      <a href={`mailto:${client.email}`} className="text-palnadu-blue hover:underline">
                        {client.email}
                      </a>
                    </td>
                    <td className="px-4 py-3 text-palnadu-body font-mono">{client.phone || '—'}</td>
                    <td className="px-4 py-3 text-palnadu-secondary">
                      {new Date(client.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 text-right space-x-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(client)}
                        className="h-7 w-7 text-palnadu-blue hover:bg-palnadu-light-blue hover:text-palnadu-blue"
                        title="Edit Client"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget({ id: client.id, name: client.name })}
                        className="h-7 w-7 text-palnadu-error hover:bg-palnadu-error/10 hover:text-palnadu-error"
                        title="Delete Client"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-md rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
              <h2 className="text-sm font-bold text-palnadu-dark">
                {editingClient ? 'Edit Client Details' : 'Add New Client'}
              </h2>
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

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
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
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="client-company" className="text-xs font-semibold text-palnadu-dark block">Company Name</Label>
                  <Input
                    id="client-company"
                    type="text"
                    placeholder="e.g. Acme Corp"
                    value={formData.company}
                    onChange={(e) => setFormData({ ...formData, company: e.target.value })}
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="client-phone" className="text-xs font-semibold text-palnadu-dark block">Phone / WhatsApp</Label>
                  <Input
                    id="client-phone"
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="client-notes" className="text-xs font-semibold text-palnadu-dark block">Internal Notes</Label>
                <Textarea
                  id="client-notes"
                  rows={3}
                  placeholder="Client requirements, payment terms, or engagement history..."
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                />
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
                  {submitting ? 'Saving...' : editingClient ? 'Save Changes' : 'Create Client'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Confirmation Web Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Client?"
        message={deleteTarget ? `Are you sure you want to delete client "${deleteTarget.name}"? This action cannot be undone and will remove associated data.` : ''}
        confirmLabel="Delete Client"
      />
    </div>
  );
}
