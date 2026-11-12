'use client';

import React from 'react';
import { KeyRound, ShieldCheck, Sparkles, RefreshCw, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { GeminiStatusBadge } from './gemini-status-badge';
import { GeminiVerificationModal } from './gemini-verification-modal';
import { GeminiPendingBanner } from './gemini-pending-banner';
import { GeminiAuditTable } from './gemini-audit-table';
import { useGeminiSettings } from './use-gemini-settings';
import { DEFAULT_GEMINI_MODELS } from './types';

export function GeminiSettingsPanel() {
  const {
    activeKey,
    loading,
    verifying,
    activating,
    retryingPending,
    candidateKey,
    setCandidateKey,
    candidateResult,
    modalOpen,
    setModalOpen,
    auditLogs,
    primaryModel,
    setPrimaryModel,
    handleVerify,
    handleActivate,
    handleRetryPending,
    handleRetryFromModal,
    refreshStatus,
    refreshAuditLogs,
  } = useGeminiSettings();

  const statusDisplay =
    activeKey && !activeKey.configured && !activeKey.pendingCandidate
      ? 'Not Configured'
      : activeKey?.verificationStatus || 'UNVERIFIED';

  return (
    <div className="space-y-6">
      {activeKey?.pendingCandidate && (
        <GeminiPendingBanner
          pending={activeKey.pendingCandidate}
          retrying={retryingPending}
          onRetry={handleRetryPending}
        />
      )}

      <div className="rounded-xl border border-palnadu-border bg-white shadow-sm p-6 space-y-5">
        <div className="flex items-center justify-between border-b border-palnadu-border pb-4">
          <div className="flex items-center gap-2">
            <KeyRound className="h-5 w-5 text-palnadu-blue" />
            <div>
              <h2 className="text-sm font-bold text-palnadu-dark">
                Active Gemini API Key & Cloud Project
              </h2>
              <p className="text-xs text-palnadu-secondary mt-0.5">
                Authoritative runtime credentials for automated research, article composition, and multilingual generation.
              </p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={refreshStatus}
            disabled={loading}
            className="cursor-pointer"
          >
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Status</span>
          </Button>
        </div>

        {loading ? (
          <div className="py-8 flex items-center justify-center gap-2 text-xs text-palnadu-secondary">
            <Loader2 className="h-4 w-4 animate-spin text-palnadu-blue" />
            <span>Loading active key identity metadata...</span>
          </div>
        ) : activeKey ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-xs">
            <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/40 space-y-1.5">
              <span className="text-palnadu-secondary font-medium">Masked API Key & Auth</span>
              <p className="font-mono font-bold text-palnadu-dark text-xs">
                {activeKey.maskedKey || 'No API key configured'}
              </p>
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <GeminiStatusBadge status={statusDisplay} />
                {activeKey.authenticationStatus && (
                  <GeminiStatusBadge status={activeKey.authenticationStatus} />
                )}
              </div>
            </div>

            <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/40 space-y-1.5">
              <span className="text-palnadu-secondary font-medium">Google Cloud Project</span>
              <p className="font-mono font-bold text-palnadu-dark text-xs">
                {activeKey.project.id || 'Project Not Identified'}
              </p>
              <p className="text-palnadu-secondary">
                Association: {activeKey.project.status}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-palnadu-border bg-palnadu-off-white/40 space-y-1.5">
              <span className="text-palnadu-secondary font-medium">Google Account Identity</span>
              <p className="font-bold text-palnadu-dark text-xs">
                {activeKey.account.email || 'Account Identity Unavailable'}
              </p>
              <p className="text-palnadu-secondary">
                Identity Check: {activeKey.account.status}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-palnadu-border space-y-1">
              <span className="text-palnadu-secondary font-medium">Active & Fallback Model</span>
              <p className="font-mono font-bold text-palnadu-dark">
                {activeKey.activeUsableModel || activeKey.primaryModel || primaryModel}
              </p>
              <p className="text-palnadu-secondary">
                Storage:{' '}
                {activeKey.source === 'database'
                  ? 'AES-256-GCM Encrypted'
                  : activeKey.source === 'environment'
                    ? 'Environment Fallback'
                    : 'Not Configured'}
                {activeKey.fallbackUsed ? ' (Fallback active)' : ''}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-palnadu-border space-y-1">
              <span className="text-palnadu-secondary font-medium">Quota & Permissions</span>
              <p className="font-bold text-palnadu-dark">
                Quota: {activeKey.quota?.status || 'Unknown'}
              </p>
              <p className="text-palnadu-secondary">
                Permissions: {activeKey.permissions?.status || 'Unknown'}
              </p>
            </div>

            <div className="p-3.5 rounded-lg border border-palnadu-border space-y-1">
              <span className="text-palnadu-secondary font-medium">Last Verification / Activation</span>
              <p className="text-palnadu-dark font-mono">
                {activeKey.activatedAt
                  ? new Date(activeKey.activatedAt).toLocaleString()
                  : 'Environment / Unactivated'}
              </p>
              <p className="text-palnadu-secondary">By: {activeKey.activatedBy || 'System'}</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="rounded-xl border border-palnadu-border bg-white shadow-sm p-6 space-y-4">
        <div className="flex items-center gap-2 border-b border-palnadu-border pb-3">
          <ShieldCheck className="h-5 w-5 text-palnadu-teal" />
          <div>
            <h2 className="text-sm font-bold text-palnadu-dark">
              Rotate or Update Gemini API Key
            </h2>
            <p className="text-xs text-palnadu-secondary mt-0.5">
              Two-step atomic workflow: verify key authentication & model availability, then confirm activation.
            </p>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="sm:col-span-2 space-y-1.5">
            <Label htmlFor="candidate-key">New Gemini API Key</Label>
            <Input
              id="candidate-key"
              type="password"
              autoComplete="off"
              value={candidateKey}
              onChange={(e) => setCandidateKey(e.target.value)}
              placeholder="AIzaSy... or AQ..."
              className="h-9 text-xs rounded-md"
            />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="primary-model">Primary Model</Label>
            <Input
              id="primary-model"
              value={primaryModel}
              onChange={(e) => setPrimaryModel(e.target.value)}
              placeholder={DEFAULT_GEMINI_MODELS[0]}
              className="h-9 text-xs rounded-md"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
          <p className="text-xs text-palnadu-secondary max-w-md">
            Safe Activation Guarantee: Existing active DB or environment key stays protected if verification encounters overload or invalid credentials.
          </p>
          <Button
            variant="default"
            size="sm"
            onClick={handleVerify}
            disabled={verifying || !candidateKey.trim()}
            className="cursor-pointer"
          >
            {verifying ? (
              <>
                <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
                <span>Verifying Identity & Models...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4 mr-1.5" />
                <span>Verify Key & Project</span>
              </>
            )}
          </Button>
        </div>
      </div>

      <GeminiAuditTable entries={auditLogs} onRefresh={refreshAuditLogs} />

      <GeminiVerificationModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        result={candidateResult}
        activating={activating}
        retrying={verifying || retryingPending}
        onRetryVerification={handleRetryFromModal}
        onConfirmActivate={handleActivate}
      />
    </div>
  );
}
