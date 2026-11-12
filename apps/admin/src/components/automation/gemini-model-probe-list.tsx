'use client';

import React from 'react';
import { GeminiStatusBadge } from './gemini-status-badge';
import type { ModelAccessStatus } from './types';

interface GeminiModelProbeListProps {
  tested: ModelAccessStatus[];
  supportedCount: number;
  fallbackUsed?: boolean;
  activeUsableModel?: string | null;
}

export function GeminiModelProbeList({
  tested,
  supportedCount,
  fallbackUsed,
  activeUsableModel,
}: GeminiModelProbeListProps) {
  return (
    <div className="p-3 rounded-lg border border-palnadu-border space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-palnadu-secondary font-medium">
          Model Availability & Generation Probes
        </p>
        <div className="flex items-center gap-2">
          {fallbackUsed && activeUsableModel && (
            <GeminiStatusBadge status="Fallback Succeeded" size="sm" />
          )}
          <span className="text-palnadu-secondary">
            {supportedCount} model(s) listed
          </span>
        </div>
      </div>

      {tested.length === 0 ? (
        <p className="text-palnadu-secondary py-1">
          Generation probes skipped due to credential rejection.
        </p>
      ) : (
        <div className="space-y-2">
          {tested.map((m) => (
            <div
              key={m.model}
              className="py-1.5 border-b border-palnadu-border/60 last:border-b-0 space-y-1"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-mono text-palnadu-dark font-medium">{m.model}</span>
                <div className="flex flex-wrap items-center gap-2">
                  {typeof m.latencyMs === 'number' && (
                    <span className="font-mono text-palnadu-secondary">{m.latencyMs}ms</span>
                  )}
                  {m.attempts && m.attempts > 1 && (
                    <span className="text-palnadu-secondary">({m.attempts} attempts)</span>
                  )}
                  <span
                    className={
                      m.accessible
                        ? 'text-palnadu-teal-dark font-semibold'
                        : m.isTemporary
                          ? 'text-palnadu-warning font-semibold'
                          : 'text-palnadu-error font-semibold'
                    }
                  >
                    {m.accessible
                      ? m.model === activeUsableModel && fallbackUsed
                        ? 'Available (Fallback)'
                        : 'Available'
                      : m.failureCategory || 'Unavailable'}
                  </span>
                  {!m.accessible && (
                    <span className="text-palnadu-secondary">
                      ({m.isTemporary ? 'Temporary' : 'Permanent'})
                    </span>
                  )}
                </div>
              </div>
              {!m.accessible && m.error && (
                <p className="text-palnadu-secondary break-words">{m.error}</p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

