'use client';

import React from 'react';
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

interface BlogPaginationProps {
  currentPage: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
  loading: boolean;
  onPageChange: (_page: number) => void;
  onPageSizeChange: (_size: number) => void;
}

export function BlogPagination({
  currentPage,
  pageSize,
  totalPosts,
  totalPages,
  loading,
  onPageChange,
  onPageSizeChange,
}: BlogPaginationProps) {
  return (
    <div className="px-4 py-3 bg-white border-t border-palnadu-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-palnadu-secondary">
      <div className="flex items-center gap-3">
        <span>
          Showing <span className="font-semibold text-palnadu-dark">{totalPosts === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
          <span className="font-semibold text-palnadu-dark">{Math.min(currentPage * pageSize, totalPosts)}</span> of{' '}
          <span className="font-semibold text-palnadu-dark">{totalPosts}</span> articles
        </span>
        <div className="flex items-center gap-1.5 pl-3 border-l border-palnadu-border/80">
          <Label htmlFor="blog-page-size" className="font-normal text-palnadu-secondary">Per page:</Label>
          <select
            id="blog-page-size"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="h-9 rounded-md border border-palnadu-border bg-white px-2.5 text-xs font-semibold text-palnadu-dark cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
          >
            <option value={10}>10</option>
            <option value={20}>20</option>
            <option value={50}>50</option>
            <option value={100}>100</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageChange(1)}
          disabled={currentPage <= 1 || loading}
          className="h-7 w-7 p-0"
          title="First page"
          aria-label="First page"
        >
          <ChevronsLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage <= 1 || loading}
          className="h-7 w-7 p-0"
          title="Previous page"
          aria-label="Previous page"
        >
          <ChevronLeft className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <div className="flex items-center gap-1 px-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
            .map((p, i, arr) => {
              const prev = arr[i - 1];
              const showEllipsis = prev && p - prev > 1;
              return (
                <div key={p} className="flex items-center gap-1">
                  {showEllipsis && <span className="px-1 text-palnadu-secondary">…</span>}
                  <Button
                    size="sm"
                    variant={currentPage === p ? 'default' : 'outline'}
                    onClick={() => onPageChange(p)}
                    className="h-7 min-w-[28px] px-2 text-xs font-semibold"
                  >
                    {p}
                  </Button>
                </div>
              );
            })}
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage >= totalPages || loading}
          className="h-7 w-7 p-0"
          title="Next page"
          aria-label="Next page"
        >
          <ChevronRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
        <Button
          type="button"
          size="sm"
          variant="outline"
          onClick={() => onPageChange(totalPages)}
          disabled={currentPage >= totalPages || loading}
          className="h-7 w-7 p-0"
          title="Last page"
          aria-label="Last page"
        >
          <ChevronsRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Button>
      </div>
    </div>
  );
}
