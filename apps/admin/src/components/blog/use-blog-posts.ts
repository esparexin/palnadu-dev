'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { api } from '@/lib/api';
import { BlogPost, PublishStatus } from '@palnadu/types';
import { useToast } from '@/components/ui/toast';
import { CategoryOption } from './types';
import { getQuickPublishRollback } from './blog-admin.util';

const SEARCH_DEBOUNCE_MS = 300;

export function useBlogPosts() {
  const { toast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearchState] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilterState] = useState('');
  const [categoryFilter, setCategoryFilterState] = useState('');
  const [languageFilter, setLanguageFilterState] = useState('');

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSizeState] = useState(10);
  const [totalPosts, setTotalPosts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [publishedCount, setPublishedCount] = useState(0);
  const [draftCount, setDraftCount] = useState(0);
  const [archivedCount, setArchivedCount] = useState(0);
  const [publishingId, setPublishingId] = useState<string | null>(null);
  const requestSeqRef = useRef(0);

  const fetchCounts = useCallback(() => {
    api.automation.status().then((res) => {
      if (res?.data?.statistics) {
        setPublishedCount(res.data.statistics.publishedPosts || 0);
        setDraftCount(res.data.statistics.draftPosts || 0);
        setArchivedCount(res.data.statistics.archivedPosts || 0);
      }
    }).catch(() => {});
  }, []);

  const fetchPosts = useCallback(() => {
    const requestId = ++requestSeqRef.current;
    setLoading(true);
    const params: Record<string, string> = { page: String(currentPage), limit: String(pageSize) };
    if (debouncedSearch) params.search = debouncedSearch;
    if (statusFilter) params.status = statusFilter;
    if (categoryFilter) params.category = categoryFilter;
    if (languageFilter) params.language = languageFilter;

    Promise.all([api.blog.list(params), api.blog.categories()])
      .then((results) => {
        if (requestId !== requestSeqRef.current) return;
        const postsRes = (results[0] ?? {}) as { data?: BlogPost[]; meta?: { total?: number; totalPages?: number } };
        const catRes = (results[1] ?? {}) as { data?: CategoryOption[] };
        setPosts(postsRes.data || []);
        if (postsRes.meta) {
          setTotalPosts(postsRes.meta.total || 0);
          setTotalPages(postsRes.meta.totalPages || 1);
        }
        setCategories(catRes.data || []);
      })
      .catch((err) => {
        if (requestId !== requestSeqRef.current) return;
        toast.error(err instanceof Error ? err.message : 'Failed to load articles');
      })
      .finally(() => {
        if (requestId === requestSeqRef.current) setLoading(false);
      });
  }, [currentPage, pageSize, debouncedSearch, statusFilter, categoryFilter, languageFilter, toast]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch((prev) => {
        if (prev !== search) setCurrentPage(1);
        return search;
      });
    }, SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);
  useEffect(() => { fetchCounts(); }, [fetchCounts]);

  const setSearch = useCallback((value: string) => setSearchState(value), []);
  const setStatusFilter = useCallback((value: string) => { setStatusFilterState(value); setCurrentPage(1); }, []);
  const setCategoryFilter = useCallback((value: string) => { setCategoryFilterState(value); setCurrentPage(1); }, []);
  const setLanguageFilter = useCallback((value: string) => { setLanguageFilterState(value); setCurrentPage(1); }, []);
  const setPageSize = useCallback((value: number) => { setPageSizeState(value); setCurrentPage(1); }, []);

  const quickPublish = async (post: BlogPost) => {
    if (publishingId) return;
    setPublishingId(post.id);
    const rollback = getQuickPublishRollback(post);
    const publishDate = post.publishDate || new Date().toISOString();
    setPosts((prev) => prev.map((p) => (p.id === post.id ? { ...p, status: PublishStatus.PUBLISHED, publishDate } : p)));
    if (rollback.wasDraft) {
      setDraftCount((c) => Math.max(0, c - 1));
      setPublishedCount((c) => c + 1);
    }
    try {
      await api.blog.update(post.id, { status: PublishStatus.PUBLISHED, publishDate });
      toast.success(`"${post.title.slice(0, 40)}..." is live on Google!`);
      fetchCounts();
    } catch (err) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === post.id ? { ...p, status: rollback.status, publishDate: rollback.publishDate } : p,
        ),
      );
      if (rollback.wasDraft) {
        setDraftCount((c) => c + 1);
        setPublishedCount((c) => Math.max(0, c - 1));
      }
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
