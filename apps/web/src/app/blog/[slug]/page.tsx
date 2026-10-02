import type { Metadata } from 'next';
import { ArticleView } from '@/components/blog/article-view';
import { buildArticleMetadata, getLocalizedPost } from '@/lib/blog-post';

type Props = {
  params: Promise<{ slug: string }>;
};

// Dynamic Google SEO Metadata
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;

  try {
    const post = await getLocalizedPost(slug, 'en');
    return buildArticleMetadata(post, 'en');
  } catch {
    return { title: 'Blog | Palnadu.dev' };
  }
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = await getLocalizedPost(slug, 'en');

  return <ArticleView post={post} locale="en" />;
}
