'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Client } from '@palnadu/types';
import { Plus, Search } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ProjectModal } from '@/components/projects/project-modal';
import { ProjectTable } from '@/components/projects/project-table';
import type { ProjectFormData } from '@/components/projects/types';
import { initialFormData } from '@/components/projects/types';

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
    setFormData({ ...initialFormData, clientId: clients[0]?.id || '' });
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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Projects</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Internal tracking of client contracts, development milestones, budgets, and active deliverables.
          </p>
        </div>
        <Button onClick={openCreateModal} className="gap-1.5 shrink-0">
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </Button>
      </div>

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

      <ProjectTable
        projects={projects}
        loading={loading}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
      />

      <ProjectModal
        open={modalOpen}
        editingProject={editingProject}
        formData={formData}
        clients={clients}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onChange={setFormData}
        onSubmit={handleSaveProject}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDeleteProject}
        loading={deleting}
        title="Delete Project?"
        message={deleteTarget ? `Are you sure you want to delete project "${deleteTarget.name}"?` : ''}
        confirmLabel="Delete Project"
      />
    </div>
  );
}
