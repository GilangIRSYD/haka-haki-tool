export enum ActionType {
  BUY = "ACTION_TYPE_BUY",
  SELL = "ACTION_TYPE_SELL",
  MESOP_OPTION = "ACTION_TYPE_MESOP_OPTION",
  MSOP_OPTION = "ACTION_TYPE_MSOP_OPTION",
  WARRANT_EXERCISE = "ACTION_TYPE_WARRANT_EXERCISE",
  CROSS = "ACTION_TYPE_CROSS",
}

export enum NationalityType {
  LOCAL = "NATIONALITY_TYPE_LOCAL",
  FOREIGN = "NATIONALITY_TYPE_FOREIGN",
}

export enum SourceType {
  IDX = "SOURCE_TYPE_IDX",
  KSEI = "SOURCE_TYPE_KSEI",
}

export enum BrokerGroup {
  UNSPECIFIED = "BROKER_GROUP_UNSPECIFIED",
  LOCAL = "BROKER_GROUP_LOCAL",
  FOREIGN = "BROKER_GROUP_FOREIGN",
  GOVERNMENT = "BROKER_GROUP_GOVERNMENT",
}

export enum ShareholderBadge {
  PENGENDALI = "SHAREHOLDER_BADGE_PENGENDALI",
  DIREKTUR = "SHAREHOLDER_BADGE_DIREKTUR",
}

export interface HoldingData {
  value: string;
  percentage: string;
  formatted_value: string;
}

export interface DataSource {
  label: string;
  type: SourceType;
}

export interface BrokerDetail {
  code: string;
  group: BrokerGroup;
}

export interface BigPlayerMovementRaw {
  id: string;
  name: string;
  symbol: string;
  date: string;
  previous: HoldingData;
  current: HoldingData;
  changes: HoldingData;
  marker: string;
  is_posted: boolean;
  cmh_id: string;
  nationality: NationalityType;
  action_type: ActionType;
  data_source: DataSource;
  price_formatted: string;
  broker_detail: BrokerDetail;
  badges: ShareholderBadge[];
}

export interface BigPlayerResponse {
  message: string;
  data: {
    is_more: boolean;
    movement: BigPlayerMovementRaw[];
  };
}

// Aggregated interface for table display
export interface BigPlayerMovementAggregated {
  key: string; // composite key: name-symbol-date-action
  name: string;
  symbol: string;
  date: string;
  action_type: ActionType;
  nationality: NationalityType;
  badges: ShareholderBadge[];

  // Aggregated values
  total_change_value: number; // sum of all changes
  avg_change_percentage: number; // weighted average
  current_holding_value: string; // latest current value
  current_holding_percentage: string; // latest current percentage
  previous_holding_value: string; // earliest previous value
  previous_holding_percentage: string; // earliest previous percentage

  // Additional info
  brokers: string[]; // array of broker codes
  prices: string[]; // array of prices
  sources: SourceType[]; // array of sources
  entry_count: number; // how many entries were merged

  // Original raw entries for reference
  raw_entries: BigPlayerMovementRaw[];
}

// Filter and sort types
export interface BigPlayerFilters {
  datePreset: "today" | "3days" | "5days" | "7days" | "custom";
  dateStart?: string;
  dateEnd?: string;
  symbolSearch?: string;
  actionType?: "all" | "buy" | "sell" | "other";
}

export type DatePreset =
  | "today"
  | "3days"
  | "5days"
  | "7days"
  | "1month"
  | "3months"
  | "6months"
  | "1year"
  | "custom";
