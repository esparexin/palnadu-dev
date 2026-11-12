'use client';

import React from 'react';
import { Eye } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { siteConfig } from '@palnadu/config';
import { cn } from '@/lib/utils';
import { BlogFormData } from './types';

interface BlogSeoTabProps {
  formData: BlogFormData;
  setFormData: React.Dispatch<React.SetStateAction<BlogFormData>>;
}

export function BlogSeoTab({ formData, setFormData }: BlogSeoTabProps) {
  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-palnadu-border bg-palnadu-off-white/40 p-4 space-y-3">
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="blog-seo-title">Google Search Title Tag</Label>
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
            id="blog-seo-title"
            type="text"
            placeholder="e.g. 5 Practical Steps to Validate a SaaS MVP | Palnadu.dev"
            value={formData.seoTitle}
            onChange={(e) => setFormData({ ...formData, seoTitle: e.target.value })}
          />
          <p className="text-xs text-palnadu-secondary">Recommended: 50–60 characters. Place your main keyword first.</p>
        </div>

        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <Label htmlFor="blog-seo-description">Google Meta Description Snippet</Label>
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
            id="blog-seo-description"
            rows={3}
            placeholder="e.g. Learn how software engineers validate startup ideas, avoid costly technical traps, and launch an MVP with paying customers in 3 to 6 weeks."
            value={formData.seoDescription}
            onChange={(e) => setFormData({ ...formData, seoDescription: e.target.value })}
          />
          <p className="text-xs text-palnadu-secondary">Recommended: 140–160 characters. Provide a compelling click hook for searchers.</p>
        </div>
      </div>

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
  );
}
