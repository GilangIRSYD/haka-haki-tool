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
import { Button } from "@heroui/button";
import { useAnalytics } from "@/lib/hooks/useAnalytics";

export default function BigPlayerMovementClientPage() {
  // Analytics
  const {
    trackBigPlayerMovementView,
    trackBigPlayerFilterChanged,
    trackBigPlayerLoadMore,
    trackBigPlayerDataFetched,
    trackScrollToTop,
  } = useAnalytics();

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
  const [showScrollTop, setShowScrollTop] = useState(false);

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

      const startTime = Date.now();

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

        const durationMs = Date.now() - startTime;

        if (response.data && response.data.movement) {
          const recordCount = response.data.movement.length;

          if (append) {
            setAllRawData((prev) => {
              const newLength = prev.length + recordCount;
              // Track load more with actual results loaded
              trackBigPlayerLoadMore(page, recordCount, newLength);
              return [...prev, ...response.data.movement];
            });
          } else {
            setAllRawData(response.data.movement);
          }

          setHasMore(response.data.is_more || false);
          setCurrentPage(page);

          // Track data fetched
          trackBigPlayerDataFetched(
            start,
            end,
            crawlType,
            recordCount,
            true,
            durationMs
          );
        }
      } catch (error) {
        const durationMs = Date.now() - startTime;
        console.error("Failed to fetch Big Player Movement:", error);

        // Track fetch failure
        trackBigPlayerDataFetched(
          start,
          end,
          crawlType,
          0,
          false,
          durationMs
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [datePreset, trackBigPlayerDataFetched, trackBigPlayerLoadMore]
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

  // Initial fetch on mount - track page view
  useEffect(() => {
    // Fetch initial data for today's preset
    const { start, end } = getDateRange("today");
    setDateStart(start);
    setDateEnd(end);
    fetchData(1, false);

    // Track initial page view
    trackBigPlayerMovementView("today", start, end);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only on mount

  // Track page view when data changes (debounced by checking significant changes)
  useEffect(() => {
    if (displayData.length > 0 && dateStart && dateEnd) {
      trackBigPlayerMovementView(datePreset, dateStart, dateEnd, displayData.length);
    }
    // Only track when data actually changes significantly
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allRawData.length]); // Only depend on actual data length change

  // Track scroll events to detect when user manually scrolls
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;

      // Set hasScrolled untuk infinite scroll
      if (!hasScrolled && scrollY > 0) {
        setHasScrolled(true);
      }

      // Show/hide scroll to top button (tampilkan setelah scroll 400px)
      if (scrollY > 400) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    // Listen to window scroll
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [hasScrolled]);

  // Infinite scroll observer
  useEffect(() => {
    const currentTarget = observerTarget.current;
    if (!currentTarget) return;

    const observer = new IntersectionObserver(
      (entries) => {
        // Only trigger if:
        // 1. User has manually scrolled at least once
        // 2. There is more data to load
        // 3. Not currently loading
        // 4. In partial mode (pagination available)
        // 5. NO active filters (symbol search or action type)
        const hasActiveFilters = symbolSearch.trim() !== "" || actionType !== "all";

        if (entries[0].isIntersecting && hasMore && !loadingMore && isPartialMode && hasScrolled && !hasActiveFilters) {
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
    // Exclude fetchData from deps to prevent recreation on date preset change
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, loadingMore, currentPage, isPartialMode, hasScrolled, symbolSearch, actionType]);

  // Handle apply custom filters
  const handleApplyFilters = useCallback(() => {
    setAllRawData([]);
    setCurrentPage(1);
    // Pass current dates directly to avoid stale closure
    fetchData(1, false, dateStart, dateEnd);

    // Track custom filter apply
    trackBigPlayerFilterChanged("date_start", dateStart, "");
    trackBigPlayerFilterChanged("date_end", dateEnd, "");
  }, [dateStart, dateEnd, fetchData, trackBigPlayerFilterChanged]);

  // Handle date preset change
  const handleDatePresetChange = useCallback((preset: DatePreset) => {
    const previousPreset = datePreset;
    setDatePreset(preset);
    setAllRawData([]);
    setCurrentPage(1);
    setHasScrolled(false);

    // Track filter change
    trackBigPlayerFilterChanged("date_preset", preset, previousPreset);

    if (preset !== "custom") {
      const { start, end } = getDateRange(preset);
      setDateStart(start);
      setDateEnd(end);
      // Auto-fetch for presets - pass dates directly to avoid stale closure
      fetchData(1, false, start, end);
    }
  }, [datePreset, getDateRange, fetchData, trackBigPlayerFilterChanged]);

  // Handle custom date start change
  const handleDateStartChange = useCallback((date: string) => {
    const previousDate = dateStart;
    setDateStart(date);
    // If user manually changes date while on a preset, switch to custom mode
    if (datePreset !== "custom") {
      setDatePreset("custom");
    }
    // Track filter change
    trackBigPlayerFilterChanged("date_start", date, previousDate);
  }, [dateStart, datePreset, trackBigPlayerFilterChanged]);

  // Handle custom date end change
  const handleDateEndChange = useCallback((date: string) => {
    const previousDate = dateEnd;
    setDateEnd(date);
    // If user manually changes date while on a preset, switch to custom mode
    if (datePreset !== "custom") {
      setDatePreset("custom");
    }
    // Track filter change
    trackBigPlayerFilterChanged("date_end", date, previousDate);
  }, [dateEnd, datePreset, trackBigPlayerFilterChanged]);

  // Handle symbol search change
  const handleSymbolSearchChange = useCallback((search: string) => {
    setSymbolSearch(search);
    setHasScrolled(false); // Reset scroll state to prevent auto load more while filtering
    // Track filter change
    trackBigPlayerFilterChanged("symbol_search", search);
  }, [trackBigPlayerFilterChanged]);

  // Handle action type change
  const handleActionTypeChange = useCallback((type: "all" | "buy" | "sell" | "other") => {
    const previousType = actionType;
    setActionType(type);
    setHasScrolled(false); // Reset scroll state to prevent auto load more while filtering
    // Track filter change
    trackBigPlayerFilterChanged("action_type", type, previousType);
  }, [actionType, trackBigPlayerFilterChanged]);

  // Scroll to top function
  const scrollToTop = useCallback(() => {
    const currentScrollPosition = window.scrollY;

    // Track scroll to top event
    trackScrollToTop('bigplayer-movement', currentScrollPosition);

    // Smooth scroll to top
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }, [trackScrollToTop]);

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
          onSymbolSearchChange={handleSymbolSearchChange}
          onActionTypeChange={handleActionTypeChange}
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
              {isPartialMode && hasMore && !symbolSearch && actionType === "all" && (
                <span className="ml-2 text-default-400">
                  (scroll to load more)
                </span>
              )}
              {isPartialMode && hasMore && (symbolSearch || actionType !== "all") && (
                <span className="ml-2 text-warning-500 text-xs">
                  ⚠️ Filters active - scroll disabled
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

      {/* Infinite scroll sentinel - only show when no active filters */}
      {isPartialMode && hasMore && !symbolSearch && actionType === "all" && (
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
      {isPartialMode && !hasMore && displayData.length > 0 && !symbolSearch && actionType === "all" && (
        <div className="text-center text-sm text-default-400 py-4">
          No more data to load
        </div>
      )}

      {/* Floating Action Button - Scroll to Top */}
      {showScrollTop && (
        <Button
          isIconOnly
          color="primary"
          size="lg"
          radius="full"
          onPress={scrollToTop}
          className="fixed bottom-8 right-8 z-50 shadow-lg hover:scale-110 active:scale-95 transition-transform"
          aria-label="Scroll to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2}
            stroke="currentColor"
            className="w-6 h-6"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 15.75l7.5-7.5 7.5 7.5"
            />
          </svg>
        </Button>
      )}
    </div>
  );
}
