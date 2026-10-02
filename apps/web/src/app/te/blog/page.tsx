import type { Metadata } from 'next';
import { BlogIndexView } from '@/components/blog/blog-index-view';
import { api } from '@/lib/api';

// Telugu listing. Self-canonical at /te/blog with an hreflang alternate to
// the English index — never the reverse, and never an alternate that 404s.
export const metadata: Metadata = {
  title: 'బ్లాగ్ & ఇంజనీరింగ్ అంతర్దృష్టులు | Palnadu.dev',
  description:
    'Palnadu.dev ద్వారా ఆచరణాత్మక సాఫ్ట్‌వేర్ ఇంజనీరింగ్ మార్గదర్శకాలు, స్టార్టప్ MVP విశ్లేషణలు, పాఠశాల వెబ్‌సైట్‌లు మరియు స్థానిక SEO అంతర్దృష్టులు.',
  alternates: {
    canonical: '/te/blog',
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

export default async function TeluguBlogPage({ searchParams }: Props) {
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
        language: 'te',
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
      locale="te"
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
