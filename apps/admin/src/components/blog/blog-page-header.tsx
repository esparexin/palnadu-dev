'use client';

import React from 'react';
import { Plus, Sparkles, Loader2, Compass, ListChecks } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface BlogPageHeaderProps {
  onOpenKeywords: () => void;
  onOpenQueue: () => void;
  onGenerateDraft: () => void;
  onOpenCreate: () => void;
  generatingGeneralDraft: boolean;
  isGenerating: boolean;
}

export function BlogPageHeader({
  onOpenKeywords,
  onOpenQueue,
  onGenerateDraft,
  onOpenCreate,
  generatingGeneralDraft,
  isGenerating,
}: BlogPageHeaderProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Blog & Articles</h1>
        <p className="text-xs text-palnadu-secondary mt-0.5">
          Publish technical guides, engineering case breakdowns, and manage SEO search metadata.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenKeywords}
          title="Discover real Google search terms for Andhra Pradesh & Palnadu"
        >
          <Compass className="h-4 w-4 mr-1.5 text-palnadu-blue" />
          <span>SEO Keywords</span>
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={onOpenQueue}
          title="View scheduled blog queue & rotation status"
        >
          <ListChecks className="h-4 w-4 mr-1.5 text-palnadu-teal" />
          <span>Queue Status</span>
        </Button>
        <Button
          variant="secondary"
          size="sm"
          onClick={onGenerateDraft}
          disabled={isGenerating}
          title="Generate next scheduled AI blog draft from queue"
        >
          {generatingGeneralDraft ? (
            <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
          ) : (
            <Sparkles className="h-4 w-4 mr-1.5" />
          )}
          <span>{generatingGeneralDraft ? 'Generating Draft...' : 'Generate AI Blog Draft'}</span>
        </Button>
        <Button variant="default" size="sm" onClick={onOpenCreate}>
          <Plus className="h-4 w-4 mr-1.5" />
          <span>New Article</span>
        </Button>
      </div>
    </div>
  );
}
