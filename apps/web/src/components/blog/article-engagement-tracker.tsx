'use client';

import { useEffect, useRef } from 'react';
import { trackBlogEngagement } from '@/lib/analytics';

interface ArticleEngagementTrackerProps {
  slug: string;
  title: string;
  category?: string;
  locale?: string;
}

export function ArticleEngagementTracker({
  slug,
  title,
  category,
  locale = 'en',
}: ArticleEngagementTrackerProps) {
  const firedDepths = useRef<Set<number>>(new Set());
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    // 1. Initial article view engagement
    trackBlogEngagement({
      article_slug: slug,
      article_title: title,
      category,
      locale,
      read_time_seconds: 0,
    });

    // 2. Scroll depth milestones tracking
    const thresholds = [25, 50, 75, 90, 100] as const;

    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      if (docHeight <= 0) return;

      const scrollPercent = Math.min(100, Math.round((window.scrollY / docHeight) * 100));

      for (const threshold of thresholds) {
        if (scrollPercent >= threshold && !firedDepths.current.has(threshold)) {
          firedDepths.current.add(threshold);
          const elapsedSeconds = Math.round((Date.now() - startTimeRef.current) / 1000);

          trackBlogEngagement({
            article_slug: slug,
            article_title: title,
            category,
            locale,
            scroll_depth_threshold: threshold,
            read_time_seconds: elapsedSeconds,
          });
        }
      }
    };

    window.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, [slug, title, category, locale]);

  return null;
}
