'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import type { BlogPost } from '@palnadu/types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  X,
  Globe,
  Eye,
  FileText,
  CheckCircle2,
  Sparkles,
  ExternalLink,
  UploadCloud,
  Loader2,
  Compass,
  Copy,
  Check,
  ListChecks,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  Archive,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';
import { useToast } from '@/components/ui/toast';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { siteConfig, slugify } from '@palnadu/config';
import { cn } from '@/lib/utils';

interface BlogFormData {
  title: string;
  slug: string;
  language: 'en' | 'te';
  translationGroupId?: string;
  categoryId?: string;
  excerpt: string;
  content: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  status: 'DRAFT' | 'PUBLISHED' | 'ARCHIVED';
}

const initialFormData: BlogFormData = {
  title: '',
  slug: '',
  language: 'en',
  translationGroupId: undefined,
  categoryId: undefined,
  excerpt: '',
  content: '',
  coverImage: '',
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  status: 'DRAFT',
};

export default function BlogAdminPage() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);

  const [uploadingCover, setUploadingCover] = useState(false);
  const [generatingAi, setGeneratingAi] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; title: string } | null>(null);
  const [deleting, setDeleting] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  // Pagination & Counts State
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);

  // SEO Keyword Research Tool modal state
  const [keywordModalOpen, setKeywordModalOpen] = useState(false);
  const [keywordSeed, setKeywordSeed] = useState('billing software');
  const [keywordLocation, setKeywordLocation] = useState('Guntur & Palnadu');
  const [discoveredKeywords, setDiscoveredKeywords] = useState<any[]>([]);
  const [searchingKeywords, setSearchingKeywords] = useState(false);
  const [copiedKw, setCopiedKw] = useState<string | null>(null);

  // Automation queue modal state
  const [queueModalOpen, setQueueModalOpen] = useState(false);
  const [automationStatus, setAutomationStatus] = useState<any | null>(null);
  const [loadingStatus, setLoadingStatus] = useState(false);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const res: any = await api.media.upload(file);
      const url = res?.data?.url || res?.url;
      if (url) {
        setFormData((prev) => ({
          ...prev,
          coverImage: url,
          ogImage: prev.ogImage || url,
        }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const fetchCounts = () => {
    // Non-blocking background fetch for status KPI counts
    api.automation
      .status()
      .then((autoRes: any) => {
        if (autoRes?.data?.statistics) {
          setPublishedCount(autoRes.data.statistics.publishedPosts || 0);
          setDraftCount(autoRes.data.statistics.draftPosts || 0);
          setArchivedCount(autoRes.data.statistics.archivedPosts || 0);
        }
      })
      .catch(() => {
        // Non-blocking: background metrics failure must not interrupt table operations
      });
  };

  const fetchPosts = () => {
    setLoading(true);
    const params: Record<string, string> = {
      page: String(currentPage),
      limit: String(pageSize),
    };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    if (languageFilter) params.language = languageFilter;

    Promise.all([
      api.blog.list(params),
      api.blog.categories(),
    ])
      .then(([postsRes, catRes]: [any, any]) => {
        setPosts(postsRes.data || []);
        if (postsRes.meta) {
          setTotalPosts(postsRes.meta.total || 0);
          setTotalPages(postsRes.meta.totalPages || 1);
        }
        setCategories(catRes.data || []);
      })
      .catch((err) => {
        toast.error(err instanceof Error ? err.message : 'Failed to load articles');
      })
      .finally(() => setLoading(false));
  };

  // Reset to page 1 whenever filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [search, statusFilter, categoryFilter, languageFilter, pageSize]);

  useEffect(() => {
    fetchPosts();
  }, [currentPage, pageSize, search, statusFilter, categoryFilter, languageFilter]);

  // Initial non-blocking load of KPI counter statistics
  useEffect(() => {
    fetchCounts();
  }, []);

  const openCreateModal = () => {
    setEditingPost(null);
    setFormData(initialFormData);
    setActiveTab('content');
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
    setActiveTab('content');
    setModalOpen(true);
  };

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      // Auto-suggest slug only when creating new post
      slug: editingPost ? prev.slug : slugify(title),
      // Auto-suggest SEO title if empty
      seoTitle: prev.seoTitle || (title ? `${title} | Palnadu.dev` : ''),
    }));
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
        title: formData.title,
        slug: formData.slug,
        language: formData.language,
        translationGroupId: formData.translationGroupId || undefined,
        categoryId: formData.categoryId || undefined,
        excerpt: formData.excerpt || undefined,
        content: formData.content,
        coverImage: formData.coverImage || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        ogImage: formData.ogImage || formData.coverImage || undefined,
        status: formData.status,
        publishDate: editingPost?.publishDate
          ? editingPost.publishDate
          : formData.status === 'PUBLISHED'
          ? new Date().toISOString()
          : undefined,
      };

      if (editingPost) {
        await api.blog.update(editingPost.id, payload);
        toast.success('Article updated successfully');
      } else {
        await api.blog.create(payload);
        toast.success('Article published successfully');
      }

      setModalOpen(false);
      fetchPosts();
      fetchCounts();
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
      fetchPosts();
      fetchCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to delete article');
    } finally {
      setDeleting(false);
    }
  };

  const quickPublish = async (post: any) => {
    try {
      await api.blog.update(post.id, {
        status: 'PUBLISHED',
        publishDate: new Date().toISOString(),
      });
      toast.success(`"${post.title.slice(0, 30)}..." published and live!`);
      fetchPosts();
      fetchCounts();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to publish article');
    }
  };

  const triggerAiGenerate = async () => {
    setGeneratingAi(true);
    toast.info('Generating 1,200+ word draft with licensed images...');
    try {
      const res = await api.automation.generate();
      if (res.success) {
        toast.success(`Draft generated: "${res.data.title.slice(0, 30)}..." Review below!`);
        setStatusFilter('DRAFT');
        fetchPosts();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate blog draft');
    } finally {
      setGeneratingAi(false);
    }
  };

  const fetchKeywords = async () => {
    if (!keywordSeed.trim()) return;
    setSearchingKeywords(true);
    try {
      const res = await api.automation.keywords(keywordSeed, keywordLocation);
      if (res.success) {
        setDiscoveredKeywords(res.data || []);
      }
    } catch {
      toast.error('Failed to discover keywords');
    } finally {
      setSearchingKeywords(false);
    }
  };

  const fetchAutomationStatus = async () => {
    setLoadingStatus(true);
    setQueueModalOpen(true);
    try {
      const res = await api.automation.status();
      if (res.success) {
        setAutomationStatus(res.data);
      }
    } catch {
      toast.error('Failed to fetch automation queue status');
    } finally {
      setLoadingStatus(false);
    }
  };

  const generateFromKeyword = async (kw: string) => {
    setGeneratingAi(true);
    toast.info(`Generating draft for "${kw}"...`);
    try {
      const res = await api.automation.generate({
        topic: kw,
        targetLocation: keywordLocation,
      });
      if (res.success) {
        toast.success(`Draft generated: "${res.data.title.slice(0, 30)}..." Review below!`);
        setKeywordModalOpen(false);
        setStatusFilter('DRAFT');
        fetchPosts();
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to generate blog draft');
    } finally {
      setGeneratingAi(false);
    }
  };

  const copyKeyword = (kw: string) => {
    navigator.clipboard.writeText(kw);
    setCopiedKw(kw);
    toast.success('Keyword copied to clipboard');
    setTimeout(() => setCopiedKw(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-palnadu-dark">Blog & Articles</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Publish technical guides, engineering case breakdowns, and manage SEO search metadata.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setKeywordModalOpen(true);
              if (discoveredKeywords.length === 0) fetchKeywords();
            }}
            title="Discover real Google search terms for Andhra Pradesh & Palnadu"
          >
            <Compass className="h-4 w-4 mr-1.5 text-palnadu-blue" />
            <span>SEO Keywords</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={fetchAutomationStatus}
            title="View scheduled blog queue & rotation status"
          >
            <ListChecks className="h-4 w-4 mr-1.5 text-palnadu-teal" />
            <span>Queue Status</span>
          </Button>
          <Button
            variant="secondary"
            size="sm"
            onClick={triggerAiGenerate}
            disabled={generatingAi}
            title="Generate next scheduled AI blog draft from queue"
          >
            {generatingAi ? (
              <Loader2 className="h-4 w-4 mr-1.5 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4 mr-1.5" />
            )}
            <span>{generatingAi ? 'Generating Draft...' : 'Generate AI Blog Draft'}</span>
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={openCreateModal}
          >
            <Plus className="h-4 w-4 mr-1.5" />
            <span>New Article</span>
          </Button>
        </div>
      </div>

      {/* KPI Overview (Clickable Quick Filters) */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setStatusFilter('')}
          className={cn(
            'rounded-lg border bg-white p-3.5 text-left transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue',
            statusFilter === ''
              ? 'border-palnadu-blue ring-1 ring-palnadu-blue bg-palnadu-light-blue/20'
              : 'border-palnadu-border hover:border-palnadu-blue/50'
          )}
        >
          <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Total Articles</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading && totalPosts === 0 ? '—' : totalPosts}</p>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('PUBLISHED')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setStatusFilter('PUBLISHED')}
          className={cn(
            'rounded-lg border bg-white p-3.5 text-left transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-teal',
            statusFilter === 'PUBLISHED'
              ? 'border-palnadu-teal ring-1 ring-palnadu-teal bg-palnadu-teal/10'
              : 'border-palnadu-border hover:border-palnadu-blue/50'
          )}
        >
          <p className="text-xs font-semibold text-palnadu-teal uppercase tracking-wider">Published on Google</p>
          <p className="text-xl font-bold text-palnadu-teal mt-1">{loading && publishedCount === 0 ? '—' : publishedCount}</p>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('DRAFT')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setStatusFilter('DRAFT')}
          className={cn(
            'rounded-lg border bg-white p-3.5 text-left transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-warning',
            statusFilter === 'DRAFT'
              ? 'border-palnadu-warning ring-1 ring-palnadu-warning bg-palnadu-warning/10'
              : 'border-palnadu-border hover:border-palnadu-blue/50'
          )}
        >
          <p className="text-xs font-semibold text-palnadu-warning uppercase tracking-wider">Drafts Pending Review</p>
          <p className="text-xl font-bold text-palnadu-warning mt-1">{loading && draftCount === 0 ? '—' : draftCount}</p>
        </div>
        <div
          role="button"
          tabIndex={0}
          onClick={() => setStatusFilter('ARCHIVED')}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setStatusFilter('ARCHIVED')}
          className={cn(
            'rounded-lg border bg-white p-3.5 text-left transition-all cursor-pointer shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-secondary',
            statusFilter === 'ARCHIVED'
              ? 'border-palnadu-secondary ring-1 ring-palnadu-secondary bg-palnadu-off-white'
              : 'border-palnadu-border hover:border-palnadu-blue/50'
          )}
        >
          <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Archived Articles</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading && archivedCount === 0 ? '—' : archivedCount}</p>
        </div>
      </div>

      {/* Review Alert Banner when Drafts Exist */}
      {draftCount > 0 && statusFilter !== 'DRAFT' && (
        <div className="p-3.5 rounded-xl border border-palnadu-warning/40 bg-palnadu-warning/10 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-in">
          <div className="flex items-center gap-2.5">
            <span className="h-2 w-2 rounded-full bg-palnadu-warning animate-pulse shrink-0" />
            <p className="text-xs font-semibold text-palnadu-dark">
              {draftCount} automated blog article(s) waiting in draft mode for your review.
            </p>
          </div>
          <Button
            size="sm"
            variant="default"
            onClick={() => setStatusFilter('DRAFT')}
            className="self-start sm:self-auto shrink-0"
          >
            Review Drafts →
          </Button>
        </div>
      )}

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-palnadu-secondary" />
          <Input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <select
            value={languageFilter}
            onChange={(e) => setLanguageFilter(e.target.value)}
            className="flex h-9 rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
          >
            <option value="">All Languages</option>
            <option value="en">English (EN)</option>
            <option value="te">Telugu (TE)</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="flex h-9 rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="flex h-9 rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Drafts Only</option>
            <option value="ARCHIVED">Archived Articles</option>
          </select>
        </div>
      </div>

      {/* Articles Table with Internal Body Scrolling & Pagination */}
      <div className="rounded-xl border border-palnadu-border bg-white shadow-sm overflow-hidden flex flex-col">
        {/* Scrollable Table Body Container with Sticky Header */}
        <div className="overflow-x-auto overflow-y-auto max-h-[580px] sm:max-h-[640px]">
          <table className="w-full text-xs border-collapse">
            <thead className="sticky top-0 z-10 bg-palnadu-off-white border-b border-palnadu-border text-palnadu-secondary text-left font-semibold shadow-sm">
              <tr>
                <th className="px-4 py-3 bg-palnadu-off-white">Article Title & Slug</th>
                <th className="px-4 py-3 bg-palnadu-off-white">Lang</th>
                <th className="px-4 py-3 bg-palnadu-off-white">Category</th>
                <th className="px-4 py-3 bg-palnadu-off-white">SEO Health</th>
                <th className="px-4 py-3 bg-palnadu-off-white">Status</th>
                <th className="px-4 py-3 bg-palnadu-off-white">Updated Date</th>
                <th className="px-4 py-3 text-right bg-palnadu-off-white">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-palnadu-border/60 bg-white">
              {loading ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-palnadu-secondary">
                    <Loader2 className="h-5 w-5 animate-spin mx-auto text-palnadu-blue mb-2" />
                    <span>Loading articles...</span>
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-12 text-center text-palnadu-secondary">
                    <p className="font-semibold text-palnadu-dark">No articles found</p>
                    <p className="text-xs mt-1">Try adjusting your search query, language, or status filter.</p>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className="hover:bg-palnadu-light-blue/20 transition-colors"
                  >
                    {/* Title & Slug */}
                    <td className="px-4 py-3 max-w-md">
                      <div className="font-bold text-palnadu-dark text-xs flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-palnadu-blue shrink-0" />
                        <span>{post.title}</span>
                      </div>
                      <div className="font-mono text-xs text-palnadu-secondary mt-0.5">
                        /blog/{post.slug}
                      </div>
                    </td>

                    {/* Language & Translation Linkage Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <span
                          className={cn(
                            'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-semibold border',
                            post.language === 'te'
                              ? 'bg-palnadu-light-blue text-palnadu-blue border-palnadu-blue/30'
                              : 'bg-palnadu-off-white text-palnadu-dark border-palnadu-border'
                          )}
                        >
                          {post.language === 'te' ? 'TE' : 'EN'}
                        </span>
                        {post.translationGroupId && (
                          <span
                            className="text-palnadu-blue text-xs"
                            title={`Translation Group ID: ${post.translationGroupId}`}
                          >
                            🔗
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-palnadu-off-white border border-palnadu-border text-xs font-semibold text-palnadu-dark">
                        {post.category?.name || 'Unassigned'}
                      </span>
                    </td>

                    {/* SEO Health Badge */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        {post.seoTitle && post.seoDescription ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-palnadu-teal/10 border border-palnadu-teal/30 text-palnadu-teal-dark font-semibold text-xs">
                            <Sparkles className="h-3 w-3 text-palnadu-teal" />
                            <span>SEO Ready</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-palnadu-warning/10 border border-palnadu-warning/30 text-palnadu-warning font-semibold text-xs">
                            Basic Meta
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-xs font-bold uppercase tracking-wider',
                          post.status === 'PUBLISHED'
                            ? 'bg-palnadu-teal/10 text-palnadu-teal-dark border-palnadu-teal/30'
                            : post.status === 'ARCHIVED'
                            ? 'bg-palnadu-off-white text-palnadu-secondary border-palnadu-border'
                            : 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/30'
                        )}
                      >
                        {post.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-palnadu-secondary whitespace-nowrap">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                      {post.status === 'DRAFT' && (
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => quickPublish(post)}
                          className="h-7 px-2 text-xs"
                          title="1-Click Approve & Publish"
                        >
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          <span>Approve</span>
                        </Button>
                      )}
                      {post.status === 'PUBLISHED' && (
                        <a
                          href={post.language === 'te' ? `${siteConfig.url}/te/blog/${post.slug}` : `${siteConfig.url}/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center justify-center h-7 w-7 rounded-md text-palnadu-secondary hover:text-palnadu-blue hover:bg-palnadu-light-blue transition-colors align-middle"
                          title="View Live on Site"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => openEditModal(post)}
                        className="h-7 w-7 p-0 text-palnadu-blue"
                        title="Edit Article"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setDeleteTarget({ id: post.id, title: post.title })}
                        className="h-7 w-7 p-0 text-palnadu-error hover:text-palnadu-error hover:bg-palnadu-error/10"
                        title="Delete Article"
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

        {/* Pagination Controls Bar */}
        <div className="px-4 py-3 bg-white border-t border-palnadu-border flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-palnadu-secondary">
          <div className="flex items-center gap-3">
            <span>
              Showing <span className="font-semibold text-palnadu-dark">{totalPosts === 0 ? 0 : (currentPage - 1) * pageSize + 1}</span> to{' '}
              <span className="font-semibold text-palnadu-dark">{Math.min(currentPage * pageSize, totalPosts)}</span> of{' '}
              <span className="font-semibold text-palnadu-dark">{totalPosts}</span> articles
            </span>

            <div className="flex items-center gap-1.5 pl-3 border-l border-palnadu-border/80">
              <span>Per page:</span>
              <select
                value={pageSize}
                onChange={(e) => setPageSize(Number(e.target.value))}
                className="h-7 rounded border border-palnadu-border bg-white px-2 text-xs font-semibold text-palnadu-dark cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-palnadu-blue"
              >
                <option value={10}>10</option>
                <option value={20}>20</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(1)}
              disabled={currentPage <= 1 || loading}
              className="h-7 w-7 p-0"
              title="First page"
            >
              <ChevronsLeft className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage <= 1 || loading}
              className="h-7 w-7 p-0"
              title="Previous page"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
            </Button>

            {/* Page number indicators */}
            <div className="flex items-center gap-1 px-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((p) => p === 1 || p === totalPages || Math.abs(p - currentPage) <= 1)
                .map((p, i, arr) => {
                  const prev = arr[i - 1];
                  const showEllipsis = prev && p - prev > 1;
                  return (
                    <div key={p} className="flex items-center gap-1">
                      {showEllipsis && <span className="px-1 text-palnadu-secondary">…</span>}
                      <Button
                        size="sm"
                        variant={currentPage === p ? 'default' : 'outline'}
                        onClick={() => setCurrentPage(p)}
                        className="h-7 min-w-[28px] px-2 text-xs font-semibold"
                      >
                        {p}
                      </Button>
                    </div>
                  );
                })}
            </div>

            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage >= totalPages || loading}
              className="h-7 w-7 p-0"
              title="Next page"
            >
              <ChevronRight className="h-3.5 w-3.5" />
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage >= totalPages || loading}
              className="h-7 w-7 p-0"
              title="Last page"
            >
              <ChevronsRight className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Create / Edit Article Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
              <div>
                <h2 className="text-sm font-bold text-palnadu-dark">
                  {editingPost ? 'Edit Blog Article' : 'Write New Blog Article'}
                </h2>
                <p className="text-xs text-palnadu-secondary">Configure article content, Cloudinary media, and Google SEO parameters.</p>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setModalOpen(false)}
                className="h-8 w-8 p-0 text-palnadu-secondary hover:text-palnadu-dark"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-palnadu-border px-5 gap-4 text-xs font-semibold">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveTab('content')}
                className={cn(
                  'h-auto py-2.5 px-0 rounded-none border-b-2 font-semibold text-xs shadow-none hover:bg-transparent',
                  activeTab === 'content'
                    ? 'border-palnadu-blue text-palnadu-blue hover:text-palnadu-blue'
                    : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
                )}
              >
                1. Article Content
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setActiveTab('seo')}
                className={cn(
                  'h-auto py-2.5 px-0 rounded-none border-b-2 font-semibold text-xs shadow-none hover:bg-transparent flex items-center gap-1',
                  activeTab === 'seo'
                    ? 'border-palnadu-blue text-palnadu-blue hover:text-palnadu-blue'
                    : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>2. Google SEO & Social Preview</span>
              </Button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* TAB 1: Content */}
              {activeTab === 'content' && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <Label>
                      Article Title <span className="text-palnadu-error">*</span>
                    </Label>
                    <Input
                      type="text"
                      required
                      placeholder="e.g. 5 Practical Steps to Validate a SaaS MVP in 2026"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                    <div className="sm:col-span-1 space-y-1">
                      <Label>
                        URL Slug <span className="text-palnadu-error">*</span>
                      </Label>
                      <Input
                        type="text"
                        required
                        value={formData.slug}
                        onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })}
                        className="font-mono text-xs"
                      />
                    </div>

                    <div className="sm:col-span-1 space-y-1">
                      <Label>Language</Label>
                      <select
                        value={formData.language}
                        onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'te' })}
                        className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                      >
                        <option value="en">English (en)</option>
                        <option value="te">Telugu (te)</option>
                      </select>
                    </div>

                    <div className="sm:col-span-1 space-y-1">
                      <Label>Category</Label>
                      <select
                        value={formData.categoryId || ''}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || undefined })}
                        className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                      >
                        <option value="">Select Category...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="sm:col-span-1 space-y-1">
                      <Label>Publication Status</Label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' })}
                        className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                      >
                        <option value="DRAFT">Draft (Internal Only)</option>
                        <option value="PUBLISHED">Published (Live)</option>
                        <option value="ARCHIVED">Archived (Delisted)</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-1">
                    <Label>Translation Group ID (Optional)</Label>
                    <Input
                      type="text"
                      placeholder="e.g. saas-mvp-validation (pairs English & Telugu versions)"
                      value={formData.translationGroupId || ''}
                      onChange={(e) => setFormData({ ...formData, translationGroupId: e.target.value || undefined })}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Cover Image with 1-Click Cloudinary Upload */}
                  <div className="space-y-1.5">
                    <Label>Cover Photo (Cloudinary CDN)</Label>
                    {formData.coverImage ? (
                      <div className="relative rounded-lg border border-palnadu-border p-2 bg-palnadu-off-white/40 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 overflow-hidden">
                          <img
                            src={formData.coverImage}
                            alt="Cover preview"
                            className="h-12 w-20 rounded-md object-cover border border-palnadu-border shrink-0"
                          />
                          <span className="text-xs font-mono text-palnadu-secondary truncate">{formData.coverImage}</span>
                        </div>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setFormData({ ...formData, coverImage: '', ogImage: '' })}
                          className="text-xs text-palnadu-error hover:text-palnadu-error hover:bg-palnadu-error/10 shrink-0"
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <input
                          type="file"
                          ref={coverInputRef}
                          accept="image/png,image/jpeg,image/webp,image/avif"
                          onChange={handleCoverUpload}
                          className="hidden"
                          id="blog-cover-upload"
                        />
                        <Label
                          htmlFor="blog-cover-upload"
                          className={cn(
                            'inline-flex items-center justify-center gap-1.5 h-9 px-3 rounded-md border border-palnadu-border bg-white text-xs font-semibold text-palnadu-dark hover:bg-palnadu-light-blue hover:text-palnadu-blue hover:border-palnadu-blue transition-colors cursor-pointer shadow-sm shrink-0',
                            uploadingCover && 'opacity-50 pointer-events-none'
                          )}
                        >
                          {uploadingCover ? (
                            <>
                              <Loader2 className="h-3.5 w-3.5 animate-spin text-palnadu-blue" />
                              <span>Uploading to Cloudinary...</span>
                            </>
                          ) : (
                            <>
                              <UploadCloud className="h-3.5 w-3.5 text-palnadu-blue" />
                              <span>Upload Photo</span>
                            </>
                          )}
                        </Label>
                        <span className="text-xs text-palnadu-secondary shrink-0">or URL:</span>
                        <Input
                          type="url"
                          placeholder="https://res.cloudinary.com/..."
                          value={formData.coverImage}
                          onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                          className="flex-1"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <Label>Short Excerpt (Summary)</Label>
                    <Textarea
                      rows={2}
                      placeholder="A 2-sentence summary shown on the blog index cards..."
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                    />
                  </div>

                  <div className="space-y-1">
                    <Label>
                      Article Content <span className="text-palnadu-error">*</span>
                    </Label>
                    <Textarea
                      rows={7}
                      required
                      placeholder="Write your article body here using Markdown (# Headers, - Bullet points, **bold**)..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="font-mono text-xs"
                    />
                  </div>
                </div>
              )}

              {/* TAB 2: SEO & Social Preview */}
              {activeTab === 'seo' && (
                <div className="space-y-4">
                  <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-4 space-y-3">
                    {/* SEO Title */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Google Search Title Tag</Label>
                        <span
                          className={cn(
                            'text-xs font-mono font-semibold',
                            formData.seoTitle.length > 60
                              ? 'text-palnadu-error'
                              : formData.seoTitle.length >= 45
                              ? 'text-palnadu-teal'
                              : 'text-palnadu-secondary'
                          )}
                        >
                          {formData.seoTitle.length} / 60 chars
                        </span>
                      </div>
                      <Input
                        type="text"
                        placeholder="e.g. 5 Practical Steps to Validate a SaaS MVP | Palnadu.dev"
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                      />
                      <p className="text-xs text-palnadu-secondary">Recommended: 50–60 characters. Place your main keyword first.</p>
                    </div>

                    {/* SEO Meta Description */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <Label>Google Meta Description Snippet</Label>
                        <span
                          className={cn(
                            'text-xs font-mono font-semibold',
                            formData.seoDescription.length > 160
                              ? 'text-palnadu-error'
                              : formData.seoDescription.length >= 130
                              ? 'text-palnadu-teal'
                              : 'text-palnadu-secondary'
                          )}
                        >
                          {formData.seoDescription.length} / 160 chars
                        </span>
                      </div>
                      <Textarea
                        rows={3}
                        placeholder="e.g. Learn how software engineers validate startup ideas, avoid costly technical traps, and launch an MVP with paying customers in 3 to 6 weeks."
                        value={formData.seoDescription}
                        onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                      />
                      <p className="text-xs text-palnadu-secondary">Recommended: 140–160 characters. Provide a compelling click hook for searchers.</p>
                    </div>
                  </div>

                  {/* Real-time Google SERP Simulator */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-palnadu-dark flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-palnadu-blue" />
                      <span>Live Google Search Snippet Preview</span>
                    </p>
                    <div className="rounded-lg border border-palnadu-border bg-white p-4 shadow-sm space-y-1">
                      <div className="text-xs text-palnadu-dark flex items-center gap-1 font-sans">
                        <span>{siteConfig.url}</span>
                        <span className="text-palnadu-secondary">›</span>
                        <span>{formData.language === 'te' ? 'te/blog' : 'blog'}</span>
                        <span className="text-palnadu-secondary">›</span>
                        <span className="text-palnadu-secondary truncate">{formData.slug || 'your-article-slug'}</span>
                      </div>
                      <div className="text-base font-medium text-palnadu-blue hover:underline cursor-pointer line-clamp-1 leading-snug">
                        {formData.seoTitle || formData.title || 'Your Article Title Appears Here | Palnadu.dev'}
                      </div>
                      <div className="text-xs text-palnadu-body line-clamp-2 leading-relaxed">
                        {formData.seoDescription || formData.excerpt || 'Your meta description will appear here on Google search results. Write a descriptive, keyword-rich summary.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-palnadu-border/60">
                <span className="text-xs text-palnadu-secondary">
                  {formData.status === 'PUBLISHED' ? (
                    <span className="text-palnadu-teal font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" /> Will be live and indexed by Google
                    </span>
                  ) : formData.status === 'ARCHIVED' ? (
                    <span className="text-palnadu-secondary font-semibold flex items-center gap-1">
                      <Archive className="h-3.5 w-3.5" /> Will be preserved in Historical Archive
                    </span>
                  ) : (
                    'Will be saved privately as Draft'
                  )}
                </span>
                <div className="flex items-center gap-2">
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
                    variant="default"
                    size="sm"
                    disabled={submitting}
                  >
                    {submitting ? 'Saving...' : editingPost ? 'Update Article' : formData.status === 'PUBLISHED' ? 'Publish Article →' : 'Save as Draft'}
                  </Button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Article Web Dialog */}
      <ConfirmDialog
        open={Boolean(deleteTarget)}
        onCancel={() => setDeleteTarget(null)}
        onConfirm={confirmDelete}
        loading={deleting}
        title="Delete Article?"
        message={deleteTarget ? `Are you sure you want to delete article "${deleteTarget.title}"? This action cannot be undone.` : ''}
        confirmLabel="Delete Article"
      />

      {/* SEO Keyword Discovery Modal */}
      {keywordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-xl border border-palnadu-border bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-palnadu-light-blue text-palnadu-blue flex items-center justify-center">
                  <Compass className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-palnadu-dark">Google Live SEO Keyword Discovery</h3>
                  <p className="text-xs text-palnadu-secondary">Real-time autocomplete queries from Google India for regional intent</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setKeywordModalOpen(false)}
                className="h-8 w-8 p-0 text-palnadu-secondary hover:text-palnadu-dark"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 border-b border-palnadu-border/60 bg-palnadu-off-white/30 space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>Seed Keyword / Topic</Label>
                  <Input
                    type="text"
                    value={keywordSeed}
                    onChange={(e) => setKeywordSeed(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && fetchKeywords()}
                    placeholder="e.g. billing software, school website, web design"
                  />
                </div>
                <div className="space-y-1">
                  <Label>Target Regional Location</Label>
                  <select
                    value={keywordLocation}
                    onChange={(e) => setKeywordLocation(e.target.value)}
                    className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                  >
                    <option value="Guntur & Palnadu">Guntur & Palnadu</option>
                    <option value="Palnadu">Palnadu</option>
                    <option value="Guntur">Guntur</option>
                    <option value="Narasaraopet">Narasaraopet</option>
                    <option value="Chilakaluripet">Chilakaluripet</option>
                    <option value="Sattenapalle">Sattenapalle</option>
                    <option value="Macherla">Macherla</option>
                    <option value="Vinukonda">Vinukonda</option>
                    <option value="Andhra Pradesh">Andhra Pradesh</option>
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <p className="text-xs text-palnadu-secondary">
                  Found <span className="font-semibold text-palnadu-dark">{discoveredKeywords.length}</span> live search variations
                </p>
                <Button
                  size="sm"
                  variant="default"
                  onClick={fetchKeywords}
                  disabled={searchingKeywords || !keywordSeed.trim()}
                >
                  {searchingKeywords ? <Loader2 className="h-3.5 w-3.5 mr-1.5 animate-spin" /> : <Search className="h-3.5 w-3.5 mr-1.5" />}
                  <span>{searchingKeywords ? 'Discovering...' : 'Discover Keywords'}</span>
                </Button>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-2">
              {searchingKeywords ? (
                <div className="py-12 text-center text-xs text-palnadu-secondary space-y-2">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-palnadu-blue" />
                  <p>Querying Google India live suggestion indexes...</p>
                </div>
              ) : discoveredKeywords.length === 0 ? (
                <div className="py-10 text-center text-xs text-palnadu-secondary">
                  No suggestions found for this seed. Try a broader term like &quot;software&quot;, &quot;app&quot;, or &quot;website&quot;.
                </div>
              ) : (
                <div className="space-y-2">
                  {discoveredKeywords.map((kw, idx) => {
                    const intentColor =
                      kw.intent === 'transactional'
                        ? 'bg-palnadu-teal/10 text-palnadu-teal-dark border-palnadu-teal/30'
                        : kw.intent === 'local'
                        ? 'bg-palnadu-light-blue text-palnadu-blue border-palnadu-blue/30'
                        : 'bg-palnadu-off-white text-palnadu-dark border-palnadu-border';

                    return (
                      <div
                        key={idx}
                        className="rounded-lg border border-palnadu-border bg-white p-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-palnadu-blue transition-all"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-bold text-palnadu-dark">{kw.keyword}</span>
                            <span className={cn('px-2 py-0.5 rounded text-xs font-mono font-semibold border uppercase', intentColor)}>
                              {kw.intent}
                            </span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-palnadu-secondary">
                            <span>Score: {kw.relevanceScore}/100</span>
                            <span>•</span>
                            <span>{kw.source}</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => copyKeyword(kw.keyword)}
                            className="h-8 w-8 p-0"
                            title="Copy keyword"
                          >
                            {copiedKw === kw.keyword ? <Check className="h-3.5 w-3.5 text-palnadu-teal" /> : <Copy className="h-3.5 w-3.5" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => generateFromKeyword(kw.keyword)}
                            disabled={generatingAi}
                          >
                            <Sparkles className="h-3.5 w-3.5 mr-1" />
                            <span>Draft Post</span>
                          </Button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Automation Queue Status Modal */}
      {queueModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-2xl max-h-[85vh] rounded-xl border border-palnadu-border bg-white shadow-2xl flex flex-col overflow-hidden">
            <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white">
              <div className="flex items-center gap-2">
                <div className="h-7 w-7 rounded-lg bg-palnadu-teal/10 text-palnadu-teal-dark flex items-center justify-center border border-palnadu-teal/30">
                  <ListChecks className="h-4 w-4" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-palnadu-dark">Blog Automation Engine & Queue</h3>
                  <p className="text-xs text-palnadu-secondary">Autonomous cron schedule, topic rotation, and publish status</p>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setQueueModalOpen(false)}
                className="h-8 w-8 p-0 text-palnadu-secondary hover:text-palnadu-dark"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="p-5 space-y-4 overflow-y-auto">
              {loadingStatus ? (
                <div className="py-12 text-center text-xs text-palnadu-secondary space-y-2">
                  <Loader2 className="h-5 w-5 animate-spin mx-auto text-palnadu-blue" />
                  <p>Loading automation statistics...</p>
                </div>
              ) : automationStatus ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-3">
                      <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Cron Schedule</p>
                      <p className="text-xs font-bold text-palnadu-dark mt-1">Daily 05:00 AM IST</p>
                    </div>
                    <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-3">
                      <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Queue Progress</p>
                      <p className="text-xs font-bold text-palnadu-dark mt-1">
                        {automationStatus.statistics?.queueCompleted || 0} Done / {automationStatus.upcomingQueue?.length || 0} Total
                      </p>
                    </div>
                    <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-3">
                      <p className="text-xs font-semibold text-palnadu-secondary uppercase tracking-wider">Auto-Publish</p>
                      <p className="text-xs font-bold mt-1 text-palnadu-warning">
                        {automationStatus.autoPublishEnabled ? 'Automatic (Live)' : 'Draft Review (Safe)'}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-2 pt-2">
                    <h4 className="text-xs font-bold text-palnadu-dark uppercase tracking-wider">Scheduled Topic Rotation Queue</h4>
                    <div className="space-y-2">
                      {automationStatus.upcomingQueue?.map((item: any, idx: number) => {
                        const isCompleted = item.status === 'COMPLETED' || item.isGenerated;
                        return (
                          <div
                            key={idx}
                            className="rounded-lg border border-palnadu-border bg-white p-3 flex items-center justify-between gap-3 text-xs"
                          >
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-palnadu-dark">{item.topic}</span>
                                <span
                                  className={cn(
                                    'px-2 py-0.5 rounded text-xs font-mono font-bold uppercase border',
                                    isCompleted
                                      ? 'bg-palnadu-teal/10 text-palnadu-teal-dark border-palnadu-teal/30'
                                      : 'bg-palnadu-warning/10 text-palnadu-warning border-palnadu-warning/30'
                                  )}
                                >
                                  {isCompleted ? 'Published' : 'Pending'}
                                </span>
                              </div>
                              <p className="text-xs text-palnadu-secondary">
                                Category: <span className="font-mono">{item.categorySlug}</span> • Target: {item.targetLocation}
                              </p>
                            </div>

                            {!isCompleted && (
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setQueueModalOpen(false);
                                  generateFromKeyword(item.topic);
                                }}
                                disabled={generatingAi}
                              >
                                Generate
                              </Button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
