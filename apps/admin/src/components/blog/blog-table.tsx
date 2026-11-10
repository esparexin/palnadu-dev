'use client';

import React from 'react';
import type { BlogPost } from '@palnadu/types';
import {
  FileText,
  Sparkles,
  CheckCircle2,
  ExternalLink,
  Edit2,
  Trash2,
  Loader2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { siteConfig, formatBlogDate } from '@palnadu/config';
import { cn } from '@/lib/utils';
import { BlogPagination } from './blog-pagination';

interface BlogTableProps {
  posts: BlogPost[];
  loading: boolean;
  publishingId: string | null;
  onQuickPublish: (_post: BlogPost) => void;
  onOpenEdit: (_post: BlogPost) => void;
  onDeleteRequest: (_target: { id: string; title: string }) => void;
  currentPage: number;
  pageSize: number;
  totalPosts: number;
  totalPages: number;
  onPageChange: (_page: number) => void;
  onPageSizeChange: (_size: number) => void;
}

export function BlogTable({
  posts,
  loading,
  publishingId,
  onQuickPublish,
  onOpenEdit,
  onDeleteRequest,
  currentPage,
  pageSize,
  totalPosts,
  totalPages,
  onPageChange,
  onPageSizeChange,
}: BlogTableProps) {
  return (
    <div className="rounded-xl border border-palnadu-border bg-white shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto overflow-y-auto max-h-[580px] sm:max-h-[640px]">
        <table className="w-full text-xs border-collapse">
          <thead className="sticky top-0 z-10 bg-palnadu-off-white border-b border-palnadu-border text-palnadu-secondary text-left font-semibold shadow-sm">
            <tr>
              <th className="px-4 py-3 bg-palnadu-off-white">Article Title & Slug</th>
              <th className="px-4 py-3 bg-palnadu-off-white">Lang</th>
              <th className="px-4 py-3 bg-palnadu-off-white">Category</th>
              <th className="px-4 py-3 bg-palnadu-off-white">SEO Health</th>
              <th className="px-4 py-3 bg-palnadu-off-white">Status</th>
              <th className="px-4 py-3 bg-palnadu-off-white">Date / Status</th>
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
                <tr key={post.id} className="hover:bg-palnadu-light-blue/20 transition-colors">
                  <td className="px-4 py-3 max-w-md">
                    <div className="font-bold text-palnadu-dark text-xs flex items-center gap-1.5">
                      <FileText className="h-3.5 w-3.5 text-palnadu-blue shrink-0" />
                      <span>{post.title}</span>
                    </div>
                    <div className="font-mono text-xs text-palnadu-secondary mt-0.5">/blog/{post.slug}</div>
                  </td>
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
                        <span className="text-palnadu-blue text-xs" title={`Translation Group ID: ${post.translationGroupId}`}>
                          🔗
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-3 whitespace-nowrap">
                    <span className="inline-block px-2 py-0.5 rounded-md bg-palnadu-off-white border border-palnadu-border text-xs font-semibold text-palnadu-dark">
                      {post.category?.name || 'Unassigned'}
                    </span>
                  </td>
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
                  <td className="px-4 py-3 whitespace-nowrap text-xs font-mono" title={post.publishDate ? `Published: ${post.publishDate}` : `Created: ${post.createdAt}`}>
                    {post.status === 'PUBLISHED' ? (
                      <div>
                        <span className="font-semibold text-palnadu-teal-dark mr-1">Pub:</span>
                        <span className="text-palnadu-dark">{formatBlogDate(post.publishDate || post.createdAt)}</span>
                      </div>
                    ) : post.status === 'ARCHIVED' ? (
                      <div>
                        <span className="text-palnadu-secondary mr-1">Archived:</span>
                        <span className="text-palnadu-secondary">{formatBlogDate(post.publishDate || post.createdAt)}</span>
                      </div>
                    ) : (
                      <div>
                        <span className="text-palnadu-warning font-semibold mr-1">Draft:</span>
                        <span className="text-palnadu-secondary">{formatBlogDate(post.createdAt)}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-3 text-right whitespace-nowrap space-x-1">
                    {post.status === 'DRAFT' && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => onQuickPublish(post)}
                        disabled={publishingId === post.id}
                        className="h-7 px-2 text-xs"
                        title="1-Click Approve & Publish"
                      >
                        {publishingId === post.id ? (
                          <Loader2 className="h-3 w-3 animate-spin mr-1" />
                        ) : (
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                        )}
                        <span>{publishingId === post.id ? 'Publishing...' : 'Approve'}</span>
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
                      onClick={() => onOpenEdit(post)}
                      className="h-7 w-7 p-0 text-palnadu-blue"
                      title="Edit Article"
                    >
                      <Edit2 className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onDeleteRequest({ id: post.id, title: post.title })}
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

      <BlogPagination
        currentPage={currentPage}
        pageSize={pageSize}
        totalPosts={totalPosts}
        totalPages={totalPages}
        loading={loading}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
