'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { Service } from '@palnadu/types';
import { Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { slugify } from '@palnadu/config';
import { ServiceTable } from '@/components/services/service-table';
import { ServiceModal } from '@/components/services/service-modal';
import type { ServiceFormData } from '@/components/services/types';
import { initialFormData } from '@/components/services/types';

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Core Engineering Services</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Manage public capability pages, deliverables, and directory ordering.
          </p>
        </div>
        <Button onClick={openCreateModal} size="sm" className="gap-1.5 font-semibold text-xs h-9">
          <Plus className="h-4 w-4" />
          <span>Add Service</span>
        </Button>
      </div>

      <ServiceTable
        services={services}
        loading={loading}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
      />

      <ServiceModal
        open={modalOpen}
        editingService={editingService}
        formData={formData}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onTitleChange={handleTitleChange}
        onChange={setFormData}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Service?"
        message={deleteTarget ? `Are you sure you want to delete service "${deleteTarget.title}"?` : ''}
        confirmLabel="Delete Service"
      />
    </div>
  );
}
