'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Project } from '@palnadu/types';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-100 text-blue-800',
  ACTIVE: 'bg-green-100 text-green-800',
  ON_HOLD: 'bg-yellow-100 text-yellow-800',
  COMPLETED: 'bg-gray-100 text-gray-800',
  CANCELLED: 'bg-red-100 text-red-800',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.projects
      .list()
      .then((res: any) => setProjects(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Projects</h1>
          <p className="text-muted-foreground">Manage active and past projects.</p>
        </div>
        <button className="inline-flex h-10 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          New Project
        </button>
      </div>

      <div className="rounded-lg border">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Project</th>
                <th className="px-4 py-3 text-left font-medium">Status</th>
                <th className="px-4 py-3 text-left font-medium">Start Date</th>
                <th className="px-4 py-3 text-left font-medium">Expected Completion</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">
                    No projects yet.
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b hover:bg-muted/30">
                    <td className="px-4 py-3">
                      <div className="font-medium">{project.name}</div>
                      {project.description && (
                        <p className="text-xs text-muted-foreground line-clamp-1">{project.description}</p>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={cn('rounded-full px-2 py-0.5 text-xs font-medium', statusColors[project.status])}>
                        {project.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {project.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
