import {
  BigPlayerMovementRaw,
  BigPlayerMovementAggregated,
  ActionType,
  SourceType,
} from "@/components/bigplayer/types";
import { parseLargeNumber } from "./format";

/**
 * Aggregate multiple Big Player Movement entries
 * Groups by: name + symbol + date + action_type
 *
 * @param rawEntries - Array of raw Big Player Movement data
 * @returns Array of aggregated entries
 */
export function aggregateBigPlayerMovements(
  rawEntries: BigPlayerMovementRaw[]
): BigPlayerMovementAggregated[] {
  // Group entries by composite key
  const groupedEntries = new Map<string, BigPlayerMovementRaw[]>();

  rawEntries.forEach((entry) => {
    // Create composite key: name-symbol-date-action
    const key = `${entry.name}-${entry.symbol}-${entry.date}-${entry.action_type}`;

    if (!groupedEntries.has(key)) {
      groupedEntries.set(key, []);
    }

    groupedEntries.get(key)!.push(entry);
  });

  // Aggregate each group
  const aggregatedEntries: BigPlayerMovementAggregated[] = [];

  groupedEntries.forEach((entries, key) => {
    const aggregated = aggregateGroup(entries, key);
    aggregatedEntries.push(aggregated);
  });

  return aggregatedEntries;
}

/**
 * Aggregate a group of entries with the same key
 */
function aggregateGroup(
  entries: BigPlayerMovementRaw[],
  key: string
): BigPlayerMovementAggregated {
  if (entries.length === 0) {
    throw new Error("Cannot aggregate empty entry group");
  }

  const firstEntry = entries[0];

  // Sum up all change values
  let totalChangeValue = 0;
  let totalCurrentHolding = 0;
  let totalPreviousHolding = 0;

  entries.forEach((entry) => {
    const changeValue = parseLargeNumber(entry.changes.value);
    const currentValue = parseLargeNumber(entry.current.value);
    const previousValue = parseLargeNumber(entry.previous.value);

    totalChangeValue += changeValue;
    totalCurrentHolding += currentValue;
    totalPreviousHolding += previousValue;
  });

  // Calculate weighted average percentage change
  // Weighted by the value of each change
  let weightedPercentageSum = 0;
  let totalWeight = 0;

  entries.forEach((entry) => {
    const changeValue = Math.abs(parseLargeNumber(entry.changes.value));
    const changePercentage = parseFloat(entry.changes.percentage) || 0;

    weightedPercentageSum += changePercentage * changeValue;
    totalWeight += changeValue;
  });

  const avgChangePercentage = totalWeight > 0 ? weightedPercentageSum / totalWeight : 0;

  // Collect unique brokers
  const brokers = new Set<string>();
  entries.forEach((entry) => {
    if (entry.broker_detail.code && entry.broker_detail.code !== "") {
      brokers.add(entry.broker_detail.code);
    }
  });

  // Collect unique prices
  const prices = new Set<string>();
  entries.forEach((entry) => {
    if (entry.price_formatted && entry.price_formatted !== "0") {
      prices.add(entry.price_formatted);
    }
  });

  // Collect unique sources
  const sources = new Set<SourceType>();
  entries.forEach((entry) => {
    sources.add(entry.data_source.type);
  });

  // Get the latest current holding percentage and earliest previous
  // Use the entry with the largest current value as the "latest"
  const sortedByCurrentValue = [...entries].sort((a, b) => {
    const aValue = parseLargeNumber(a.current.value);
    const bValue = parseLargeNumber(b.current.value);
    return bValue - aValue; // Descending
  });

  const latestEntry = sortedByCurrentValue[0];

  return {
    key,
    name: firstEntry.name,
    symbol: firstEntry.symbol,
    date: firstEntry.date,
    action_type: firstEntry.action_type as ActionType,
    nationality: firstEntry.nationality,
    badges: firstEntry.badges,

    // Aggregated values
    total_change_value: totalChangeValue,
    avg_change_percentage: avgChangePercentage,
    current_holding_value: latestEntry.current.value,
    current_holding_percentage: latestEntry.current.percentage,
    previous_holding_value: latestEntry.previous.value,
    previous_holding_percentage: latestEntry.previous.percentage,

    // Additional info
    brokers: Array.from(brokers),
    prices: Array.from(prices),
    sources: Array.from(sources),
    entry_count: entries.length,

    // Original entries
    raw_entries: entries,
  };
}

/**
 * Filter aggregated entries by symbol search
 */
export function filterBySymbol(
  entries: BigPlayerMovementAggregated[],
  searchTerm: string
): BigPlayerMovementAggregated[] {
  if (!searchTerm || searchTerm.trim() === "") {
    return entries;
  }

  const term = searchTerm.toLowerCase();
  return entries.filter((entry) => {
    return (
      entry.symbol.toLowerCase().includes(term) ||
      entry.name.toLowerCase().includes(term)
    );
  });
}

/**
 * Filter aggregated entries by action type
 */
export function filterByActionType(
  entries: BigPlayerMovementAggregated[],
  actionType: "all" | "buy" | "sell" | "other"
): BigPlayerMovementAggregated[] {
  if (actionType === "all") {
    return entries;
  }

  if (actionType === "buy") {
    return entries.filter((entry) => {
      return entry.action_type === "ACTION_TYPE_BUY";
    });
  }

  if (actionType === "sell") {
    return entries.filter((entry) => {
      return entry.action_type === "ACTION_TYPE_SELL";
    });
  }

  if (actionType === "other") {
    return entries.filter((entry) => {
      return [
        "ACTION_TYPE_MESOP_OPTION",
        "ACTION_TYPE_MSOP_OPTION",
        "ACTION_TYPE_WARRANT_EXERCISE",
        "ACTION_TYPE_CROSS",
      ].includes(entry.action_type);
    });
  }

  return entries;
}

/**
 * Sort aggregated entries
 */
export type SortField = "date" | "change_percentage" | "change_value" | "holding_percentage";
export type SortOrder = "asc" | "desc";

export function sortEntries(
  entries: BigPlayerMovementAggregated[],
  field: SortField = "date",
  order: SortOrder = "desc"
): BigPlayerMovementAggregated[] {
  const sorted = [...entries];

  sorted.sort((a, b) => {
    let comparison = 0;

    switch (field) {
      case "date":
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case "change_percentage":
        comparison = a.avg_change_percentage - b.avg_change_percentage;
        break;
      case "change_value":
        comparison = a.total_change_value - b.total_change_value;
        break;
      case "holding_percentage":
        comparison =
          parseFloat(a.current_holding_percentage) -
          parseFloat(b.current_holding_percentage);
        break;
    }

    return order === "asc" ? comparison : -comparison;
  });

  return sorted;
}
