'use client';

import React from 'react';
import { X, Compass, Search, Copy, Check, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';
import { KeywordResult } from './types';

interface BlogKeywordModalProps {
  open: boolean;
  onClose: () => void;
  keywordSeed: string;
  onKeywordSeedChange: (_seed: string) => void;
  keywordLocation: string;
  onKeywordLocationChange: (_loc: string) => void;
  discoveredKeywords: KeywordResult[];
  searchingKeywords: boolean;
  generatingAi: boolean;
  copiedKw: string | null;
  onFetchKeywords: () => void;
  onCopyKeyword: (_kw: string) => void;
  onGenerateFromKeyword: (_kw: string) => void;
}

export function BlogKeywordModal({
  open,
  onClose,
  keywordSeed,
  onKeywordSeedChange,
  keywordLocation,
  onKeywordLocationChange,
  discoveredKeywords,
  searchingKeywords,
  generatingAi,
  copiedKw,
  onFetchKeywords,
  onCopyKeyword,
  onGenerateFromKeyword,
}: BlogKeywordModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
      <div className="w-full max-w-2xl max-h-[85vh] rounded-xl border border-palnadu-border bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center">
              <Compass className="h-4 w-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-palnadu-dark">Google Live SEO Keyword Discovery</h3>
              <p className="text-xs text-palnadu-secondary">Real-time autocomplete queries from Google India for regional intent</p>
            </div>
          </div>
          <Button size="sm" variant="ghost" onClick={onClose} className="h-8 w-8 p-0 text-palnadu-secondary hover:text-palnadu-dark">
            <X className="h-4 w-4" />
          </Button>
        </div>

        <div className="p-5 border-b border-palnadu-border/60 bg-palnadu-off-white/30 space-y-3">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Seed Keyword / Topic</Label>
              <Input
                type="text"
                value={keywordSeed}
                onChange={(e) => onKeywordSeedChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && onFetchKeywords()}
                placeholder="e.g. billing software, school website, web design"
              />
            </div>
            <div className="space-y-1">
              <Label>Target Regional Location</Label>
              <select
                value={keywordLocation}
                onChange={(e) => onKeywordLocationChange(e.target.value)}
                className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
              >
                <option value="Guntur & Palnadu">Guntur & Palnadu</option>
                <option value="Palnadu">Palnadu</option>
                <option value="Guntur">Guntur</option>
                <option value="Narasaraopet">Narasaraopet</option>
                <option value="Chilakaluripet">Chilakaluripet</option>
                <option value="Sattenapalle">Sattenapalle</option>
                <option value="Macherla">Macherla</option>
                <option value="Vinukonda">Vinukonda</option>
                <option value="Andhra Pradesh">Andhra Pradesh</option>
              </select>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <p className="text-xs text-palnadu-secondary">
              Found <span className="font-semibold text-palnadu-dark">{discoveredKeywords.length}</span> live search variations
            </p>
            <Button size="sm" variant="default" onClick={onFetchKeywords} disabled={searchingKeywords || !keywordSeed.trim()}>
              {searchingKeywords ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
              <span>{searchingKeywords ? 'Discovering...' : 'Discover Keywords'}</span>
            </Button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {searchingKeywords ? (
            <div className="py-12 text-center text-xs text-palnadu-secondary space-y-2">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-palnadu-blue" />
              <p>Querying Google India live suggestion indexes...</p>
            </div>
          ) : discoveredKeywords.length === 0 ? (
            <div className="py-10 text-center text-xs text-palnadu-secondary">
              No suggestions found for this seed. Try a broader term like &quot;software&quot;, &quot;app&quot;, or &quot;website&quot;.
            </div>
          ) : (
            <div className="space-y-2">
              {discoveredKeywords.map((kw, idx) => {
                const intentColor =
                  kw.intent === 'transactional'
                    ? 'bg-palnadu-teal/10 text-palnadu-teal-dark border-palnadu-teal/30'
                    : kw.intent === 'local'
                    ? 'bg-palnadu-light-blue text-palnadu-blue border-palnadu-blue/30'
                    : 'bg-palnadu-off-white text-palnadu-dark border-palnadu-border';

                return (
                  <div key={idx} className="rounded-lg border border-palnadu-border bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-palnadu-blue transition-all">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-palnadu-dark">{kw.keyword}</span>
                        <span className={cn('px-2 py-0.5 rounded text-xs font-mono font-semibold border uppercase', intentColor)}>
                          {kw.intent}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-xs text-palnadu-secondary">
                        <span>Score: {kw.relevanceScore}/100</span>
                        <span>•</span>
                        <span>{kw.source}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <Button size="sm" variant="outline" onClick={() => onCopyKeyword(kw.keyword)} className="h-8 w-8 p-0" title="Copy keyword">
                        {copiedKw === kw.keyword ? <Check className="h-3.5 w-3.5 text-palnadu-teal" /> : <Copy className="h-3.5 w-3.5" />}
                      </Button>
                      <Button size="sm" variant="secondary" onClick={() => onGenerateFromKeyword(kw.keyword)} disabled={generatingAi}>
                        <Sparkles className="h-3.5 w-3.5 mr-1" />
                        <span>Draft Post</span>
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
