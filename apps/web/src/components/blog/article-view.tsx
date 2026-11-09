import Link from 'next/link';
import Image from 'next/image';
import {
  siteConfig,
  imagePresets,
  getBreadcrumbSchema,
  type BlogLocale,
} from '@palnadu/config';
import { CtaSection } from '@/components/sections/cta-section';
import { Calendar, User, ArrowLeft, Tag, Clock } from 'lucide-react';
import { articleBasePath, articleCanonical, articleDateLocale } from '@/lib/blog-post';
import { ArticleContent, isOptimizableImageUrl } from './article-content';
import { ArticleFaq } from './article-faq';
import { ArticleFooter } from './article-footer';

type ArticleViewProps = {
  post: any;
  locale: BlogLocale;
};

export function ArticleView({ post, locale }: ArticleViewProps) {
  const basePath = articleBasePath(locale);
  const canonicalUrl = articleCanonical({ ...post, language: locale });
  const dateLocale = articleDateLocale(locale);
  const inLanguage = locale === 'te' ? 'te' : 'en';

  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    '@id': `${canonicalUrl}/#article`,
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.coverImage || `${siteConfig.url}/og.png`,
    datePublished: post.publishDate || post.createdAt,
    dateModified: post.updatedAt,
    inLanguage,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Palnadu.dev Engineering Team',
    },
    publisher: {
      '@type': 'Organization',
      '@id': `${siteConfig.url}/#organization`,
      name: siteConfig.name,
      logo: `${siteConfig.url}/logo.png`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': canonicalUrl,
    },
  };

  const breadcrumbJsonLd = getBreadcrumbSchema([
    { name: 'Home', path: '' },
    { name: 'Blog', path: basePath },
    { name: post.title, path: `${basePath}/${post.slug}` },
  ]);

  const faqItems: Array<{ q: string; a: string }> = Array.isArray(post.faqData)
    ? post.faqData.filter((item: any) => item && typeof item.q === 'string' && typeof item.a === 'string')
    : [];

  const faqSchema = faqItems.length > 0 ? {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    '@id': `${canonicalUrl}/#faq`,
    mainEntity: faqItems.map((item) => ({
      '@type': 'Question',
      name: item.q,
      acceptedAnswer: {
        '@type': 'Answer',
        text: item.a,
      },
    })),
  } : null;

  const words = post.content ? post.content.split(/\s+/).length : 0;
  const readMinutes = Math.max(1, Math.ceil(words / 220));
  const paragraphs = post.content ? post.content.split('\n\n').filter(Boolean) : [];

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
      {faqSchema && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
        />
      )}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <article className="bg-white py-12 sm:py-16">
        <div className="container max-w-3xl">
          {/* Breadcrumb Navigation */}
          <div className="mb-6 flex items-center justify-between">
            <Link
              href={basePath}
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-palnadu-secondary hover:text-palnadu-blue transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Articles</span>
            </Link>

            {post.category?.name && (
              <Link
                href={`${basePath}?category=${post.category.slug}`}
                className="inline-flex items-center gap-1 text-xs font-semibold text-palnadu-teal hover:underline"
              >
                <Tag className="h-3 w-3" />
                <span>{post.category.name}</span>
              </Link>
            )}
          </div>

          {/* Article Header */}
          <header className="space-y-4 pb-8 border-b border-palnadu-border/60">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-palnadu-dark leading-[1.15]">
              {post.title}
            </h1>

            {post.excerpt && (
              <p className="text-base sm:text-lg text-palnadu-body leading-relaxed">
                {post.excerpt}
              </p>
            )}

            <div className="flex flex-wrap items-center gap-4 text-xs text-palnadu-secondary pt-2">
              <span className="flex items-center gap-1.5 font-medium">
                <User className="h-3.5 w-3.5 text-palnadu-blue" />
                <span>{post.author?.name || 'Engineering Team'}</span>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono">
                <Calendar className="h-3.5 w-3.5 text-palnadu-secondary/80" />
                <time dateTime={post.publishDate || post.createdAt}>
                  {new Date(post.publishDate || post.createdAt).toLocaleDateString(dateLocale, {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </span>
              <span>•</span>
              <span className="flex items-center gap-1.5 font-mono">
                <Clock className="h-3.5 w-3.5 text-palnadu-secondary/80" />
                <span>{readMinutes} min read</span>
              </span>
            </div>
          </header>

          {/* Cover Image with Fallback */}
          {post.coverImage ? (
            <div className="relative aspect-[16/9] max-h-[480px] my-8 rounded-xl overflow-hidden border border-palnadu-border shadow-sm bg-palnadu-off-white">
              <Image
                src={imagePresets.blogHero(post.coverImage)}
                alt={post.title}
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 800px"
                className="object-cover"
                unoptimized={!isOptimizableImageUrl(post.coverImage)}
              />
            </div>
          ) : (
            <div className="my-8 rounded-xl overflow-hidden border border-palnadu-border/60 bg-gradient-to-br from-palnadu-dark via-palnadu-dark-hover to-palnadu-blue p-8 sm:p-12 text-white shadow-sm">
              <span className="text-xs font-mono font-bold uppercase tracking-widest text-palnadu-teal block mb-2">
                {post.category?.name || 'Engineering Insight'}
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-white leading-tight">
                {post.title}
              </h2>
            </div>
          )}

          {/* Article Body Content */}
          <ArticleContent paragraphs={paragraphs} postTitle={post.title} />

          {/* Article FAQs */}
          <ArticleFaq faqItems={faqItems} locale={locale} />

          {/* Author Bio & Related Posts */}
          <ArticleFooter post={post} locale={locale} />
        </div>
      </article>

      <CtaSection />
    </>
  );
}
