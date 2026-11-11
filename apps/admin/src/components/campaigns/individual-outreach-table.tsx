'use client';

import { Send, CheckCircle2, Eye, AlertCircle, Clock, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { IndividualOutreachMessageItem } from './types';

interface IndividualOutreachTableProps {
  messages: IndividualOutreachMessageItem[];
  loading: boolean;
  onOpenOutreachModal: () => void;
  onReconcileMessage?: (_id: string, _confirmedStatus: 'DELIVERED' | 'FAILED') => Promise<void>;
}

export function IndividualOutreachTable({
  messages,
  loading,
  onOpenOutreachModal,
  onReconcileMessage,
}: IndividualOutreachTableProps) {
  if (loading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-palnadu-border bg-palnadu-white">
        <span className="text-xs text-palnadu-secondary">Loading individual outreach messages...</span>
      </div>
    );
  }

  if (messages.length === 0) {
    return (
      <div className="flex h-56 flex-col items-center justify-center rounded-xl border border-palnadu-border bg-palnadu-white p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-palnadu-light-blue text-palnadu-blue mb-3">
          <Send className="h-5 w-5" />
        </div>
        <p className="text-sm font-bold text-palnadu-dark">No individual messages sent yet</p>
        <p className="mt-1 text-xs text-palnadu-secondary max-w-sm">
          Send a direct, personalized WhatsApp message to a local business prospect with verified consent.
        </p>
        <Button
          size="sm"
          onClick={onOpenOutreachModal}
          className="mt-4 h-9 gap-1.5 bg-palnadu-teal hover:bg-palnadu-teal-dark text-white text-xs cursor-pointer"
        >
          <Send className="h-4 w-4" />
          <span>Send Direct Message</span>
        </Button>
      </div>
    );
  }

  const getStatusBadge = (m: IndividualOutreachMessageItem) => {
    switch (m.status) {
      case 'READ':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-palnadu-light-blue px-2 py-0.5 text-xs font-semibold text-palnadu-blue">
            <Eye className="h-3 w-3" />
            <span>Read</span>
          </span>
        );
      case 'DELIVERED':
        if (m.isReconciled) {
          return (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-palnadu-teal/15 px-2 py-0.5 text-xs font-semibold text-palnadu-teal-dark cursor-help"
              title={`Manually confirmed by admin (${m.reconciledBy || 'Admin'})${m.reconciledAt ? ` at ${new Date(m.reconciledAt).toLocaleString()}` : ''}${m.reconciliationNotes ? `: ${m.reconciliationNotes}` : ''}`}
            >
              <CheckCircle2 className="h-3 w-3" />
              <span>Delivered (Manual)</span>
            </span>
          );
        }
        return (
          <span
            className="inline-flex items-center gap-1 rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-semibold text-palnadu-teal"
            title="Confirmed delivered by Meta WhatsApp webhook"
          >
            <CheckCircle2 className="h-3 w-3" />
            <span>Delivered</span>
          </span>
        );
      case 'RECONCILIATION_PENDING':
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-semibold text-palnadu-warning">
            <Clock className="h-3 w-3" />
            <span>Needs Reconciliation</span>
          </span>
        );
      case 'FAILED':
        if (m.isReconciled) {
          return (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-palnadu-error/15 px-2 py-0.5 text-xs font-semibold text-palnadu-error cursor-help"
              title={`Manually marked failed by admin (${m.reconciledBy || 'Admin'})${m.reconciledAt ? ` at ${new Date(m.reconciledAt).toLocaleString()}` : ''}`}
            >
              <AlertCircle className="h-3 w-3" />
              <span>Failed (Manual)</span>
            </span>
          );
        }
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-palnadu-error/10 px-2 py-0.5 text-xs font-semibold text-palnadu-error">
            <AlertCircle className="h-3 w-3" />
            <span>Failed</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-palnadu-off-white px-2 py-0.5 text-xs font-semibold text-palnadu-secondary">
            <Send className="h-3 w-3" />
            <span>Sent</span>
          </span>
        );
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-palnadu-border bg-palnadu-white shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="border-b border-palnadu-border bg-palnadu-off-white text-palnadu-secondary">
            <tr>
              <th className="px-4 py-3 font-semibold">Recipient</th>
              <th className="px-4 py-3 font-semibold">Template</th>
              <th className="px-4 py-3 font-semibold">Consent Verification</th>
              <th className="px-4 py-3 font-semibold">Status</th>
              <th className="px-4 py-3 font-semibold text-right">Sent Time</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-palnadu-border">
            {messages.map((m) => (
              <tr key={m.id} className="hover:bg-palnadu-off-white/40">
                <td className="px-4 py-3">
                  <div className="font-mono font-medium text-palnadu-dark">{m.to}</div>
                  {m.businessName && <div className="text-xs text-palnadu-secondary">{m.businessName}</div>}
                </td>
                <td className="px-4 py-3 text-palnadu-body">
                  <div className="font-medium text-palnadu-dark">{m.templateName}</div>
                  <div className="text-xs text-palnadu-secondary">{m.languageCode}</div>
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-1 text-palnadu-teal font-medium">
                    <ShieldCheck className="h-3.5 w-3.5" />
                    <span>{m.consentType?.replace(/_/g, ' ') || 'Verified Opt-In'}</span>
                  </div>
                  {m.consentEvidenceRef && (
                    <div className="font-mono text-xs text-palnadu-secondary">{m.consentEvidenceRef}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <div>{getStatusBadge(m)}</div>
                  {m.status === 'RECONCILIATION_PENDING' && onReconcileMessage && (
                    <div className="mt-1.5 flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => onReconcileMessage(m.id, 'DELIVERED')}
                        className="rounded border border-palnadu-teal/30 bg-palnadu-teal/10 px-1.5 py-0.5 text-xs font-semibold text-palnadu-teal hover:bg-palnadu-teal/20 cursor-pointer"
                        title="Confirm message was delivered to recipient"
                      >
                        Confirm Delivered
                      </button>
                      <button
                        type="button"
                        onClick={() => onReconcileMessage(m.id, 'FAILED')}
                        className="rounded border border-palnadu-error/30 bg-palnadu-error/10 px-1.5 py-0.5 text-xs font-semibold text-palnadu-error hover:bg-palnadu-error/20 cursor-pointer"
                        title="Mark message as undelivered / failed"
                      >
                        Mark Failed
                      </button>
                    </div>
                  )}
                  {m.errorMessage && (
                    <div className="mt-0.5 text-xs text-palnadu-error line-clamp-1" title={m.errorMessage}>
                      {m.errorMessage}
                    </div>
                  )}
                </td>
                <td className="px-4 py-3 text-right font-mono text-palnadu-secondary">
                  {new Date(m.createdAt).toLocaleString(undefined, {
                    month: 'short',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

