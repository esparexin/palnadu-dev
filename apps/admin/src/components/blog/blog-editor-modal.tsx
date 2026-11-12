'use client';

import React, { useRef, useState } from 'react';
import type { BlogPost } from '@palnadu/types';
import { X, Globe, UploadCloud, Loader2, CheckCircle2, Archive } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { slugify } from '@palnadu/config';
import { cn } from '@/lib/utils';
import { api } from '@/lib/api';
import { useToast } from '@/components/ui/toast';
import { BlogFormData, CategoryOption } from './types';
import { BlogSeoTab } from './blog-seo-tab';

interface BlogEditorModalProps {
  open: boolean;
  editingPost: BlogPost | null;
  formData: BlogFormData;
  setFormData: React.Dispatch<React.SetStateAction<BlogFormData>>;
  categories: CategoryOption[];
  submitting: boolean;
  onClose: () => void;
  onSubmit: (_e: React.FormEvent) => void;
}

export function BlogEditorModal({
  open,
  editingPost,
  formData,
  setFormData,
  categories,
  submitting,
  onClose,
  onSubmit,
}: BlogEditorModalProps) {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');
  const [uploadingCover, setUploadingCover] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);

  if (!open) return null;

  const handleTitleChange = (title: string) => {
    setFormData((prev) => ({
      ...prev,
      title,
      slug: editingPost ? prev.slug : slugify(title),
      seoTitle: prev.seoTitle || (title ? `${title} | Palnadu.dev` : ''),
    }));
  };

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingCover(true);
    try {
      const res: any = await api.media.upload(file);
      const url = res?.data?.url || res?.url;
      if (url) {
        setFormData((prev) => ({ ...prev, coverImage: url, ogImage: prev.ogImage || url }));
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Upload failed');
    } finally {
      setUploadingCover(false);
      if (coverInputRef.current) coverInputRef.current.value = '';
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="blog-editor-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-fade-in overflow-y-auto"
    >
      <div className="w-full max-w-2xl rounded-xl border border-palnadu-border bg-white shadow-xl overflow-hidden my-8">
        <div className="flex items-center justify-between border-b border-palnadu-border px-5 py-3.5 bg-palnadu-off-white/40">
          <div>
            <h2 id="blog-editor-modal-title" className="text-sm font-bold text-palnadu-dark">
              {editingPost ? 'Edit Blog Article' : 'Write New Blog Article'}
            </h2>
            <p className="text-xs text-palnadu-secondary">Configure article content, Cloudinary media, and Google SEO parameters.</p>
          </div>
          <Button
            type="button"
            size="sm"
            variant="ghost"
            onClick={onClose}
            aria-label="Close article editor modal"
            className="h-8 w-8 p-0 text-palnadu-secondary hover:text-palnadu-dark"
          >
            <X className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex border-b border-palnadu-border px-5 gap-4 text-xs font-semibold">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setActiveTab('content')}
            className={cn(
              'h-auto py-2.5 px-0 rounded-none border-b-2 font-semibold text-xs shadow-none hover:bg-transparent',
              activeTab === 'content' ? 'border-palnadu-blue text-palnadu-blue hover:text-palnadu-blue' : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
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
              activeTab === 'seo' ? 'border-palnadu-blue text-palnadu-blue hover:text-palnadu-blue' : 'border-transparent text-palnadu-secondary hover:text-palnadu-dark'
            )}
          >
            <Globe className="h-3.5 w-3.5" aria-hidden="true" />
            <span>2. Google SEO & Social Preview</span>
          </Button>
        </div>

        <form onSubmit={onSubmit} className="p-5 space-y-4">
          {activeTab === 'content' ? (
            <div className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="blog-editor-title">Article Title <span className="text-palnadu-error">*</span></Label>
                <Input id="blog-editor-title" type="text" required placeholder="e.g. 5 Practical Steps to Validate a SaaS MVP in 2026" value={formData.title} onChange={(e) => handleTitleChange(e.target.value)} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                <div className="sm:col-span-1 space-y-1">
                  <Label htmlFor="blog-editor-slug">URL Slug <span className="text-palnadu-error">*</span></Label>
                  <Input id="blog-editor-slug" type="text" required value={formData.slug} onChange={(e) => setFormData({ ...formData, slug: slugify(e.target.value) })} className="font-mono text-xs" />
                </div>
                <div className="sm:col-span-1 space-y-1">
                  <Label htmlFor="blog-editor-language">Language</Label>
                  <select id="blog-editor-language" value={formData.language} onChange={(e) => setFormData({ ...formData, language: e.target.value as 'en' | 'te' })} className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer">
                    <option value="en">English (en)</option>
                    <option value="te">Telugu (te)</option>
                  </select>
                </div>
                <div className="sm:col-span-1 space-y-1">
                  <Label htmlFor="blog-editor-category">Category</Label>
                  <select id="blog-editor-category" value={formData.categoryId || ''} onChange={(e) => setFormData({ ...formData, categoryId: e.target.value || undefined })} className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer">
                    <option value="">Select Category...</option>
                    {categories.map((c) => (<option key={c.id} value={c.id}>{c.name}</option>))}
                  </select>
                </div>
                <div className="sm:col-span-1 space-y-1">
                  <Label htmlFor="blog-editor-status">Publication Status</Label>
                  <select id="blog-editor-status" value={formData.status} onChange={(e) => setFormData({ ...formData, status: e.target.value as 'DRAFT' | 'PUBLISHED' | 'ARCHIVED' })} className="flex h-9 w-full rounded-md border border-palnadu-border bg-white px-3 py-1.5 text-xs text-palnadu-dark focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue cursor-pointer">
                    <option value="DRAFT">Draft (Internal Only)</option>
                    <option value="PUBLISHED">Published (Live)</option>
                    <option value="ARCHIVED">Archived (Delisted)</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <Label htmlFor="blog-editor-translation-group">Translation Group ID (Optional)</Label>
                <Input id="blog-editor-translation-group" type="text" placeholder="e.g. saas-mvp-validation (pairs English & Telugu versions)" value={formData.translationGroupId || ''} onChange={(e) => setFormData({ ...formData, translationGroupId: e.target.value || undefined })} className="font-mono text-xs" />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="blog-editor-cover-url">Cover Photo (Cloudinary CDN)</Label>
                {formData.coverImage ? (
                  <div className="relative rounded-lg border border-palnadu-border p-2 bg-palnadu-off-white/40 flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img src={formData.coverImage} alt="Cover preview" className="h-12 w-20 rounded-md object-cover border border-palnadu-border shrink-0" />
                      <span className="text-xs font-mono text-palnadu-secondary truncate">{formData.coverImage}</span>
                    </div>
                    <Button type="button" variant="ghost" size="sm" onClick={() => setFormData({ ...formData, coverImage: '', ogImage: '' })} className="text-xs text-palnadu-error hover:text-palnadu-error hover:bg-palnadu-error/10 shrink-0">Remove</Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
                    <Input type="file" ref={coverInputRef} accept="image/png,image/jpeg,image/webp,image/avif" onChange={handleCoverUpload} className="sr-only" tabIndex={-1} aria-hidden="true" id="blog-cover-upload" />
                    <Button type="button" variant="outline" size="sm" disabled={uploadingCover} onClick={() => coverInputRef.current?.click()} className="gap-1.5 shrink-0">
                      {uploadingCover ? (<><Loader2 className="h-3.5 w-3.5 animate-spin text-palnadu-blue" aria-hidden="true" /><span>Uploading to Cloudinary...</span></>) : (<><UploadCloud className="h-3.5 w-3.5 text-palnadu-blue" aria-hidden="true" /><span>Upload Photo</span></>)}
                    </Button>
                    <span className="text-xs text-palnadu-secondary shrink-0">or URL:</span>
                    <Input id="blog-editor-cover-url" type="url" placeholder="https://res.cloudinary.com/..." value={formData.coverImage} onChange={(e) => setFormData({ ...formData, coverImage: e.target.value })} className="flex-1" />
                  </div>
                )}
              </div>

              <div className="space-y-1">
                <Label htmlFor="blog-editor-excerpt">Short Excerpt (Summary)</Label>
                <Textarea id="blog-editor-excerpt" rows={2} placeholder="A 2-sentence summary shown on the blog index cards..." value={formData.excerpt} onChange={(e) => setFormData({ ...formData, excerpt: e.target.value })} />
              </div>

              <div className="space-y-1">
                <Label htmlFor="blog-editor-content">Article Content <span className="text-palnadu-error">*</span></Label>
                <Textarea id="blog-editor-content" rows={7} required placeholder="Write your article body here using Markdown (# Headers, - Bullet points, **bold**)..." value={formData.content} onChange={(e) => setFormData({ ...formData, content: e.target.value })} className="font-mono text-xs" />
              </div>
            </div>
          ) : (
            <BlogSeoTab formData={formData} setFormData={setFormData} />
          )}

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
              <Button type="button" variant="outline" size="sm" onClick={onClose}>Cancel</Button>
              <Button type="submit" variant="default" size="sm" disabled={submitting}>
                {submitting ? 'Saving...' : editingPost ? 'Update Article' : formData.status === 'PUBLISHED' ? 'Publish Article →' : 'Save as Draft'}
              </Button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
