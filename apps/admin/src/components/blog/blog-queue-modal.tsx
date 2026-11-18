'use client';

import React from 'react';
import type { AutomationStatus, BilingualStatus, BlogTopic } from '@palnadu/types';
import { X, ListChecks, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getQueueItemDiagnostic } from './blog-queue-diagnostics.util';
import { BlogQueueStats } from './blog-queue-stats';

interface BlogQueueModalProps {
  open: boolean;
  onClose: () => void;
  loadingStatus: boolean;
  automationStatus: AutomationStatus | null;
  bilingualStatus: BilingualStatus | null;
  updatingSettings: boolean;
  togglingBilingual: boolean;
  discoveringTopics: boolean;
  generatingTopicId?: string | null;
  isGenerating?: boolean;
  canManageSettings?: boolean;
  onToggleAutoPublish: () => void;
  onToggleBilingual: () => void;
  onDiscoverTopics: () => void;
  onGenerateFromTopic: (_topic: BlogTopic) => void;
}

export function BlogQueueModal({
  open,
  onClose,
  loadingStatus,
  automationStatus,
  bilingualStatus,
  updatingSettings,
  togglingBilingual,
  discoveringTopics,
  generatingTopicId = null,
  isGenerating = false,
  canManageSettings = false,
  onToggleAutoPublish,
  onToggleBilingual,
  onDiscoverTopics,
  onGenerateFromTopic,
}: BlogQueueModalProps) {
  if (!open) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-queue-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-3xl max-h-[85vh] rounded-xl border border-palnadu-border bg-white shadow-2xl flex flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-palnadu-teal/10 text-palnadu-teal-dark flex items-center justify-center border border-palnadu-teal/30">
              <ListChecks className="h-4 w-4" aria-hidden="true" />
            </div>
            <div>
              <h3 id="blog-queue-modal-title" className="text-sm font-bold text-palnadu-dark">
                Blog Automation Engine &amp; Queue
              </h3>
              <p className="text-xs text-palnadu-secondary">Autonomous cron schedule, topic rotation, and publish status</p>
            </div>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close automation queue modal"
            className="h-8 w-8 p-0 text-palnadu-secondary hover:text-palnadu-dark"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="p-5 space-y-4 overflow-y-auto">
          {loadingStatus ? (
            <div className="py-12 text-center text-xs text-palnadu-secondary space-y-2">
              <Loader2 className="h-5 w-5 animate-spin mx-auto text-palnadu-blue" />
              <p>Loading automation statistics...</p>
            </div>
          ) : automationStatus ? (
            <>
              <BlogQueueStats
                automationStatus={automationStatus}
                bilingualStatus={bilingualStatus}
                updatingSettings={updatingSettings}
                togglingBilingual={togglingBilingual}
                canManageSettings={canManageSettings}
                onToggleAutoPublish={onToggleAutoPublish}
                onToggleBilingual={onToggleBilingual}
              />

              <div className="space-y-3 pt-2">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-bold text-palnadu-dark uppercase tracking-wider">Scheduled Topic Rotation Queue</h4>
                    <p className="text-xs text-palnadu-secondary">Showing {automationStatus.upcomingQueue?.length || 0} queued topics in rotation preview</p>
                  </div>
                  <Button size="sm" variant="secondary" disabled={discoveringTopics} onClick={onDiscoverTopics} className="h-8 text-xs gap-1.5 self-start sm:self-auto">
                    {discoveringTopics ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-palnadu-blue" />}
                    Discover New Topics
                  </Button>
                </div>

                {automationStatus.upcomingQueue && automationStatus.upcomingQueue.length > 0 ? (
                  <div className="space-y-2">
                    {automationStatus.upcomingQueue.map((item: BlogTopic, idx: number) => {
                      const diag = getQueueItemDiagnostic(item);
                      const topicId = item.id || item.topicKey || item.topic;
                      const isThisItemGenerating = generatingTopicId === topicId;

                      return (
                        <div key={topicId || idx} className="rounded-lg border border-palnadu-border bg-white p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
                          <div className="space-y-1.5 flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <span className="font-semibold text-palnadu-dark">{item.topic}</span>
                              <span className={cn('px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border', diag.badgeClassName)}>
                                {diag.badgeLabel}
                              </span>
                              <span className="px-1.5 py-0.5 rounded text-xs font-mono font-bold uppercase border bg-palnadu-light-blue text-palnadu-blue border-palnadu-blue/20">
                                {item.language === 'te' ? 'Telugu' : 'English'}
                              </span>
                            </div>
                            <p className="text-xs text-palnadu-secondary">
                              Category: <span className="font-mono">{item.categorySlug}</span> • Target: {item.targetLocation || 'Global'}
                              {item.attempts > 0 ? ` • Attempts: ${item.attempts}/3` : ''}
                              {diag.retryTimingText ? ` • ${diag.retryTimingText}` : ''}
                            </p>
                            {diag.errorAnalysis && (
                              <div className="rounded-md border border-palnadu-border/70 bg-palnadu-off-white/40 p-2 text-xs space-y-1">
                                <div className="flex items-center gap-1.5">
                                  <span className="font-mono font-bold text-xs uppercase px-1.5 py-0.5 rounded border bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/30">
                                    {diag.errorAnalysis.category}
                                  </span>
                                  <span className="text-palnadu-secondary font-medium">Last error report</span>
                                </div>
                                <p className="text-palnadu-body font-mono text-xs break-words line-clamp-2">
                                  {diag.errorAnalysis.sanitizedMessage}
                                </p>
                              </div>
                            )}
                          </div>
                          {diag.canManuallyGenerate && (
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => onGenerateFromTopic(item)}
                              disabled={isGenerating}
                              className="h-8 text-xs shrink-0 self-end sm:self-auto"
                            >
                              {isThisItemGenerating ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
                              {diag.buttonLabel}
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="rounded-lg border border-dashed border-palnadu-border p-8 text-center space-y-2">
                    <p className="text-xs font-semibold text-palnadu-dark">No topics currently in rotation queue</p>
                    <p className="text-xs text-palnadu-secondary">Click &ldquo;Discover New Topics&rdquo; to automatically identify and queue search opportunities.</p>
                    <Button size="sm" variant="secondary" disabled={discoveringTopics} onClick={onDiscoverTopics} className="mt-2 h-8 text-xs gap-1.5">
                      {discoveringTopics ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5 text-palnadu-blue" />}
                      Discover New Topics
                    </Button>
                  </div>
                )}
              </div>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
