"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { BigPlayerTable } from "@/components/bigplayer/Table";
import { FilterBar } from "@/components/bigplayer/FilterBar";
import {
  fetchBigPlayerMovement,
  getCrawlTypeForDateRange,
} from "@/lib/api/bigplayer";
import {
  aggregateBigPlayerMovements,
  filterBySymbol,
  filterByActionType,
  sortEntries,
} from "@/lib/utils/aggregation";
import { formatDateRange } from "@/lib/utils/format";
import { BigPlayerMovementAggregated, DatePreset } from "@/components/bigplayer/types";
import { Card } from "@heroui/card";

export default function BigPlayerMovementClientPage() {
  // Filters state
  const [datePreset, setDatePreset] = useState<DatePreset>("today");
  const [dateStart, setDateStart] = useState("");
  const [dateEnd, setDateEnd] = useState("");
  const [symbolSearch, setSymbolSearch] = useState("");
  const [actionType, setActionType] = useState<"all" | "buy" | "sell" | "other">("all");

  // Data state
  const [allRawData, setAllRawData] = useState<any[]>([]);
  const [displayData, setDisplayData] = useState<BigPlayerMovementAggregated[]>([]);

  // Loading state
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [isPartialMode, setIsPartialMode] = useState(false);
  const [hasScrolled, setHasScrolled] = useState(false);

  // Observer for infinite scroll
  const observerTarget = useRef<HTMLDivElement>(null);

  // Get date range based on preset
  const getDateRange = useCallback((preset: DatePreset) => {
    const today = new Date();
    const endDate = today.toISOString().split("T")[0];

    let startDate = endDate;

    switch (preset) {
      case "today":
        startDate = endDate;
        break;
      case "3days":
        today.setDate(today.getDate() - 3);
        startDate = today.toISOString().split("T")[0];
        break;
      case "5days":
        today.setDate(today.getDate() - 5);
        startDate = today.toISOString().split("T")[0];
        break;
      case "7days":
        today.setDate(today.getDate() - 7);
        startDate = today.toISOString().split("T")[0];
        break;
      case "1month":
        today.setMonth(today.getMonth() - 1);
        startDate = today.toISOString().split("T")[0];
        break;
      case "3months":
        today.setMonth(today.getMonth() - 3);
        startDate = today.toISOString().split("T")[0];
        break;
      case "6months":
        today.setMonth(today.getMonth() - 6);
        startDate = today.toISOString().split("T")[0];
        break;
      case "1year":
        today.setFullYear(today.getFullYear() - 1);
        startDate = today.toISOString().split("T")[0];
        break;
      case "custom":
        // Use custom dates from state
        return { start: dateStart, end: dateEnd };
    }

    return { start: startDate, end: endDate };
  }, [dateStart, dateEnd]);

  // Fetch data
  const fetchData = useCallback(
    async (page: number = 1, append: boolean = false, startOverride?: string, endOverride?: string) => {
      const { start, end } = startOverride && endOverride
        ? { start: startOverride, end: endOverride }
        : getDateRange(datePreset);

      if (!start || !end) return;

      const crawlType = getCrawlTypeForDateRange(start, end);
      setIsPartialMode(crawlType === "PARTIAL");

      try {
        if (append) {
          setLoadingMore(true);
        } else {
          setLoading(true);
        }

        const response = await fetchBigPlayerMovement({
          dateStart: start,
          dateEnd: end,
          crawlType,
          page: crawlType === "PARTIAL" ? page : undefined,
        });

        if (response.data && response.data.movement) {
          if (append) {
            setAllRawData((prev) => [...prev, ...response.data.movement]);
          } else {
            setAllRawData(response.data.movement);
          }

          setHasMore(response.data.is_more || false);
          setCurrentPage(page);
        }
      } catch (error) {
        console.error("Failed to fetch Big Player Movement:", error);
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [datePreset]
  );

  // Apply filters and sort
  useEffect(() => {
    let filtered = aggregateBigPlayerMovements(allRawData);

    // Filter by symbol search
    if (symbolSearch) {
      filtered = filterBySymbol(filtered, symbolSearch);
    }

    // Filter by action type
    if (actionType !== "all") {
      filtered = filterByActionType(filtered, actionType);
    }

    // Sort: date desc (primary), then change percentage desc (secondary)
    filtered.sort((a, b) => {
      // Primary sort: date desc (newest first)
      const dateA = new Date(a.date).getTime();
      const dateB = new Date(b.date).getTime();
      if (dateA !== dateB) {
        return dateB - dateA; // desc
      }

      // Secondary sort: change percentage desc (highest first)
      return b.avg_change_percentage - a.avg_change_percentage; // desc
    });

    setDisplayData(filtered);
  }, [allRawData, symbolSearch, actionType]);

  // Initial fetch on mount
  useEffect(() => {
    // Fetch initial data for today's preset
    const { start, end } = getDateRange("today");
    setDateStart(start);
    setDateEnd(end);
    fetchData(1, false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track scroll events to detect when user manually scrolls
  useEffect(() => {
    const handleScroll = () => {
      if (!hasScrolled) {
        setHasScrolled(true);
      }
    };

    // Listen to window scroll instead of container
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasScrolled]);

  // Infinite scroll observer
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Only trigger if user has manually scrolled at least once
        if (entries[0].isIntersecting && hasMore && !loadingMore && isPartialMode && hasScrolled) {
          fetchData(currentPage + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    observer.observe(currentTarget);

    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loadingMore, currentPage, isPartialMode, fetchData, hasScrolled]);

  // Handle apply custom filters
  const handleApplyFilters = () => {
    setAllRawData([]);
    setCurrentPage(1);
    // Pass current dates directly to avoid stale closure
    fetchData(1, false, dateStart, dateEnd);
  };

  // Handle date preset change
  const handleDatePresetChange = (preset: DatePreset) => {
    setDatePreset(preset);
    setAllRawData([]);
    setCurrentPage(1);
    setHasScrolled(false);

    if (preset !== "custom") {
      const { start, end } = getDateRange(preset);
      setDateStart(start);
      setDateEnd(end);
      // Auto-fetch for presets - pass dates directly to avoid stale closure
      fetchData(1, false, start, end);
    }
  };

  // Handle custom date start change
  const handleDateStartChange = (date: string) => {
    setDateStart(date);
    // If user manually changes date while on a preset, switch to custom mode
    if (datePreset !== "custom") {
      setDatePreset("custom");
    }
  };

  // Handle custom date end change
  const handleDateEndChange = (date: string) => {
    setDateEnd(date);
    // If user manually changes date while on a preset, switch to custom mode
    if (datePreset !== "custom") {
      setDatePreset("custom");
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-default-800">
          Big Player Movement
        </h1>
        <p className="mt-1 text-sm text-default-500">
          Track significant shareholder movements and trading activities
        </p>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <FilterBar
          datePreset={datePreset}
          dateStart={dateStart}
          dateEnd={dateEnd}
          symbolSearch={symbolSearch}
          actionType={actionType}
          onDatePresetChange={handleDatePresetChange}
          onDateStartChange={handleDateStartChange}
          onDateEndChange={handleDateEndChange}
          onSymbolSearchChange={setSymbolSearch}
          onActionTypeChange={setActionType}
          onApplyFilters={handleApplyFilters}
          loading={loading}
        />
      </Card>

      {/* Data summary & Legend */}
      {displayData.length > 0 && (
        <div className="space-y-3">
          {/* Top row: Showing entries + Date range */}
          <div className="flex items-center justify-between text-sm">
            <div className="text-default-600">
              Showing <span className="font-semibold">{displayData.length}</span>{" "}
              entries
              {isPartialMode && hasMore && (
                <span className="ml-2 text-default-400">
                  (scroll to load more)
                </span>
              )}
            </div>
            <div className="text-default-500 font-medium">
              {formatDateRange(dateStart, dateEnd)}
            </div>
          </div>

          {/* Legend - Horizontally Scrollable */}
          <div className="overflow-x-auto">
            <div className="flex items-center justify-start gap-4 text-xs whitespace-nowrap pb-2 min-w-max">
              <div className="text-default-500 font-medium mr-2">Legend:</div>

              {/* Badges */}
              <div className="flex items-center gap-2 pr-3 border-r border-default-200">
                <span title="Controller">👑 Controller</span>
                <span title="Director">👤 Director</span>
              </div>

              {/* Nationality */}
              <div className="flex items-center gap-2 pr-3 border-r border-default-200">
                <span title="Foreign">🌍 Foreign</span>
                <span title="Local">🇮🇩 Local</span>
              </div>

              {/* Action Types */}
              <div className="flex items-center gap-2">
                <span title="Buy">🟢 Buy</span>
                <span title="Sell">🔴 Sell</span>
                <span title="MESOP/MSOP Options">⚡ Option</span>
                <span title="Warrant Exercise">📜 Warrant</span>
                <span title="Cross">🔄 Cross</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <Card>
        <BigPlayerTable data={displayData} loading={loading} />
      </Card>

      {/* Infinite scroll sentinel */}
      {isPartialMode && hasMore && (
        <div
          ref={observerTarget}
          className="flex justify-center py-4"
        >
          {loadingMore && (
            <div className="flex items-center gap-2 text-sm text-default-500">
              <div className="h-4 w-4 animate-spin rounded-full border-2 border-default-300 border-t-default-600" />
              Loading more...
            </div>
          )}
        </div>
      )}

      {/* No more data indicator */}
      {isPartialMode && !hasMore && displayData.length > 0 && (
        <div className="text-center text-sm text-default-400 py-4">
          No more data to load
        </div>
      )}
    </div>
  );
}
