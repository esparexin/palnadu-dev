'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Lead } from '@palnadu/types';
import { Search } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { statusColors } from '@/components/leads/types';
import { LeadsTable } from '@/components/leads/leads-table';

export default function LeadsPage() {
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    api.leads
      .list(params)
      .then((res: any) => setLeads(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, statusFilter]);

  const totalLeads = leads.length;
  const newLeadsCount = leads.filter((l) => l.status === 'NEW').length;
  const inPipelineCount = leads.filter((l) =>
    ['CONTACTED', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION'].includes(l.status),
  ).length;
  const wonCount = leads.filter((l) => l.status === 'WON').length;

  const confirmDeleteLead = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.leads.delete(deleteTarget.id);
      setLeads((prev) => prev.filter((l) => l.id !== deleteTarget.id));
      setDeleteTarget(null);
      toast.success('Inquiry deleted successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete lead');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Leads & Inquiries</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Manage inbound project inquiries, client pipelines, and contact submissions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-sm">
          <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Total Leads</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading ? '—' : totalLeads}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-sm">
          <p className="text-xs font-semibold text-palnadu-blue uppercase tracking-wider">New / Unread</p>
          <p className="text-xl font-bold text-palnadu-blue mt-1">{loading ? '—' : newLeadsCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-sm">
          <p className="text-xs font-semibold text-palnadu-teal uppercase tracking-wider">In Pipeline</p>
          <p className="text-xl font-bold text-palnadu-teal mt-1">{loading ? '—' : inPipelineCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-sm">
          <p className="text-xs font-semibold text-palnadu-teal uppercase tracking-wider">Won / Converted</p>
          <p className="text-xl font-bold text-palnadu-teal mt-1">{loading ? '—' : wonCount}</p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-palnadu-secondary" />
          <Input
            type="text"
            placeholder="Search by name, email, company..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer w-full sm:w-auto"
          >
            <option value="">All Statuses</option>
            {Object.keys(statusColors).map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
          {(search || statusFilter) && (
            <Button
              variant="link"
              size="sm"
              onClick={() => {
                setSearch('');
                setStatusFilter('');
              }}
              className="text-xs text-palnadu-secondary hover:text-palnadu-dark px-2 h-auto"
            >
              Reset
            </Button>
          )}
        </div>
      </div>

      <LeadsTable leads={leads} loading={loading} onDeleteClick={setDeleteTarget} />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteLead}
        loading={deleting}
        title="Delete Inquiry?"
        message={deleteTarget ? `Are you sure you want to delete the inquiry from "${deleteTarget.name}"?` : ''}
        confirmLabel="Delete Inquiry"
      />
    </div>
  );
}
