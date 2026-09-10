'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Lead } from '@palnadu/types';
import {
  ArrowLeft,
  Mail,
  Phone,
  MessageSquare,
  Building,
  Calendar,
  DollarSign,
  Layers,
  UserCheck,
  CheckCircle2,
  Trash2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800 border-blue-200',
  CONTACTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  DISCOVERY: 'bg-purple-100 text-purple-800 border-purple-200',
  PROPOSAL: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  NEGOTIATION: 'bg-orange-100 text-orange-800 border-orange-200',
  WON: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  LOST: 'bg-red-100 text-red-800 border-red-200',
  NOT_QUALIFIED: 'bg-gray-100 text-gray-800 border-gray-200',
  ON_HOLD: 'bg-gray-100 text-gray-600 border-gray-200',
};

const allStatuses = Object.keys(statusColors);

export default function LeadDetailPage() {
  const { toast } = useToast();
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [converting, setConverting] = useState(false);
  const [convertedSuccess, setConvertedSuccess] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (params.id) {
      api.leads
        .get(params.id as string)
        .then((res: any) => {
          setLead(res.data);
          setNotes(res.data?.notes || '');
        })
        .catch(() => router.push('/leads'))
        .finally(() => setLoading(false));
    }
  }, [params.id, router]);

  const updateStatus = async (status: string) => {
    if (!lead) return;
    setSaving(true);
    try {
      await api.leads.update(lead.id, { status });
      setLead({ ...lead, status: status as Lead['status'] });
    } catch {
      /* handle error */
    }
    setSaving(false);
  };

  const saveNotes = async () => {
    if (!lead) return;
    setSaving(true);
    try {
      await api.leads.update(lead.id, { notes });
      setLead({ ...lead, notes });
      toast.success('Notes saved successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save notes');
    }
    setSaving(false);
  };

  const handleConfirmDelete = async () => {
    if (!lead) return;
    try {
      setDeleting(true);
      await api.leads.delete(lead.id);
      router.push('/leads');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete lead');
    } finally {
      setDeleting(false);
    }
  };

  const convertToClient = async () => {
    if (!lead) return;
    setConverting(true);
    try {
      await api.clients.create({
        name: lead.name,
        company: lead.company || undefined,
        email: lead.email,
        phone: lead.phone || undefined,
        notes: `Converted from Lead ID: ${lead.id}\nOriginal Requirement: ${lead.problemDescription}`,
      });
      await api.leads.update(lead.id, { status: 'WON' });
      setLead({ ...lead, status: 'WON' as Lead['status'] });
      setConvertedSuccess(true);
      toast.success('Inquiry converted to client successfully');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to convert client');
    }
    setConverting(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-xs text-palnadu-secondary">Loading lead dossier...</div>;
  }

  if (!lead) {
    return <div className="p-8 text-center text-xs text-palnadu-secondary">Lead not found.</div>;
  }

  const rawPhone = lead.phone ? lead.phone.replace(/[^0-9]/g, '') : '';

  return (
    <div className="space-y-6">
      {/* Back navigation */}
      <button
        onClick={() => router.push('/leads')}
        className="flex items-center gap-1.5 text-xs font-semibold text-palnadu-secondary hover:text-palnadu-blue transition-colors cursor-pointer"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to all leads</span>
      </button>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-palnadu-border bg-white shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h1 className="text-2xl font-extrabold text-palnadu-dark">{lead.name}</h1>
            <span
              className={cn(
                'rounded-md border px-2.5 py-0.5 text-xs font-bold uppercase tracking-wider',
                statusColors[lead.status],
              )}
            >
              {lead.status.replace(/_/g, ' ')}
            </span>
          </div>
          {lead.company && (
            <p className="text-xs text-palnadu-secondary font-medium flex items-center gap-1">
              <Building className="h-3.5 w-3.5" />
              <span>{lead.company}</span>
            </p>
          )}
        </div>

        {/* Quick Action Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <a
            href={`mailto:${lead.email}?subject=${encodeURIComponent(`Re: Your Project Inquiry - Palnadu.dev`)}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-palnadu-blue text-white text-xs font-semibold hover:bg-[#12487e] shadow-xs"
          >
            <Mail className="h-3.5 w-3.5" />
            <span>Reply via Email</span>
          </a>

          {rawPhone && (
            <a
              href={`https://wa.me/${rawPhone}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 shadow-xs"
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>WhatsApp</span>
            </a>
          )}

          {lead.phone && (
            <a
              href={`tel:${lead.phone}`}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-palnadu-border bg-white text-palnadu-dark text-xs font-semibold hover:bg-palnadu-light-blue shadow-2xs"
            >
              <Phone className="h-3.5 w-3.5" />
              <span>Call</span>
            </a>
          )}

          {!convertedSuccess && lead.status !== 'WON' && (
            <button
              onClick={convertToClient}
              disabled={converting}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md border border-purple-300 bg-purple-50 text-purple-800 text-xs font-semibold hover:bg-purple-100 disabled:opacity-50 cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{converting ? 'Converting...' : 'Convert to Client'}</span>
            </button>
          )}
        </div>
      </div>

      {convertedSuccess && (
        <div className="p-3.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>Lead successfully converted into an active Client record in the database!</span>
        </div>
      )}

      {/* Main Grid: Left Details, Right Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem / Project Description */}
          <div className="rounded-xl border border-palnadu-border bg-white p-5 sm:p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-palnadu-dark uppercase tracking-wider font-mono text-xs mb-3">
              Problem Description & Scope
            </h2>
            <p className="text-sm text-palnadu-body whitespace-pre-wrap leading-relaxed">
              {lead.problemDescription}
            </p>
          </div>

          {/* Requested Services / Additional Info */}
          {lead.additionalInfo && (
            <div className="rounded-xl border border-palnadu-border bg-white p-5 sm:p-6 shadow-2xs">
              <h2 className="text-sm font-bold text-palnadu-dark uppercase tracking-wider font-mono text-xs mb-3">
                Selected Project Types & Tags
              </h2>
              <div className="flex flex-wrap gap-2">
                {lead.additionalInfo.replace('Interested in: ', '').split(', ').map((tag) => (
                  <span
                    key={tag}
                    className="px-2.5 py-1 rounded-md bg-palnadu-light-blue border border-palnadu-blue/20 text-palnadu-blue text-xs font-semibold"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Current Situation (if provided) */}
          {lead.currentSituation && (
            <div className="rounded-xl border border-palnadu-border bg-white p-5 sm:p-6 shadow-2xs">
              <h2 className="text-sm font-bold text-palnadu-dark uppercase tracking-wider font-mono text-xs mb-3">
                Current Business Situation
              </h2>
              <p className="text-sm text-palnadu-body whitespace-pre-wrap leading-relaxed">
                {lead.currentSituation}
              </p>
            </div>
          )}

          {/* Internal Notes */}
          <div className="rounded-xl border border-palnadu-border bg-white p-5 sm:p-6 shadow-2xs">
            <h2 className="text-sm font-bold text-palnadu-dark uppercase tracking-wider font-mono text-xs mb-1">
              Internal Engineering Notes
            </h2>
            <p className="text-xs text-palnadu-secondary mb-3">
              Private audit notes visible only to the internal team.
            </p>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-palnadu-border bg-white p-3 text-xs text-palnadu-body focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
              placeholder="Record discovery call notes, technical evaluation, or budget details..."
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-3 inline-flex h-9 items-center rounded-md bg-palnadu-blue px-4 text-xs font-semibold text-white hover:bg-[#12487e] disabled:opacity-50 cursor-pointer shadow-xs"
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>

        {/* Right Sidebar (1 Col) */}
        <div className="space-y-6">
          {/* Key Parameters Dossier */}
          <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-palnadu-dark mb-4">
              Lead Parameters
            </h3>
            <dl className="space-y-3.5 text-xs">
              <div>
                <dt className="text-palnadu-secondary font-medium">Email Address</dt>
                <dd className="mt-0.5">
                  <a href={`mailto:${lead.email}`} className="text-palnadu-blue font-mono font-semibold hover:underline">
                    {lead.email}
                  </a>
                </dd>
              </div>

              {lead.phone && (
                <div>
                  <dt className="text-palnadu-secondary font-medium">Phone / WhatsApp</dt>
                  <dd className="mt-0.5 font-mono text-palnadu-dark font-semibold">
                    {lead.phone}
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-palnadu-secondary font-medium">Required Service</dt>
                <dd className="mt-0.5 font-semibold text-palnadu-dark flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-palnadu-blue" />
                  <span>{lead.requiredHelp ? lead.requiredHelp.replace(/_/g, ' ') : 'General'}</span>
                </dd>
              </div>

              <div>
                <dt className="text-palnadu-secondary font-medium">Project Stage</dt>
                <dd className="mt-0.5 font-semibold text-palnadu-dark">
                  {lead.projectStage ? lead.projectStage.replace(/_/g, ' ') : 'Just an idea'}
                </dd>
              </div>

              {lead.budget && (
                <div>
                  <dt className="text-palnadu-secondary font-medium">Budget Estimate</dt>
                  <dd className="mt-0.5 font-semibold text-palnadu-dark flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5 text-emerald-600" />
                    <span>{lead.budget}</span>
                  </dd>
                </div>
              )}

              <div>
                <dt className="text-palnadu-secondary font-medium">Submission Timestamp</dt>
                <dd className="mt-0.5 text-palnadu-body flex items-center gap-1">
                  <Calendar className="h-3.5 w-3.5 text-palnadu-secondary" />
                  <span>{new Date(lead.createdAt).toLocaleString()}</span>
                </dd>
              </div>
            </dl>
          </div>

          {/* Status Switcher Card */}
          <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-palnadu-dark mb-3">
              Update Pipeline Status
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {allStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  disabled={saving}
                  className={cn(
                    'rounded-md border px-2.5 py-1 text-[11px] font-semibold transition-all cursor-pointer',
                    lead.status === status
                      ? 'bg-palnadu-blue text-white border-palnadu-blue shadow-xs'
                      : 'bg-white text-palnadu-body border-palnadu-border hover:bg-palnadu-light-blue hover:text-palnadu-blue',
                  )}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Delete Card */}
          <div className="rounded-xl border border-red-200 bg-red-50/50 p-4 shadow-2xs">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-palnadu-error mb-1">
              Delete Lead
            </h3>
            <p className="text-[11px] text-palnadu-secondary mb-3">
              Permanently purge spam or duplicate inquiries from the database.
            </p>
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-white border border-red-200 text-palnadu-error text-xs font-semibold hover:bg-red-50 transition-colors cursor-pointer"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Inquiry</span>
            </button>
          </div>
        </div>
      </div>

      {/* Delete Lead Web Dialog */}
      <ConfirmDialog
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Inquiry?"
        message={lead ? `Are you sure you want to delete the inquiry from "${lead.name}"? This cannot be undone.` : ''}
        confirmLabel="Delete Inquiry"
      />
    </div>
  );
}
