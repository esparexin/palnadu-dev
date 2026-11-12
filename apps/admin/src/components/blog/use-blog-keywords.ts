'use client';

import { useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { KeywordResult } from './types';

export function useBlogKeywords(
  onSuccessDraft: () => void,
  setGeneratingAi: (_loading: boolean) => void,
  fetchCounts?: () => void,
) {
  const { toast } = useToast();
  const [keywordModalOpen, setKeywordModalOpen] = useState(false);
  const [keywordSeed, setKeywordSeed] = useState('billing software');
  const [keywordLocation, setKeywordLocation] = useState('Guntur & Palnadu');
  const [discoveredKeywords, setDiscoveredKeywords] = useState<KeywordResult[]>([]);
  const [searchingKeywords, setSearchingKeywords] = useState(false);
  const [copiedKw, setCopiedKw] = useState<string | null>(null);
  const copyTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
    };
  }, []);

  const fetchKeywords = async () => {
    if (!keywordSeed.trim()) return;
    setSearchingKeywords(true);
    try {
      const res = await api.automation.keywords(keywordSeed, keywordLocation);
      if (res.success) setDiscoveredKeywords(res.data || []);
    } catch {
      toast.error('Failed to discover keywords');
    } finally {
      setSearchingKeywords(false);
    }
  };

  const generateFromKeyword = async (kw: string) => {
    setGeneratingAi(true);
    toast.info(`Generating draft for "${kw}"...`);
    try {
      const res = await api.automation.generate({ topic: kw, targetLocation: keywordLocation });
      if (res.success) {
        const title = res.data?.title || res.data?.results?.[0]?.title || kw;
        toast.success(`Draft generated: "${title.slice(0, 30)}..." Review below!`);
        setKeywordModalOpen(false);
        onSuccessDraft();
        fetchCounts?.();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate blog draft');
    } finally {
      setGeneratingAi(false);
    }
  };

  const copyKeyword = async (kw: string) => {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      toast.error('Clipboard access is unavailable in this browser');
      return;
    }
    try {
      await navigator.clipboard.writeText(kw);
      setCopiedKw(kw);
      toast.success('Keyword copied to clipboard');
      if (copyTimerRef.current) clearTimeout(copyTimerRef.current);
      copyTimerRef.current = setTimeout(() => setCopiedKw(null), 2000);
    } catch {
      toast.error('Failed to copy keyword to clipboard');
    }
  };

  return {
    keywordModalOpen,
    setKeywordModalOpen,
    keywordSeed,
    setKeywordSeed,
    keywordLocation,
    setKeywordLocation,
    discoveredKeywords,
    searchingKeywords,
    copiedKw,
    fetchKeywords,
    generateFromKeyword,
    copyKeyword,
  };
}
