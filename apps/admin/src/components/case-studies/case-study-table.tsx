import type { CaseStudy } from '@palnadu/types';
import { Edit2, Trash2, Briefcase, ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig } from '@palnadu/config';
import { cn } from '@/lib/utils';

interface CaseStudyTableProps {
  studies: CaseStudy[];
  loading: boolean;
  onEdit: (_study: CaseStudy) => void;
  onDelete: (_target: { id: string; title: string }) => void;
}

export function CaseStudyTable({ studies, loading, onEdit, onDelete }: CaseStudyTableProps) {
  return (
    <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
              <th className="px-4 py-3">Title & Slug</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Updated</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-palnadu-secondary">
                  Loading case studies...
                </td>
              </tr>
            ) : studies.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-palnadu-secondary">
                  No case studies yet. Verified client results will appear here once added.
                </td>
              </tr>
            ) : (
              studies.map((study) => (
                <tr
                  key={study.id}
                  className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/30 transition-colors"
                >
                  <td className="px-4 py-3">
                    <div className="font-bold text-palnadu-dark text-xs flex items-center gap-1.5">
                      <Briefcase className="h-3.5 w-3.5 text-palnadu-blue shrink-0" />
                      <span>{study.title}</span>
                    </div>
                    <div className="font-mono text-xs text-palnadu-secondary mt-0.5">
                      /work/{study.slug}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                        study.status === 'PUBLISHED'
                          ? 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/30'
                          : 'bg-palnadu-off-white text-palnadu-body border-palnadu-border',
                      )}
                    >
                      {study.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-palnadu-secondary">
                    {new Date(study.updatedAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3 text-right space-x-1">
                    <a
                      href={`${siteConfig.url}/work/${study.slug}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center p-1.5 rounded-md text-palnadu-secondary hover:text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
                      title="View Live Page"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(study)}
                      className="h-7 w-7 text-palnadu-blue hover:bg-palnadu-light-blue hover:text-palnadu-blue"
                      title="Edit Case Study"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete({ id: study.id, title: study.title })}
                      className="h-7 w-7 text-palnadu-error hover:bg-palnadu-error/10 hover:text-palnadu-error"
                      title="Delete Case Study"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
