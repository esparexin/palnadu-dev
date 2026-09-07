'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import type { Lead } from '@palnadu/types';
import { ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  NEW: 'bg-blue-100 text-blue-800',
  CONTACTED: 'bg-yellow-100 text-yellow-800',
  DISCOVERY: 'bg-purple-100 text-purple-800',
  PROPOSAL: 'bg-indigo-100 text-indigo-800',
  NEGOTIATION: 'bg-orange-100 text-orange-800',
  WON: 'bg-green-100 text-green-800',
  LOST: 'bg-red-100 text-red-800',
  NOT_QUALIFIED: 'bg-gray-100 text-gray-800',
  ON_HOLD: 'bg-gray-100 text-gray-600',
};

const allStatuses = Object.keys(statusColors);

export default function LeadDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [lead, setLead] = useState<Lead | null>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

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
    } catch {
      /* handle error */
    }
    setSaving(false);
  };

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Loading...</div>;
  }

  if (!lead) {
    return <div className="p-8 text-center text-muted-foreground">Lead not found.</div>;
  }

  return (
    <div className="space-y-6">
      <button
        onClick={() => router.push('/leads')}
        className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to leads
      </button>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold">{lead.name}</h1>
          {lead.company && <p className="text-muted-foreground">{lead.company}</p>}
        </div>
        <span
          className={cn(
            'rounded-full px-3 py-1 text-sm font-medium',
            statusColors[lead.status],
          )}
        >
          {lead.status.replace(/_/g, ' ')}
        </span>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lead Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Problem Description</h2>
            <p className="text-muted-foreground whitespace-pre-wrap">{lead.problemDescription}</p>
          </div>

          {lead.currentSituation && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Current Situation</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{lead.currentSituation}</p>
            </div>
          )}

          {lead.additionalInfo && (
            <div className="rounded-lg border bg-card p-6">
              <h2 className="text-lg font-semibold mb-4">Additional Information</h2>
              <p className="text-muted-foreground whitespace-pre-wrap">{lead.additionalInfo}</p>
            </div>
          )}

          {/* Notes */}
          <div className="rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold mb-4">Internal Notes</h2>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={4}
              className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              placeholder="Add internal notes about this lead..."
            />
            <button
              onClick={saveNotes}
              disabled={saving}
              className="mt-3 inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save Notes'}
            </button>
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-semibold mb-4">Contact Details</h3>
            <dl className="space-y-3 text-sm">
              <div>
                <dt className="text-muted-foreground">Email</dt>
                <dd>
                  <a href={`mailto:${lead.email}`} className="hover:underline">
                    {lead.email}
                  </a>
                </dd>
              </div>
              {lead.phone && (
                <div>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{lead.phone}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Project Stage</dt>
                <dd>{lead.projectStage.replace(/_/g, ' ')}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Help Needed</dt>
                <dd>{lead.requiredHelp.replace(/_/g, ' ')}</dd>
              </div>
              {lead.budget && (
                <div>
                  <dt className="text-muted-foreground">Budget</dt>
                  <dd>{lead.budget}</dd>
                </div>
              )}
              <div>
                <dt className="text-muted-foreground">Submitted</dt>
                <dd>{new Date(lead.createdAt).toLocaleString()}</dd>
              </div>
            </dl>
          </div>

          <div className="rounded-lg border bg-card p-6">
            <h3 className="text-sm font-semibold mb-4">Update Status</h3>
            <div className="flex flex-wrap gap-2">
              {allStatuses.map((status) => (
                <button
                  key={status}
                  onClick={() => updateStatus(status)}
                  disabled={saving || lead.status === status}
                  className={cn(
                    'rounded-full px-3 py-1 text-xs font-medium transition-opacity',
                    statusColors[status],
                    lead.status === status ? 'ring-2 ring-ring' : 'opacity-60 hover:opacity-100',
                  )}
                >
                  {status.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
