'use client';

import React from 'react';
import { Clock, Loader2, RefreshCw, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeminiStatusBadge } from './gemini-status-badge';
import type { GeminiPendingCandidateSummary } from './types';

interface GeminiPendingBannerProps {
  pending: GeminiPendingCandidateSummary;
  retrying: boolean;
  onRetry: (_activate: boolean) => void;
}

export function GeminiPendingBanner({
  pending,
  retrying,
  onRetry,
}: GeminiPendingBannerProps) {
  return (
    <div className="rounded-xl border border-palnadu-warning/40 bg-palnadu-warning/10 p-5 space-y-3 text-xs">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-palnadu-warning shrink-0" />
          <span className="font-bold text-palnadu-dark">
            Pending Candidate Key Preserved Safely
          </span>
          <GeminiStatusBadge status={pending.status} />
        </div>
        <span className="font-mono text-palnadu-secondary">{pending.maskedKey}</span>
      </div>

      <p className="text-palnadu-body">
        The submitted key could not be activated yet because Gemini returned a temporary failure (
        <span className="font-mono font-semibold">{pending.lastFailureCode}</span>). Your existing
        active credential remains untouched, and this candidate is encrypted as{' '}
        <span className="font-mono font-semibold">PENDING_VERIFICATION</span>.
      </p>

      <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
        <div className="text-palnadu-secondary space-x-3">
          <span>Model: {pending.primaryModel}</span>
          <span>Attempts: {pending.attemptCount}</span>
          <span>Last checked: {new Date(pending.lastCheckedAt).toLocaleString()}</span>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onRetry(false)}
            disabled={retrying}
            className="cursor-pointer"
          >
            {retrying ? (
              <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            )}
            <span>Retry Verification</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={() => onRetry(true)}
            disabled={retrying}
            className="cursor-pointer"
          >
            <CheckCircle2 className="h-3.5 w-3.5 mr-1.5" />
            <span>Retry & Activate</span>
          </Button>
        </div>
      </div>
    </div>
  );
}

