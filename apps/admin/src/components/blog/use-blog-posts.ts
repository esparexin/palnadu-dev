'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { BlogPost, PublishStatus } from '@palnadu/types';
import { useToast } from '@/components/ui/toast';
import { CategoryOption } from './types';

export function useBlogPosts() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [languageFilter, setLanguageFilter] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [publishingId, setPublishingId] = useState<string | null>(null);

  const fetchCounts = () => {
    api.automation.status().then((res: any) => {
      if (res?.data?.statistics) {
        setPublishedCount(res.data.statistics.publishedPosts || 0);
        setDraftCount(res.data.statistics.draftPosts || 0);
        setArchivedCount(res.data.statistics.archivedPosts || 0);
      }
    }).catch(() => {});
  };

  const fetchPosts = () => {
    setLoading(true);
    const params: Record<string, string> = { page: String(currentPage), limit: String(pageSize) };
    if (search) params.search = search;
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    if (languageFilter) params.language = languageFilter;

    Promise.all([api.blog.list(params), api.blog.categories()])
      .then(([postsRes, catRes]: [any, any]) => {
        setPosts(postsRes.data || []);
        if (postsRes.meta) {
          setTotalPosts(postsRes.meta.total || 0);
          setTotalPages(postsRes.meta.totalPages || 1);
        }
        setCategories(catRes.data || []);
      })
      .catch((err) => toast.error(err instanceof Error ? err.message : 'Failed to load articles'))
      .finally(() => setLoading(false));
  };

  useEffect(() => { setCurrentPage(1); }, [search, statusFilter, categoryFilter, languageFilter, pageSize]);
  useEffect(() => { fetchPosts(); }, [currentPage, pageSize, search, statusFilter, categoryFilter, languageFilter]);
  useEffect(() => { fetchCounts(); }, []);

  const quickPublish = async (post: any) => {
    if (publishingId) return;
    setPublishingId(post.id);
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: PublishStatus.PUBLISHED, publishDate: new Date().toISOString() } : p)));
    setDraftCount((c) => Math.max(0, c - 1));
    setPublishedCount((c) => c + 1);
    try {
      await api.blog.update(post.id, { status: PublishStatus.PUBLISHED, publishDate: new Date().toISOString() });
      toast.success(`"${post.title.slice(0, 40)}..." is live on Google!`);
      fetchCounts();
    } catch (err) {
      setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: PublishStatus.DRAFT, publishDate: post.publishDate } : p)));
      setDraftCount((c) => c + 1);
      setPublishedCount((c) => Math.max(0, c - 1));
      toast.error(err instanceof Error ? err.message : 'Failed to publish article');
    } finally {
      setPublishingId(null);
    }
  };

  return {
    posts,
    categories,
    loading,
    search,
    setSearch,
    statusFilter,
    setStatusFilter,
    categoryFilter,
    setCategoryFilter,
    languageFilter,
    setLanguageFilter,
    currentPage,
    setCurrentPage,
    pageSize,
    setPageSize,
    totalPosts,
    totalPages,
    publishedCount,
    draftCount,
    archivedCount,
    publishingId,
    fetchCounts,
    fetchPosts,
    quickPublish,
  };
}
