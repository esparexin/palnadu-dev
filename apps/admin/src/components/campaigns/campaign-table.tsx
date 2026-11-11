'use client';

import { Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { CampaignSummary } from './types';

interface CampaignTableProps {
  campaigns: CampaignSummary[];
  loading: boolean;
  onDispatch: (_campaign: CampaignSummary) => void;
  onPause: (_campaign: CampaignSummary) => void;
  actionLoadingId: string | null;
}

export function CampaignTable({
  campaigns,
  loading,
  onDispatch,
  onPause,
  actionLoadingId,
}: CampaignTableProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-lg border border-palnadu-border bg-palnadu-white">
        <span className="text-xs text-palnadu-secondary">Loading WhatsApp campaigns...</span>
      </div>
    );
  }

  if (campaigns.length === 0) {
    return (
      <div className="flex h-48 flex-col items-center justify-center rounded-lg border border-palnadu-border bg-palnadu-white">
        <p className="text-xs font-medium text-palnadu-dark">No campaigns found</p>
        <p className="mt-1 text-xs text-palnadu-secondary">Create your first outreach campaign to begin.</p>
      </div>
    );
  }

  const getStatusBadge = (status: CampaignSummary['status']) => {
    switch (status) {
      case 'RUNNING':
        return <span className="inline-flex items-center rounded-full bg-palnadu-light-blue px-2 py-0.5 text-xs font-medium text-palnadu-blue">Running</span>;
      case 'COMPLETED':
        return <span className="inline-flex items-center rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-medium text-palnadu-teal">Completed</span>;
      case 'PAUSED':
        return <span className="inline-flex items-center rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-medium text-palnadu-body">Paused</span>;
      case 'FAILED':
        return <span className="inline-flex items-center rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-medium text-palnadu-error">Failed</span>;
      default:
        return <span className="inline-flex items-center rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-medium text-palnadu-secondary">Draft</span>;
    }
  };

  return (
    <div className="overflow-hidden rounded-lg border border-palnadu-border bg-palnadu-white">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-palnadu-border bg-palnadu-off-white text-palnadu-secondary">
            <tr>
              <th className="px-4 py-3 font-medium">Campaign</th>
              <th className="px-4 py-3 font-medium">Template</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3 font-medium">Sent</th>
              <th className="px-4 py-3 font-medium">Delivered</th>
              <th className="px-4 py-3 font-medium">Read</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-palnadu-border">
            {campaigns.map((c) => {
              const isActioning = actionLoadingId === c.id;
              const canDispatch = c.status === 'DRAFT' || c.status === 'PAUSED' || c.status === 'SCHEDULED';
              const canPause = c.status === 'RUNNING';

              return (
                <tr key={c.id} className="hover:bg-palnadu-off-white/40">
                  <td className="px-4 py-3 font-medium text-palnadu-dark">
                    <div>{c.name}</div>
                    {c.targetAudience && (
                      <div className="text-xs text-palnadu-secondary">{c.targetAudience}</div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-palnadu-body">
                    <div>{c.templateName}</div>
                    <div className="text-xs text-palnadu-secondary">{c.languageCode}</div>
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(c.status)}</td>
                  <td className="px-4 py-3 font-semibold text-palnadu-dark">{c.sentCount}</td>
                  <td className="px-4 py-3 text-palnadu-teal">{c.deliveredCount}</td>
                  <td className="px-4 py-3 text-palnadu-blue">{c.readCount}</td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {canDispatch && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isActioning}
                          onClick={() => onDispatch(c)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Play className="h-3.5 w-3.5 text-palnadu-teal" />
                          <span>Dispatch</span>
                        </Button>
                      )}
                      {canPause && (
                        <Button
                          variant="outline"
                          size="sm"
                          disabled={isActioning}
                          onClick={() => onPause(c)}
                          className="h-8 gap-1 text-xs"
                        >
                          <Pause className="h-3.5 w-3.5 text-palnadu-secondary" />
                          <span>Pause</span>
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
