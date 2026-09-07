import { notFound } from 'next/navigation';

type Props = {
  params: Promise<{ slug: string }>;
};

export default async function LocationDetailPage({ params }: Props) {
  const { slug } = await params;
  // Future route - only populated when genuine local content is available
  notFound();
}
