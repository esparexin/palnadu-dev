import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/layout/section-heading';
import { CtaSection } from '@/components/sections/cta-section';
import { imagePresets, siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { api } from '@/lib/api';
import { Calendar, ArrowRight, Tag, Clock, Search, Archive, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Blog & Engineering Insights | Palnadu.dev',
  description:
    'Practical software engineering guides, startup MVP breakdowns, school websites, and local SEO insights by Palnadu.dev.',
  alternates: {
    canonical: '/blog',
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

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${siteConfig.url}/blog/#blog`,
    name: 'Palnadu.dev Engineering Blog & Archive',
    description:
      'Practical software engineering guides, startup MVP breakdowns, school websites, and local SEO insights by Palnadu.dev.',
    url: `${siteConfig.url}/blog`,
    publisher: getOrganizationRef(),
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: isArchiveView ? 'Blog Archive' : 'Blog', path: isArchiveView ? '/blog?view=archive' : '/blog' },
  ]);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <div className="bg-white">
        <section className="py-14 sm:py-18">
          <div className="container max-w-5xl">
            <div className="max-w-2xl mx-auto text-center space-y-2">
              <p className="text-xs font-mono uppercase tracking-widest text-palnadu-blue font-bold">
                Knowledge Base & Publication Archive
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-palnadu-dark leading-tight">
                {isArchiveView ? 'Archived Engineering Articles' : 'Engineering Insights & Software Truths'}
              </h1>
              <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
                {isArchiveView
                  ? 'Historical publications, foundational tech guides, and architectural notes preserved for reference.'
                  : 'Practical guides on startup MVPs, web application development, school platforms, and local SEO in Palnadu and Guntur.'}
              </p>
            </div>

            {/* Search & Category Filter Bar */}
            <div className="mt-10 space-y-4">
              {/* Search Bar */}
              <form method="GET" action="/blog" className="relative max-w-md mx-auto">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-palnadu-secondary" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search || ''}
                  placeholder="Search articles by topic, school, MVP, or SEO..."
                  className="w-full pl-10 pr-24 py-2 text-xs sm:text-sm rounded-lg border border-palnadu-border bg-white text-palnadu-dark placeholder:text-palnadu-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue shadow-2xs"
                />
                {category && <input type="hidden" name="category" value={category} />}
                {isArchiveView && <input type="hidden" name="view" value="archive" />}
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-palnadu-blue text-white text-xs font-semibold hover:bg-[#12487e] transition-colors cursor-pointer"
                >
                  Search
                </button>
              </form>

              {/* Category Filter Pills + Archive Switcher */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                <Link
                  href={`/blog${search ? `?search=${search}` : ''}`}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                    !category && !isArchiveView
                      ? 'bg-palnadu-blue text-white shadow-2xs'
                      : 'bg-palnadu-off-white/80 border border-palnadu-border text-palnadu-body hover:border-palnadu-blue hover:text-palnadu-blue'
                  )}
                >
                  All Publications ({meta.total || '36+'})
                </Link>

                {categories.map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={`/blog?category=${cat.slug}${search ? `&search=${search}` : ''}`}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                      category === cat.slug && !isArchiveView
                        ? 'bg-palnadu-blue text-white shadow-2xs'
                        : 'bg-palnadu-off-white/80 border border-palnadu-border text-palnadu-body hover:border-palnadu-blue hover:text-palnadu-blue'
                    )}
                  >
                    {cat.name}
                  </Link>
                ))}

                {/* Dedicated Archive Filter */}
                <Link
                  href={`/blog?view=archive${search ? `&search=${search}` : ''}`}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-1',
                    isArchiveView
                      ? 'bg-palnadu-dark text-white shadow-2xs'
                      : 'bg-palnadu-off-white/80 border border-palnadu-border text-palnadu-body hover:border-palnadu-blue hover:text-palnadu-blue'
                  )}
                >
                  <Archive className="h-3 w-3" />
                  <span>Archived Blogs</span>
                </Link>
              </div>
            </div>

            {/* Articles Listing */}
            {posts.length === 0 ? (
              <div className="mx-auto mt-12 max-w-lg text-center">
                <div className="rounded-xl border border-palnadu-border bg-palnadu-off-white p-8 shadow-2xs space-y-2">
                  <h3 className="text-base font-bold text-palnadu-dark">No Articles Found</h3>
                  <p className="text-xs text-palnadu-body leading-relaxed">
                    {search || category || isArchiveView
                      ? 'No articles match your current search, category, or archive filter. Try clearing your filters.'
                      : 'We are preparing practical engineering breakdowns and startup validation guides.'}
                  </p>
                  {(search || category || isArchiveView) && (
                    <div className="pt-2">
                      <Link
                        href="/blog"
                        className="inline-flex items-center text-xs font-semibold text-palnadu-blue hover:underline"
                      >
                        Clear all filters →
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post: any) => {
                    const words = post.content ? post.content.split(/\s+/).length : 0;
                    const readMinutes = Math.max(1, Math.ceil(words / 220));
                    const isPostArchived = post.status === 'ARCHIVED';

                    return (
                      <Link
                        key={post.id}
                        href={`/blog/${post.slug}`}
                        className="flex flex-col justify-between rounded-xl border border-palnadu-border bg-white p-5 shadow-2xs hover:border-palnadu-blue hover:shadow-sm transition-all group cursor-pointer text-left relative"
                      >
                        <div className="space-y-3">
                          {/* Cover Photo with Fallback */}
                          {post.coverImage ? (
                            <div className="rounded-lg overflow-hidden h-44 border border-palnadu-border/60 bg-palnadu-off-white relative">
                              <img
                                src={imagePresets.blogCard(post.coverImage)}
                                alt={post.title}
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                              />
                              {isPostArchived && (
                                <span className="absolute top-2.5 right-2.5 px-2 py-0.5 rounded bg-black/75 backdrop-blur-xs text-white text-[10px] font-mono font-bold uppercase tracking-wider">
                                  Archived
                                </span>
                              )}
                            </div>
                          ) : (
                            <div className="rounded-lg overflow-hidden h-44 border border-palnadu-border/60 bg-gradient-to-br from-palnadu-dark via-[#083b6f] to-palnadu-blue p-5 flex flex-col justify-between text-white relative">
                              <div className="flex items-center justify-between">
                                <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-palnadu-teal">
                                  {post.category?.name || 'Engineering'}
                                </span>
                                {isPostArchived ? (
                                  <span className="px-2 py-0.5 rounded bg-white/20 text-white text-[10px] font-mono font-bold uppercase">
                                    Archived
                                  </span>
                                ) : (
                                  <span className="h-2 w-2 rounded-full bg-palnadu-teal" />
                                )}
                              </div>
                              <div className="space-y-1">
                                <p className="text-[11px] font-mono text-palnadu-light-blue/80">Palnadu.dev Publication</p>
                                <p className="text-sm font-bold text-white line-clamp-2">{post.title}</p>
                              </div>
                            </div>
                          )}

                          {/* Meta Tags: Category + Reading Time */}
                          <div className="flex items-center justify-between gap-2 text-[11px] text-palnadu-secondary">
                            {post.category?.name ? (
                              <span className="inline-flex items-center gap-1 font-semibold text-palnadu-teal">
                                <Tag className="h-3 w-3" />
                                <span>{post.category.name}</span>
                              </span>
                            ) : (
                              <span className="font-mono">Guide</span>
                            )}

                            <span className="inline-flex items-center gap-1 font-mono">
                              <Clock className="h-3 w-3 text-palnadu-secondary/80" />
                              <span>{readMinutes} min read</span>
                            </span>
                          </div>

                          {/* Title */}
                          <h2 className="text-base font-bold text-palnadu-dark group-hover:text-palnadu-blue transition-colors leading-snug line-clamp-2">
                            {post.title}
                          </h2>

                          {/* Excerpt */}
                          {post.excerpt && (
                            <p className="text-xs text-palnadu-body leading-relaxed line-clamp-3">
                              {post.excerpt}
                            </p>
                          )}
                        </div>

                        {/* Footer Date & Read Indicator */}
                        <div className="pt-3 mt-4 border-t border-palnadu-border/40 flex items-center justify-between text-xs">
                          <div className="flex items-center gap-1 text-[11px] text-palnadu-secondary font-mono">
                            <Calendar className="h-3 w-3 text-palnadu-secondary/80" />
                            <time dateTime={post.publishDate || post.createdAt}>
                              {new Date(post.publishDate || post.createdAt).toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'short',
                                day: 'numeric',
                              })}
                            </time>
                          </div>

                          <span className="inline-flex items-center gap-1 font-semibold text-palnadu-blue group-hover:underline text-xs">
                            <span>Read</span>
                            <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>

                {/* Pagination Navigation Controls */}
                {meta.totalPages > 1 && (
                  <div className="mt-12 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-palnadu-border/60 pt-6">
                    <div className="text-xs font-mono text-palnadu-secondary">
                      Showing {(meta.page - 1) * meta.limit + 1}–{Math.min(meta.page * meta.limit, meta.total)} of {meta.total} articles
                    </div>

                    <div className="flex items-center gap-1.5">
                      {meta.page > 1 ? (
                        <Link
                          href={`/blog?page=${meta.page - 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}${isArchiveView ? '&view=archive' : ''}`}
                          className="px-3 py-1.5 rounded-lg border border-palnadu-border bg-white text-xs font-semibold text-palnadu-dark hover:bg-palnadu-light-blue hover:text-palnadu-blue transition-colors flex items-center gap-1"
                        >
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>Previous</span>
                        </Link>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg border border-palnadu-border/40 bg-gray-50 text-xs font-semibold text-gray-400 cursor-not-allowed flex items-center gap-1">
                          <ChevronLeft className="h-3.5 w-3.5" />
                          <span>Previous</span>
                        </span>
                      )}

                      {Array.from({ length: meta.totalPages }, (_, i) => i + 1).map((p) => (
                        <Link
                          key={p}
                          href={`/blog?page=${p}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}${isArchiveView ? '&view=archive' : ''}`}
                          className={cn(
                            'h-8 w-8 rounded-lg text-xs font-mono font-bold flex items-center justify-center transition-colors',
                            p === meta.page
                              ? 'bg-palnadu-blue text-white shadow-xs'
                              : 'border border-palnadu-border bg-white text-palnadu-body hover:bg-palnadu-light-blue hover:text-palnadu-blue'
                          )}
                        >
                          {p}
                        </Link>
                      ))}

                      {meta.page < meta.totalPages ? (
                        <Link
                          href={`/blog?page=${meta.page + 1}${category ? `&category=${category}` : ''}${search ? `&search=${search}` : ''}${isArchiveView ? '&view=archive' : ''}`}
                          className="px-3 py-1.5 rounded-lg border border-palnadu-border bg-white text-xs font-semibold text-palnadu-dark hover:bg-palnadu-light-blue hover:text-palnadu-blue transition-colors flex items-center gap-1"
                        >
                          <span>Next</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      ) : (
                        <span className="px-3 py-1.5 rounded-lg border border-palnadu-border/40 bg-gray-50 text-xs font-semibold text-gray-400 cursor-not-allowed flex items-center gap-1">
                          <span>Next</span>
                          <ChevronRight className="h-3.5 w-3.5" />
                        </span>
                      )}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </section>

        <CtaSection />
      </div>
    </>
  );
}
