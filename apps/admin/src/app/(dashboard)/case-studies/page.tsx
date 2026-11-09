'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CaseStudy } from '@palnadu/types';
import { Plus } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { slugify } from '@palnadu/config';
import { CaseStudyTable } from '@/components/case-studies/case-study-table';
import { CaseStudyModal } from '@/components/case-studies/case-study-modal';
import type { CaseStudyFormData } from '@/components/case-studies/types';
import { initialFormData } from '@/components/case-studies/types';

export default function CaseStudiesPage() {
  const { toast } = useToast();
  const [studies, setStudies] = useState<CaseStudy[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingStudy, setEditingStudy] = useState<CaseStudy | null>(null);
  const [formData, setFormData] = useState<CaseStudyFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchStudies = () => {
    setLoading(true);
    api.caseStudies
      .list()
      .then((res: any) => setStudies(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchStudies();
  }, []);

  const openCreateModal = () => {
    setEditingStudy(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const openEditModal = (study: CaseStudy) => {
    setEditingStudy(study);
    setFormData({
      title: study.title,
      slug: study.slug,
      problem: study.problem,
      solution: study.solution,
      technology: (study.technology || []).join(', '),
      result: study.result,
      status: study.status,
    });
    setModalOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingStudy ? prev.slug : slugify(title),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.problem || !formData.solution || !formData.result) {
      toast.error('Please fill all required fields.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        problem: formData.problem,
        solution: formData.solution,
        technology: formData.technology.split(',').map((t) => t.trim()).filter(Boolean),
        result: formData.result,
        status: formData.status,
      };
      if (editingStudy) {
        await api.caseStudies.update(editingStudy.id, payload);
        toast.success('Case study updated successfully');
      } else {
        await api.caseStudies.create(payload);
        toast.success('Case study created successfully');
      }
      setModalOpen(false);
      fetchStudies();
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
      await api.caseStudies.delete(deleteTarget.id);
      toast.success('Case study deleted successfully');
      setDeleteTarget(null);
      fetchStudies();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete case study');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Case Studies</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">Manage portfolio projects and verified case studies.</p>
        </div>
        <Button onClick={openCreateModal} size="sm" className="gap-1.5 font-semibold text-xs h-9">
          <Plus className="h-4 w-4" />
          <span>Add Case Study</span>
        </Button>
      </div>

      <CaseStudyTable
        studies={studies}
        loading={loading}
        onEdit={openEditModal}
        onDelete={setDeleteTarget}
      />

      <CaseStudyModal
        open={modalOpen}
        editingStudy={editingStudy}
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
        title="Delete Case Study?"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"?` : ''}
        confirmLabel="Delete"
      />
    </div>
  );
}
