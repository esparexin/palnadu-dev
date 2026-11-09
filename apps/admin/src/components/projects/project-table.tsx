import { FolderKanban, Calendar, DollarSign, Building, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { statusColors } from './types';

interface ProjectTableProps {
  projects: any[];
  loading: boolean;
  onEdit: (_project: any) => void;
  onDelete: (_target: { id: string; name: string }) => void;
}

export function ProjectTable({ projects, loading, onEdit, onDelete }: ProjectTableProps) {
  return (
    <div className="rounded-lg border border-palnadu-border bg-white shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-xs">
          <thead>
            <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
              <th className="px-4 py-3">Project & Description</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Tech Stack</th>
              <th className="px-4 py-3">Budget</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Timeline</th>
              <th className="px-4 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="px-4 py-8 text-center text-palnadu-secondary">
                  Loading engagements and client contracts...
                </td>
              </tr>
            ) : projects.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-4 py-12 text-center text-palnadu-secondary">
                  <FolderKanban className="mx-auto h-8 w-8 text-palnadu-secondary/40 mb-2" />
                  <p className="font-semibold text-palnadu-dark">No projects found</p>
                  <p className="text-xs text-palnadu-secondary mt-0.5">
                    Click &ldquo;New Project&rdquo; above to create your first client contract.
                  </p>
                </td>
              </tr>
            ) : (
              projects.map((project) => (
                <tr
                  key={project.id}
                  className="border-b border-palnadu-border/60 hover:bg-palnadu-off-white/30 transition-colors"
                >
                  <td className="px-4 py-3 max-w-xs">
                    <p className="font-bold text-palnadu-dark truncate">{project.name}</p>
                    {project.description && (
                      <p className="text-xs text-palnadu-secondary line-clamp-1 mt-0.5">
                        {project.description}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-palnadu-dark font-medium">
                    {project.client ? (
                      <div className="flex items-center gap-1.5">
                        <Building className="h-3 w-3 text-palnadu-secondary shrink-0" />
                        <span className="truncate">
                          {project.client.name}{' '}
                          {project.client.company ? `(${project.client.company})` : ''}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs text-palnadu-secondary/60 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1 max-w-[200px]">
                      {project.technology && project.technology.length > 0 ? (
                        project.technology.map((tech: string) => (
                          <span
                            key={tech}
                            className="px-2 py-0.5 rounded-md bg-palnadu-off-white border border-palnadu-border text-xs font-mono text-palnadu-body"
                          >
                            {tech}
                          </span>
                        ))
                      ) : (
                        <span className="text-xs text-palnadu-secondary/60 italic">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 font-semibold text-palnadu-dark">
                    {project.budget ? (
                      <span className="inline-flex items-center gap-0.5">
                        <DollarSign className="h-3 w-3 text-palnadu-teal" />
                        <span>{project.budget}</span>
                      </span>
                    ) : (
                      <span className="text-xs text-palnadu-secondary/60 italic">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={cn(
                        'inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                        statusColors[project.status] ||
                          'bg-palnadu-secondary/10 text-palnadu-secondary border-palnadu-border',
                      )}
                    >
                      {project.status.replace(/_/g, ' ')}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-palnadu-secondary text-xs">
                    <div className="flex items-center gap-1">
                      <Calendar className="h-3 w-3 text-palnadu-secondary/70" />
                      <span>
                        Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
                      </span>
                    </div>
                    <div className="text-xs text-palnadu-secondary/70 pl-4">
                      Due:{' '}
                      {project.expectedCompletion
                        ? new Date(project.expectedCompletion).toLocaleDateString()
                        : '—'}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right space-x-1.5">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onEdit(project)}
                      className="h-7 w-7 text-palnadu-blue hover:bg-palnadu-light-blue"
                      title="Edit Project"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => onDelete({ id: project.id, name: project.name })}
                      className="h-7 w-7 text-palnadu-error hover:bg-palnadu-error/10"
                      title="Delete Project"
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
