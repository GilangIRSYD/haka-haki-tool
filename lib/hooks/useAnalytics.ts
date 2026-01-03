/**
 * useAnalytics Hook
 * Provides analytics tracking methods to components
 */

'use client';

import { useCallback } from 'react';
import { analyticsService } from '@/lib/firebase';
import type {
  AnalyticsEventName,
  AnalyticsEventParams,
  PageViewParams,
} from '@/lib/types/analytics';

/**
 * Main analytics hook
 * Returns analytics tracking methods for use in components
 */
export function useAnalytics() {
  /**
   * Track custom event
   */
  const trackEvent = useCallback(
    <T extends AnalyticsEventName>(eventName: T, params?: AnalyticsEventParams) => {
      analyticsService.trackEvent(eventName, params);
    },
    []
  );

  /**
   * Track page view
   */
  const trackPageView = useCallback(
    (pageTitle: string, pagePath: string, additionalParams?: Partial<PageViewParams>) => {
      analyticsService.trackPageView(pageTitle, pagePath, additionalParams);
    },
    []
  );

  /**
   * Track broker selection
   */
  const trackBrokerSelection = useCallback(
    (
      brokerCode: string,
      brokerName: string,
      brokerGroup: 'Asing' | 'Lokal' | 'Pemerintah',
      method: 'autocomplete' | 'chip_removal'
    ) => {
      analyticsService.trackBrokerSelection(brokerCode, brokerName, brokerGroup, method);
    },
    []
  );

  /**
   * Track date filter change
   */
  const trackDateFilterChanged = useCallback(
    (
      filterType: 'start_date' | 'end_date',
      dateValue: string,
      previousValue?: string,
      daysSpan?: number
    ) => {
      analyticsService.trackDateFilterChanged(filterType, dateValue, previousValue, daysSpan);
    },
    []
  );

  /**
   * Track analysis initiation
   */
  const trackAnalysisInitiated = useCallback(
    (stockCode: string, brokerCount: number, startDate: string, endDate: string) => {
      analyticsService.trackAnalysisInitiated(stockCode, brokerCount, startDate, endDate);
    },
    []
  );

  /**
   * Track analysis completion
   */
  const trackAnalysisCompleted = useCallback(
    (stockCode: string, durationMs: number, dataPoints: number, phase: 'accumulation' | 'distribution') => {
      analyticsService.trackAnalysisCompleted(stockCode, durationMs, dataPoints, phase);
    },
    []
  );

  /**
   * Track analysis failure
   */
  const trackAnalysisFailed = useCallback(
    (stockCode: string, errorType: string, errorMessage: string, durationMs: number) => {
      analyticsService.trackAnalysisFailed(stockCode, errorType, errorMessage, durationMs);
    },
    []
  );

  /**
   * Track chart toggle
   */
  const trackChartToggled = useCallback(
    (symbol: string, trigger: 'button_click' | 'keyboard_shortcut' | 'auto_load', shortcutUsed?: boolean) => {
      analyticsService.trackChartToggled(symbol, trigger, shortcutUsed);
    },
    []
  );

  /**
   * Track API performance
   */
  const trackApiCallPerformance = useCallback(
    (
      endpoint: string,
      method: 'GET' | 'POST',
      durationMs: number,
      success: boolean,
      statusCode?: number,
      cached?: boolean
    ) => {
      analyticsService.trackApiCallPerformance(endpoint, method, durationMs, success, statusCode, cached);
    },
    []
  );

  /**
   * Track theme change
   */
  const trackThemeChanged = useCallback(
    (fromTheme: 'light' | 'dark', toTheme: 'light' | 'dark', trigger: 'button' | 'system') => {
      analyticsService.trackThemeChanged(fromTheme, toTheme, trigger);
    },
    []
  );

  /**
   * Track error
   */
  const trackError = useCallback(
    (errorType: 'network' | 'validation' | 'api' | 'unknown', errorMessage: string, context?: string, fatal?: boolean) => {
      analyticsService.trackError(errorType, errorMessage, context, fatal);
    },
    []
  );

  /**
   * Get device ID
   */
  const getDeviceId = useCallback(() => {
    return analyticsService.getDeviceId();
  }, []);

  return {
    trackEvent,
    trackPageView,
    trackBrokerSelection,
    trackDateFilterChanged,
    trackAnalysisInitiated,
    trackAnalysisCompleted,
    trackAnalysisFailed,
    trackChartToggled,
    trackApiCallPerformance,
    trackThemeChanged,
    trackError,
    getDeviceId,
  };
}
