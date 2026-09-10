import type { Metadata } from 'next';
import Link from 'next/link';
import { SectionHeading } from '@/components/layout/section-heading';
import { CtaSection } from '@/components/sections/cta-section';
import { imagePresets, siteConfig } from '@palnadu/config';
import { api } from '@/lib/api';
import { Calendar, ArrowRight, Tag, Clock, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export const metadata: Metadata = {
  title: 'Blog & Engineering Insights',
  description:
    'Practical software engineering guides, startup MVP breakdowns, school websites, and local SEO insights by Palnadu.dev.',
  alternates: {
    canonical: '/blog',
  },
};

type Props = {
  searchParams: Promise<{ category?: string; search?: string }>;
};

export default async function BlogPage({ searchParams }: Props) {
  const { category, search } = await searchParams;

  let posts: any[] = [];
  let categories: any[] = [];

  try {
    const [postsRes, catRes]: [any, any] = await Promise.all([
      api.blog.list({
        page: '1',
        limit: '24',
        ...(category ? { category } : {}),
        ...(search ? { search } : {}),
      }),
      api.blog.categories(),
    ]);

    posts = postsRes?.data || [];
    categories = catRes?.data || [];
  } catch {
    posts = [];
    categories = [];
  }

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    name: 'Palnadu.dev Engineering Blog',
    description:
      'Practical software engineering guides, startup MVP breakdowns, school websites, and local SEO insights by Palnadu.dev.',
    url: `${siteConfig.url}/blog`,
    publisher: {
      '@type': 'Organization',
      name: 'Palnadu.dev',
      url: siteConfig.url,
      logo: `${siteConfig.url}/footer_header-logo.png`,
    },
  };

  const breadcrumbJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Home',
        item: siteConfig.url,
      },
      {
        '@type': 'ListItem',
        position: 2,
        name: 'Blog',
        item: `${siteConfig.url}/blog`,
      },
    ],
  };

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
          <SectionHeading
            label="Knowledge Base"
            title="Insights & Engineering Truths"
            description="Practical guides on startup MVPs, school web platforms, local SEO, and avoiding expensive software traps."
          />

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
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-palnadu-blue text-white text-xs font-semibold hover:bg-[#12487e] transition-colors cursor-pointer"
              >
                Search
              </button>
            </form>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
              <Link
                href="/blog"
                className={cn(
                  'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                  !category
                    ? 'bg-palnadu-blue text-white shadow-2xs'
                    : 'bg-palnadu-off-white/80 border border-palnadu-border text-palnadu-body hover:border-palnadu-blue hover:text-palnadu-blue'
                )}
              >
                All Articles
              </Link>
              {categories.map((cat: any) => (
                <Link
                  key={cat.id}
                  href={`/blog?category=${cat.slug}${search ? `&search=${search}` : ''}`}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                    category === cat.slug
                      ? 'bg-palnadu-blue text-white shadow-2xs'
                      : 'bg-palnadu-off-white/80 border border-palnadu-border text-palnadu-body hover:border-palnadu-blue hover:text-palnadu-blue'
                  )}
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </div>

          {/* Articles Listing */}
          {posts.length === 0 ? (
            <div className="mx-auto mt-12 max-w-lg text-center">
              <div className="rounded-xl border border-palnadu-border bg-palnadu-off-white p-8 shadow-2xs space-y-2">
                <h3 className="text-base font-bold text-palnadu-dark">No Articles Found</h3>
                <p className="text-xs text-palnadu-body leading-relaxed">
                  {search || category
                    ? 'No published articles match your current search or category filter. Try clearing your filters.'
                    : 'We are preparing practical engineering breakdowns and startup validation guides.'}
                </p>
                {(search || category) && (
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
            <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {posts.map((post: any) => {
                const words = post.content ? post.content.split(/\s+/).length : 0;
                const readMinutes = Math.max(1, Math.ceil(words / 220));

                return (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="flex flex-col justify-between rounded-xl border border-palnadu-border bg-white p-5 shadow-2xs hover:border-palnadu-blue hover:shadow-sm transition-all group cursor-pointer text-left"
                  >
                    <div className="space-y-3">
                      {/* Cover Photo with Smart Editorial Fallback */}
                      {post.coverImage ? (
                        <div className="rounded-lg overflow-hidden h-44 border border-palnadu-border/60 bg-palnadu-off-white relative">
                          <img
                            src={imagePresets.blogCard(post.coverImage)}
                            alt={post.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                          />
                        </div>
                      ) : (
                        <div className="rounded-lg overflow-hidden h-44 border border-palnadu-border/60 bg-gradient-to-br from-palnadu-dark via-[#083b6f] to-palnadu-blue p-5 flex flex-col justify-between text-white relative">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-mono font-bold uppercase tracking-widest text-palnadu-teal">
                              {post.category?.name || 'Engineering'}
                            </span>
                            <span className="h-2 w-2 rounded-full bg-palnadu-teal" />
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
          )}
        </div>
      </section>

      <CtaSection />
      </div>
    </>
  );
}
