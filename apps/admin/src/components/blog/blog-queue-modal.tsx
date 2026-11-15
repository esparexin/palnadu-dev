'use client';

import React from 'react';
import type { AutomationStatus, BilingualStatus, BlogTopic } from '@palnadu/types';
import { X, ListChecks, Sparkles, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { getQueueItemDiagnostic } from './blog-queue-diagnostics.util';

interface BlogQueueModalProps {
  open: boolean;
  onClose: () => void;
  loadingStatus: boolean;
  automationStatus: AutomationStatus | null;
  bilingualStatus: BilingualStatus | null;
  updatingSettings: boolean;
  togglingBilingual: boolean;
  discoveringTopics: boolean;
  generatingAi: boolean;
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
  generatingAi,
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
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-3">
                  <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Cron Schedule</p>
                  <p className="text-xs font-bold text-palnadu-dark mt-1">Daily 05:00 AM IST</p>
                  <p className="text-xs text-palnadu-secondary mt-1">Autonomous cycle</p>
                </div>

                <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-3">
                  <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Queue Progress</p>
                  {(() => {
                    const stats = automationStatus.statistics;
                    const queueCompleted = stats?.queueCompleted ?? 0;
                    const queuePending = stats?.queuePending ?? 0;
                    const queueInFlight = stats?.queueInFlight ?? 0;
                    const queueFailed = stats?.queueFailed ?? 0;
                    const totalQueue = queuePending + queueCompleted + queueInFlight + queueFailed;
                    const health = automationStatus.queueHealth;
                    return (
                      <>
                        <p className="text-xs font-bold text-palnadu-dark mt-1">{queueCompleted} Done / {totalQueue} Total</p>
                        <p className="text-xs text-palnadu-secondary mt-1">
                          {health ? `${health.pending.te} TE • ${health.pending.en} EN Pending` : `${queuePending} Pending`}
                          {queueFailed > 0 ? ` • ${queueFailed} Failed` : ''}
                        </p>
                        {health && (
                          <p className={cn('text-xs font-medium mt-1', health.healthy ? 'text-palnadu-teal-dark' : 'text-palnadu-warning')}>
                            {health.healthy
                              ? '● Supply Healthy'
                              : health.supplyExhausted?.te || health.supplyExhausted?.en
                                ? '▲ Low Stock: Seed Catalog Exhausted'
                                : '▲ Low Stock: Auto-Replenish Active'}
                          </p>
                        )}
                        {health?.staleInFlight && (health.staleInFlight.te > 0 || health.staleInFlight.en > 0) && (
                          <p className="text-xs text-palnadu-warning mt-0.5">
                            Notice: {health.staleInFlight.total ?? (health.staleInFlight.te + health.staleInFlight.en)} in-flight task(s) exceeding normal duration (&gt;5m)
                          </p>
                        )}
                      </>
                    );
                  })()}
                </div>

                <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-3 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Auto-Publish Mode</p>
                    <p className={cn('text-xs font-bold mt-1', automationStatus.autoPublishEnabled ? 'text-palnadu-teal-dark' : 'text-palnadu-warning')}>
                      {automationStatus.autoPublishEnabled ? 'Automatic (Live)' : 'Draft Review (Safe)'}
                    </p>
                  </div>
                  {canManageSettings && (
                    <Button type="button" size="sm" variant="outline" disabled={updatingSettings} onClick={onToggleAutoPublish} className="mt-2 h-7 text-xs w-full justify-center">
                      {updatingSettings && <Loader2 className="h-3 w-3 animate-spin mr-1" aria-hidden="true" />}
                      Switch to {automationStatus.autoPublishEnabled ? 'Draft' : 'Auto-Publish'}
                    </Button>
                  )}
                </div>

                <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-3 flex flex-col justify-between">
                  <div>
                    <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Bilingual Engine</p>
                    <p className={cn('text-xs font-bold mt-1', bilingualStatus?.enabled ? 'text-palnadu-teal-dark' : 'text-palnadu-secondary')}>
                      {bilingualStatus?.enabled ? 'Bilingual (Active)' : 'English Only'}
                    </p>
                    <div className="text-xs text-palnadu-secondary mt-1 space-y-0.5">
                      <p>Quota: {bilingualStatus?.quota?.te ?? 2} TE / {bilingualStatus?.quota?.en ?? 3} EN</p>
                      {bilingualStatus?.pending && (
                        <p className="text-palnadu-dark font-medium">
                          Queued: {bilingualStatus.pending.te} TE • {bilingualStatus.pending.en} EN
                        </p>
                      )}
                    </div>
                  </div>
                  {canManageSettings && (
                    <Button type="button" size="sm" variant="outline" disabled={togglingBilingual || !bilingualStatus} onClick={onToggleBilingual} className="mt-2 h-7 text-xs w-full justify-center">
                      {togglingBilingual && <Loader2 className="h-3 w-3 animate-spin mr-1" aria-hidden="true" />}
                      {bilingualStatus?.enabled ? 'Disable Bilingual' : 'Enable Bilingual'}
                    </Button>
                  )}
                </div>
              </div>

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
                      return (
                        <div key={item.id || item.topicKey || idx} className="rounded-lg border border-palnadu-border bg-white p-3 flex flex-col sm:flex-row sm:items-start justify-between gap-3 text-xs">
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
                            <Button size="sm" variant="secondary" onClick={() => onGenerateFromTopic(item)} disabled={generatingAi} className="h-8 text-xs shrink-0 self-end sm:self-auto">
                              {generatingAi ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
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
