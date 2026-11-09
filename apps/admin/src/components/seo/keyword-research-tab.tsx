'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/components/ui/toast';
import { Check, Copy, HelpCircle, Search } from 'lucide-react';

export function KeywordResearchTab() {
  const { toast } = useToast();
  const [seedKeyword, setSeedKeyword] = useState('billing software');
  const [keywordLocation, setKeywordLocation] = useState('Macherla');
  const [searchingKeywords, setSearchingKeywords] = useState(false);
  const [discoveredKeywords, setDiscoveredKeywords] = useState<any[]>([]);
  const [discoveredQuestions, setDiscoveredQuestions] = useState<any[]>([]);
  const [copiedKw, setCopiedKw] = useState<string | null>(null);

  const handleSearchKeywords = async () => {
    if (!seedKeyword.trim()) return;
    setSearchingKeywords(true);
    try {
      const [kwRes, qRes] = await Promise.all([
        api.automation.keywords(seedKeyword, keywordLocation),
        api.automation.questions(seedKeyword, keywordLocation).catch(() => null),
      ]);

      if (kwRes.success && Array.isArray(kwRes.data)) {
        setDiscoveredKeywords(kwRes.data);
      }
      if (qRes?.success && Array.isArray(qRes.data)) {
        setDiscoveredQuestions(qRes.data);
      }
      toast.success(`Discovered ${kwRes.data?.length || 0} keyword suggestions`);
    } catch (err: any) {
      toast.error(err?.message || 'Failed to discover keywords');
    } finally {
      setSearchingKeywords(false);
    }
  };

  const copyKeyword = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedKw(text);
    setTimeout(() => setCopiedKw(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-palnadu-border bg-white p-5 space-y-4">
        <h2 className="text-sm font-bold text-palnadu-dark">AI-Assisted Keyword Discovery (Keyless & Verified)</h2>
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <div className="w-full sm:w-1/2">
            <Input
              value={seedKeyword}
              onChange={(e) => setSeedKeyword(e.target.value)}
              placeholder="Enter seed phrase (e.g. billing software, weighbridge, website design)..."
              className="h-9 text-xs rounded-md"
            />
          </div>
          <div className="w-full sm:w-1/3">
            <Input
              value={keywordLocation}
              onChange={(e) => setKeywordLocation(e.target.value)}
              placeholder="Location (e.g. Macherla, Palnadu, Guntur)..."
              className="h-9 text-xs rounded-md"
            />
          </div>
          <Button
            onClick={handleSearchKeywords}
            disabled={searchingKeywords}
            size="sm"
            className="h-9 text-xs rounded-md bg-palnadu-blue text-white hover:bg-palnadu-dark-hover shrink-0"
          >
            <Search className={`h-3.5 w-3.5 mr-1.5 ${searchingKeywords ? 'animate-spin' : ''}`} />
            <span>{searchingKeywords ? 'Searching...' : 'Discover'}</span>
          </Button>
        </div>

        {/* Keyword Suggestions */}
        {discoveredKeywords.length > 0 && (
          <div className="pt-4 border-t border-palnadu-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-palnadu-secondary">
              Verified Suggestions ({discoveredKeywords.length})
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2.5">
              {discoveredKeywords.map((kw, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md border border-palnadu-border bg-palnadu-off-white/40 flex items-center justify-between text-xs"
                >
                  <span className="font-medium text-palnadu-dark truncate mr-2">{kw.keyword || kw}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => copyKeyword(kw.keyword || kw)}
                    className="h-7 w-7 p-0 text-palnadu-secondary hover:text-palnadu-blue"
                    title="Copy keyword"
                  >
                    {copiedKw === (kw.keyword || kw) ? (
                      <Check className="h-3 w-3 text-palnadu-teal" />
                    ) : (
                      <Copy className="h-3 w-3" />
                    )}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Discovered Questions */}
        {discoveredQuestions.length > 0 && (
          <div className="pt-4 border-t border-palnadu-border space-y-3">
            <h3 className="text-xs font-bold uppercase tracking-wider text-palnadu-secondary flex items-center gap-1.5">
              <HelpCircle className="h-3.5 w-3.5 text-palnadu-blue" />
              <span>Customer Questions & FAQ Intent ({discoveredQuestions.length})</span>
            </h3>
            <div className="space-y-2">
              {discoveredQuestions.map((q, idx) => (
                <div
                  key={idx}
                  className="p-2.5 rounded-md border border-palnadu-border bg-white flex items-center justify-between text-xs"
                >
                  <span className="font-semibold text-palnadu-dark">{q.phrase || q}</span>
                  <span className="text-xs font-mono text-palnadu-secondary bg-palnadu-off-white px-2 py-0.5 rounded">
                    FAQ Intent
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
