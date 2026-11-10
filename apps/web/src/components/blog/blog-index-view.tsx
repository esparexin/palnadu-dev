import Link from 'next/link';
import { CtaSection } from '@/components/sections/cta-section';
import { siteConfig, getBreadcrumbSchema, getOrganizationRef } from '@palnadu/config';
import { Search, Archive, Languages } from 'lucide-react';
import { cn } from '@/lib/utils';
import { articleBasePath, articleDateLocale } from '@/lib/blog-post';
import { INDEX_COPY, type BlogIndexViewProps } from './blog-index-copy';
import { BlogCard } from './blog-card';
import { BlogPagination } from './blog-pagination';

export function BlogIndexView({
  locale,
  posts,
  categories,
  meta,
  search,
  category,
  currentPage: _currentPage,
  isArchiveView,
}: BlogIndexViewProps) {
  const basePath = articleBasePath(locale);
  const dateLocale = articleDateLocale(locale);
  const copy = INDEX_COPY[locale];

  const blogJsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Blog',
    '@id': `${siteConfig.url}${basePath}/#blog`,
    name: copy.jsonLdName,
    description: copy.jsonLdDescription,
    url: `${siteConfig.url}${basePath}`,
    publisher: getOrganizationRef(),
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    {
      name: isArchiveView ? copy.blogArchiveCrumb : copy.blogCrumb,
      path: isArchiveView ? `${basePath}?view=archive` : basePath,
    },
  ]);

  const querySuffix = `${search ? `?search=${search}` : ''}`;

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
                {copy.kicker}
              </p>
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-extrabold tracking-tight text-palnadu-dark leading-tight">
                {isArchiveView ? copy.titleArchive : copy.title}
              </h1>
              <p className="text-sm sm:text-base text-palnadu-body leading-relaxed">
                {isArchiveView ? copy.subtitleArchive : copy.subtitle}
              </p>
            </div>

            {/* Accessible Language Switcher */}
            <nav aria-label="Blog Language Selection" className="flex items-center justify-center pt-3">
              <div className="inline-flex items-center gap-1 p-1 rounded-lg border border-palnadu-border bg-palnadu-off-white/80 text-xs">
                <Languages className="h-3.5 w-3.5 text-palnadu-secondary ml-1 mr-0.5" aria-hidden="true" />
                <Link
                  href="/blog"
                  hrefLang="en"
                  aria-current={locale === 'en' ? 'page' : undefined}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
                    locale === 'en'
                      ? 'bg-white text-palnadu-blue shadow-sm border border-palnadu-border/60'
                      : 'text-palnadu-body hover:text-palnadu-dark'
                  )}
                >
                  English
                </Link>
                <Link
                  href="/te/blog"
                  hrefLang="te"
                  lang="te"
                  aria-current={locale === 'te' ? 'page' : undefined}
                  className={cn(
                    'px-2.5 py-1 rounded-md text-xs font-semibold transition-colors',
                    locale === 'te'
                      ? 'bg-white text-palnadu-blue shadow-sm border border-palnadu-border/60'
                      : 'text-palnadu-body hover:text-palnadu-dark'
                  )}
                >
                  తెలుగు
                </Link>
              </div>
            </nav>

            {/* Search & Category Filter Bar */}
            <div className="mt-10 space-y-4">
              <form method="GET" action={basePath} className="relative max-w-md mx-auto">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-palnadu-secondary" />
                <input
                  type="text"
                  name="search"
                  defaultValue={search || ''}
                  placeholder={copy.searchPlaceholder}
                  className="w-full pl-10 pr-24 py-2 text-xs sm:text-sm rounded-lg border border-palnadu-border bg-white text-palnadu-dark placeholder:text-palnadu-secondary/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-palnadu-blue shadow-sm"
                />
                {category && <input type="hidden" name="category" value={category} />}
                {isArchiveView && <input type="hidden" name="view" value="archive" />}
                <button
                  type="submit"
                  className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 rounded-md bg-palnadu-blue text-white text-xs font-semibold hover:bg-palnadu-dark-hover transition-colors cursor-pointer shadow-sm"
                >
                  {copy.searchButton}
                </button>
              </form>

              {/* Category Filter Pills + Archive Switcher */}
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                <Link
                  href={`${basePath}${querySuffix}`}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                    !category && !isArchiveView
                      ? 'bg-palnadu-blue text-white shadow-sm'
                      : 'bg-palnadu-off-white/80 border border-palnadu-border text-palnadu-body hover:border-palnadu-blue hover:text-palnadu-blue'
                  )}
                >
                  {copy.allPubs} ({meta.total || '36+'})
                </Link>

                {categories.map((cat: any) => (
                  <Link
                    key={cat.id}
                    href={`${basePath}?category=${cat.slug}${search ? `&search=${search}` : ''}`}
                    className={cn(
                      'px-3 py-1 rounded-full text-xs font-semibold transition-colors',
                      category === cat.slug && !isArchiveView
                        ? 'bg-palnadu-blue text-white shadow-sm'
                        : 'bg-palnadu-off-white/80 border border-palnadu-border text-palnadu-body hover:border-palnadu-blue hover:text-palnadu-blue'
                    )}
                  >
                    {cat.name}
                  </Link>
                ))}

                <Link
                  href={`${basePath}?view=archive${search ? `&search=${search}` : ''}`}
                  className={cn(
                    'px-3 py-1 rounded-full text-xs font-semibold transition-colors inline-flex items-center gap-1',
                    isArchiveView
                      ? 'bg-palnadu-dark text-white shadow-sm'
                      : 'bg-palnadu-off-white/80 border border-palnadu-border text-palnadu-body hover:border-palnadu-blue hover:text-palnadu-blue'
                  )}
                >
                  <Archive className="h-3 w-3" />
                  <span>{copy.archived}</span>
                </Link>
              </div>
            </div>

            {/* Articles Listing */}
            {posts.length === 0 ? (
              <div className="mx-auto mt-12 max-w-lg text-center">
                <div className="rounded-xl border border-palnadu-border bg-palnadu-off-white p-8 shadow-sm space-y-2">
                  <h3 className="text-base font-bold text-palnadu-dark">{copy.emptyTitle}</h3>
                  <p className="text-xs text-palnadu-body leading-relaxed">
                    {search || category || isArchiveView ? copy.emptyFiltered : copy.emptyDefault}
                  </p>
                  {(search || category || isArchiveView) && (
                    <div className="pt-2">
                      <Link
                        href={basePath}
                        className="inline-flex items-center text-xs font-semibold text-palnadu-blue hover:underline"
                      >
                        {copy.clearFilters}
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              <>
                <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                  {posts.map((post: any) => (
                    <BlogCard
                      key={post.id}
                      post={post}
                      locale={locale}
                      dateLocale={dateLocale}
                      copy={copy}
                    />
                  ))}
                </div>

                <BlogPagination
                  meta={meta}
                  basePath={basePath}
                  category={category}
                  search={search}
                  isArchiveView={isArchiveView}
                  copy={copy}
                />
              </>
            )}
          </div>
        </section>

        <CtaSection />
      </div>
    </>
  );
}
