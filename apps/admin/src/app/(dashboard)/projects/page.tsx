'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Project, Client } from '@palnadu/types';
import { FolderKanban, Plus, Calendar, DollarSign, Cpu, Building, X, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

const statusColors: Record<string, string> = {
  PLANNING: 'bg-blue-100 text-blue-800 border-blue-200',
  ACTIVE: 'bg-emerald-100 text-emerald-800 border-emerald-200',
  ON_HOLD: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  COMPLETED: 'bg-gray-100 text-gray-800 border-gray-200',
  CANCELLED: 'bg-red-100 text-red-800 border-red-200',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<any[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // New Project Form State
  const [formData, setFormData] = useState({
    name: '',
    clientId: '',
    description: '',
    status: 'ACTIVE',
    startDate: '',
    expectedCompletion: '',
    technology: 'Next.js, TypeScript, MongoDB',
    budget: '',
  });

  const loadData = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;

    Promise.all([api.projects.list(params), api.clients.list()])
      .then(([projRes, clientRes]: [any, any]) => {
        setProjects(projRes.data || []);
        setClients(clientRes.data || []);
        if (clientRes.data?.length > 0 && !formData.clientId) {
          setFormData((prev) => ({ ...prev, clientId: clientRes.data[0].id }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadData();
  }, [search, statusFilter]);

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.clientId) {
      alert('Please enter a project name and select a client.');
      return;
    }

    setSubmitting(true);
    try {
      const techArray = formData.technology
        ? formData.technology.split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      await api.projects.create({
        name: formData.name,
        clientId: formData.clientId,
        description: formData.description || undefined,
        status: formData.status,
        startDate: formData.startDate ? new Date(formData.startDate).toISOString() : undefined,
        expectedCompletion: formData.expectedCompletion ? new Date(formData.expectedCompletion).toISOString() : undefined,
        technology: techArray,
        budget: formData.budget || undefined,
      });

      setModalOpen(false);
      setFormData({
        name: '',
        clientId: clients[0]?.id || '',
        description: '',
        status: 'ACTIVE',
        startDate: '',
        expectedCompletion: '',
        technology: 'Next.js, TypeScript, MongoDB',
        budget: '',
      });
      loadData();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to create project');
    } finally {
      setSubmitting(false);
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
        <button
          onClick={() => setModalOpen(true)}
          className="inline-flex items-center justify-center gap-1.5 h-9 rounded-md bg-palnadu-blue px-4 text-xs font-semibold text-white hover:bg-[#12487e] shadow-xs cursor-pointer transition-colors shrink-0"
        >
          <Plus className="h-4 w-4" />
          <span>New Project</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-palnadu-secondary uppercase tracking-wider">Total Engagements</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading ? '—' : projects.length}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Active In Dev</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{loading ? '—' : activeCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-blue-700 uppercase tracking-wider">Planning / Sprints</p>
          <p className="text-xl font-bold text-blue-700 mt-1">{loading ? '—' : planningCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-gray-700 uppercase tracking-wider">Delivered & Closed</p>
          <p className="text-xl font-bold text-gray-700 mt-1">{loading ? '—' : completedCount}</p>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col gap-3 sm:flex-row items-center justify-between">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-palnadu-secondary" />
          <input
            type="text"
            placeholder="Search projects by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex h-9 w-full rounded-md border border-palnadu-border bg-white pl-9 pr-3 py-1.5 text-xs text-palnadu-dark placeholder:text-palnadu-secondary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
          >
            <option value="">All Statuses</option>
            {Object.keys(statusColors).map((status) => (
              <option key={status} value={status}>
                {status.replace(/_/g, ' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Projects Registry Table */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
                <th className="px-4 py-3">Project Name & Scope</th>
                <th className="px-4 py-3">Client</th>
                <th className="px-4 py-3">Technology Stack</th>
                <th className="px-4 py-3">Budget</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Milestones</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-4 py-8 text-center text-palnadu-secondary">
                    Loading projects...
                  </td>
                </tr>
              ) : projects.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-4 py-10 text-center space-y-2">
                    <p className="font-semibold text-palnadu-dark">No Projects Registered</p>
                    <p className="text-xs text-palnadu-secondary max-w-sm mx-auto">
                      Click &ldquo;New Project&rdquo; to start tracking an active development contract or milestone.
                    </p>
                  </td>
                </tr>
              ) : (
                projects.map((project) => (
                  <tr key={project.id} className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors">
                    {/* Project & Scope */}
                    <td className="px-4 py-3">
                      <div className="font-bold text-palnadu-dark text-xs flex items-center gap-1.5">
                        <FolderKanban className="h-3.5 w-3.5 text-palnadu-blue shrink-0" />
                        <span>{project.name}</span>
                      </div>
                      {project.description && (
                        <p className="text-[11px] text-palnadu-secondary line-clamp-1 mt-0.5">
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
                        <p className="text-[10px] text-palnadu-secondary">{project.client.company}</p>
                      )}
                    </td>

                    {/* Technology Stack */}
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1 max-w-xs">
                        {project.technology && project.technology.length > 0 ? (
                          project.technology.map((tech: string) => (
                            <span
                              key={tech}
                              className="px-2 py-0.5 rounded-md bg-palnadu-off-white border border-palnadu-border text-[10px] font-mono text-palnadu-body"
                            >
                              {tech}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-palnadu-secondary/60 italic">—</span>
                        )}
                      </div>
                    </td>

                    {/* Budget */}
                    <td className="px-4 py-3 font-semibold text-palnadu-dark">
                      {project.budget ? (
                        <span className="inline-flex items-center gap-0.5">
                          <DollarSign className="h-3 w-3 text-emerald-600" />
                          <span>{project.budget}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] text-palnadu-secondary/60 italic">—</span>
                      )}
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          statusColors[project.status] || 'bg-gray-100 text-gray-800 border-gray-200',
                        )}
                      >
                        {project.status.replace(/_/g, ' ')}
                      </span>
                    </td>

                    {/* Timeline */}
                    <td className="px-4 py-3 text-palnadu-secondary text-[11px]">
                      <div className="flex items-center gap-1">
                        <Calendar className="h-3 w-3 text-palnadu-secondary/70" />
                        <span>Start: {project.startDate ? new Date(project.startDate).toLocaleDateString() : '—'}</span>
                      </div>
                      <div className="text-[10px] text-palnadu-secondary/70 pl-4">
                        Due: {project.expectedCompletion ? new Date(project.expectedCompletion).toLocaleDateString() : '—'}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Project Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-xs p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-white p-6 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-palnadu-border/60 pb-3">
              <div>
                <h2 className="text-base font-bold text-palnadu-dark">Create New Project</h2>
                <p className="text-xs text-palnadu-secondary">Register a new client engagement or software deliverable.</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-md text-palnadu-secondary hover:text-palnadu-dark hover:bg-palnadu-off-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleCreateProject} className="space-y-3.5 text-xs">
              {/* Project Name */}
              <div className="space-y-1">
                <label className="font-semibold text-palnadu-dark block">Project Name *</label>
                <input
                  type="text"
                  placeholder="e.g. Agritech Logistics Portal"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  required
                  className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                />
              </div>

              {/* Client Selection */}
              <div className="space-y-1">
                <label className="font-semibold text-palnadu-dark block">Assigned Client *</label>
                {clients.length === 0 ? (
                  <div className="p-2.5 rounded-md bg-yellow-50 border border-yellow-200 text-[11px] text-yellow-800">
                    No clients exist yet. Please create a Client first or convert an inquiry in <a href="/leads" className="underline font-bold">Leads</a>.
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
                        {c.name} {c.company ? `(${c.company})` : ''} - {c.email}
                      </option>
                    ))}
                  </select>
                )}
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="font-semibold text-palnadu-dark block">Scope / Description</label>
                <textarea
                  rows={2}
                  placeholder="Summary of deliverables, MVP scope, or automation workflow..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full rounded-md border border-palnadu-border bg-white p-2.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                />
              </div>

              {/* Technology & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-palnadu-dark block">Tech Stack (comma separated)</label>
                  <input
                    type="text"
                    placeholder="Next.js, PostgreSQL, Node"
                    value={formData.technology}
                    onChange={(e) => setFormData({ ...formData, technology: e.target.value })}
                    className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-palnadu-dark block">Budget</label>
                  <input
                    type="text"
                    placeholder="e.g. ₹3,50,000 / $4,200"
                    value={formData.budget}
                    onChange={(e) => setFormData({ ...formData, budget: e.target.value })}
                    className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                  />
                </div>
              </div>

              {/* Dates & Status */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="space-y-1">
                  <label className="font-semibold text-palnadu-dark block">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                    className="w-full h-9 rounded-md border border-palnadu-border bg-white px-2.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                  >
                    <option value="PLANNING">Planning</option>
                    <option value="ACTIVE">Active</option>
                    <option value="ON_HOLD">On Hold</option>
                    <option value="COMPLETED">Completed</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-palnadu-dark block">Start Date</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    className="w-full h-9 rounded-md border border-palnadu-border bg-white px-2 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-semibold text-palnadu-dark block">Target Delivery</label>
                  <input
                    type="date"
                    value={formData.expectedCompletion}
                    onChange={(e) => setFormData({ ...formData, expectedCompletion: e.target.value })}
                    className="w-full h-9 rounded-md border border-palnadu-border bg-white px-2 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                  />
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-end gap-2 pt-3 border-t border-palnadu-border/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-3.5 py-2 rounded-md border border-palnadu-border text-xs font-semibold text-palnadu-secondary hover:bg-palnadu-off-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || clients.length === 0}
                  className="px-4 py-2 rounded-md bg-palnadu-blue text-xs font-semibold text-white hover:bg-[#12487e] disabled:opacity-50 cursor-pointer shadow-xs"
                >
                  {submitting ? 'Creating...' : 'Create Project'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
