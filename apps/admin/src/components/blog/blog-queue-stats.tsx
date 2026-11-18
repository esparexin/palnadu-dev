'use client';

import React from 'react';
import type { AutomationStatus, BilingualStatus } from '@palnadu/types';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BlogQueueStatsProps {
  automationStatus: AutomationStatus;
  bilingualStatus: BilingualStatus | null;
  updatingSettings: boolean;
  togglingBilingual: boolean;
  canManageSettings?: boolean;
  onToggleAutoPublish: () => void;
  onToggleBilingual: () => void;
}

export function BlogQueueStats({
  automationStatus,
  bilingualStatus,
  updatingSettings,
  togglingBilingual,
  canManageSettings = false,
  onToggleAutoPublish,
  onToggleBilingual,
}: BlogQueueStatsProps) {
  const stats = automationStatus.statistics;
  const queueCompleted = stats?.queueCompleted ?? 0;
  const queuePending = stats?.queuePending ?? 0;
  const queueInFlight = stats?.queueInFlight ?? 0;
  const queueFailed = stats?.queueFailed ?? 0;
  const totalQueue = queuePending + queueCompleted + queueInFlight + queueFailed;
  const health = automationStatus.queueHealth;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-3">
        <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Cron Schedule</p>
        <p className="text-xs font-bold text-palnadu-dark mt-1">Daily 05:00 AM IST</p>
        <p className="text-xs text-palnadu-secondary mt-1">Autonomous cycle</p>
      </div>

      <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-3">
        <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Queue Progress</p>
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
  );
}
