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

  /**
   * Track share link generation
   */
  const trackShareLinkGenerated = useCallback(
    (
      stockCode: string,
      hasCustomSlug: boolean,
      customSlug?: string,
      brokerCount?: number,
      dateRangeDays?: number
    ) => {
      analyticsService.trackShareLinkGenerated(
        stockCode,
        hasCustomSlug,
        customSlug,
        brokerCount,
        dateRangeDays
      );
    },
    []
  );

  /**
   * Track share link clicked
   */
  const trackShareLinkClicked = useCallback(
    (shareCode: string, source: 'direct' | 'social_media' | 'other') => {
      analyticsService.trackShareLinkClicked(shareCode, source);
    },
    []
  );

  /**
   * Track broker flow button clicked
   */
  const trackBrokerFlowButtonClicked = useCallback(
    (stockCode: string, brokerCount: number, dateRangeDays?: number) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'broker_analyzer',
        action: 'broker_flow_chart_opened',
        context: {
          stock_code: stockCode,
          broker_count: brokerCount,
          date_range_days: dateRangeDays,
        },
      });
    },
    []
  );

  /**
   * Track Big Player Movement page view
   */
  const trackBigPlayerMovementView = useCallback(
    (datePreset?: string, dateStart?: string, dateEnd?: string, resultsCount?: number) => {
      analyticsService.trackBigPlayerMovementView(datePreset, dateStart, dateEnd, resultsCount);
    },
    []
  );

  /**
   * Track Big Player Movement filter changes
   */
  const trackBigPlayerFilterChanged = useCallback(
    (
      filterType: 'date_preset' | 'date_start' | 'date_end' | 'symbol_search' | 'action_type',
      filterValue: string,
      previousValue?: string
    ) => {
      analyticsService.trackBigPlayerFilterChanged(filterType, filterValue, previousValue);
    },
    []
  );

  /**
   * Track Big Player Movement load more
   */
  const trackBigPlayerLoadMore = useCallback(
    (pageNumber: number, resultsLoaded: number, totalResults: number) => {
      analyticsService.trackBigPlayerLoadMore(pageNumber, resultsLoaded, totalResults);
    },
    []
  );

  /**
   * Track Big Player Movement data fetched
   */
  const trackBigPlayerDataFetched = useCallback(
    (
      dateStart: string,
      dateEnd: string,
      crawlType: 'ALL' | 'PARTIAL',
      recordCount: number,
      success: boolean,
      durationMs?: number
    ) => {
      analyticsService.trackBigPlayerDataFetched(dateStart, dateEnd, crawlType, recordCount, success, durationMs);
    },
    []
  );

  /**
   * Track scroll to top button click
   */
  const trackScrollToTop = useCallback(
    (page: string, scrollPosition: number) => {
      analyticsService.trackScrollToTop(page, scrollPosition);
    },
    []
  );

  /**
   * Track Big Broksum analysis initiated
   */
  const trackBigBroksumAnalysisInitiated = useCallback(
    (
      stockCode: string,
      periodPreset: string,
      startDate: string,
      endDate: string
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'analysis_initiated',
        context: {
          stock_code: stockCode,
          period_preset: periodPreset,
          start_date: startDate,
          end_date: endDate,
          period_count: 6,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum analysis completed
   */
  const trackBigBroksumAnalysisCompleted = useCallback(
    (
      stockCode: string,
      durationMs: number,
      successfulPeriods: number,
      periodPreset: string
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'analysis_completed',
        context: {
          stock_code: stockCode,
          duration_ms: durationMs,
          total_periods: 6,
          successful_periods: successfulPeriods,
          period_preset: periodPreset,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum analysis failed
   */
  const trackBigBroksumAnalysisFailed = useCallback(
    (
      stockCode: string,
      errorType: string,
      errorMessage: string,
      durationMs: number
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'analysis_failed',
        context: {
          stock_code: stockCode,
          error_type: errorType,
          error_message: errorMessage,
          duration_ms: durationMs,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum preset selected
   */
  const trackBigBroksumPresetSelected = useCallback(
    (
      preset: "1week" | "3months" | "6months" | "12months",
      previousPreset?: string
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'preset_selected',
        context: {
          preset: preset,
          previous_preset: previousPreset,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum custom date changed
   */
  const trackBigBroksumCustomDateChanged = useCallback(
    (
      fieldType: "start_date" | "end_date",
      newDate: string,
      daysSpan: number
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'custom_date_changed',
        context: {
          field_type: fieldType,
          new_date: newDate,
          days_span: daysSpan,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum stock code entered
   */
  const trackBigBroksumStockCodeEntered = useCallback(
    (
      stockCode: string,
      method: "manual_input" | "from_history"
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'stock_code_entered',
        context: {
          stock_code: stockCode,
          input_method: method,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum summary viewed
   */
  const trackBigBroksumSummaryViewed = useCallback(
    (
      stockCode: string,
      trendPattern: string,
      accumulationCount: number,
      distributionCount: number
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'summary_viewed',
        context: {
          stock_code: stockCode,
          trend_pattern: trendPattern,
          accumulation_count: accumulationCount,
          distribution_count: distributionCount,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum position switchers detected
   */
  const trackBigBroksumPositionSwitchersDetected = useCallback(
    (
      stockCode: string,
      switcherCount: number,
      topSwitcher?: string
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'position_switchers_detected',
        context: {
          stock_code: stockCode,
          switcher_count: switcherCount,
          top_switcher: topSwitcher,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum consistent traders viewed
   */
  const trackBigBroksumConsistentTradersViewed = useCallback(
    (
      stockCode: string,
      buyerCount: number,
      sellerCount: number
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'consistent_traders_viewed',
        context: {
          stock_code: stockCode,
          buyer_count: buyerCount,
          seller_count: sellerCount,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum period table viewed
   */
  const trackBigBroksumPeriodTableViewed = useCallback(
    (
      stockCode: string,
      periodLabel: string,
      scrollPosition?: number
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'period_table_viewed',
        context: {
          stock_code: stockCode,
          period_label: periodLabel,
          scroll_position: scrollPosition,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum new analysis
   */
  const trackBigBroksumNewAnalysis = useCallback(
    (
      previousStockCode: string,
      analysesInSession: number
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'new_analysis',
        context: {
          previous_stock_code: previousStockCode,
          analyses_in_session: analysesInSession,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum history restored
   */
  const trackBigBroksumHistoryRestored = useCallback(
    (
      stockCode: string,
      startDate: string
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'history_restored',
        context: {
          stock_code: stockCode,
          start_date: startDate,
        },
      });
    },
    []
  );

  /**
   * Track Big Broksum API batch completed
   */
  const trackBigBroksumApiBatchCompleted = useCallback(
    (
      stockCode: string,
      totalDurationMs: number,
      successfulCalls: number,
      failedCalls: number
    ) => {
      analyticsService.trackEvent('feature_used', {
        feature_name: 'big_broksum',
        action: 'api_batch_completed',
        context: {
          stock_code: stockCode,
          total_duration_ms: totalDurationMs,
          successful_calls: successfulCalls,
          failed_calls: failedCalls,
          total_calls: successfulCalls + failedCalls,
        },
      });
    },
    []
  );

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
    trackShareLinkGenerated,
    trackShareLinkClicked,
    trackBrokerFlowButtonClicked,
    trackBigPlayerMovementView,
    trackBigPlayerFilterChanged,
    trackBigPlayerLoadMore,
    trackBigPlayerDataFetched,
    trackScrollToTop,
    trackBigBroksumAnalysisInitiated,
    trackBigBroksumAnalysisCompleted,
    trackBigBroksumAnalysisFailed,
    trackBigBroksumPresetSelected,
    trackBigBroksumCustomDateChanged,
    trackBigBroksumStockCodeEntered,
    trackBigBroksumSummaryViewed,
    trackBigBroksumPositionSwitchersDetected,
    trackBigBroksumConsistentTradersViewed,
    trackBigBroksumPeriodTableViewed,
    trackBigBroksumNewAnalysis,
    trackBigBroksumHistoryRestored,
    trackBigBroksumApiBatchCompleted,
  };
}
