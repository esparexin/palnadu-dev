'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { AutomationStatus, BilingualStatus, BlogTopic } from '@palnadu/types';
import { useToast } from '@/components/ui/toast';
import { extractAutomationErrorMessage } from './blog-queue.util';

export function useBlogAutomation(
  onSuccessDraft: () => void,
  fetchCounts: () => void,
) {
  const { toast } = useToast();
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<AutomationStatus | null>(null);
  const [bilingualStatus, setBilingualStatus] = useState<BilingualStatus | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);
  const [updatingSettings, setUpdatingSettings] = useState(false);
  const [discoveringTopics, setDiscoveringTopics] = useState(false);
  const [togglingBilingual, setTogglingBilingual] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [generateError, setGenerateError] = useState<string | null>(null);

  const fetchAutomationStatus = async () => {
    setLoadingStatus(true);
    setGenerateError(null);
    setQueueModalOpen(true);
    try {
      const [statusRes, bilingualRes] = await Promise.all([
        api.automation.status(),
        api.automation.getBilingual().catch(() => null),
      ]);
      if (statusRes.success) setAutomationStatus(statusRes.data);
      if (bilingualRes?.success) setBilingualStatus(bilingualRes.data);
    } catch {
      toast.error('Failed to fetch automation queue status');
    } finally {
      setLoadingStatus(false);
    }
  };

  const toggleAutoPublish = async () => {
    if (!automationStatus) return;
    const newSetting = !automationStatus.autoPublishEnabled;
    setUpdatingSettings(true);
    try {
      const res = await api.automation.updateSettings(newSetting);
      if (res.success) {
        toast.success(res.message);
        setAutomationStatus((prev) => (prev ? { ...prev, autoPublishEnabled: newSetting } : null));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update auto-publish setting');
    } finally {
      setUpdatingSettings(false);
    }
  };

  const toggleBilingual = async () => {
    if (!bilingualStatus) return;
    const newEnabled = !bilingualStatus.enabled;
    setTogglingBilingual(true);
    try {
      const res = await api.automation.updateBilingual({ enabled: newEnabled });
      if (res.success) {
        toast.success(res.message);
        setBilingualStatus(res.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update bilingual setting');
    } finally {
      setTogglingBilingual(false);
    }
  };

  const handleDiscoverTopics = async () => {
    setDiscoveringTopics(true);
    toast.info('Discovering keyword search opportunities across reference sources...');
    try {
      const res = await api.automation.discover(40);
      if (res.success) {
        toast.success(res.message);
        const updated = await api.automation.status();
        if (updated.success) setAutomationStatus(updated.data);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to discover topics');
    } finally {
      setDiscoveringTopics(false);
    }
  };

  const generateFromTopic = async (topicItem: BlogTopic) => {
    setGeneratingAi(true);
    setGenerateError(null);
    toast.info(`Generating draft for "${topicItem.topic.slice(0, 32)}..."`);
    try {
      const res = await api.automation.generate({
        topic: topicItem.topic,
        categorySlug: topicItem.categorySlug,
        targetLocation: topicItem.targetLocation || undefined,
        language: topicItem.language,
      });
      if (res.success) {
        const title = res.data?.title || res.data?.results?.[0]?.title;
        const msg = title
          ? `Draft generated: "${title.slice(0, 30)}..." Review below!`
          : res.message || 'Draft generated! Review below!';
        toast.success(msg);
        setQueueModalOpen(false);
        onSuccessDraft();
        fetchCounts();
      }
    } catch (err) {
      const msg = extractAutomationErrorMessage(err, 'Failed to generate blog draft');
      setGenerateError(msg);
      toast.error(msg);
      try {
        const updated = await api.automation.status();
        if (updated.success) setAutomationStatus(updated.data);
      } catch {
        // Non-fatal: keep existing queue snapshot and visible generateError
      }
    } finally {
      setGeneratingAi(false);
    }
  };

  const triggerAiGenerate = async () => {
    setGeneratingAi(true);
    toast.info('Generating 1,200+ word draft with licensed images...');
    try {
      const res = await api.automation.generate();
      if (res.success) {
        const title = res.data?.title || res.data?.results?.[0]?.title;
        const msg = title
          ? `Draft generated: "${title.slice(0, 30)}..." Review below!`
          : res.message || 'Draft generated! Review below!';
        toast.success(msg);
        onSuccessDraft();
      }
    } catch (err) {
      toast.error(extractAutomationErrorMessage(err, 'Failed to generate blog draft'));
    } finally {
      setGeneratingAi(false);
    }
  };

  return {
    queueModalOpen,
    setQueueModalOpen,
    automationStatus,
    bilingualStatus,
    loadingStatus,
    updatingSettings,
    discoveringTopics,
    togglingBilingual,
    generatingAi,
    generateError,
    setGeneratingAi,
    fetchAutomationStatus,
    toggleAutoPublish,
    toggleBilingual,
    handleDiscoverTopics,
    generateFromTopic,
    triggerAiGenerate,
  };
}
