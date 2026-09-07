import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function CaseStudyPage({ params }: Props) {
  const { slug } = await params;

  // TODO: Fetch case study from API
  // For now, return not found — case studies will be admin-managed
  notFound();
}
