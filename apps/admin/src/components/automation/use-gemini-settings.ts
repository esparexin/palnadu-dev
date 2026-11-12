'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import {
  DEFAULT_GEMINI_MODELS,
  type ActiveGeminiKeySummary,
  type GeminiKeyVerificationResult,
  type GeminiKeyAuditEntry,
} from './types';
import {
  resolveActivationTarget,
  validateCandidateGeminiInput,
} from './gemini-settings.util';

export function useGeminiSettings() {
  const { toast } = useToast();
  const [activeKey, setActiveKey] = useState<ActiveGeminiKeySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [activating, setActivating] = useState<boolean>(false);
  const [retryingPending, setRetryingPending] = useState<boolean>(false);
  const [candidateKey, setCandidateKey] = useState<string>('');
  const [candidateResult, setCandidateResult] = useState<GeminiKeyVerificationResult | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<GeminiKeyAuditEntry[]>([]);
  const [primaryModel, setPrimaryModel] = useState<string>(DEFAULT_GEMINI_MODELS[0]);

  const fetchStatus = useCallback(async () => {
    try {
      setLoading(true);
      const res = await api.automation.geminiStatus();
      if (res.success && res.data) {
        setActiveKey(res.data);
      }
    } catch (err: any) {
      toast.error(err?.message || 'Failed to load Gemini API status');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  const fetchAuditLogs = useCallback(async () => {
    try {
      const res = await api.automation.geminiAuditLog(25);
      if (res.success && Array.isArray(res.data)) {
        setAuditLogs(res.data);
      }
    } catch {
      // Non-fatal
    }
  }, []);

  useEffect(() => {
    fetchStatus();
    fetchAuditLogs();
  }, [fetchStatus, fetchAuditLogs]);

  const handleVerify = async () => {
    const validated = validateCandidateGeminiInput(candidateKey, primaryModel);
    if (!validated.ok) {
      toast.error(validated.error);
      return;
    }

    try {
      setVerifying(true);
      const res = await api.automation.geminiVerify(
        validated.data.apiKey,
        validated.data.primaryModel,
      );
      if (res.success && res.data) {
        setCandidateResult(res.data);
        setModalOpen(true);
        if (res.data.isValid && res.data.isUsableForGeneration) {
          toast.success(`Key probe successful: ${res.data.verificationStatus}`);
        } else if (res.data.isTemporary) {
          toast.error(`Temporary Gemini issue (${res.data.verificationStatus}) — safe to retry.`);
        } else {
          toast.error(`Key verification issue: ${res.data.verificationStatus}`);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Verification request failed.');
    } finally {
      setVerifying(false);
      fetchStatus();
      fetchAuditLogs();
    }
  };

  const handleActivate = async () => {
    const target = resolveActivationTarget(
      candidateKey,
      Boolean(activeKey?.pendingCandidate),
    );
    if (target === 'pending') {
      await handleRetryPending(true);
      return;
    }
    if (target === 'none') return;

    const validated = validateCandidateGeminiInput(candidateKey, primaryModel);
    if (!validated.ok) {
      toast.error(validated.error);
      return;
    }

    try {
      setActivating(true);
      const res = await api.automation.geminiActivate(
        validated.data.apiKey,
        validated.data.primaryModel,
      );
      if (res.success && res.data) {
        setActiveKey(res.data);
        setModalOpen(false);
        setCandidateKey('');
        setCandidateResult(null);
        toast.success('Gemini API Key verified and atomically activated!');
        fetchAuditLogs();
      }
    } catch (err: any) {
      toast.error(err?.message || 'Activation failed. Existing key was preserved.');
      fetchStatus();
      fetchAuditLogs();
    } finally {
      setActivating(false);
    }
  };

  const handleRetryPending = async (activate = false) => {
    try {
      setRetryingPending(true);
      const res = await api.automation.geminiRetryPending(primaryModel, activate);
      if (res.success && res.data) {
        setCandidateResult(res.data.verification);
        if (res.data.activated) {
          setActiveKey(res.data.activated);
          setModalOpen(false);
          setCandidateKey('');
          setCandidateResult(null);
          toast.success('Pending Gemini API Key verified and activated!');
        } else {
          setModalOpen(true);
          if (res.data.verification.isUsableForGeneration) {
            toast.success('Pending candidate passed verification!');
          } else {
            toast.error(`Retry status: ${res.data.verification.verificationStatus}`);
          }
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Retry verification failed.');
    } finally {
      setRetryingPending(false);
      fetchStatus();
      fetchAuditLogs();
    }
  };

  const handleRetryFromModal = async () => {
    if (candidateKey.trim()) {
      await handleVerify();
      return;
    }
    await handleRetryPending(false);
  };

  return {
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
    refreshStatus: fetchStatus,
    refreshAuditLogs: fetchAuditLogs,
  };
}
