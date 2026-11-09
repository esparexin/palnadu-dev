'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Lead } from '@palnadu/types';
import { ArrowLeft } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { LeadDetailHeader } from '@/components/leads/lead-detail-header';
import { LeadDetailSidebar } from '@/components/leads/lead-detail-sidebar';

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

  return (
    <div className="space-y-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push('/leads')}
        className="flex items-center gap-1.5 text-xs font-semibold text-palnadu-secondary hover:text-palnadu-blue transition-colors p-0 h-auto"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        <span>Back to all leads</span>
      </Button>

      <LeadDetailHeader
        lead={lead}
        convertedSuccess={convertedSuccess}
        converting={converting}
        onConvertToClient={convertToClient}
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-xl border border-palnadu-border bg-white p-5 sm:p-6 shadow-sm">
            <h2 className="font-bold text-palnadu-dark uppercase tracking-wider font-mono text-xs mb-3">
              Problem Description & Scope
            </h2>
            <p className="text-sm text-palnadu-body whitespace-pre-wrap leading-relaxed">
              {lead.problemDescription}
            </p>
          </div>

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
            <Button size="sm" onClick={saveNotes} disabled={saving} className="mt-3 h-9">
              {saving ? 'Saving...' : 'Save Notes'}
            </Button>
          </div>
        </div>

        <LeadDetailSidebar
          lead={lead}
          saving={saving}
          onUpdateStatus={updateStatus}
          onDeleteClick={() => setConfirmDeleteOpen(true)}
        />
      </div>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onCancel={() => setConfirmDeleteOpen(false)}
        onConfirm={handleConfirmDelete}
        loading={deleting}
        title="Delete Inquiry?"
        message={lead ? `Are you sure you want to delete the inquiry from "${lead.name}"?` : ''}
        confirmLabel="Delete Inquiry"
      />
    </div>
  );
}
