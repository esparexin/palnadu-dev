import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { siteConfig, imagePresets } from '@palnadu/config';
import { api } from '@/lib/api';
import { CtaSection } from '@/components/sections/cta-section';
import { Calendar, User, ArrowLeft, ArrowRight } from 'lucide-react';

type Props = {
  params: Promise<{ slug: string }>;
};

// Dynamic Google SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const res: any = await api.blog.getBySlug(slug);
    const post = res?.data;
    if (!post) return { title: 'Article Not Found | Palnadu.dev' };

    const title = post.seoTitle || `${post.title} | Palnadu.dev`;
    const description = post.seoDescription || post.excerpt || siteConfig.description;
    const ogImage = post.ogImage || post.coverImage || `${siteConfig.url}/og.png`;
    const canonicalUrl = post.canonicalUrl || `${siteConfig.url}/blog/${slug}`;

    return {
      title,
      description,
      alternates: {
        canonical: canonicalUrl,
      },
      openGraph: {
        title,
        description,
        url: canonicalUrl,
        type: 'article',
        publishedTime: post.publishDate || post.createdAt,
        images: [{ url: ogImage, width: 1200, height: 630, alt: post.title }],
      },
      twitter: {
        card: 'summary_large_image',
        title,
        description,
        images: [ogImage],
      },
    };
  } catch {
    return { title: 'Blog | Palnadu.dev' };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;

  let post: any = null;
  try {
    const res: any = await api.blog.getBySlug(slug);
    post = res?.data;
  } catch {
    notFound();
  }

  if (!post) {
    notFound();
  }

  // Google JSON-LD Schema for Google Rich Snippets
  const articleSchema = {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.seoDescription || post.excerpt,
    image: post.coverImage || `${siteConfig.url}/og.png`,
    datePublished: post.publishDate || post.createdAt,
    dateModified: post.updatedAt,
    author: {
      '@type': 'Person',
      name: post.author?.name || 'Palnadu.dev Engineering Team',
    },
    publisher: {
      '@type': 'Organization',
      name: 'Palnadu.dev',
      logo: `${siteConfig.url}/footer_header-logo.png`,
    },
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': `${siteConfig.url}/blog/${slug}`,
    },
  };

  // Convert line breaks to paragraphs
  const paragraphs = post.content.split('\n\n').filter(Boolean);

  return (
    <>
      {/* Inject Google SEO Structured Data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }}
      />

      <article className="bg-white py-12 sm:py-16">
        <div className="container max-w-3xl">
          {/* Breadcrumb Navigation */}
          <div className="mb-6">
            <Link
              href="/blog"
              className="inline-flex items-center gap-1.5 text-xs font-mono uppercase tracking-wider text-palnadu-secondary hover:text-palnadu-blue transition-colors"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              <span>Back to Articles</span>
            </Link>
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
                  {new Date(post.publishDate || post.createdAt).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </time>
              </span>
            </div>
          </header>

          {/* Cover Image if available with Cloudinary Optimization */}
          {post.coverImage && (
            <div className="my-8 rounded-xl overflow-hidden border border-palnadu-border shadow-xs bg-palnadu-off-white">
              <img
                src={imagePresets.blogHero(post.coverImage)}
                alt={post.title}
                className="w-full h-auto max-h-[480px] object-cover"
              />
            </div>
          )}

          {/* Article Body Content */}
          <div className="py-8 space-y-6 text-[15px] sm:text-base text-palnadu-body leading-relaxed">
            {paragraphs.map((para: string, idx: number) => {
              if (para.startsWith('# ')) {
                return (
                  <h2 key={idx} className="text-2xl sm:text-3xl font-bold text-palnadu-dark pt-4">
                    {para.replace('# ', '')}
                  </h2>
                );
              }
              if (para.startsWith('## ')) {
                return (
                  <h3 key={idx} className="text-xl sm:text-2xl font-bold text-palnadu-dark pt-3">
                    {para.replace('## ', '')}
                  </h3>
                );
              }
              if (para.startsWith('### ')) {
                return (
                  <h4 key={idx} className="text-lg sm:text-xl font-bold text-palnadu-dark pt-2">
                    {para.replace('### ', '')}
                  </h4>
                );
              }
              return (
                <p key={idx} className="leading-relaxed">
                  {para}
                </p>
              );
            })}
          </div>
        </div>
      </article>

      <CtaSection />
    </>
  );
}
