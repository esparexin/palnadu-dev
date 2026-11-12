'use client';

import React from 'react';
import { History } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeminiStatusBadge } from './gemini-status-badge';
import type { GeminiKeyAuditEntry } from './types';

interface AuditTableProps {
  entries: GeminiKeyAuditEntry[];
  onRefresh: () => void;
}

export function GeminiAuditTable({ entries, onRefresh }: AuditTableProps) {
  return (
    <div className="rounded-xl border border-palnadu-border bg-white shadow-sm overflow-hidden space-y-3 p-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-palnadu-blue" />
          <h2 className="text-sm font-bold text-palnadu-dark">
            Gemini API Key Audit Trail
          </h2>
        </div>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          className="text-xs text-palnadu-blue cursor-pointer"
        >
          Refresh Logs
        </Button>
      </div>

      <p className="text-xs text-palnadu-secondary">
        Immutable record of key verification probes and activation events. Plaintext secrets are never recorded.
      </p>

      {entries.length === 0 ? (
        <div className="py-8 text-center text-xs text-palnadu-secondary">
          No key verification or activation events recorded yet.
        </div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-palnadu-border text-palnadu-secondary">
                <th className="py-2 px-3 font-semibold">Timestamp</th>
                <th className="py-2 px-3 font-semibold">Action</th>
                <th className="py-2 px-3 font-semibold">Actor</th>
                <th className="py-2 px-3 font-semibold">Masked Key</th>
                <th className="py-2 px-3 font-semibold">Status</th>
                <th className="py-2 px-3 font-semibold">Project / Reason</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-palnadu-border/60">
              {entries.map((entry) => (
                <tr key={entry.id} className="hover:bg-palnadu-off-white/40">
                  <td className="py-2.5 px-3 text-palnadu-secondary font-mono whitespace-nowrap">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-palnadu-dark whitespace-nowrap">
                    {entry.action.replace(/_/g, ' ')}
                  </td>
                  <td className="py-2.5 px-3 text-palnadu-dark whitespace-nowrap">
                    {entry.actor}
                  </td>
                  <td className="py-2.5 px-3 font-mono text-palnadu-secondary whitespace-nowrap">
                    {entry.maskedKey}
                  </td>
                  <td className="py-2.5 px-3 whitespace-nowrap">
                    <GeminiStatusBadge status={entry.status} size="sm" />
                  </td>
                  <td
                    className="py-2.5 px-3 text-palnadu-body max-w-xs truncate"
                    title={entry.reason || ''}
                  >
                    {entry.verificationCode ? `[${entry.verificationCode}] ` : ''}
                    {entry.projectId ? `[Project: ${entry.projectId}] ` : ''}
                    {entry.reason || 'N/A'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
