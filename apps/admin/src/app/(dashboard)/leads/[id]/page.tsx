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
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';

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
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/leads')}
        className="flex items-center gap-1.5 text-xs font-semibold text-palnadu-secondary hover:text-palnadu-blue transition-colors p-0 h-auto"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to all leads</span>
      </Button>

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-xl border border-palnadu-border bg-white shadow-sm">
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
          <Button asChild size="sm" className="gap-1.5 font-semibold text-xs h-8">
            <a
              href={`mailto:${lead.email}?subject=${encodeURIComponent(`Re: Your Project Inquiry - Palnadu.dev`)}`}
            >
              <Mail className="h-3.5 w-3.5" />
              <span>Reply via Email</span>
            </a>
          </Button>

          {rawPhone && (
            <Button asChild variant="secondary" size="sm" className="gap-1.5 font-semibold text-xs h-8">
              <a
                href={`https://wa.me/${rawPhone}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <MessageSquare className="h-3.5 w-3.5" />
                <span>WhatsApp</span>
              </a>
            </Button>
          )}

          {lead.phone && (
            <Button asChild variant="outline" size="sm" className="gap-1.5 font-semibold text-xs h-8">
              <a href={`tel:${lead.phone}`}>
                <Phone className="h-3.5 w-3.5" />
                <span>Call</span>
              </a>
            </Button>
          )}

          {!convertedSuccess && lead.status !== 'WON' && (
            <Button
              variant="outline"
              size="sm"
              onClick={convertToClient}
              disabled={converting}
              className="gap-1.5 font-semibold text-xs h-8 border-palnadu-blue/30 text-palnadu-blue hover:bg-palnadu-light-blue"
            >
              <UserCheck className="h-3.5 w-3.5" />
              <span>{converting ? 'Converting...' : 'Convert to Client'}</span>
            </Button>
          )}
        </div>
      </div>

      {convertedSuccess && (
        <div className="p-3.5 rounded-lg bg-palnadu-teal/10 border border-palnadu-teal/20 text-palnadu-teal text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-palnadu-teal shrink-0" />
          <span>Lead successfully converted into an active Client record in the database!</span>
        </div>
      )}

      {/* Main Grid: Left Details, Right Sidebar */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left Column (2 Cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Problem / Project Description */}
          <div className="rounded-xl border border-palnadu-border bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-palnadu-dark uppercase tracking-wider font-mono text-xs mb-3">
              Problem Description & Scope
            </h2>
            <p className="text-sm text-palnadu-body whitespace-pre-wrap leading-relaxed">
              {lead.problemDescription}
            </p>
          </div>

          {/* Requested Services / Additional Info */}
          {lead.additionalInfo && (
            <div className="rounded-xl border border-palnadu-border bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="font-bold text-palnadu-dark uppercase tracking-wider font-mono text-xs mb-3">
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
            <div className="rounded-xl border border-palnadu-border bg-white p-5 sm:p-6 shadow-sm">
              <h2 className="font-bold text-palnadu-dark uppercase tracking-wider font-mono text-xs mb-3">
                Current Business Situation
              </h2>
              <p className="text-sm text-palnadu-body whitespace-pre-wrap leading-relaxed">
                {lead.currentSituation}
              </p>
            </div>
          )}

          {/* Internal Notes */}
          <div className="rounded-xl border border-palnadu-border bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-palnadu-dark uppercase tracking-wider font-mono text-xs mb-1">
              Internal Engineering Notes
            </h2>
            <p className="text-xs text-palnadu-secondary mb-3">
              Private audit notes visible only to the internal team.
            </p>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              placeholder="Record discovery call notes, technical evaluation, or budget details..."
            />
            <Button
              size="sm"
              onClick={saveNotes}
              disabled={saving}
              className="mt-3 h-9"
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>

        {/* Right Sidebar (1 Col) */}
        <div className="space-y-6">
          {/* Key Parameters Dossier */}
          <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-sm">
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
                    <DollarSign className="h-3.5 w-3.5 text-palnadu-teal" />
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
          <div className="rounded-xl border border-palnadu-border bg-white p-5 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-palnadu-dark mb-3">
              Update Pipeline Status
            </h3>
            <div className="flex flex-wrap gap-1.5">
              {allStatuses.map((status) => (
                <Button
                  key={status}
                  size="sm"
                  variant={lead.status === status ? 'default' : 'outline'}
                  onClick={() => updateStatus(status)}
                  disabled={saving}
                  className="h-7 px-2.5 text-xs font-semibold"
                >
                  {status.replace(/_/g, ' ')}
                </Button>
              ))}
            </div>
          </div>

          {/* Delete Card */}
          <div className="rounded-xl border border-palnadu-error/20 bg-palnadu-error/5 p-4 shadow-sm">
            <h3 className="text-xs font-bold uppercase tracking-wider font-mono text-palnadu-error mb-1">
              Delete Lead
            </h3>
            <p className="text-xs text-palnadu-secondary mb-3">
              Permanently purge spam or duplicate inquiries from the database.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setConfirmDeleteOpen(true)}
              className="gap-1.5 text-xs h-8"
            >
              <Trash2 className="h-3.5 w-3.5" />
              <span>Delete Inquiry</span>
            </Button>
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
