'use client';

import { useState, useEffect, useCallback } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import type {
  ActiveGeminiKeySummary,
  GeminiKeyVerificationResult,
  GeminiKeyAuditEntry,
} from './types';

export function useGeminiSettings() {
  const { toast } = useToast();
  const [activeKey, setActiveKey] = useState<ActiveGeminiKeySummary | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [verifying, setVerifying] = useState<boolean>(false);
  const [activating, setActivating] = useState<boolean>(false);
  const [candidateKey, setCandidateKey] = useState<string>('');
  const [candidateResult, setCandidateResult] = useState<GeminiKeyVerificationResult | null>(null);
  const [modalOpen, setModalOpen] = useState<boolean>(false);
  const [auditLogs, setAuditLogs] = useState<GeminiKeyAuditEntry[]>([]);
  const [primaryModel, setPrimaryModel] = useState<string>('gemini-3.8-flash');

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
  }, []);

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
    const trimmed = candidateKey.trim();
    if (!trimmed) {
      toast.error('Please enter a Gemini API Key to verify.');
      return;
    }
    if (!trimmed.startsWith('AIza') && !trimmed.startsWith('AQ')) {
      toast.error('Invalid format: Gemini API key must begin with "AIza" or "AQ".');
      return;
    }

    try {
      setVerifying(true);
      const res = await api.automation.geminiVerify(trimmed, primaryModel);
      if (res.success && res.data) {
        setCandidateResult(res.data);
        setModalOpen(true);
        if (res.data.isValid && res.data.isUsableForGeneration) {
          toast.success(`Key probe successful: ${res.data.verificationStatus}`);
        } else {
          toast.error(`Key verification issue: ${res.data.verificationStatus}`);
        }
      }
    } catch (err: any) {
      toast.error(err?.message || 'Verification request failed.');
    } finally {
      setVerifying(false);
      fetchAuditLogs();
    }
  };

  const handleActivate = async () => {
    const trimmed = candidateKey.trim();
    if (!trimmed) return;

    try {
      setActivating(true);
      const res = await api.automation.geminiActivate(trimmed, primaryModel);
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
    } finally {
      setActivating(false);
    }
  };

  return {
    activeKey,
    loading,
    verifying,
    activating,
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
    refreshStatus: fetchStatus,
    refreshAuditLogs: fetchAuditLogs,
  };
}
