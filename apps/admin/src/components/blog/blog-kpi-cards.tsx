'use client';

import React from 'react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface BlogKpiCardsProps {
  loading: boolean;
  totalPosts: number;
  publishedCount: number;
  draftCount: number;
  archivedCount: number;
  statusFilter: string;
  onStatusFilterChange: (_status: string) => void;
}

export function BlogKpiCards({
  loading,
  totalPosts,
  publishedCount,
  draftCount,
  archivedCount,
  statusFilter,
  onStatusFilterChange,
}: BlogKpiCardsProps) {
  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => onStatusFilterChange('')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onStatusFilterChange('')}
          className={cn(
            'rounded-lg border bg-white p-3.5 text-left transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue',
            statusFilter === ''
              ? 'border-palnadu-blue ring-1 ring-palnadu-blue bg-palnadu-light-blue/20'
              : 'border-palnadu-border hover:border-palnadu-blue/50'
          )}
        >
          <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Total Articles</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading && totalPosts === 0 ? '—' : totalPosts}</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onStatusFilterChange('PUBLISHED')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onStatusFilterChange('PUBLISHED')}
          className={cn(
            'rounded-lg border bg-white p-3.5 text-left transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-teal',
            statusFilter === 'PUBLISHED'
              ? 'border-palnadu-teal ring-1 ring-palnadu-teal bg-palnadu-teal/10'
              : 'border-palnadu-border hover:border-palnadu-blue/50'
          )}
        >
          <p className="text-xs font-semibold text-palnadu-teal uppercase tracking-wider">Published on Google</p>
          <p className="text-xl font-bold text-palnadu-teal mt-1">{loading && publishedCount === 0 ? '—' : publishedCount}</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onStatusFilterChange('DRAFT')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onStatusFilterChange('DRAFT')}
          className={cn(
            'rounded-lg border bg-white p-3.5 text-left transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-warning',
            statusFilter === 'DRAFT'
              ? 'border-palnadu-warning ring-1 ring-palnadu-warning bg-palnadu-warning/10'
              : 'border-palnadu-border hover:border-palnadu-blue/50'
          )}
        >
          <p className="text-xs font-semibold text-palnadu-warning uppercase tracking-wider">Drafts Pending Review</p>
          <p className="text-xl font-bold text-palnadu-warning mt-1">{loading && draftCount === 0 ? '—' : draftCount}</p>
        </div>

        <div
          role="button"
          tabIndex={0}
          onClick={() => onStatusFilterChange('ARCHIVED')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && onStatusFilterChange('ARCHIVED')}
          className={cn(
            'rounded-lg border bg-white p-3.5 text-left transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-secondary',
            statusFilter === 'ARCHIVED'
              ? 'border-palnadu-secondary ring-1 ring-palnadu-secondary bg-palnadu-off-white'
              : 'border-palnadu-border hover:border-palnadu-blue/50'
          )}
        >
          <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Archived Articles</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading && archivedCount === 0 ? '—' : archivedCount}</p>
        </div>
      </div>

      {draftCount > 0 && statusFilter !== 'DRAFT' && (
        <div className="p-3.5 rounded-xl border border-palnadu-warning/40 bg-palnadu-warning/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-palnadu-warning animate-pulse shrink-0" />
            <p className="text-xs font-semibold text-palnadu-dark">
              {draftCount} automated blog article(s) waiting in draft mode for your review.
            </p>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={() => onStatusFilterChange('DRAFT')}
            className="self-start sm:self-auto shrink-0"
          >
            Review Drafts →
          </Button>
        </div>
      )}
    </div>
  );
}
