'use client';

import { useEffect, useRef } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { trackPageView, captureUtmFromSearch } from '@/lib/analytics';

export function AnalyticsRouteTracker() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname) return;

    // Capture and persist UTMs if query string contains campaign parameters
    if (searchParams) {
      captureUtmFromSearch(searchParams);
    }

    const currentUrl = typeof window !== 'undefined' ? window.location.href : pathname;
    const queryString = searchParams?.toString();
    const fullPath = queryString ? `${pathname}?${queryString}` : pathname;

    // Avoid duplicate page_view firing for identical path in rapid succession
    if (lastTrackedPath.current === fullPath) {
      return;
    }

    lastTrackedPath.current = fullPath;

    // Detect locale from path prefix
    const isTelugu = pathname.startsWith('/te');
    const pageLocale = isTelugu ? 'te' : 'en';

    trackPageView({
      page_title: typeof document !== 'undefined' ? document.title : '',
      page_location: currentUrl,
      page_path: pathname,
      page_referrer: typeof document !== 'undefined' ? document.referrer : '',
      page_locale: pageLocale,
    });
  }, [pathname, searchParams]);

  return null;
}

