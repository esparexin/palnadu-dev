'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import type { BlogPost } from '@palnadu/types';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { BlogFormData, initialFormData } from '@/components/blog/types';
import {
  canManageBlogAdminControls,
  getBlogSaveSuccessMessage,
  readStoredAdminRole,
} from '@/components/blog/blog-admin.util';
import { BlogPageHeader } from '@/components/blog/blog-page-header';
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
  const [adminRole, setAdminRole] = useState<string | null>(null);

  useEffect(() => {
    setAdminRole(readStoredAdminRole());
  }, []);

  const canManageAdminSettings = canManageBlogAdminControls(adminRole);

  const onSuccessDraft = () => {
    blogPosts.setStatusFilter('DRAFT');
  };

  const automation = useBlogAutomation(onSuccessDraft, blogPosts.fetchCounts);
  const keywords = useBlogKeywords(onSuccessDraft, blogPosts.fetchCounts, automation.isGenerating);

  const openCreateModal = () => {
    setEditingPost(null);
    setFormData(initialFormData);
    setModalOpen(true);
  };

  const openEditModal = (post: BlogPost) => {
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
        publishDate:
          formData.status === 'PUBLISHED'
            ? editingPost?.publishDate || new Date().toISOString()
            : editingPost
            ? null
            : undefined,
      };
      if (editingPost) {
        await api.blog.update(editingPost.id, payload);
      } else {
        await api.blog.create(payload);
      }
      toast.success(getBlogSaveSuccessMessage(Boolean(editingPost), formData.status));
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
      <BlogPageHeader
        onOpenKeywords={() => {
          keywords.setKeywordModalOpen(true);
          if (keywords.discoveredKeywords.length === 0) keywords.fetchKeywords();
        }}
        onOpenQueue={automation.fetchAutomationStatus}
        onGenerateDraft={automation.triggerAiGenerate}
        onOpenCreate={openCreateModal}
        generatingGeneralDraft={automation.generatingGeneralDraft}
        isGenerating={automation.isGenerating}
      />

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
        canDelete={canManageAdminSettings}
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
        generatingKeyword={keywords.generatingKeyword}
        isGenerating={automation.isGenerating}
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
        generatingTopicId={automation.generatingTopicId}
        isGenerating={automation.isGenerating}
        canManageSettings={canManageAdminSettings}
        onToggleAutoPublish={automation.toggleAutoPublish}
        onToggleBilingual={automation.toggleBilingual}
        onDiscoverTopics={automation.handleDiscoverTopics}
        onGenerateFromTopic={automation.generateFromTopic}
      />
    </div>
  );
}
