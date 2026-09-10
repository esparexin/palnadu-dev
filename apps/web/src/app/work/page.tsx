import type { Metadata } from 'next';
import { WorkClient } from './work-client';

export const metadata: Metadata = {
  title: 'Our Work',
  description:
    'A visual collection of our most recent works — each piece crafted with intention, emotion and style. See what Palnadu.dev engineers build.',
  alternates: {
    canonical: '/work',
  },
};

export default function WorkPage() {
  return <WorkClient />;
}
