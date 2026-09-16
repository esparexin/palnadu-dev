'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Service } from '@palnadu/types';
import { Plus, Edit2, Trash2, X, Briefcase, ExternalLink } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { siteConfig } from '@palnadu/config';
import { cn } from '@/lib/utils';

interface ServiceFormData {
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
  order: number;
}

const initialFormData: ServiceFormData = {
  title: '',
  slug: '',
  shortDescription: '',
  content: '',
  status: 'PUBLISHED',
  order: 0,
};

function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function ServicesAdminPage() {
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingService, setEditingService] = useState<Service | null>(null);
  const [formData, setFormData] = useState<ServiceFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchServices = () => {
    setLoading(true);
    api.services
      .list()
      .then((res: any) => setServices(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchServices();
  }, []);

  const openCreateModal = () => {
    setEditingService(null);
    setFormData({
      ...initialFormData,
      order: services.length + 1,
    });
    setModalOpen(true);
  };

  const openEditModal = (service: Service) => {
    setEditingService(service);
    setFormData({
      title: service.title,
      slug: service.slug,
      shortDescription: service.shortDescription,
      content: service.content,
      status: service.status,
      order: service.order,
    });
    setModalOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingService ? prev.slug : slugify(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.shortDescription || !formData.content) {
      toast.error('Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      if (editingService) {
        await api.services.update(editingService.id, formData);
        toast.success('Service updated successfully');
      } else {
        await api.services.create(formData);
        toast.success('Service created successfully');
      }
      setModalOpen(false);
      fetchServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      setDeleting(true);
      await api.services.delete(deleteTarget.id);
      toast.success('Service deleted successfully');
      setDeleteTarget(null);
      fetchServices();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete service');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Core Engineering Services</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Manage public capability pages, deliverables, and directory ordering.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-palnadu-blue px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#12487e] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </button>
      </div>

      {/* Services Table */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Service Title & Slug</th>
                <th className="px-4 py-3">Deliverables Summary</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-palnadu-secondary">
                    Loading services...
                  </td>
                </tr>
              ) : services.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-palnadu-secondary">
                    No services found. Add your first service capability above.
                  </td>
                </tr>
              ) : (
                services.map((service) => (
                  <tr
                    key={service.id}
                    className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
                  >
                    <td className="px-4 py-3 font-mono text-palnadu-secondary font-bold">
                      0{service.order}
                    </td>
                    <td className="px-4 py-3">
                      <div className="font-bold text-palnadu-dark text-xs flex items-center gap-1.5">
                        <Briefcase className="h-3.5 w-3.5 text-palnadu-blue shrink-0" />
                        <span>{service.title}</span>
                      </div>
                      <div className="font-mono text-[11px] text-palnadu-secondary mt-0.5">
                        /services/{service.slug}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-palnadu-body max-w-sm">
                      <p className="line-clamp-2 leading-relaxed text-[11px]">
                        {service.shortDescription}
                      </p>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          service.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        )}
                      >
                        {service.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right space-x-1.5">
                      <a
                        href={`${siteConfig.url}/services/${service.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center p-1.5 rounded-md text-palnadu-secondary hover:text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
                        title="View Live Page"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                      <button
                        onClick={() => openEditModal(service)}
                        className="inline-flex items-center p-1.5 rounded-md hover:bg-palnadu-light-blue text-palnadu-blue transition-colors cursor-pointer"
                        title="Edit Service"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => setDeleteTarget({ id: service.id, title: service.title })}
                        className="inline-flex items-center p-1.5 rounded-md hover:bg-red-50 text-palnadu-error transition-colors cursor-pointer"
                        title="Delete Service"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create / Edit Service Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
              <h2 className="text-sm font-bold text-palnadu-dark">
                {editingService ? 'Edit Engineering Service' : 'Add New Service Capability'}
              </h2>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-palnadu-secondary hover:text-palnadu-dark transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-semibold text-palnadu-dark block">
                  Service Title <span className="text-palnadu-error">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AI Workflow Automation"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="font-semibold text-palnadu-dark block">
                    URL Slug <span className="text-palnadu-error">*</span>
                  </label>
                  <div className="flex items-center rounded-md border border-palnadu-border bg-palnadu-off-white/50 px-2 h-8">
                    <span className="text-[11px] text-palnadu-secondary shrink-0 font-mono">/services/</span>
                    <input
                      type="text"
                      required
                      value={formData.slug}
                      onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                      className="w-full bg-transparent px-1 text-xs font-mono text-palnadu-dark focus-visible:outline-none"
                    />
                  </div>
                </div>

                <div className="col-span-1 space-y-1">
                  <label className="font-semibold text-palnadu-dark block">Display Order</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.order}
                    onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 1 })}
                    className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-palnadu-dark block">Publication Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                >
                  <option value="PUBLISHED">Published (Visible on site)</option>
                  <option value="DRAFT">Draft (Internal)</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-palnadu-dark block">
                  Short Deliverables Summary <span className="text-palnadu-error">*</span>
                </label>
                <textarea
                  rows={2}
                  required
                  placeholder="2-sentence description for cards and search snippets..."
                  value={formData.shortDescription}
                  onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
                  className="w-full rounded-md border border-palnadu-border bg-white p-2.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                />
              </div>

              <div className="space-y-1">
                <label className="font-semibold text-palnadu-dark block">
                  Full Service Page Content <span className="text-palnadu-error">*</span>
                </label>
                <textarea
                  rows={5}
                  required
                  placeholder="Detailed breakdown of problems solved, deliverables, and technical architecture..."
                  value={formData.content}
                  onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                  className="w-full rounded-md border border-palnadu-border bg-white p-2.5 text-xs font-mono text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-palnadu-border/60">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="rounded-md border border-palnadu-border bg-white px-3.5 py-1.5 text-xs font-semibold text-palnadu-dark hover:bg-palnadu-off-white transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="rounded-md bg-palnadu-blue px-4 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#12487e] transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Saving...' : editingService ? 'Update Service' : 'Create Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Delete Service Web Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Service?"
        message={deleteTarget ? `Are you sure you want to delete service "${deleteTarget.title}"? This action cannot be undone.` : ''}
        confirmLabel="Delete Service"
      />
    </div>
  );
}
