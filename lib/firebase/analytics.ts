/**
 * Firebase Analytics service
 * Centralized analytics tracking with device ID injection
 */

import { logEvent, Analytics } from 'firebase/analytics';
import { getFirebaseAnalytics } from './config';
import { getOrCreateDeviceId } from './device-id';
import { getClientIPSync } from '@/lib/utils/client-ip';
import { env } from '@/lib/env';
import type {
  AnalyticsEventName,
  AnalyticsEventParams,
  PageViewParams,
  BrokerSelectedParams,
  AnalysisInitiatedParams,
  AnalysisCompletedParams,
  AnalysisFailedParams,
  ChartViewToggledParams,
  DateFilterChangedParams,
  ApiCallPerformanceParams,
  ThemeChangedParams,
  ErrorOccurredParams,
  ShareLinkGeneratedParams,
  ShareLinkClickedParams,
  BigPlayerMovementViewParams,
  BigPlayerFilterChangedParams,
  BigPlayerLoadMoreParams,
  BigPlayerDataFetchedParams,
  ScrollToTopParams,
} from '@/lib/types/analytics';

/**
 * Analytics Service Class
 * Provides type-safe analytics tracking with automatic device ID injection
 */
class AnalyticsService {
  private analytics: Analytics | null = null;
  private deviceId: string = '';
  private clientIP: string | null = null;

  constructor() {
    // Initialize on client-side only
    if (typeof window !== 'undefined') {
      this.analytics = getFirebaseAnalytics();
      this.deviceId = getOrCreateDeviceId();
      this.clientIP = getClientIPSync(); // Get cached IP if available
    }
  }

  /**
   * Core event tracking method
   * Automatically injects device_id, timestamp, and client_ip
   */
  trackEvent<T extends AnalyticsEventName>(
    eventName: T,
    params?: AnalyticsEventParams
  ): void {
    // Log to console in development mode
    if (env.isDevelopment) {
      console.log('[Analytics]', eventName, {
        ...params,
        device_id: this.deviceId,
        client_ip: this.clientIP || 'unknown',
        timestamp: Date.now(),
      });
      return;
    }

    // Send to Firebase in production
    if (!this.analytics) {
      return;
    }

    try {
      logEvent(this.analytics, eventName as any, {
        ...params,
        device_id: this.deviceId,
        client_ip: this.clientIP || 'unknown',
        timestamp: Date.now(),
      });
    } catch (error) {
      // Fail silently - don't break the app if analytics fails
      console.error('[Analytics Error]', error);
    }
  }

  /**
   * Track page views
   */
  trackPageView(pageTitle: string, pagePath: string, additionalParams?: Partial<PageViewParams>): void {
    this.trackEvent('page_view', {
      page_title: pageTitle,
      page_path: pagePath,
      page_location: typeof window !== 'undefined' ? window.location.href : '',
      referrer: typeof window !== 'undefined' ? document.referrer : undefined,
      ...additionalParams,
    } as PageViewParams);
  }

  /**
   * Track broker selection
   */
  trackBrokerSelection(
    brokerCode: string,
    brokerName: string,
    brokerGroup: 'Asing' | 'Lokal' | 'Pemerintah',
    method: 'autocomplete' | 'chip_removal'
  ): void {
    this.trackEvent('broker_selected', {
      broker_code: brokerCode,
      broker_name: brokerName,
      broker_group: brokerGroup,
      selection_method: method,
    } as BrokerSelectedParams);
  }

  /**
   * Track date filter changes
   */
  trackDateFilterChanged(
    filterType: 'start_date' | 'end_date',
    dateValue: string,
    previousValue?: string,
    daysSpan?: number
  ): void {
    this.trackEvent('date_filter_changed', {
      filter_type: filterType,
      date_value: dateValue,
      previous_value: previousValue,
      days_span: daysSpan,
    } as DateFilterChangedParams);
  }

  /**
   * Track analysis initiation
   */
  trackAnalysisInitiated(
    stockCode: string,
    brokerCount: number,
    startDate: string,
    endDate: string
  ): void {
    const daysAnalyzed = Math.ceil(
      (new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)
    );

    this.trackEvent('analysis_initiated', {
      stock_code: stockCode,
      broker_count: brokerCount,
      start_date: startDate,
      end_date: endDate,
      days_analyzed: daysAnalyzed,
    } as AnalysisInitiatedParams);
  }

  /**
   * Track analysis completion
   */
  trackAnalysisCompleted(
    stockCode: string,
    durationMs: number,
    dataPoints: number,
    phase: 'accumulation' | 'distribution'
  ): void {
    this.trackEvent('analysis_completed', {
      stock_code: stockCode,
      duration_ms: durationMs,
      data_points: dataPoints,
      phase,
      success: true,
    } as AnalysisCompletedParams);
  }

  /**
   * Track analysis failure
   */
  trackAnalysisFailed(
    stockCode: string,
    errorType: string,
    errorMessage: string,
    durationMs: number
  ): void {
    this.trackEvent('analysis_failed', {
      stock_code: stockCode,
      error_type: errorType,
      error_message: errorMessage,
      duration_ms: durationMs,
    } as AnalysisFailedParams);
  }

  /**
   * Track chart view toggle
   */
  trackChartToggled(
    symbol: string,
    trigger: 'button_click' | 'keyboard_shortcut' | 'auto_load',
    shortcutUsed?: boolean
  ): void {
    this.trackEvent('chart_view_toggled', {
      symbol,
      trigger,
      shortcut_used: shortcutUsed,
    } as ChartViewToggledParams);
  }

  /**
   * Track API call performance
   */
  trackApiCallPerformance(
    endpoint: string,
    method: 'GET' | 'POST',
    durationMs: number,
    success: boolean,
    statusCode?: number,
    cached?: boolean
  ): void {
    this.trackEvent('api_call_performance', {
      endpoint,
      method,
      duration_ms: durationMs,
      success,
      status_code: statusCode,
      cached: cached || false,
    } as ApiCallPerformanceParams);
  }

  /**
   * Track theme changes
   */
  trackThemeChanged(
    fromTheme: 'light' | 'dark',
    toTheme: 'light' | 'dark',
    trigger: 'button' | 'system'
  ): void {
    this.trackEvent('theme_changed', {
      from_theme: fromTheme,
      to_theme: toTheme,
      trigger,
    } as ThemeChangedParams);
  }

  /**
   * Track errors
   */
  trackError(
    errorType: 'network' | 'validation' | 'api' | 'unknown',
    errorMessage: string,
    context?: string,
    fatal?: boolean
  ): void {
    this.trackEvent('error_occurred', {
      error_type: errorType,
      error_message: errorMessage,
      context,
      fatal: fatal || false,
    } as ErrorOccurredParams);
  }

  /**
   * Track share link generation
   */
  trackShareLinkGenerated(
    stockCode: string,
    hasCustomSlug: boolean,
    customSlug?: string,
    brokerCount?: number,
    dateRangeDays?: number
  ): void {
    this.trackEvent('share_link_generated', {
      stock_code: stockCode,
      has_custom_slug: hasCustomSlug,
      custom_slug: customSlug,
      broker_count: brokerCount || 0,
      date_range_days: dateRangeDays || 0,
    } as ShareLinkGeneratedParams);
  }

  /**
   * Track share link click
   */
  trackShareLinkClicked(
    shareCode: string,
    source: 'direct' | 'social_media' | 'other'
  ): void {
    this.trackEvent('share_link_clicked', {
      share_code: shareCode,
      source,
    } as ShareLinkClickedParams);
  }

  /**
   * Track Big Player Movement page view
   */
  trackBigPlayerMovementView(
    datePreset?: string,
    dateStart?: string,
    dateEnd?: string,
    resultsCount?: number
  ): void {
    this.trackEvent('big_player_movement_view', {
      date_preset: datePreset,
      date_start: dateStart,
      date_end: dateEnd,
      results_count: resultsCount,
    } as BigPlayerMovementViewParams);
  }

  /**
   * Track Big Player Movement filter changes
   */
  trackBigPlayerFilterChanged(
    filterType: 'date_preset' | 'date_start' | 'date_end' | 'symbol_search' | 'action_type',
    filterValue: string,
    previousValue?: string
  ): void {
    this.trackEvent('big_player_filter_changed', {
      filter_type: filterType,
      filter_value: filterValue,
      previous_value: previousValue,
    } as BigPlayerFilterChangedParams);
  }

  /**
   * Track Big Player Movement load more
   */
  trackBigPlayerLoadMore(
    pageNumber: number,
    resultsLoaded: number,
    totalResults: number
  ): void {
    this.trackEvent('big_player_load_more', {
      page_number: pageNumber,
      results_loaded: resultsLoaded,
      total_results: totalResults,
    } as BigPlayerLoadMoreParams);
  }

  /**
   * Track Big Player Movement data fetched
   */
  trackBigPlayerDataFetched(
    dateStart: string,
    dateEnd: string,
    crawlType: 'ALL' | 'PARTIAL',
    recordCount: number,
    success: boolean,
    durationMs?: number
  ): void {
    this.trackEvent('big_player_data_fetched', {
      date_start: dateStart,
      date_end: dateEnd,
      crawl_type: crawlType,
      record_count: recordCount,
      duration_ms: durationMs,
      success,
    } as BigPlayerDataFetchedParams);
  }

  /**
   * Track scroll to top button click
   */
  trackScrollToTop(page: string, scrollPosition: number): void {
    this.trackEvent('scroll_to_top', {
      page,
      scroll_position: scrollPosition,
      trigger_method: 'button_click',
    } as ScrollToTopParams);
  }

  /**
   * Get current device ID
   */
  getDeviceId(): string {
    return this.deviceId;
  }
}

// Singleton instance
export const analyticsService = new AnalyticsService();

// Re-export for convenience
export { AnalyticsService };
