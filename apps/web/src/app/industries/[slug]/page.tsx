import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function IndustryDetailPage({ params }: Props) {
  const { slug } = await params;
  // Reserved future-ready route
  notFound();
}
