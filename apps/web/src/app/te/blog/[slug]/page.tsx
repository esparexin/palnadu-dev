import type { Metadata } from 'next';
import { ArticleView } from '@/components/blog/article-view';
import { buildArticleMetadata, getLocalizedPost } from '@/lib/blog-post';

type Props = {
  params: Promise<{ slug: string }>;
};

// Dynamic Google SEO Metadata (Telugu). Canonical is self-referencing
// (`/te/blog/<slug>`); hreflang alternates come from the post's published
// translations only — no alternate is emitted for a missing translation.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await getLocalizedPost(slug, 'te');
    return buildArticleMetadata(post, 'te');
  } catch {
    return { title: 'Blog | Palnadu.dev' };
  }
}

export default async function TeluguBlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getLocalizedPost(slug, 'te');

  return <ArticleView post={post} locale="te" />;
}
