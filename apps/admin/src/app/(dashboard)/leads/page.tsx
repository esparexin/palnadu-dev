'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { api } from '@/lib/api';
import type { Lead } from '@palnadu/types';
import { Mail, Phone, MessageSquare, ArrowRight, Search, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  NEW: 'bg-palnadu-blue/10 text-palnadu-blue border-palnadu-blue/20',
  CONTACTED: 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/20',
  DISCOVERY: 'bg-palnadu-light-blue text-palnadu-blue border-palnadu-blue/20',
  PROPOSAL: 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/20',
  NEGOTIATION: 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/20',
  WON: 'bg-palnadu-teal/15 text-palnadu-teal border-palnadu-teal/30',
  LOST: 'bg-palnadu-error/10 text-palnadu-error border-palnadu-error/20',
  NOT_QUALIFIED: 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border',
  ON_HOLD: 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border',
};

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
  const inPipelineCount = leads.filter((l) => ['CONTACTED', 'DISCOVERY', 'PROPOSAL', 'NEGOTIATION'].includes(l.status)).length;
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
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Leads & Inquiries</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">Manage inbound project inquiries, client pipelines, and contact submissions.</p>
        </div>
      </div>

      {/* Summary KPI Cards */}
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

      {/* Filter & Search Toolbar */}
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

      {/* Detailed Leads Table */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
                <th className="px-4 py-3">Lead / Company</th>
                <th className="px-4 py-3">Contact</th>
                <th className="px-4 py-3">Requirement & Stage</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Date</th>
                <th className="px-4 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-palnadu-secondary">
                    Loading leads...
                  </td>
                </tr>
              ) : leads.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-palnadu-secondary">
                    No inquiries found matching current filters.
                  </td>
                </tr>
              ) : (
                leads.map((lead) => {
                  const rawPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';
                  return (
                    <tr key={lead.id} className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors">
                      {/* Name & Company */}
                      <td className="px-4 py-3">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="font-bold text-palnadu-dark hover:text-palnadu-blue transition-colors text-xs flex items-center gap-1.5"
                        >
                          <span>{lead.name}</span>
                        </Link>
                        {lead.company ? (
                          <span className="inline-block mt-0.5 text-xs text-palnadu-secondary font-medium">
                            {lead.company}
                          </span>
                        ) : (
                          <span className="text-xs text-palnadu-secondary/60 italic">Individual</span>
                        )}
                      </td>

                      {/* Contact Info */}
                      <td className="px-4 py-3 space-y-1">
                        <a
                          href={`mailto:${lead.email}`}
                          className="text-palnadu-body hover:text-palnadu-blue flex items-center gap-1 font-mono text-xs"
                          title="Click to email"
                        >
                          <Mail className="h-3 w-3 text-palnadu-secondary shrink-0" />
                          <span className="truncate max-w-[150px]">{lead.email}</span>
                        </a>
                        {lead.phone && (
                          <div className="flex items-center gap-2 text-xs">
                            <a
                              href={`tel:${lead.phone}`}
                              className="text-palnadu-body hover:text-palnadu-blue flex items-center gap-1 font-mono"
                              title="Call phone"
                            >
                              <Phone className="h-3 w-3 text-palnadu-secondary shrink-0" />
                              <span>{lead.phone}</span>
                            </a>
                            {rawPhone && (
                              <a
                                href={`https://wa.me/${rawPhone}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-palnadu-teal hover:text-palnadu-teal-dark flex items-center gap-0.5 font-medium text-xs"
                                title="Chat on WhatsApp"
                              >
                                <MessageSquare className="h-2.5 w-2.5" />
                                <span>WA</span>
                              </a>
                            )}
                          </div>
                        )}
                      </td>

                      {/* Requirement & Stage */}
                      <td className="px-4 py-3">
                        <div className="font-semibold text-palnadu-dark">
                          {lead.requiredHelp ? lead.requiredHelp.replace(/_/g, ' ') : 'General'}
                        </div>
                        <span className="text-xs text-palnadu-secondary">
                          Stage: {lead.projectStage ? lead.projectStage.replace(/_/g, ' ') : 'Just an idea'}
                        </span>
                      </td>

                      {/* Budget */}
                      <td className="px-4 py-3">
                        {lead.budget ? (
                          <span className="inline-block px-2 py-0.5 rounded-md bg-palnadu-off-white border border-palnadu-border text-xs font-semibold text-palnadu-dark">
                            {lead.budget}
                          </span>
                        ) : (
                          <span className="text-palnadu-secondary/60 italic text-xs">Not specified</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-4 py-3">
                        <span
                          className={cn(
                            'inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                            statusColors[lead.status] || 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border',
                          )}
                        >
                          {lead.status.replace(/_/g, ' ')}
                        </span>
                      </td>

                      {/* Date */}
                      <td className="px-4 py-3 text-palnadu-secondary">
                        <div>{new Date(lead.createdAt).toLocaleDateString()}</div>
                        <div className="text-xs text-palnadu-secondary/70">
                          {new Date(lead.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </td>

                      {/* Action */}
                      <td className="px-4 py-3 text-right space-x-1">
                        <Link
                          href={`/leads/${lead.id}`}
                          className="inline-flex items-center gap-1 rounded-md px-2.5 py-1 text-xs font-semibold text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
                        >
                          <span>Review</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteTarget({ id: lead.id, name: lead.name })}
                          className="h-7 w-7 text-palnadu-error hover:bg-palnadu-error/10 hover:text-palnadu-error"
                          title="Delete Lead"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
      {/* Delete Lead Web Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteLead}
        loading={deleting}
        title="Delete Inquiry?"
        message={deleteTarget ? `Are you sure you want to delete the inquiry from "${deleteTarget.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete Inquiry"
      />
    </div>
  );
}
