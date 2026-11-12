'use client';

import { useState } from 'react';
import { api } from '@/lib/api';
import type { BlogPost } from '@palnadu/types';
import { Plus, Sparkles, Loader2, Compass, ListChecks } from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { BlogFormData, initialFormData } from '@/components/blog/types';
import { BlogKpiCards } from '@/components/blog/blog-kpi-cards';
import { BlogFilters } from '@/components/blog/blog-filters';
import { BlogTable } from '@/components/blog/blog-table';
import { BlogEditorModal } from '@/components/blog/blog-editor-modal';
import { BlogKeywordModal } from '@/components/blog/blog-keyword-modal';
import { BlogQueueModal } from '@/components/blog/blog-queue-modal';
import { useBlogPosts } from '@/components/blog/use-blog-posts';
import { useBlogAutomation } from '@/components/blog/use-blog-automation';
import { useBlogKeywords } from '@/components/blog/use-blog-keywords';

export default function BlogAdminPage() {
  const { toast } = useToast();
  const blogPosts = useBlogPosts();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);

  const onSuccessDraft = () => {
    blogPosts.setStatusFilter('DRAFT');
    blogPosts.fetchPosts();
  };

  const automation = useBlogAutomation(onSuccessDraft, blogPosts.fetchCounts);
  const keywords = useBlogKeywords(onSuccessDraft, automation.setGeneratingAi);

  const openCreateModal = () => {
    setEditingPost(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const openEditModal = (post: any) => {
    setEditingPost(post);
    setFormData({
      title: post.title,
      slug: post.slug,
      language: post.language === 'te' ? 'te' : 'en',
      translationGroupId: post.translationGroupId || undefined,
      categoryId: post.categoryId || post.category?.id || undefined,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      ogImage: post.ogImage || '',
      status: post.status === 'PUBLISHED' ? 'PUBLISHED' : post.status === 'ARCHIVED' ? 'ARCHIVED' : 'DRAFT',
    });
    setModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.slug || !formData.content) {
      toast.error('Please provide Title, Slug, and Article Content.');
      return;
    }
    setSubmitting(true);
    try {
      const payload = {
        ...formData,
        categoryId: formData.categoryId || undefined,
        translationGroupId: formData.translationGroupId || undefined,
        excerpt: formData.excerpt || undefined,
        coverImage: formData.coverImage || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        ogImage: formData.ogImage || formData.coverImage || undefined,
        publishDate: editingPost?.publishDate ? editingPost.publishDate : formData.status === 'PUBLISHED' ? new Date().toISOString() : undefined,
      };
      if (editingPost) {
        await api.blog.update(editingPost.id, payload);
        toast.success('Article updated successfully');
      } else {
        await api.blog.create(payload);
        toast.success('Article published successfully');
      }
      setModalOpen(false);
      blogPosts.fetchPosts();
      blogPosts.fetchCounts();
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
      await api.blog.delete(deleteTarget.id);
      toast.success('Article deleted successfully');
      setDeleteTarget(null);
      blogPosts.fetchPosts();
      blogPosts.fetchCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-palnadu-dark">Blog & Articles</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Publish technical guides, engineering case breakdowns, and manage SEO search metadata.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => { keywords.setKeywordModalOpen(true); if (keywords.discoveredKeywords.length === 0) keywords.fetchKeywords(); }} title="Discover real Google search terms for Andhra Pradesh & Palnadu">
            <Compass className="h-4 w-4 mr-1.5 text-palnadu-blue" />
            <span>SEO Keywords</span>
          </Button>
          <Button variant="outline" size="sm" onClick={automation.fetchAutomationStatus} title="View scheduled blog queue & rotation status">
            <ListChecks className="h-4 w-4 mr-1.5 text-palnadu-teal" />
            <span>Queue Status</span>
          </Button>
          <Button variant="secondary" size="sm" onClick={automation.triggerAiGenerate} disabled={automation.generatingAi} title="Generate next scheduled AI blog draft from queue">
            {automation.generatingAi ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : <Sparkles className="h-4 w-4 mr-1.5" />}
            <span>{automation.generatingAi ? 'Generating Draft...' : 'Generate AI Blog Draft'}</span>
          </Button>
          <Button variant="default" size="sm" onClick={openCreateModal}>
            <Plus className="h-4 w-4 mr-1.5" />
            <span>New Article</span>
          </Button>
        </div>
      </div>

      <BlogKpiCards
        loading={blogPosts.loading}
        totalPosts={blogPosts.totalPosts}
        publishedCount={blogPosts.publishedCount}
        draftCount={blogPosts.draftCount}
        archivedCount={blogPosts.archivedCount}
        statusFilter={blogPosts.statusFilter}
        onStatusFilterChange={blogPosts.setStatusFilter}
      />

      <BlogFilters
        search={blogPosts.search}
        onSearchChange={blogPosts.setSearch}
        languageFilter={blogPosts.languageFilter}
        onLanguageFilterChange={blogPosts.setLanguageFilter}
        categoryFilter={blogPosts.categoryFilter}
        onCategoryFilterChange={blogPosts.setCategoryFilter}
        statusFilter={blogPosts.statusFilter}
        onStatusFilterChange={blogPosts.setStatusFilter}
        categories={blogPosts.categories}
      />

      <BlogTable
        posts={blogPosts.posts}
        loading={blogPosts.loading}
        publishingId={blogPosts.publishingId}
        onQuickPublish={blogPosts.quickPublish}
        onOpenEdit={openEditModal}
        onDeleteRequest={setDeleteTarget}
        currentPage={blogPosts.currentPage}
        pageSize={blogPosts.pageSize}
        totalPosts={blogPosts.totalPosts}
        totalPages={blogPosts.totalPages}
        onPageChange={blogPosts.setCurrentPage}
        onPageSizeChange={blogPosts.setPageSize}
      />

      <BlogEditorModal
        open={modalOpen}
        editingPost={editingPost}
        formData={formData}
        setFormData={setFormData}
        categories={blogPosts.categories}
        submitting={submitting}
        onClose={() => setModalOpen(false)}
        onSubmit={handleSubmit}
      />

      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Article?"
        message={deleteTarget ? `Are you sure you want to delete article "${deleteTarget.title}"? This action cannot be undone.` : ''}
        confirmLabel="Delete Article"
      />

      <BlogKeywordModal
        open={keywords.keywordModalOpen}
        onClose={() => keywords.setKeywordModalOpen(false)}
        keywordSeed={keywords.keywordSeed}
        onKeywordSeedChange={keywords.setKeywordSeed}
        keywordLocation={keywords.keywordLocation}
        onKeywordLocationChange={keywords.setKeywordLocation}
        discoveredKeywords={keywords.discoveredKeywords}
        searchingKeywords={keywords.searchingKeywords}
        generatingAi={automation.generatingAi}
        copiedKw={keywords.copiedKw}
        onFetchKeywords={keywords.fetchKeywords}
        onCopyKeyword={keywords.copyKeyword}
        onGenerateFromKeyword={keywords.generateFromKeyword}
      />

      <BlogQueueModal
        open={automation.queueModalOpen}
        onClose={() => automation.setQueueModalOpen(false)}
        loadingStatus={automation.loadingStatus}
        automationStatus={automation.automationStatus}
        bilingualStatus={automation.bilingualStatus}
        updatingSettings={automation.updatingSettings}
        togglingBilingual={automation.togglingBilingual}
        discoveringTopics={automation.discoveringTopics}
        generatingAi={automation.generatingAi}
        generateError={automation.generateError}
        onToggleAutoPublish={automation.toggleAutoPublish}
        onToggleBilingual={automation.toggleBilingual}
        onDiscoverTopics={automation.handleDiscoverTopics}
        onGenerateFromTopic={automation.generateFromTopic}
      />
    </div>
  );
}
