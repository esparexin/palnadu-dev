'use client';

import React from 'react';
import { X, ShieldCheck, AlertCircle, Loader2, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GeminiStatusBadge } from './gemini-status-badge';
import type { GeminiKeyVerificationResult } from './types';

interface VerificationModalProps {
  open: boolean;
  onClose: () => void;
  result: GeminiKeyVerificationResult | null;
  activating: boolean;
  onConfirmActivate: () => void;
}

export function GeminiVerificationModal({
  open,
  onClose,
  result,
  activating,
  onConfirmActivate,
}: VerificationModalProps) {
  if (!open || !result) return null;

  const canActivate = result.isValid && result.isUsableForGeneration;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-palnadu-dark/40 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-xl rounded-xl bg-white border border-palnadu-border shadow-xl p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-3">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-palnadu-blue" />
            <h3 className="text-sm font-bold text-palnadu-dark">Gemini API Key Identity Verification</h3>
          </div>
          <button
            onClick={onClose}
            className="text-palnadu-secondary hover:text-palnadu-dark transition-colors cursor-pointer"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          <div className="flex items-center justify-between p-3 rounded-lg bg-palnadu-off-white/50 border border-palnadu-border">
            <div>
              <p className="font-semibold text-palnadu-dark">Candidate API Key</p>
              <p className="font-mono text-palnadu-secondary mt-0.5">{result.maskedKey}</p>
            </div>
            <GeminiStatusBadge status={result.verificationStatus} />
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

          <div className="p-3 rounded-lg border border-palnadu-border space-y-2">
            <div className="flex items-center justify-between">
              <p className="text-palnadu-secondary font-medium">Model Availability & Generation Tests</p>
              <span className="text-palnadu-secondary">
                {result.models.supportedCount} model(s) verified
              </span>
            </div>
            <div className="space-y-1.5">
              {result.models.tested.map((m) => (
                <div key={m.model} className="flex items-center justify-between py-1 border-b border-palnadu-border/60 last:border-b-0">
                  <span className="font-mono text-palnadu-dark font-medium">{m.model}</span>
                  <div className="flex items-center gap-2">
                    {m.latencyMs ? <span className="text-palnadu-secondary">{m.latencyMs}ms</span> : null}
                    <span className={m.accessible ? 'text-palnadu-teal font-semibold' : 'text-palnadu-error font-semibold'}>
                      {m.accessible ? 'Accessible' : (m.error || 'Denied')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="p-2.5 rounded-lg border border-palnadu-border">
              <span className="text-palnadu-secondary block">Quota & Billing</span>
              <span className="font-bold text-palnadu-dark">{result.quota.status}</span>
            </div>
            <div className="p-2.5 rounded-lg border border-palnadu-border">
              <span className="text-palnadu-secondary block">API Permissions</span>
              <span className="font-bold text-palnadu-dark">{result.permissions.status}</span>
            </div>
          </div>

          {!canActivate && (
            <div className="p-3 rounded-lg bg-palnadu-error/10 border border-palnadu-error/30 text-palnadu-error flex items-start gap-2">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Activation Blocked</p>
                <p className="mt-0.5">{result.errorMessage || 'Candidate key cannot be used for content generation.'}</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 border-t border-palnadu-border pt-4">
          <Button variant="outline" size="sm" onClick={onClose} disabled={activating}>
            Cancel
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={onConfirmActivate}
            disabled={!canActivate || activating}
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

