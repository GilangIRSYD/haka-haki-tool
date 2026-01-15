/**
 * TypeScript types for Firebase Analytics events
 */

// Base event parameters
export interface BaseEventParams {
  device_id?: string;
  timestamp?: number;
}

// Page View Events
export interface PageViewParams extends BaseEventParams {
  page_title: string;
  page_path: string;
  page_location: string;
  referrer?: string;
}

export interface BrokerCalendarViewParams extends BaseEventParams {
  stock_code?: string;
  date_range?: string;
  broker_count?: number;
}

// User Interaction Events
export interface BrokerSelectedParams extends BaseEventParams {
  broker_code: string;
  broker_name: string;
  broker_group: 'Asing' | 'Lokal' | 'Pemerintah';
  selection_method: 'autocomplete' | 'chip_removal';
}

export interface BrokersBatchSelectedParams extends BaseEventParams {
  broker_codes: string[];
  count: number;
  groups: string[];
}

export interface DateFilterChangedParams extends BaseEventParams {
  filter_type: 'start_date' | 'end_date';
  date_value: string;
  previous_value?: string;
  days_span?: number;
}

// Analysis Events
export interface AnalysisInitiatedParams extends BaseEventParams {
  stock_code: string;
  broker_count: number;
  start_date: string;
  end_date: string;
  days_analyzed: number;
}

export interface AnalysisCompletedParams extends BaseEventParams {
  stock_code: string;
  duration_ms: number;
  data_points: number;
  phase: 'accumulation' | 'distribution';
  success: boolean;
}

export interface AnalysisFailedParams extends BaseEventParams {
  stock_code: string;
  error_type: string;
  error_message: string;
  duration_ms: number;
}

// Chart Events
export interface ChartViewToggledParams extends BaseEventParams {
  symbol: string;
  trigger: 'button_click' | 'keyboard_shortcut' | 'auto_load';
  shortcut_used?: boolean;
}

export interface ChartWidgetLoadedParams extends BaseEventParams {
  symbol: string;
  load_time_ms: number;
  studies_count: number;
}

export interface CalendarCellHoveredParams extends BaseEventParams {
  date: string;
  has_data: boolean;
  broker_count: number;
}

// Performance Events
export interface ApiCallPerformanceParams extends BaseEventParams {
  endpoint: string;
  method: 'GET' | 'POST';
  duration_ms: number;
  success: boolean;
  status_code?: number;
  cached: boolean;
}

export interface PageLoadPerformanceParams extends BaseEventParams {
  page_name: string;
  load_time_ms: number;
  first_contentful_paint?: number;
  interactive_time?: number;
}

// Feature Usage Events
export interface FeatureUsedParams extends BaseEventParams {
  feature_name: 'broker_analyzer' | 'tradingview_chart' | 'calendar_view';
  action: string;
  context?: Record<string, unknown>;
}

export interface ThemeChangedParams extends BaseEventParams {
  from_theme: 'light' | 'dark';
  to_theme: 'light' | 'dark';
  trigger: 'button' | 'system';
}

// Error Events
export interface ErrorOccurredParams extends BaseEventParams {
  error_type: 'network' | 'validation' | 'api' | 'unknown';
  error_message: string;
  context?: string;
  fatal: boolean;
}

// Data Export Events (for future use)
export interface DataExportInitiatedParams extends BaseEventParams {
  format: 'csv' | 'json' | 'excel';
  data_type: 'summary' | 'calendar' | 'full';
  record_count: number;
}

export interface DataExportCompletedParams extends BaseEventParams {
  format: string;
  file_size_bytes: number;
  duration_ms: number;
}

// Share Link Events
export interface ShareLinkGeneratedParams extends BaseEventParams {
  stock_code: string;
  has_custom_slug: boolean;
  custom_slug?: string;
  broker_count: number;
  date_range_days: number;
}

export interface ShareLinkClickedParams extends BaseEventParams {
  share_code: string;
  source: 'direct' | 'social_media' | 'other';
}

// Big Player Movement Events
export interface BigPlayerMovementViewParams extends BaseEventParams {
  date_preset?: string;
  date_start?: string;
  date_end?: string;
  results_count?: number;
}

export interface BigPlayerFilterChangedParams extends BaseEventParams {
  filter_type: 'date_preset' | 'date_start' | 'date_end' | 'symbol_search' | 'action_type';
  filter_value: string;
  previous_value?: string;
}

export interface BigPlayerLoadMoreParams extends BaseEventParams {
  page_number: number;
  results_loaded: number;
  total_results: number;
}

export interface BigPlayerDataFetchedParams extends BaseEventParams {
  date_start: string;
  date_end: string;
  crawl_type: 'ALL' | 'PARTIAL';
  record_count: number;
  duration_ms?: number;
  success: boolean;
}

// Scroll to Top Event
export interface ScrollToTopParams extends BaseEventParams {
  page: string;
  scroll_position: number; // pixels from top
  trigger_method: 'button_click';
}

// Union type for all event names
export type AnalyticsEventName =
  | 'page_view'
  | 'broker_calendar_view'
  | 'broker_selected'
  | 'brokers_batch_selected'
  | 'date_filter_changed'
  | 'analysis_initiated'
  | 'analysis_completed'
  | 'analysis_failed'
  | 'chart_view_toggled'
  | 'chart_widget_loaded'
  | 'calendar_cell_hovered'
  | 'api_call_performance'
  | 'page_load_performance'
  | 'feature_used'
  | 'theme_changed'
  | 'error_occurred'
  | 'data_export_initiated'
  | 'data_export_completed'
  | 'share_link_generated'
  | 'share_link_clicked'
  | 'big_player_movement_view'
  | 'big_player_filter_changed'
  | 'big_player_load_more'
  | 'big_player_data_fetched'
  | 'scroll_to_top';

// Union type for all event parameters
export type AnalyticsEventParams =
  | PageViewParams
  | BrokerCalendarViewParams
  | BrokerSelectedParams
  | BrokersBatchSelectedParams
  | DateFilterChangedParams
  | AnalysisInitiatedParams
  | AnalysisCompletedParams
  | AnalysisFailedParams
  | ChartViewToggledParams
  | ChartWidgetLoadedParams
  | CalendarCellHoveredParams
  | ApiCallPerformanceParams
  | PageLoadPerformanceParams
  | FeatureUsedParams
  | ThemeChangedParams
  | ErrorOccurredParams
  | DataExportInitiatedParams
  | DataExportCompletedParams
  | ShareLinkGeneratedParams
  | ShareLinkClickedParams
  | BigPlayerMovementViewParams
  | BigPlayerFilterChangedParams
  | BigPlayerLoadMoreParams
  | BigPlayerDataFetchedParams
  | ScrollToTopParams;

// Event name to parameters mapping
export interface AnalyticsEventMap {
  page_view: PageViewParams;
  broker_calendar_view: BrokerCalendarViewParams;
  broker_selected: BrokerSelectedParams;
  brokers_batch_selected: BrokersBatchSelectedParams;
  date_filter_changed: DateFilterChangedParams;
  analysis_initiated: AnalysisInitiatedParams;
  analysis_completed: AnalysisCompletedParams;
  analysis_failed: AnalysisFailedParams;
  chart_view_toggled: ChartViewToggledParams;
  chart_widget_loaded: ChartWidgetLoadedParams;
  calendar_cell_hovered: CalendarCellHoveredParams;
  api_call_performance: ApiCallPerformanceParams;
  page_load_performance: PageLoadPerformanceParams;
  feature_used: FeatureUsedParams;
  theme_changed: ThemeChangedParams;
  error_occurred: ErrorOccurredParams;
  data_export_initiated: DataExportInitiatedParams;
  data_export_completed: DataExportCompletedParams;
  share_link_generated: ShareLinkGeneratedParams;
  share_link_clicked: ShareLinkClickedParams;
  big_player_movement_view: BigPlayerMovementViewParams;
  big_player_filter_changed: BigPlayerFilterChangedParams;
  big_player_load_more: BigPlayerLoadMoreParams;
  big_player_data_fetched: BigPlayerDataFetchedParams;
  scroll_to_top: ScrollToTopParams;
}
