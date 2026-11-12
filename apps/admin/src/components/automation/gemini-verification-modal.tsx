'use client';

import React from 'react';
import {
  X,
  ShieldCheck,
  AlertCircle,
  Loader2,
  CheckCircle2,
  RefreshCw,
  Clock,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeminiStatusBadge } from './gemini-status-badge';
import { GeminiModelProbeList } from './gemini-model-probe-list';
import type { GeminiKeyVerificationResult } from './types';

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  result: GeminiKeyVerificationResult | null;
  activating: boolean;
  retrying: boolean;
  onRetryVerification: () => void;
  onConfirmActivate: () => void;
}

export function GeminiVerificationModal({
  open,
  onClose,
  result,
  activating,
  retrying,
  onRetryVerification,
  onConfirmActivate,
}: VerificationModalProps) {
  if (!open || !result) return null;

  const canActivate = result.isValid && result.isUsableForGeneration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-palnadu-dark/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-xl bg-white border border-palnadu-border shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-palnadu-blue" />
            <h3 className="text-sm font-bold text-palnadu-dark">
              Gemini API Key Verification Diagnostics
            </h3>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            aria-label="Close modal"
            className="h-8 w-8 p-0 cursor-pointer"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex flex-wrap items-center justify-between gap-2 p-3 rounded-lg bg-palnadu-off-white/50 border border-palnadu-border">
            <div>
              <p className="font-semibold text-palnadu-dark">Candidate API Key</p>
              <p className="font-mono text-palnadu-secondary mt-0.5">{result.maskedKey}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GeminiStatusBadge status={result.authenticationStatus} />
              <GeminiStatusBadge status={result.verificationStatus} />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="p-3 rounded-lg border border-palnadu-border space-y-1">
              <p className="text-palnadu-secondary font-medium">Google Cloud Project ID</p>
              <p className="font-mono font-bold text-palnadu-dark text-xs">
                {result.project.id || 'Project Not Identified'}
              </p>
              <p className="text-palnadu-secondary">Status: {result.project.status}</p>
            </div>

            <div className="p-3 rounded-lg border border-palnadu-border space-y-1">
              <p className="text-palnadu-secondary font-medium">Google Account Identity</p>
              <p className="font-bold text-palnadu-dark text-xs">
                {result.account.email || 'Account Identity Unavailable'}
              </p>
              <p className="text-palnadu-secondary">Status: {result.account.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-2.5 rounded-lg border border-palnadu-border">
              <span className="text-palnadu-secondary block">Authentication</span>
              <span className="font-bold text-palnadu-dark">{result.authenticationStatus}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-palnadu-border">
              <span className="text-palnadu-secondary block">Quota & Billing</span>
              <span className="font-bold text-palnadu-dark">{result.quota.status}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-palnadu-border">
              <span className="text-palnadu-secondary block">API Permissions</span>
              <span className="font-bold text-palnadu-dark">{result.permissions.status}</span>
            </div>
          </div>

          <GeminiModelProbeList
            tested={result.models.tested}
            supportedCount={result.models.supportedCount}
            fallbackUsed={result.fallbackUsed}
            activeUsableModel={result.activeUsableModel}
          />

          {canActivate && result.fallbackUsed && result.activeUsableModel && (
            <div className="p-3 rounded-lg bg-palnadu-blue/10 border border-palnadu-blue/30 text-palnadu-blue flex items-start gap-2">
              <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Fallback Model Succeeded</p>
                <p className="mt-0.5">
                  Primary model experienced high demand, and fallback model{' '}
                  <span className="font-mono font-semibold">{result.activeUsableModel}</span>{' '}
                  passed live generation verification.
                </p>
              </div>
            </div>
          )}

          {!canActivate && (
            <div
              className={
                result.isTemporary
                  ? 'p-3 rounded-lg bg-palnadu-warning/10 border border-palnadu-warning/30 text-palnadu-warning flex items-start gap-2'
                  : 'p-3 rounded-lg bg-palnadu-error/10 border border-palnadu-error/30 text-palnadu-error flex items-start gap-2'
              }
            >
              {result.isTemporary ? (
                <Clock className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <div className="space-y-1">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold">
                    {result.isTemporary
                      ? 'Temporary Capacity Deferral (Activation Paused)'
                      : 'Activation Blocked (Permanent Failure)'}
                  </p>
                  {result.failureCategory && (
                    <span className="font-mono font-semibold">[{result.failureCategory}]</span>
                  )}
                  <span className="font-medium">
                    • {result.isTemporary ? 'Temporary — Retryable' : 'Permanent'}
                  </span>
                </div>
                <p>
                  {result.errorMessage ||
                    'Candidate key could not complete generation verification.'}
                </p>
                {result.pendingPreserved && (
                  <p className="text-palnadu-body">
                    Preserved securely as <span className="font-mono">PENDING_VERIFICATION</span>{' '}
                    without altering the active credential.
                  </p>
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-end gap-2 border-t border-palnadu-border pt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={onClose}
            disabled={activating || retrying}
            className="cursor-pointer"
          >
            Cancel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetryVerification}
            disabled={activating || retrying}
            className="cursor-pointer"
          >
            {retrying ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-1.5" />
            )}
            <span>Retry Verification</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onConfirmActivate}
            disabled={!canActivate || activating || retrying}
            className="cursor-pointer"
          >
            {activating ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                <span>Activating Atomically...</span>
              </>
            ) : (
              <>
                <CheckCircle2 className="h-4 w-4 mr-1.5" />
                <span>Confirm & Activate Key</span>
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}
