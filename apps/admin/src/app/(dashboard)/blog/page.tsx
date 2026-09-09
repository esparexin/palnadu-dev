'use client';

import { useEffect, useState, useRef } from 'react';
import { api } from '@/lib/api';
import type { BlogPost } from '@palnadu/types';
import { Plus, Search, Edit2, Trash2, X, Globe, Eye, FileText, CheckCircle2, Sparkles, ExternalLink, UploadCloud, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface BlogFormData {
  title: string;
  slug: string;
  categoryId?: string;
  excerpt: string;
  content: string;
  coverImage: string;
  seoTitle: string;
  seoDescription: string;
  ogImage: string;
  status: 'DRAFT' | 'PUBLISHED';
}

const initialFormData: BlogFormData = {
  title: '',
  slug: '',
  categoryId: undefined,
  excerpt: '',
  content: '',
  coverImage: '',
  seoTitle: '',
  seoDescription: '',
  ogImage: '',
  status: 'DRAFT',
};

// Helper: auto-generate URL-friendly slug
function slugify(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

export default function BlogAdminPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [editingPost, setEditingPost] = useState<any | null>(null);
  const [formData, setFormData] = useState<BlogFormData>(initialFormData);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

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
      alert(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  const fetchPosts = () => {
    setLoading(true);
    const params: Record<string, string> = {};
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;

    Promise.all([
      api.blog.list(params),
      api.blog.categories(),
    ])
      .then(([postsRes, catRes]: [any, any]) => {
        setPosts(postsRes.data || []);
        setCategories(catRes.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    fetchPosts();
  }, [search, statusFilter, categoryFilter]);

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
      categoryId: post.categoryId || post.category?.id || undefined,
      excerpt: post.excerpt || '',
      content: post.content,
      coverImage: post.coverImage || '',
      seoTitle: post.seoTitle || '',
      seoDescription: post.seoDescription || '',
      ogImage: post.ogImage || '',
      status: post.status === 'PUBLISHED' ? 'PUBLISHED' : 'DRAFT',
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
      alert('Please provide Title, Slug, and Article Content.');
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        title: formData.title,
        slug: formData.slug,
        categoryId: formData.categoryId || undefined,
        excerpt: formData.excerpt || undefined,
        content: formData.content,
        coverImage: formData.coverImage || undefined,
        seoTitle: formData.seoTitle || undefined,
        seoDescription: formData.seoDescription || undefined,
        ogImage: formData.ogImage || formData.coverImage || undefined,
        status: formData.status,
        publishDate: formData.status === 'PUBLISHED' ? new Date().toISOString() : undefined,
      };

      if (editingPost) {
        await api.blog.update(editingPost.id, payload);
      } else {
        await api.blog.create(payload);
      }

      setModalOpen(false);
      fetchPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Operation failed');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string, title: string) => {
    if (!confirm(`Are you sure you want to delete article "${title}"? This cannot be undone.`)) {
      return;
    }
    try {
      await api.blog.delete(id);
      fetchPosts();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Failed to delete article');
    }
  };

  const totalCount = posts.length;
  const publishedCount = posts.filter((p) => p.status === 'PUBLISHED').length;
  const draftCount = posts.filter((p) => p.status === 'DRAFT').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-palnadu-dark">Blog & Articles</h1>
          <p className="text-xs text-palnadu-secondary mt-0.5">
            Publish technical guides, engineering case breakdowns, and manage SEO search metadata.
          </p>
        </div>
        <button
          onClick={openCreateModal}
          className="inline-flex items-center justify-center gap-1.5 rounded-md bg-palnadu-blue px-4 py-2 text-xs font-semibold text-white shadow-xs hover:bg-[#12487e] transition-colors cursor-pointer"
        >
          <Plus className="h-4 w-4" />
          <span>New Article</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-palnadu-secondary uppercase tracking-wider">Total Articles</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading ? '—' : totalCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-emerald-700 uppercase tracking-wider">Published on Google</p>
          <p className="text-xl font-bold text-emerald-700 mt-1">{loading ? '—' : publishedCount}</p>
        </div>
        <div className="rounded-lg border border-palnadu-border bg-white p-3.5 shadow-2xs">
          <p className="text-[11px] font-semibold text-palnadu-secondary uppercase tracking-wider">Drafts in Progress</p>
          <p className="text-xl font-bold text-palnadu-dark mt-1">{loading ? '—' : draftCount}</p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-palnadu-secondary" />
          <input
            type="text"
            placeholder="Search articles by title or keyword..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-md border border-palnadu-border bg-white text-palnadu-dark placeholder:text-palnadu-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
          />
        </div>

        <div className="flex items-center gap-2">
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-8 rounded-md border border-palnadu-border bg-white px-2.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
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
            className="h-8 rounded-md border border-palnadu-border bg-white px-2.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
          >
            <option value="">All Statuses</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Drafts Only</option>
          </select>
        </div>
      </div>

      {/* Articles Table */}
      <div className="rounded-lg border border-palnadu-border bg-white shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-palnadu-border bg-palnadu-off-white/50 text-palnadu-secondary text-left font-semibold">
                <th className="px-4 py-3">Article Title & Slug</th>
                <th className="px-4 py-3">Category</th>
                <th className="px-4 py-3">SEO Health</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Updated Date</th>
                <th className="px-4 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="px-4 py-10 text-center text-palnadu-secondary">
                    Loading articles...
                  </td>
                </tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-12 text-center text-palnadu-secondary">
                    <p className="font-semibold text-palnadu-dark">No articles found</p>
                    <p className="text-[11px] mt-1">Create your first blog post using the button above.</p>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr
                    key={post.id}
                    className="border-b border-palnadu-border/60 hover:bg-palnadu-light-blue/20 transition-colors"
                  >
                    {/* Title & Slug */}
                    <td className="px-4 py-3 max-w-md">
                      <div className="font-bold text-palnadu-dark text-xs flex items-center gap-1.5">
                        <FileText className="h-3.5 w-3.5 text-palnadu-blue shrink-0" />
                        <span>{post.title}</span>
                      </div>
                      <div className="font-mono text-[11px] text-palnadu-secondary mt-0.5">
                        /blog/{post.slug}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 rounded-md bg-palnadu-off-white border border-palnadu-border text-[10px] font-semibold text-palnadu-dark">
                        {post.category?.name || 'Unassigned'}
                      </span>
                    </td>

                    {/* SEO Health Badge */}
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1.5">
                        {post.seoTitle && post.seoDescription ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-emerald-50 border border-emerald-200 text-emerald-800 font-semibold text-[10px]">
                            <Sparkles className="h-3 w-3 text-emerald-600" />
                            <span>SEO Configured</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-yellow-50 border border-yellow-200 text-yellow-800 text-[10px]">
                            Basic Meta
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-4 py-3">
                      <span
                        className={cn(
                          'inline-flex rounded-md border px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider',
                          post.status === 'PUBLISHED'
                            ? 'bg-emerald-100 text-emerald-800 border-emerald-200'
                            : 'bg-gray-100 text-gray-700 border-gray-200'
                        )}
                      >
                        {post.status}
                      </span>
                    </td>

                    {/* Date */}
                    <td className="px-4 py-3 text-palnadu-secondary">
                      {new Date(post.updatedAt).toLocaleDateString()}
                    </td>

                    {/* Actions */}
                    <td className="px-4 py-3 text-right space-x-1.5">
                      {post.status === 'PUBLISHED' && (
                        <a
                          href={`https://palnadu.dev/blog/${post.slug}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center p-1.5 rounded-md text-palnadu-secondary hover:text-palnadu-blue hover:bg-palnadu-light-blue transition-colors"
                          title="View Live on Site"
                        >
                          <ExternalLink className="h-3.5 w-3.5" />
                        </a>
                      )}
                      <button
                        onClick={() => openEditModal(post)}
                        className="inline-flex items-center p-1.5 rounded-md hover:bg-palnadu-light-blue text-palnadu-blue transition-colors cursor-pointer"
                        title="Edit Article"
                      >
                        <Edit2 className="h-3.5 w-3.5" />
                      </button>
                      <button
                        onClick={() => handleDelete(post.id, post.title)}
                        className="inline-flex items-center p-1.5 rounded-md hover:bg-red-50 text-palnadu-error transition-colors cursor-pointer"
                        title="Delete Article"
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

      {/* Create / Edit Article Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in overflow-y-auto">
          <div className="w-full max-w-2xl rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
              <div>
                <h2 className="text-sm font-bold text-palnadu-dark">
                  {editingPost ? 'Edit Blog Article' : 'Write New Blog Article'}
                </h2>
                <p className="text-xs text-palnadu-secondary">Configure article content, Cloudinary media, and Google SEO parameters.</p>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-md p-1 text-palnadu-secondary hover:text-palnadu-dark transition-colors cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Navigation Tabs */}
            <div className="flex border-b border-palnadu-border px-5 gap-4 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setActiveTab('content')}
                className={cn(
                  'py-2.5 border-b-2 transition-colors cursor-pointer',
                  activeTab === 'content'
                    ? 'border-palnadu-blue text-palnadu-blue'
                    : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
                )}
              >
                1. Article Content
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('seo')}
                className={cn(
                  'py-2.5 border-b-2 transition-colors cursor-pointer flex items-center gap-1',
                  activeTab === 'seo'
                    ? 'border-palnadu-blue text-palnadu-blue'
                    : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
                )}
              >
                <Globe className="h-3.5 w-3.5" />
                <span>2. Google SEO & Social Preview</span>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-5 space-y-4">
              {/* TAB 1: Content */}
              {activeTab === 'content' && (
                <div className="space-y-3.5">
                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-palnadu-dark">
                      Article Title <span className="text-palnadu-error">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. 5 Practical Steps to Validate a SaaS MVP in 2026"
                      value={formData.title}
                      onChange={(e) => handleTitleChange(e.target.value)}
                      className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                    />
                  </div>

                  <div className="grid grid-cols-3 gap-3">
                    <div className="col-span-1 space-y-1">
                      <label className="text-xs font-semibold text-palnadu-dark">
                        URL Slug <span className="text-palnadu-error">*</span>
                      </label>
                      <div className="flex items-center rounded-md border border-palnadu-border bg-palnadu-off-white/50 px-2 h-8">
                        <span className="text-[11px] text-palnadu-secondary shrink-0 font-mono">/blog/</span>
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
                      <label className="text-xs font-semibold text-palnadu-dark">Category</label>
                      <select
                        value={formData.categoryId || ''}
                        onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || undefined })}
                        className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                      >
                        <option value="">Select Category...</option>
                        {categories.map((c) => (
                          <option key={c.id} value={c.id}>
                            {c.name}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div className="col-span-1 space-y-1">
                      <label className="text-xs font-semibold text-palnadu-dark">Publication Status</label>
                      <select
                        value={formData.status}
                        onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' })}
                        className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer"
                      >
                        <option value="DRAFT">Draft (Internal Only)</option>
                        <option value="PUBLISHED">Published (Live on Google & Site)</option>
                      </select>
                    </div>
                  </div>

                  {/* Cover Image with 1-Click Cloudinary Upload */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-palnadu-dark">Cover Photo (Cloudinary CDN)</label>
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
                        <button
                          type="button"
                          onClick={() => setFormData({ ...formData, coverImage: '', ogImage: '' })}
                          className="text-xs font-semibold text-palnadu-error hover:underline shrink-0 cursor-pointer"
                        >
                          Remove
                        </button>
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
                        <label
                          htmlFor="blog-cover-upload"
                          className={cn(
                            "inline-flex items-center justify-center gap-1.5 h-8 px-3 rounded-md border border-palnadu-border bg-white text-xs font-semibold text-palnadu-dark hover:bg-palnadu-light-blue hover:text-palnadu-blue hover:border-palnadu-blue transition-colors cursor-pointer shadow-xs shrink-0",
                            uploadingCover && "opacity-50 pointer-events-none"
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
                        </label>
                        <span className="text-[11px] text-palnadu-secondary shrink-0">or URL:</span>
                        <input
                          type="url"
                          placeholder="https://res.cloudinary.com/..."
                          value={formData.coverImage}
                          onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })}
                          className="flex-1 h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                        />
                      </div>
                    )}
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-palnadu-dark">Short Excerpt (Summary)</label>
                    <textarea
                      rows={2}
                      placeholder="A 2-sentence summary shown on the blog index cards..."
                      value={formData.excerpt}
                      onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })}
                      className="w-full rounded-md border border-palnadu-border bg-white p-2.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                    />
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-semibold text-palnadu-dark">
                      Article Content <span className="text-palnadu-error">*</span>
                    </label>
                    <textarea
                      rows={7}
                      required
                      placeholder="Write your article body here using Markdown (# Headers, - Bullet points, **bold**)..."
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="w-full rounded-md border border-palnadu-border bg-white p-2.5 text-xs font-mono text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
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
                        <label className="text-xs font-semibold text-palnadu-dark">
                          Google Search Title Tag
                        </label>
                        <span className={cn(
                          'text-[11px] font-mono font-semibold',
                          formData.seoTitle.length > 60 ? 'text-palnadu-error' : formData.seoTitle.length >= 45 ? 'text-emerald-700' : 'text-palnadu-secondary'
                        )}>
                          {formData.seoTitle.length} / 60 chars
                        </span>
                      </div>
                      <input
                        type="text"
                        placeholder="e.g. 5 Practical Steps to Validate a SaaS MVP | Palnadu.dev"
                        value={formData.seoTitle}
                        onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
                        className="w-full h-8 rounded-md border border-palnadu-border bg-white px-3 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                      />
                      <p className="text-[10px] text-palnadu-secondary">Recommended: 50–60 characters. Place your main keyword first.</p>
                    </div>

                    {/* SEO Meta Description */}
                    <div className="space-y-1">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-palnadu-dark">
                          Google Meta Description Snippet
                        </label>
                        <span className={cn(
                          'text-[11px] font-mono font-semibold',
                          formData.seoDescription.length > 160 ? 'text-palnadu-error' : formData.seoDescription.length >= 130 ? 'text-emerald-700' : 'text-palnadu-secondary'
                        )}>
                          {formData.seoDescription.length} / 160 chars
                        </span>
                      </div>
                      <textarea
                        rows={3}
                        placeholder="e.g. Learn how software engineers validate startup ideas, avoid costly technical traps, and launch an MVP with paying customers in 3 to 6 weeks."
                        value={formData.seoDescription}
                        onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
                        className="w-full rounded-md border border-palnadu-border bg-white p-2.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue"
                      />
                      <p className="text-[10px] text-palnadu-secondary">Recommended: 140–160 characters. Provide a compelling click hook for searchers.</p>
                    </div>
                  </div>

                  {/* Real-time Google SERP Simulator */}
                  <div className="space-y-1.5">
                    <p className="text-xs font-bold text-palnadu-dark flex items-center gap-1">
                      <Eye className="h-3.5 w-3.5 text-palnadu-blue" />
                      <span>Live Google Search Snippet Preview</span>
                    </p>
                    <div className="rounded-lg border border-palnadu-border bg-white p-4 shadow-xs space-y-1">
                      <div className="text-[11px] text-[#202124] flex items-center gap-1 font-sans">
                        <span>https://palnadu.dev</span>
                        <span className="text-gray-400">›</span>
                        <span>blog</span>
                        <span className="text-gray-400">›</span>
                        <span className="text-gray-600 truncate">{formData.slug || 'your-article-slug'}</span>
                      </div>
                      <div className="text-base font-medium text-[#1a0dab] hover:underline cursor-pointer line-clamp-1 leading-snug">
                        {formData.seoTitle || formData.title || 'Your Article Title Appears Here | Palnadu.dev'}
                      </div>
                      <div className="text-xs text-[#4d5156] line-clamp-2 leading-relaxed">
                        {formData.seoDescription || formData.excerpt || 'Your meta description will appear here on Google search results. Write a descriptive, keyword-rich summary.'}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-palnadu-border/60">
                <span className="text-[11px] text-palnadu-secondary">
                  {formData.status === 'PUBLISHED' ? (
                    <span className="text-emerald-700 font-semibold flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> Will be live and indexed by Google
                    </span>
                  ) : (
                    'Will be saved privately as Draft'
                  )}
                </span>
                <div className="flex items-center gap-2">
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
                    {submitting ? 'Saving...' : editingPost ? 'Update Article' : formData.status === 'PUBLISHED' ? 'Publish Article →' : 'Save as Draft'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
