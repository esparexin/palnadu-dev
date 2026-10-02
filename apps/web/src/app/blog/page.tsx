import type { Metadata } from 'next';
import { BlogIndexView } from '@/components/blog/blog-index-view';
import { api } from '@/lib/api';

export const metadata: Metadata = {
  title: 'Blog & Engineering Insights | Palnadu.dev',
  description:
    'Practical software engineering guides, startup MVP breakdowns, school websites, and local SEO insights by Palnadu.dev.',
  alternates: {
    canonical: '/blog',
    languages: {
      en: '/blog',
      te: '/te/blog',
      'x-default': '/blog',
    },
  },
};

type Props = {
  searchParams: Promise<{ category?: string; search?: string; page?: string; view?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const { category, search, page, view } = await searchParams;
  const currentPage = parseInt(page || '1', 10) || 1;
  const isArchiveView = view === 'archive';
  const limit = '12';

  let posts: any[] = [];
  let categories: any[] = [];
  let meta = {
    page: currentPage,
    limit: 12,
    total: 0,
    totalPages: 1,
  };

  try {
    const [postsRes, catRes]: [any, any] = await Promise.all([
      api.blog.list({
        page: String(currentPage),
        limit,
        includeArchived: 'true',
        // The English listing shows English posts only. Telugu posts resolve
        // exclusively under /te/blog/<slug>, never here.
        language: 'en',
        ...(isArchiveView ? { status: 'ARCHIVED' } : {}),
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
      }),
      api.blog.categories(),
    ]);

    posts = postsRes?.data || [];
    if (postsRes?.meta) {
      meta = {
        page: postsRes.meta.page || currentPage,
        limit: postsRes.meta.limit || 12,
        total: postsRes.meta.total || 0,
        totalPages: postsRes.meta.totalPages || 1,
      };
    }
    categories = catRes?.data || [];
  } catch {
    posts = [];
    categories = [];
  }

  return (
    <BlogIndexView
      locale="en"
      posts={posts}
      categories={categories}
      meta={meta}
      search={search}
      category={category}
      currentPage={currentPage}
      isArchiveView={isArchiveView}
    />
  );
}
