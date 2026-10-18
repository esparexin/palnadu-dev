'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Client } from '@palnadu/types';
import { FolderKanban, Plus, Calendar, DollarSign, Building, X, Search, Edit2, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-palnadu-blue/10 text-palnadu-blue border-palnadu-blue/20',
  ACTIVE: 'bg-palnadu-teal/10 text-palnadu-teal border-palnadu-teal/20',
  ON_HOLD: 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/20',
  COMPLETED: 'bg-palnadu-secondary/10 text-palnadu-secondary border-palnadu-border',
  CANCELLED: 'bg-palnadu-error/10 text-palnadu-error border-palnadu-error/20',
};

interface ProjectFormData {
  name: string;
  clientId: string;
  description: string;
  status: string;
  startDate: string;
  expectedCompletion: string;
  technology: string;
  budget: string;
}

const initialFormData: ProjectFormData = {
  name: '',
  clientId: '',
  description: '',
  status: 'ACTIVE',
  startDate: '',
  expectedCompletion: '',
  technology: 'Next.js, TypeScript, MongoDB',
  budget: '',
};

export default function ProjectsPage() {
  const { toast } = useToast();
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [formData, setFormData] = useState<ProjectFormData>(initialFormData);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const loadData = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    Promise.all([api.projects.list(params), api.clients.list()])
      .then(([projRes, clientRes]: [any, any]) => {
        setProjects(projRes.data || []);
        const fetchedClients = clientRes.data || [];
        setClients(fetchedClients);
        if (fetchedClients.length > 0 && !formData.clientId) {
          setFormData((prev) => ({ ...prev, clientId: fetchedClients[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const openCreateModal = () => {
    setEditingProject(null);
    setFormData({
      ...initialFormData,
      clientId: clients[0]?.id || '',
    });
    setModalOpen(true);
  };

  const openEditModal = (project: any) => {
    setEditingProject(project);
    setFormData({
      name: project.name,
      clientId: project.clientId || project.client?.id || '',
      description: project.description || '',
      status: project.status || 'ACTIVE',
      startDate: project.startDate ? project.startDate.split('T')[0] : '',
      expectedCompletion: project.expectedCompletion ? project.expectedCompletion.split('T')[0] : '',
      technology: Array.isArray(project.technology) ? project.technology.join(', ') : '',
      budget: project.budget || '',
    });
    setModalOpen(true);
  };

  const handleSaveProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId) {
      toast.error('Please enter a project name and select a client.');
      return;
    }

    setSubmitting(true);
    try {
      const techArray = formData.technology
        ? formData.technology.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      const payload = {
        name: formData.name,
        clientId: formData.clientId,
        description: formData.description || undefined,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        expectedCompletion: formData.expectedCompletion ? new Date(formData.expectedCompletion).toISOString() : undefined,
        technology: techArray,
        budget: formData.budget || undefined,
      };

      if (editingProject) {
        await api.projects.update(editingProject.id, payload);
        toast.success('Project updated successfully');
      } else {
        await api.projects.create(payload);
        toast.success('Project created successfully');
      }

      setModalOpen(false);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDeleteProject = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.projects.delete(deleteTarget.id);
      toast.success('Project deleted successfully');
      setDeleteTarget(null);
      loadData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete project');
    } finally {
      setDeleting(false);
    }
  };

  const activeCount = projects.filter((p) => p.status === 'ACTIVE').length;
  const planningCount = projects.filter((p) => p.status === 'PLANNING').length;
  const completedCount = projects.filter((p) => p.status === 'COMPLETED').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Projects</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Internal tracking of client contracts, development milestones, budgets, and active deliverables.
          </p>
        </div>
        <Button
          onClick={openCreateModal}
          className="gap-1.5 shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-sm">
          <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Total Engagements</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading ? '—' : projects.length}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-sm">
          <p className="text-xs font-semibold text-palnadu-teal uppercase tracking-wider">Active In Dev</p>
          <p className="text-xl font-bold text-palnadu-teal mt-1">{loading ? '—' : activeCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-sm">
          <p className="text-xs font-semibold text-palnadu-blue uppercase tracking-wider">Planning / Sprints</p>
          <p className="text-xl font-bold text-palnadu-blue mt-1">{loading ? '—' : planningCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-sm">
          <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Delivered & Closed</p>
          <p className="text-xl font-bold text-palnadu-secondary mt-1">{loading ? '—' : completedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-palnadu-secondary pointer-events-none" />
          <Input
            type="text"
            placeholder="Search projects or clients..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="h-9 rounded-md border border-palnadu-border bg-white px-2.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="ACTIVE">Active in Dev</option>
            <option value="PLANNING">Planning</option>
            <option value="ON_HOLD">On Hold</option>
            <option value="COMPLETED">Completed</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Projects Table */}
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
                  <td colSpan={7} className="px-4 py-12 text-center text-palnadu-secondary">
                    Loading project records...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-palnadu-secondary">
                    <p className="font-semibold text-palnadu-dark">No projects found</p>
                    <p className="text-xs text-palnadu-secondary mt-1">
                      {search || statusFilter ? 'Try adjusting your search criteria.' : 'Create your first project engagement.'}
                    </p>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr
                    key={project.id}
                    className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
                  >
                    {/* Name & Details */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-palnadu-dark text-xs flex items-center gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5 text-palnadu-blue shrink-0" />
                        <span>{project.name}</span>
                      </div>
                      {project.description && (
                        <p className="text-xs text-palnadu-secondary line-clamp-1 mt-0.5">
                          {project.description}
                        </p>
                      )}
                    </td>

                    {/* Client */}
                    <td className="px-4 py-3">
                      <div className="font-semibold text-palnadu-dark flex items-center gap-1">
                        <Building className="h-3 w-3 text-palnadu-secondary" />
                        <span>{project.client?.name || 'Unassigned'}</span>
                      </div>
                      {project.client?.company && (
                        <p className="text-xs text-palnadu-secondary">{project.client.company}</p>
                      )}
                    </td>

                    {/* Technology Stack */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
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

                    {/* Budget */}
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

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                          statusColors[project.status] || 'bg-palnadu-secondary/10 text-palnadu-secondary border-palnadu-border',
                        )}
                      >
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Timeline */}
                    <td className="px-4 py-3 text-palnadu-secondary text-xs">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-palnadu-secondary/70" />
                        <span>Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="text-xs text-palnadu-secondary/70 pl-4">
                        Due: {project.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : '—'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => openEditModal(project)}
                        className="h-7 w-7 text-palnadu-blue hover:bg-palnadu-light-blue"
                        title="Edit Project"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget({ id: project.id, name: project.name })}
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

      {/* Project Modal (Create / Edit) */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-white p-6 shadow-xl space-y-4 my-8 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-palnadu-border/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-palnadu-dark">
                  {editingProject ? 'Edit Project' : 'Create New Project'}
                </h2>
                <p className="text-xs text-palnadu-secondary">
                  {editingProject ? 'Update project scope, deliverables, or status.' : 'Register a new client engagement or software deliverable.'}
                </p>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                className="h-7 w-7 text-palnadu-secondary hover:text-palnadu-dark"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSaveProject} className="space-y-3.5 text-xs">
              {/* Project Name */}
              <div className="space-y-1">
                <Label>Project Name *</Label>
                <Input
                  type="text"
                  placeholder="e.g. Agritech Logistics Portal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                />
              </div>

              {/* Client Selection */}
              <div className="space-y-1">
                <Label>Associated Client *</Label>
                {clients.length === 0 ? (
                  <div className="p-2.5 rounded-md bg-palnadu-warning/10 border border-palnadu-warning/20 text-xs text-palnadu-warning">
                    No clients exist yet. Please create a Client first in <a href="/clients" className="underline font-bold">Clients</a>.
                  </div>
                ) : (
                  <select
                    value={formData.clientId}
                    onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                    required
                    className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                  >
                    {clients.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name} {c.company ? `(${c.company})` : ''}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Status & Budget */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Status</Label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active in Dev</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                    <option value="CANCELLED">Cancelled</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <Label>Budget / Value</Label>
                  <Input
                    type="text"
                    placeholder="e.g. ₹2,50,000 / $3,000"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                  />
                </div>
              </div>

              {/* Dates */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Start Date</Label>
                  <Input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  />
                </div>

                <div className="space-y-1">
                  <Label>Target Delivery</Label>
                  <Input
                    type="date"
                    value={formData.expectedCompletion}
                    onChange={(e) => setFormData({ ...formData, expectedCompletion: e.target.value })}
                  />
                </div>
              </div>

              {/* Technology */}
              <div className="space-y-1">
                <Label>Technologies (comma separated)</Label>
                <Input
                  type="text"
                  placeholder="e.g. Next.js, TypeScript, Tailwind, MongoDB"
                  value={formData.technology}
                  onChange={(e) => setFormData({ ...formData, technology: e.target.value })}
                />
              </div>

              {/* Description */}
              <div className="space-y-1">
                <Label>Scope Description</Label>
                <Textarea
                  rows={2}
                  placeholder="Briefly state key deliverables or scope boundaries..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                />
              </div>

              {/* Actions */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-palnadu-border/60">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={submitting || clients.length === 0}
                >
                  {submitting ? 'Saving...' : editingProject ? 'Save Changes' : 'Create Project'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Project Web Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteProject}
        loading={deleting}
        title="Delete Project?"
        message={deleteTarget ? `Are you sure you want to delete project "${deleteTarget.name}"? This action cannot be undone.` : ''}
        confirmLabel="Delete Project"
      />
    </div>
  );
}
