'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { CaseStudy } from '@palnadu/types';
import { Plus, Edit2, Trash2, X, Briefcase, ExternalLink } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { siteConfig, slugify } from '@palnadu/config';
import { cn } from '@/lib/utils';

interface CaseStudyFormData {
  title: string;
  slug: string;
  problem: string;
  solution: string;
  technology: string;
  result: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

const initialFormData: CaseStudyFormData = {
  title: '',
  slug: '',
  problem: '',
  solution: '',
  technology: '',
  result: '',
  status: 'DRAFT',
};

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
        technology: formData.technology
          .split(',')
          .map((t) => t.trim())
          .filter(Boolean),
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
        <Button
          onClick={openCreateModal}
          size="sm"
          className="gap-1.5 font-semibold text-xs h-9"
        >
          <Plus className="h-4 w-4" />
          <span>Add Case Study</span>
        </Button>
      </div>

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
                  <tr key={study.id} className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/30 transition-colors">
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
                            : 'bg-palnadu-off-white text-palnadu-body border-palnadu-border'
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
                        onClick={() => openEditModal(study)}
                        className="h-7 w-7 text-palnadu-blue hover:bg-palnadu-light-blue hover:text-palnadu-blue"
                        title="Edit Case Study"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => setDeleteTarget({ id: study.id, title: study.title })}
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

      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-lg rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8">
            <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
              <h2 className="text-sm font-bold text-palnadu-dark">
                {editingStudy ? 'Edit Case Study' : 'Add New Case Study'}
              </h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setModalOpen(false)}
                className="h-7 w-7 text-palnadu-secondary hover:text-palnadu-dark"
                aria-label="Close dialog"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-3.5 text-xs max-h-[70vh] overflow-y-auto">
              <div className="space-y-1.5">
                <Label htmlFor="cs-title" className="text-xs font-semibold text-palnadu-dark block">
                  Title <span className="text-palnadu-error">*</span>
                </Label>
                <Input
                  id="cs-title"
                  type="text"
                  required
                  minLength={2}
                  maxLength={200}
                  placeholder="e.g. Logistics Platform Modernization"
                  value={formData.title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cs-slug" className="text-xs font-semibold text-palnadu-dark block">
                  URL Slug <span className="text-palnadu-error">*</span>
                </Label>
                <Input
                  id="cs-slug"
                  type="text"
                  required
                  minLength={2}
                  maxLength={200}
                  pattern="[a-z0-9]+(-[a-z0-9]+)*"
                  title="Lowercase letters, numbers, hyphens only"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                  className="font-mono text-xs"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cs-status" className="text-xs font-semibold text-palnadu-dark block">Publication Status</Label>
                <select
                  id="cs-status"
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                  className="w-full h-9 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-pointer"
                >
                  <option value="DRAFT">Draft (Internal)</option>
                  <option value="PUBLISHED">Published (Visible on site)</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cs-problem" className="text-xs font-semibold text-palnadu-dark block">
                  Problem <span className="text-palnadu-error">*</span> <span className="font-normal text-palnadu-secondary">(min 20 chars)</span>
                </Label>
                <Textarea
                  id="cs-problem"
                  rows={3}
                  required
                  minLength={20}
                  placeholder="What business problem did the client face?"
                  value={formData.problem}
                  onChange={(e) => setFormData({ ...formData, problem: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cs-solution" className="text-xs font-semibold text-palnadu-dark block">
                  Solution <span className="text-palnadu-error">*</span> <span className="font-normal text-palnadu-secondary">(min 20 chars)</span>
                </Label>
                <Textarea
                  id="cs-solution"
                  rows={3}
                  required
                  minLength={20}
                  placeholder="What did we build and how?"
                  value={formData.solution}
                  onChange={(e) => setFormData({ ...formData, solution: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cs-technology" className="text-xs font-semibold text-palnadu-dark block">
                  Technology <span className="text-palnadu-error">*</span> <span className="font-normal text-palnadu-secondary">(comma-separated, min 1)</span>
                </Label>
                <Input
                  id="cs-technology"
                  type="text"
                  required
                  placeholder="Next.js, TypeScript, PostgreSQL"
                  value={formData.technology}
                  onChange={(e) => setFormData({ ...formData, technology: e.target.value })}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cs-result" className="text-xs font-semibold text-palnadu-dark block">
                  Result <span className="text-palnadu-error">*</span> <span className="font-normal text-palnadu-secondary">(min 20 chars)</span>
                </Label>
                <Textarea
                  id="cs-result"
                  rows={3}
                  required
                  minLength={20}
                  placeholder="Measurable outcome for the client"
                  value={formData.result}
                  onChange={(e) => setFormData({ ...formData, result: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-palnadu-border/60">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  disabled={submitting}
                >
                  {submitting ? 'Saving...' : editingStudy ? 'Update Case Study' : 'Create Case Study'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Case Study?"
        message={deleteTarget ? `Are you sure you want to delete "${deleteTarget.title}"? This action cannot be undone.` : ''}
        confirmLabel="Delete Case Study"
      />
    </div>
  );
}
