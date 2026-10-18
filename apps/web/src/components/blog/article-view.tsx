import Link from 'next/link';
import {
  siteConfig,
  imagePresets,
  getBreadcrumbSchema,
  blogPostPath,
  type BlogLocale,
} from '@palnadu/config';
import { CtaSection } from '@/components/sections/cta-section';
import { Calendar, User, ArrowLeft, ArrowRight, Tag, Clock } from 'lucide-react';
import { articleBasePath, articleCanonical, articleDateLocale } from '@/lib/blog-post';

// Inline Markdown helper (links, code, clean plain typography without asterisks)
function renderInline(text: string): React.ReactNode {
  // Strip any remaining asterisks so they never render as literal * or **
  const clean = text
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/\*([^*\n]+)\*/g, '$1')
    .replace(/\*\*/g, '')
    .replace(/(?<=\s)\*(?=\s)/g, '-');

  const regex = /(\[[^\]]+\]\([^)]+\)|`[^`]+`)/g;
  const parts = clean.split(regex);
  if (parts.length === 1) return clean;

  return parts.map((part, idx) => {
    if (part.startsWith('[') && part.includes('](')) {
      const match = part.match(/^\[([^\]]+)\]\(([^)]+)\)$/);
      if (match) {
        return (
          <Link
            key={idx}
            href={match[2]}
            className="text-palnadu-blue underline underline-offset-2 font-semibold hover:text-palnadu-dark-hover transition-colors"
          >
            {match[1]}
          </Link>
        );
      }
    }
    if (part.startsWith('`') && part.endsWith('`')) {
      return (
        <code key={idx} className="px-1.5 py-0.5 rounded bg-palnadu-off-white text-xs font-mono text-palnadu-blue font-semibold">
          {part.slice(1, -1)}
        </code>
      );
    }
    return part;
  });
}

type ArticleViewProps = {
  post: any;
  locale: BlogLocale;
};

/**
 * Full article rendering shared by `/blog/<slug>` and `/te/blog/<slug>`.
 * All locale-dependent URLs (back link, category, related posts, canonicals)
 * derive from `locale`, so the two routes cannot drift apart.
 */
export function ArticleView({ post, locale }: ArticleViewProps) {
  const basePath = articleBasePath(locale);
  const canonicalUrl = articleCanonical({ ...post, language: locale });
  const dateLocale = articleDateLocale(locale);
  const inLanguage = locale === 'te' ? 'te' : 'en';

  // Google JSON-LD Schema for Google Rich Snippets
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

  const words = post.content ? post.content.split(/\s+/).length : 0;
  const readMinutes = Math.max(1, Math.ceil(words / 220));

  // Convert line breaks to paragraphs
  const paragraphs = post.content.split('\n\n').filter(Boolean);

  return (
    <>
      {/* Inject Google SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />
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
            <div className="my-8 rounded-xl overflow-hidden border border-palnadu-border shadow-sm bg-palnadu-off-white">
              <img
                src={imagePresets.blogHero(post.coverImage)}
                alt={post.title}
                className="w-full h-auto max-h-[480px] object-cover"
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
          <div className="py-8 space-y-6 text-sm sm:text-base text-palnadu-body leading-relaxed">
            {paragraphs.map((para: string, idx: number) => {
              const trimmed = para.trim();

              // 1. Horizontal rules
              if (trimmed === '---' || trimmed === '***' || trimmed === '___') {
                return <hr key={idx} className="my-8 border-palnadu-border/80" />;
              }

              // 2. Inline Markdown Images with optional caption (with or without asterisks)
              const imageMatch = trimmed.match(/^!\[([^\]]*)\]\((https?:\/\/[^)]+)\)(?:[\s\n]*(?:\*?Caption:\s*([^*\n]+)\*?))?/);
              if (imageMatch) {
                const [, alt, url, rawCaption] = imageMatch;
                const caption = rawCaption ? rawCaption.replace(/\*/g, '').trim() : '';
                return (
                  <figure key={idx} className="my-8 rounded-xl overflow-hidden border border-palnadu-border shadow-sm bg-palnadu-off-white">
                    <img
                      src={url}
                      alt={alt || post.title}
                      className="w-full h-auto max-h-[500px] object-cover"
                    />
                    {caption && (
                      <figcaption className="px-4 py-2.5 text-center text-xs text-palnadu-secondary bg-palnadu-off-white/80 border-t border-palnadu-border/60">
                        Caption: {caption}
                      </figcaption>
                    )}
                  </figure>
                );
              }

              // 3. Markdown Tables
              const lines = trimmed.split('\n').map((l) => l.trim()).filter(Boolean);
              if (lines.length >= 2 && lines.every((l) => l.startsWith('|') && l.endsWith('|'))) {
                const parseRow = (line: string) =>
                  line
                    .slice(1, -1)
                    .split('|')
                    .map((cell) => cell.trim());

                const headerCells = parseRow(lines[0]);
                const bodyRows = lines.slice(1).filter((l) => !l.includes('---')).map(parseRow);

                return (
                  <div key={idx} className="my-6 overflow-x-auto rounded-xl border border-palnadu-border shadow-sm">
                    <table className="w-full text-left text-xs sm:text-sm border-collapse">
                      <thead className="bg-palnadu-off-white text-palnadu-dark border-b border-palnadu-border font-bold">
                        <tr>
                          {headerCells.map((h, i) => (
                            <th key={i} className="p-3 font-bold">
                              {renderInline(h)}
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-palnadu-border/60 bg-white">
                        {bodyRows.map((row, rIdx) => (
                          <tr key={rIdx} className="hover:bg-palnadu-light-blue/20">
                            {row.map((cell, cIdx) => (
                              <td key={cIdx} className="p-3 text-palnadu-body">
                                {renderInline(cell)}
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                );
              }

              // 4. Headings
              if (trimmed.startsWith('# ')) {
                return (
                  <h2 key={idx} className="text-2xl sm:text-3xl font-bold text-palnadu-dark pt-6 first:pt-0">
                    {renderInline(trimmed.replace(/^#\s+/, ''))}
                  </h2>
                );
              }
              if (trimmed.startsWith('## ')) {
                return (
                  <h3 key={idx} className="text-xl sm:text-2xl font-bold text-palnadu-dark pt-5">
                    {renderInline(trimmed.replace(/^##\s+/, ''))}
                  </h3>
                );
              }
              if (trimmed.startsWith('### ')) {
                return (
                  <h4 key={idx} className="text-lg sm:text-xl font-bold text-palnadu-dark pt-4">
                    {renderInline(trimmed.replace(/^###\s+/, ''))}
                  </h4>
                );
              }

              // 5. Code blocks
              if (trimmed.startsWith('```')) {
                const codeContent = trimmed.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '');
                return (
                  <pre key={idx} className="my-6 p-4 rounded-xl bg-palnadu-dark text-palnadu-off-white text-xs font-mono overflow-x-auto">
                    <code>{codeContent}</code>
                  </pre>
                );
              }

              // 6. Lists
              if (trimmed.startsWith('- ') || trimmed.startsWith('* ') || /^\d+\.\s/.test(trimmed)) {
                const items = trimmed.split('\n').filter(Boolean);
                return (
                  <ul key={idx} className="space-y-2 my-4 pl-2">
                    {items.map((item: string, i: number) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm sm:text-base text-palnadu-body">
                        <span className="text-palnadu-blue font-bold shrink-0 mt-0.5">▪</span>
                        <span>{renderInline(item.replace(/^([-*]|\d+\.)\s+/, ''))}</span>
                      </li>
                    ))}
                  </ul>
                );
              }

              // 7. Standard Paragraph
              return (
                <p key={idx} className="leading-relaxed">
                  {renderInline(trimmed)}
                </p>
              );
            })}
          </div>

          {/* Author Bio Card */}
          <div className="mt-12 rounded-xl border border-palnadu-border bg-palnadu-off-white/60 p-5 sm:p-6 flex items-start gap-4">
            <div className="h-10 w-10 rounded-full bg-palnadu-blue/20 text-palnadu-blue flex items-center justify-center font-bold text-xs shrink-0">
              PD
            </div>
            <div className="space-y-1.5">
              <h4 className="font-bold text-sm text-palnadu-dark">Palnadu.dev Engineering Team</h4>
              <p className="text-xs text-palnadu-secondary leading-relaxed">
                Problem-first software developers based in Palnadu, Andhra Pradesh. We engineer{' '}
                <Link href="/services/web-development" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
                  web applications
                </Link>
                ,{' '}
                <Link href="/services/mobile-app-development" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
                  mobile apps
                </Link>
                , and{' '}
                <Link href="/services/business-automation" className="text-palnadu-blue underline hover:text-palnadu-dark-hover">
                  business automation
                </Link>{' '}
                systems with 100% code ownership. Serving enterprises across{' '}
                <Link href="/locations/guntur" className="text-palnadu-blue hover:underline">
                  Guntur
                </Link>
                ,{' '}
                <Link href="/locations/palnadu" className="text-palnadu-blue hover:underline">
                  Palnadu
                </Link>
                , and{' '}
                <Link href="/locations/narasaraopet" className="text-palnadu-blue hover:underline">
                  Narasaraopet
                </Link>
                .
              </p>
            </div>
          </div>

          {/* Related Articles */}
          {post.relatedPosts && post.relatedPosts.length > 0 && (
            <div className="mt-14 pt-10 border-t border-palnadu-border">
              <h3 className="text-xl font-bold text-palnadu-dark mb-5">Related Articles</h3>
              <div className="grid gap-4 sm:grid-cols-2">
                {post.relatedPosts.map((rel: any) => (
                  <Link
                    key={rel.id}
                    href={blogPostPath({ slug: rel.slug, language: rel.language ?? locale })}
                    className="group rounded-lg border border-palnadu-border bg-white p-4 hover:border-palnadu-blue transition-colors flex flex-col justify-between"
                  >
                    <div className="space-y-1.5">
                      <p className="text-xs font-mono uppercase text-palnadu-teal font-semibold">
                        {rel.category?.name || 'Guide'}
                      </p>
                      <h4 className="text-sm font-bold text-palnadu-dark group-hover:text-palnadu-blue transition-colors line-clamp-2">
                        {rel.title}
                      </h4>
                      {rel.excerpt && (
                        <p className="text-xs text-palnadu-secondary line-clamp-2 leading-relaxed">
                          {rel.excerpt}
                        </p>
                      )}
                    </div>
                    <div className="pt-3 mt-2 border-t border-palnadu-border/40 flex items-center justify-between text-xs text-palnadu-blue font-semibold">
                      <span>Read Article</span>
                      <ArrowRight className="h-3 w-3 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </div>
      </article>

      <CtaSection />
    </>
  );
}
