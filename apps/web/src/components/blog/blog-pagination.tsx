import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { BlogIndexMeta } from './blog-index-copy';

interface BlogPaginationProps {
  meta: BlogIndexMeta;
  basePath: string;
  category?: string;
  search?: string;
  isArchiveView: boolean;
  copy: any;
}

export function BlogPagination({
  meta,
  basePath,
  category,
  search,
  isArchiveView,
  copy,
}: BlogPaginationProps) {
  if (meta.totalPages <= 1) return null;

  const buildPageUrl = (pageNumber: number) => {
    return `${basePath}?page=${pageNumber}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}${isArchiveView ? '&view=archive' : ''}`;
  };

  return (
    <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-palnadu-border/60 pt-6">
      <div className="text-xs font-mono text-palnadu-secondary">
        {copy.showing(
          (meta.page - 1) * meta.limit + 1,
          Math.min(meta.page * meta.limit, meta.total),
          meta.total
        )}
      </div>

      <div className="flex items-center gap-1.5">
        {meta.page > 1 ? (
          <Link
            href={buildPageUrl(meta.page - 1)}
            className="px-3 py-1.5 rounded-lg border border-palnadu-border bg-white text-xs font-semibold text-palnadu-dark hover:bg-palnadu-light-blue hover:text-palnadu-blue transition-colors flex items-center gap-1"
          >
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{copy.previous}</span>
          </Link>
        ) : (
          <span className="px-3 py-1.5 rounded-lg border border-palnadu-border/40 bg-palnadu-off-white/50 text-xs font-semibold text-palnadu-secondary/50 cursor-not-allowed flex items-center gap-1">
            <ChevronLeft className="h-3.5 w-3.5" />
            <span>{copy.previous}</span>
          </span>
        )}

        {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
          <Link
            key={p}
            href={buildPageUrl(p)}
            className={cn(
              'h-8 w-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors',
              p === meta.page
                ? 'bg-palnadu-blue text-white shadow-sm'
                : 'border border-palnadu-border bg-white text-palnadu-body hover:bg-palnadu-light-blue hover:text-palnadu-blue'
            )}
          >
            {p}
          </Link>
        ))}

        {meta.page < meta.totalPages ? (
          <Link
            href={buildPageUrl(meta.page + 1)}
            className="px-3 py-1.5 rounded-lg border border-palnadu-border bg-white text-xs font-semibold text-palnadu-dark hover:bg-palnadu-light-blue hover:text-palnadu-blue transition-colors flex items-center gap-1"
          >
            <span>{copy.next}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </Link>
        ) : (
          <span className="px-3 py-1.5 rounded-lg border border-palnadu-border/40 bg-palnadu-off-white/50 text-xs font-semibold text-palnadu-secondary/50 cursor-not-allowed flex items-center gap-1">
            <span>{copy.next}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </span>
        )}
      </div>
    </div>
  );
}
