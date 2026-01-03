/**
 * useTrackPageView Hook
 * Automatically tracks page views on component mount
 */

'use client';

import { useEffect, useRef } from 'react';
import { useAnalytics } from './useAnalytics';
import { usePathname } from 'next/navigation';

interface UseTrackPageViewOptions {
  pageTitle: string;
  additionalParams?: Record<string, unknown>;
  trackPathChanges?: boolean;
}

/**
 * Page view tracking hook
 * Automatically tracks page view on mount and optionally on path changes
 *
 * @param options - Page view tracking options
 * @param options.pageTitle - Title of the page
 * @param options.additionalParams - Additional parameters to include in the event
 * @param options.trackPathChanges - Whether to track when pathname changes (default: false)
 *
 * @example
 * ```tsx
 * useTrackPageView({
 *   pageTitle: 'Broker Calendar',
 *   additionalParams: {
 *     stock_code: 'BBCA',
 *     broker_count: 5,
 *   },
 * });
 * ```
 */
export function useTrackPageView({
  pageTitle,
  additionalParams = {},
  trackPathChanges = false,
}: UseTrackPageViewOptions) {
  const { trackPageView } = useAnalytics();
  const pathname = usePathname();
  const lastTrackedPath = useRef<string>('');

  useEffect(() => {
    // Skip if already tracked for this path
    if (!trackPathChanges && lastTrackedPath.current === pathname) {
      return;
    }

    // Track page view
    trackPageView(pageTitle, pathname, additionalParams);
    lastTrackedPath.current = pathname;
  }, [pathname, pageTitle, additionalParams, trackPathChanges, trackPageView]);
}
