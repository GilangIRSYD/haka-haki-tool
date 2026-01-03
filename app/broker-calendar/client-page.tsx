"use client";

/**
 * Broker Calendar Client Page
 * Client component that handles all the interactive logic
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { motion, AnimatePresence } from "framer-motion";
import { BROKERS } from "@/data/brokers";
import { addToast } from "@heroui/toast";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useTrackPageView } from "@/lib/hooks/useTrackPageView";
import { ShareModal } from "@/components/broker-calendar/ShareModal";
import { ShareFloatingButton } from "@/components/broker-calendar/ShareFloatingButton";
import { BrokerFlowModal } from "@/components/broker-calendar/BrokerFlowModal";
import { BrokerFlowFloatingButton } from "@/components/broker-calendar/BrokerFlowFloatingButton";
import { useRouter } from "next/navigation";
import { createShareLink, getSharedLink } from "@/lib/api/share";

interface BrokerCalendarClientProps {
  shareSlug?: string;
}

// Types
interface BrokerDailyData {
  broker: string;
  buyValue: number;
  buyLot: number;
  buyAvg: number;
  sellValue: number;
  sellLot: number;
  sellAvg: number;
}

interface DailyData {
  date: string;
  netLot: number;
  netValue: number;
  closingPrice: number;
  priceChange: number; // Price change from previous day
  priceChangePercent: number; // Percentage change
  brokers: BrokerDailyData[];
}

interface PriceMovement {
  from: number;
  to: number;
  change: number;
  changePercent: number;
}

interface AnalysisResult {
  phase: "accumulation" | "distribution";
  netBuy: number;
  netSell: number;
  totalValue: number;
  insight: string;
  brokerSummary: BrokerDailyData[];
  dailyData: DailyData[];
  dominantBrokers: string[];
  distributionBrokers: string[];
  priceMovement: PriceMovement;
}

// Helper function to get color based on broker group
function getBrokerGroupColor(group: string): "primary" | "secondary" | "warning" | "default" {
  switch (group) {
    case "Asing":
      return "warning"; // Orange
    case "Lokal":
      return "secondary"; // Purple
    case "Pemerintah":
      return "primary"; // Blue
    default:
      return "default";
  }
}

function getBrokerGroupCode(brokerCode: string): string {
  const broker = BROKERS.find((b) => b.code === brokerCode);
  return broker?.group || "";
}

function getBrokerGroupTextColor(group: string): string {
  switch (group) {
    case "Asing":
      return "text-warning"; // Orange
    case "Lokal":
      return "text-secondary"; // Purple
    case "Pemerintah":
      return "text-primary"; // Blue
    default:
      return "text-default-700";
  }
}

function getBrokerGroupDisplayName(group: string): string {
  switch (group) {
    case "Asing":
      return "Foreign";
    case "Lokal":
      return "Domestic";
    case "Pemerintah":
      return "BUMN";
    default:
      return group;
  }
}

// Generate random hex string for x-nonce header
function generateNonce(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// LocalStorage keys
const STORAGE_KEYS = {
  STOCK_CODE: 'broker-calendar-stock-code',
  SELECTED_BROKERS: 'broker-calendar-selected-brokers',
};

// Helper functions for localStorage
function saveToLocalStorage(key: string, value: any) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(key, JSON.stringify(value));
  }
}

function loadFromLocalStorage<T>(key: string, defaultValue: T): T {
  if (typeof window !== 'undefined') {
    const item = localStorage.getItem(key);
    if (item) {
      try {
        return JSON.parse(item) as T;
      } catch {
        return defaultValue;
      }
    }
  }
  return defaultValue;
}

// Helper function to get date 3 months ago
function getDateThreeMonthsAgo(): string {
  const date = new Date();
  date.setMonth(date.getMonth() - 3);
  return date.toISOString().split('T')[0];
}

// Helper function to get today's date
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper function to calculate and format date range duration
function formatDateRangeDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;

  if (months > 0 && remainingDays > 0) {
    return `${months} Month${months > 1 ? 's' : ''} ${remainingDays} Day${remainingDays > 1 ? 's' : ''}`;
  } else if (months > 0) {
    return `${months} Month${months > 1 ? 's' : ''}`;
  } else {
    return `${diffDays} Day${diffDays > 1 ? 's' : ''}`;
  }
}

// Helper function to get date based on preset
function getDateByPreset(preset: string): string {
  const date = new Date();
  switch (preset) {
    case '1week':
      date.setDate(date.getDate() - 7);
      break;
    case '1month':
      date.setMonth(date.getMonth() - 1);
      break;
    case '3months':
      date.setMonth(date.getMonth() - 3);
      break;
    case '6months':
      date.setMonth(date.getMonth() - 6);
      break;
    case '1year':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setMonth(date.getMonth() - 3);
  }
  return date.toISOString().split('T')[0];
}

// Helper function to check if dates match a preset
function getMatchingPreset(startDate: string, endDate: string): string {
  const today = getTodayDate();
  if (endDate !== today) return '';

  const presets = ['1week', '1month', '3months', '6months', '1year'];
  for (const preset of presets) {
    if (startDate === getDateByPreset(preset)) {
      return preset;
    }
  }
  return '';
}

// Fetch broker summary from dedicated API
async function fetchBrokerSummary(
  stockCode: string,
  startDate: string,
  endDate: string
): Promise<BrokerDailyData[]> {
  const baseUrl = 'https://api-idx.gsphomelab.org/api/v1';
  const endpoint = '/emiten-broker-summary';

  const params = new URLSearchParams({
    symbol: stockCode,
    from: startDate,
    to: endDate,
  });

  const url = `${baseUrl}${endpoint}?${params.toString()}`;

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-nonce': generateNonce(),
    },
  });

  if (!response.ok) {
    throw new Error(`Broker Summary API Error: ${response.status} ${response.statusText}`);
  }

  const apiResponse = await response.json();

  // Transform broker buy data
  const buyBrokers = apiResponse.brokers_buy.map((broker: any) => ({
    broker: broker.broker_code,
    buyValue: broker.buy_value,
    buyLot: broker.buy_volume,
    buyAvg: broker.avg_price,
    sellValue: 0,
    sellLot: 0,
    sellAvg: 0,
  }));

  // Transform broker sell data
  const sellBrokers = apiResponse.brokers_sell.map((broker: any) => ({
    broker: broker.broker_code,
    buyValue: 0,
    buyLot: 0,
    buyAvg: 0,
    sellValue: broker.sell_value,
    sellLot: broker.sell_volume,
    sellAvg: broker.avg_price
  }));

  // Merge buy and sell data by broker code
  const brokerMap = new Map<string, BrokerDailyData>();

  [...buyBrokers, ...sellBrokers].forEach((broker: BrokerDailyData) => {
    const existing = brokerMap.get(broker.broker);
    if (existing) {
      existing.buyValue += broker.buyValue;
      existing.buyLot += broker.buyLot;
      existing.buyAvg = existing.buyLot > 0 ? existing.buyValue / existing.buyLot / 100 : 0;
      existing.sellValue += broker.sellValue;
      existing.sellLot += broker.sellLot;
      existing.sellAvg = existing.sellLot > 0 ? existing.sellValue / existing.sellLot / 100 : 0;
    } else {
      brokerMap.set(broker.broker, broker);
    }
  });

  return Array.from(brokerMap.values());
}

// Real API call to fetch broker calendar data
async function analyzeData(
  brokers: string[],
  stockCode: string,
  startDate: string,
  endDate: string
): Promise<AnalysisResult> {
  const baseUrl = 'https://api-idx.gsphomelab.org/api/v1';
  const endpoint = '/broker-action-calendar';

  // Build query parameters
  const params = new URLSearchParams({
    symbol: stockCode,
    from: startDate,
    to: endDate,
  });

  // Add multiple broker_code params
  brokers.forEach(code => {
    params.append('broker_code', code);
  });

  const url = `${baseUrl}${endpoint}?${params.toString()}`;

  try {
    // Fetch both calendar and broker summary data in parallel
    const [calendarResponse, brokerSummaryData] = await Promise.all([
      fetch(url, {
        method: 'GET',
        headers: {
          'x-nonce': generateNonce(),
        },
      }),
      fetchBrokerSummary(stockCode, startDate, endDate),
    ]);

    if (!calendarResponse.ok) {
      throw new Error(`Calendar API Error: ${calendarResponse.status} ${calendarResponse.statusText}`);
    }

    const apiResponse = await calendarResponse.json();

    // Transform API response to our data structure
    const dailyData: DailyData[] = apiResponse.data.map((day: any, index: number) => {
      const prevDay = apiResponse.data[index - 1];
      const previousPrice = prevDay ? prevDay.close_price : day.close_price;
      const priceChange = day.close_price - previousPrice;
      const priceChangePercent = (priceChange / previousPrice) * 100;

      // Transform broker data
      const brokersData: BrokerDailyData[] = Object.entries(day.brokers).map(([code, data]: [string, any]) => {
        const value = data.value;
        const volume = data.volume;
        const isBuy = value > 0;

        return {
          broker: code,
          buyValue: isBuy ? value : 0,
          buyLot: isBuy ? volume : 0,
          buyAvg: isBuy ? volume > 0 ? value / volume : 0 : 0,
          sellValue: !isBuy ? Math.abs(value) : 0,
          sellLot: !isBuy ? Math.abs(volume) : 0,
          sellAvg: !isBuy ? volume !== 0 ? Math.abs(value) / Math.abs(volume) : 0 : 0,
        };
      });

      return {
        date: day.date,
        netLot: day.total_volume,
        netValue: day.total_value,
        closingPrice: day.close_price,
        priceChange,
        priceChangePercent,
        brokers: brokersData,
      };
    });

    // Use broker summary from dedicated API instead of calculating from calendar data
    const brokerSummary = brokerSummaryData;

    const netBuy = apiResponse.summary.total_buy_value || 0;
    const netSell = apiResponse.summary.total_sell_value || 0;

    return {
      phase: apiResponse.summary.trend,
      netBuy,
      netSell,
      totalValue: apiResponse.summary.total_value,
      insight: apiResponse.summary.note,
      brokerSummary,
      dailyData,
      dominantBrokers: apiResponse.summary.dominant_brokers || [],
      distributionBrokers: apiResponse.summary.distribution_brokers || [],
      priceMovement: {
        from: apiResponse.summary.price_movement?.from || 0,
        to: apiResponse.summary.price_movement?.to || 0,
        change: apiResponse.summary.price_movement?.change || 0,
        changePercent: apiResponse.summary.price_movement?.change_pct || 0,
      },
    };
  } catch (error) {
    throw error;
  }
}

// Calendar Cell with Tooltip
function CalendarCell({
  day,
  data,
}: {
  day: number;
  data: DailyData | null;
}) {
  const [showTooltip, setShowTooltip] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState<'top' | 'bottom'>('top');
  const cellRef = useRef<HTMLDivElement>(null);

  const handleMouseEnter = () => {
    if (cellRef.current) {
      const rect = cellRef.current.getBoundingClientRect();
      const threshold = 250; // pixels from top - adjust based on navbar height
      setTooltipPosition(rect.top < threshold ? 'bottom' : 'top');
    }
    setShowTooltip(true);
  };

  if (!data) {
    return (
      <div className="aspect-square bg-default-100/30 rounded-lg" />
    );
  }

  const isBuy = data.netLot > 0;
  const bgColor = isBuy
    ? "bg-success/10 border-success/30 hover:bg-success/20"
    : "bg-danger/10 border-danger/30 hover:bg-danger/20";

  const isPriceUp = data.priceChangePercent >= 0;
  const priceColor = isPriceUp ? "text-success" : "text-danger";

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) return `${(absValue / 1000000000).toFixed(1)}B`;
    if (absValue >= 1000000) return `${(absValue / 1000000).toFixed(1)}M`;
    return `${(absValue / 1000).toFixed(1)}K`;
  };

  const formatLot = (value: number) => {
    if (Math.abs(value) >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(0)}%`;
  };

  const tooltipClasses = tooltipPosition === 'top'
    ? "bottom-full left-1/2 -translate-x-1/2 mb-2"
    : "top-full left-1/2 -translate-x-1/2 mt-2";

  const animationVariants = tooltipPosition === 'top'
    ? {
        initial: { opacity: 0, y: -10, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: -10, scale: 0.95 }
      }
    : {
        initial: { opacity: 0, y: 10, scale: 0.95 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 10, scale: 0.95 }
      };

  return (
    <div
      ref={cellRef}
      className="relative"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`aspect-square p-2 rounded-lg border ${bgColor} transition-all cursor-pointer hover:scale-105 hover:shadow-lg`}
      >
        <div className="text-[11px] text-right font-bold text-default-600 mb-3">
          {day}
        </div>
        <div className="text-[10px] leading-tight">
          {formatLot(data.netLot)}
        </div>
        <div className="text-lg text-default-600 font-bold leading-tight">
          {formatCurrency(data.netValue)}
        </div>
        <div className="text-[9px] text-default-400 leading-tight mt-0.5 flex items-center gap-1">
          <span>@{data.closingPrice.toFixed(0)}</span>
          <span className={`font-bold italic ${priceColor} text-[10px]`}>
            {formatPercent(data.priceChangePercent)}
          </span>
        </div>
      </div>

      {showTooltip && (
        <motion.div
          initial={animationVariants.initial}
          animate={animationVariants.animate}
          exit={animationVariants.exit}
          transition={{ duration: 0.15 }}
          className={`absolute z-[9999] w-56 bg-content1 border border-default-200 rounded-lg shadow-xl p-3 ${tooltipClasses}`}
        >
          <div className="text-xs font-semibold mb-2 text-foreground">
            {new Date(data.date).toLocaleDateString("en-US", { day: "2-digit", month: "long" })}
          </div>

          {/* Price Info */}
          <div className="mb-3 pb-2 border-b border-default-200">
            <div className="flex justify-between items-center text-[10px] mb-1">
              <span className="text-default-600">Price:</span>
              <span className="font-semibold">IDR {data.closingPrice.toFixed(0)}</span>
            </div>
            <div className="flex justify-between items-center text-[10px]">
              <span className="text-default-600">Change:</span>
              <span className={`font-bold ${isPriceUp ? "text-success" : "text-danger"}`}>
                {data.priceChange >= 0 ? "+" : ""}{data.priceChange.toFixed(0)} ({formatPercent(data.priceChangePercent)})
              </span>
            </div>
          </div>

          <div className="space-y-1.5 max-h-40 overflow-y-auto">
            {data.brokers.map((b) => {
              const netValue = b.buyValue - b.sellValue;
              const isBrokerBuy = netValue > 0;

              if (b.buyValue === 0 && b.sellValue === 0) return null;

              const brokerGroup = getBrokerGroupCode(b.broker);
              const groupColor = getBrokerGroupColor(brokerGroup);

              return (
                <div
                  key={b.broker}
                  className="flex justify-between items-center gap-2 text-[10px]"
                >
                  <div className="flex items-center gap-1.5">
                    <span className="font-semibold text-default-700">
                      {b.broker}
                    </span>
                    <Chip size="sm" variant="flat" color={groupColor} className="h-4 text-[8px] px-1">
                      {getBrokerGroupDisplayName(brokerGroup)}
                    </Chip>
                  </div>
                  <span
                    className={
                      isBrokerBuy ? "text-success font-bold" : "text-danger font-bold"
                    }
                  >
                    {isBrokerBuy ? "+" : "-"}
                    {formatCurrency(Math.abs(netValue))} /{" "}
                    {formatLot(isBrokerBuy ? b.buyLot : b.sellLot)} Lot
                  </span>
                </div>
              );
            })}
          </div>
        </motion.div>
      )}
    </div>
  );
}

// Calendar View component
function CalendarView({ dailyData }: { dailyData: DailyData[] }) {
  const monthlyData = useMemo(() => {
    const months: Record<string, DailyData[]> = {};
    dailyData.forEach((day) => {
      const monthKey = day.date.substring(0, 7);
      if (!months[monthKey]) months[monthKey] = [];
      months[monthKey].push(day);
    });
    return months;
  }, [dailyData]);

  const renderMonth = (monthKey: string, days: DailyData[]) => {
    const date = new Date(monthKey + "-01");
    const monthName = date.toLocaleDateString("en-US", {
      month: "long",
      year: "numeric",
    });

    const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).getDay();
    const daysInMonth = new Date(
      date.getFullYear(),
      date.getMonth() + 1,
      0
    ).getDate();

    const dataMap = new Map<string, DailyData>();
    days.forEach((d) => {
      const dayNum = parseInt(d.date.split("-")[2]);
      dataMap.set(dayNum.toString(), d);
    });

    const cells = [];

    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = new Date(
        date.getFullYear(),
        date.getMonth(),
        day
      ).getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (isWeekend) {
        cells.push(
          <div
            key={day}
            className="aspect-square bg-default-100/50 rounded-lg"
          />
        );
      } else {
        cells.push(
          <CalendarCell key={day} day={day} data={dataMap.get(day.toString()) || null} />
        );
      }
    }

    return (
      <div key={monthKey} className="mb-6">
        <h3 className="text-lg font-bold mb-3 text-foreground">{monthName}</h3>
        <div className="grid grid-cols-7 gap-1">
          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((day) => (
            <div
              key={day}
              className="text-center text-xs font-medium text-default-500 py-1"
            >
              {day}
            </div>
          ))}
          {cells}
        </div>
      </div>
    );
  };

  const sortedMonths = Object.keys(monthlyData).sort().reverse();

  return (
    <div className="space-y-2">
      {sortedMonths.map((monthKey) => renderMonth(monthKey, monthlyData[monthKey]))}
    </div>
  );
}

// Broker Summary Table
function BrokerSummaryTable({ brokerSummary }: { brokerSummary: BrokerDailyData[] }) {
  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `${(value / 1000000000).toFixed(1)}B`;
    if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
    return `${(value / 1000).toFixed(1)}K`;
  };

  const formatLot = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  const formatPrice = (value: number) => {
    return Math.floor(value).toFixed(0);
  };

  // Separate buyers and sellers
  const buyers = brokerSummary.filter((broker) => broker.buyValue > 0);
  const sellers = brokerSummary.filter((broker) => broker.sellValue > 0);

  return (
    <>
      <div className="grid grid-cols-2 gap-1">
        {/* Buyers Table */}
        <Card className="w-full">
          <CardBody className="p-0">
            <div className="bg-success/10 px-3 py-2 border-b border-success/30">
              <h3 className="text-xs font-bold text-success">BUYERS</h3>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-default-50">
                  <tr className="border-b border-default-200">
                    <th className="px-2 py-2 text-left font-semibold text-default-700">BY</th>
                    <th className="px-2 py-2 text-right font-semibold text-success">B.Val</th>
                    <th className="px-2 py-2 text-right font-semibold text-success">B.Lot</th>
                    <th className="px-2 py-2 text-right font-semibold text-success">B.Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {buyers.map((broker, idx) => {
                    const brokerGroup = getBrokerGroupCode(broker.broker);
                    const groupTextColor = getBrokerGroupTextColor(brokerGroup);

                    return (
                      <tr
                        key={broker.broker}
                        className={`border-b border-default-100 hover:bg-default-50 transition-colors ${
                          idx % 2 === 0 ? "bg-default-100/30" : ""
                        }`}
                      >
                        <td className="px-2 py-2">
                          <span className={`font-bold ${groupTextColor}`}>{broker.broker}</span>
                        </td>
                        <td className="px-2 py-2 text-right text-success">
                          {formatCurrency(broker.buyValue)}
                        </td>
                        <td className="px-2 py-2 text-right text-success">
                          {formatLot(broker.buyLot)}
                        </td>
                        <td className="px-2 py-2 text-right text-success">
                          {formatPrice(broker.buyAvg)}
                        </td>
                      </tr>
                    );
                  })}
                  {buyers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center text-default-500 text-xs">
                        No buyers in this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>

        {/* Sellers Table */}
        <Card className="w-full">
          <CardBody className="p-0">
            <div className="bg-danger/10 px-3 py-2 border-b border-danger/30">
              <h3 className="text-xs font-bold text-danger">SELLERS</h3>
            </div>
            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-[11px]">
                <thead className="sticky top-0 bg-default-50">
                  <tr className="border-b border-default-200">
                    <th className="px-2 py-2 text-left font-semibold text-default-700">SL</th>
                    <th className="px-2 py-2 text-right font-semibold text-danger">S.Val</th>
                    <th className="px-2 py-2 text-right font-semibold text-danger">S.Lot</th>
                    <th className="px-2 py-2 text-right font-semibold text-danger">S.Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {sellers.map((broker, idx) => {
                    const brokerGroup = getBrokerGroupCode(broker.broker);
                    const groupTextColor = getBrokerGroupTextColor(brokerGroup);

                    return (
                      <tr
                        key={broker.broker}
                        className={`border-b border-default-100 hover:bg-default-50 transition-colors ${
                          idx % 2 === 0 ? "bg-default-100/30" : ""
                        }`}
                      >
                        <td className="px-2 py-2">
                          <span className={`font-bold ${groupTextColor}`}>{broker.broker}</span>
                        </td>
                        <td className="px-2 py-2 text-right text-danger">
                          {formatCurrency(broker.sellValue)}
                        </td>
                        <td className="px-2 py-2 text-right text-danger">
                          {formatLot(broker.sellLot)}
                        </td>
                        <td className="px-2 py-2 text-right text-danger">
                          {formatPrice(broker.sellAvg)}
                        </td>
                      </tr>
                    );
                  })}
                  {sellers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-4 text-center text-default-500 text-xs">
                        No sellers in this period
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      </div>

      {/* Color Legend */}
      <div className="flex items-center justify-center gap-4 mt-2 text-[10px]">
        <div className="flex items-center gap-1">
          <span className="font-bold text-warning">●</span>
          <span className="text-default-600">Foreign</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-secondary">●</span>
          <span className="text-default-600">Domestic</span>
        </div>
        <div className="flex items-center gap-1">
          <span className="font-bold text-primary">●</span>
          <span className="text-default-600">BUMN</span>
        </div>
      </div>
    </>
  );
}

// Executive Summary component
function ExecutiveSummary({ result, startDate, endDate }: { result: AnalysisResult; startDate: string; endDate: string }) {
  const isAccumulation = result.phase === "accumulation";
  const netValue = Math.abs(result.totalValue);
  const isPriceUp = result.priceMovement.changePercent >= 0;

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `IDR ${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `IDR ${(value / 1000000).toFixed(2)}M`;
    return `IDR ${(value / 1000).toFixed(2)}K`;
  };

  const formatPercent = (value: number) => {
    const sign = value >= 0 ? "+" : "";
    return `${sign}${value.toFixed(2)}%`;
  };

  // Format date range
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  };

  // Get date range duration
  const dateRangeDuration = formatDateRangeDuration(startDate, endDate);

  return (
    <Card className="w-full">
      <CardBody className="gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Executive Summary</h2>
            <p className="text-default-500 text-xs">
              {formatDate(startDate)} - {formatDate(endDate)}
              <span className="text-default-400 ml-1">({dateRangeDuration})</span>
            </p>
          </div>
          <Chip
            color={isAccumulation ? "success" : "danger"}
            variant="flat"
            size="sm"
            className="font-semibold"
          >
            {isAccumulation ? "ACCUMULATION" : "DISTRIBUTION"}
          </Chip>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <div
            className={`p-2 rounded-lg ${
              isAccumulation
                ? "bg-success/10 border border-success/30"
                : "bg-default-100"
            }`}
          >
            <p className="text-[10px] text-default-500 mb-0.5">Net Buy</p>
            <p className="text-sm font-bold text-success">
              {formatCurrency(result.netBuy)}
            </p>
          </div>

          <div
            className={`p-2 rounded-lg ${
              !isAccumulation
                ? "bg-danger/10 border border-danger/30"
                : "bg-default-100"
            }`}
          >
            <p className="text-[10px] text-default-500 mb-0.5">Net Sell</p>
            <p className="text-sm font-bold text-danger">
              {formatCurrency(result.netSell)}
            </p>
          </div>

          <div
            className={`p-2 rounded-lg ${
              isAccumulation
                ? "bg-success/10 border border-success/30"
                : "bg-danger/10 border border-danger/30"
            }`}
          >
            <p className="text-[10px] text-default-500 mb-0.5">Net Total</p>
            <p
              className={`text-sm font-bold ${
                isAccumulation ? "text-success" : "text-danger"
              }`}
            >
              {isAccumulation ? "+" : "-"}
              {formatCurrency(netValue)}
            </p>
          </div>
        </div>

        {/* Price Movement */}
        <div className="bg-default-100 p-2 rounded-lg">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-[10px] text-default-500 mb-0.5">Price Movement</p>
              <p className="text-sm font-bold">
                IDR {result.priceMovement.from.toFixed(0)} → IDR {result.priceMovement.to.toFixed(0)}
              </p>
            </div>
            <div className="text-right">
              <p className="text-xs text-default-500">Change</p>
              <p className={`text-sm font-bold ${isPriceUp ? "text-success" : "text-danger"}`}>
                {result.priceMovement.change >= 0 ? "+" : ""}{result.priceMovement.change.toFixed(0)}
                <span className="text-[10px] ml-1">({formatPercent(result.priceMovement.changePercent)})</span>
              </p>
            </div>
          </div>
        </div>

        {/* Dominant & Distribution Brokers */}
        <div className="grid grid-cols-2 gap-2">
          {/* Dominant Buyers */}
          {result.dominantBrokers.length > 0 && (
            <div className="bg-success/10 border border-success/30 p-2 rounded-lg">
              <p className="text-[10px] text-default-600 mb-1.5 font-semibold">Dominant Buyers</p>
              <div className="flex flex-wrap gap-1">
                {result.dominantBrokers.map((broker) => {
                  const brokerGroup = getBrokerGroupCode(broker);
                  const groupColor = getBrokerGroupTextColor(brokerGroup);
                  return (
                    <span key={broker} className={`text-xs font-bold ${groupColor}`}>
                      {broker}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          {/* Active Distributors */}
          {result.distributionBrokers.length > 0 && (
            <div className="bg-danger/10 border border-danger/30 p-2 rounded-lg">
              <p className="text-[10px] text-default-600 mb-1.5 font-semibold">Active Distributors</p>
              <div className="flex flex-wrap gap-1">
                {result.distributionBrokers.map((broker) => {
                  const brokerGroup = getBrokerGroupCode(broker);
                  const groupColor = getBrokerGroupTextColor(brokerGroup);
                  return (
                    <span key={broker} className={`text-xs font-bold ${groupColor}`}>
                      {broker}
                    </span>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="bg-default-100 p-2 rounded-lg">
          <p className="text-[11px] text-default-600">{result.insight}</p>
        </div>
      </CardBody>
    </Card>
  );
}

// TradingView Modal Component
function TradingViewModal({
  isOpen,
  onClose,
  symbol
}: {
  isOpen: boolean;
  onClose: () => void;
  symbol: string;
}) {
  const widgetRef = useRef<HTMLDivElement>(null);
  const scriptLoaded = useRef(false);
  const widgetCreated = useRef(false);
  const currentSymbol = useRef<string>("");

  // Load TradingView script only once
  useEffect(() => {
    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.id = 'tradingview-widget-script';
      script.onload = () => {
        scriptLoaded.current = true;
      };
      document.head.appendChild(script);
    }
  }, []);

  // Create widget only once when symbol changes
  useEffect(() => {
    if (symbol && widgetRef.current) {
      const waitForScript = () => {
        if (!scriptLoaded.current) {
          setTimeout(waitForScript, 100);
          return;
        }

        if (widgetRef.current && currentSymbol.current !== symbol) {
          currentSymbol.current = symbol;
          widgetRef.current.innerHTML = '';

          // @ts-ignore
          new TradingView.widget({
            autosize: true,
            symbol: `IDX:${symbol}`,
            interval: "D",
            timezone: "Asia/Jakarta",
            theme: "dark",
            style: "1",
            locale: "en",
            toolbar_bg: "#1e222d",
            enable_publishing: false,
            hide_side_toolbar: false,
            allow_symbol_change: true,
            container_id: "tradingview-widget-container",
            studies: [
              "MASimple@tv-basicstudies",
              "MACD@tv-basicstudies"
            ]
          });
          widgetCreated.current = true;
        }
      };

      waitForScript();
    }
  }, [symbol]);

  if (!symbol) return null;

  return (
    <>
      {/* Widget Container - ALWAYS in DOM, visibility controlled by CSS */}
      <div
        className={`fixed inset-4 md:inset-8 lg:inset-12 z-[10001] transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full h-full bg-content1 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-default-200 flex-shrink-0">
            <h2 className="text-lg font-bold">TradingView Chart - {symbol}</h2>
            <Button
              isIconOnly
              size="sm"
              variant="flat"
              onPress={onClose}
              className="rounded-full"
            >
              ✕
            </Button>
          </div>

          {/* TradingView Widget Container - Always in DOM */}
          <div className="flex-1 p-3 min-h-0">
            <div
              id="tradingview-widget-container"
              ref={widgetRef}
              className="w-full h-full rounded-lg overflow-hidden"
            />
          </div>
        </div>
      </div>

      {/* Backdrop - Controlled by AnimatePresence */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/30 backdrop-blur-sm z-[10000]"
            onClick={onClose}
          />
        )}
      </AnimatePresence>
    </>
  );
}

// Floating Action Button for Chart
function ChartFloatingButton({
  onClick,
  symbol
}: {
  onClick: () => void;
  symbol: string;
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      exit={{ scale: 0, opacity: 0 }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20
      }}
      className="fixed bottom-8 right-8 z-[9999] group"
    >
      <Button
        isIconOnly
        size="lg"
        color="primary"
        className="rounded-full shadow-2xl h-16 w-16"
        onPress={onClick}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="28"
          height="28"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="22 12 18 12 15 21 9 3 6 12 2 12"></polyline>
        </svg>
      </Button>
      {/* Tooltip with shortcut hint */}
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-2">
        <span>Toggle Chart</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-default-100 opacity-65 text-default-foreground border border-default-300 rounded">
          ⌘ + K
        </kbd>
      </div>
    </motion.div>
  );
}

// Input Section component
function InputSection({
  onSubmit,
  initialData,
}: {
  onSubmit: (data: {
    brokers: string[];
    stockCode: string;
    startDate: string;
    endDate: string;
  }) => void;
  initialData?: {
    brokers: string[];
    stockCode: string;
    startDate: string;
    endDate: string;
  };
}) {
  const { trackBrokerSelection, trackDateFilterChanged } = useAnalytics();

  // Load from localStorage on mount (only if no initialData provided)
  const [loadedFromStorage, setLoadedFromStorage] = useState(false);

  const [selectedBrokers, setSelectedBrokers] = useState<string[]>(
    initialData?.brokers || ["AK", "XL", "XC", "CC", "MG"]
  );
  const [stockCode, setStockCode] = useState(initialData?.stockCode || "FORE");
  const [startDate, setStartDate] = useState(
    initialData?.startDate || getDateThreeMonthsAgo()
  );
  const [endDate, setEndDate] = useState(initialData?.endDate || getTodayDate());
  const [selectedPreset, setSelectedPreset] = useState<string>("3months");
  const [isCustomRange, setIsCustomRange] = useState(false);

  // Sync selectedPreset when initialData changes or dates change
  useEffect(() => {
    if (initialData?.startDate && initialData?.endDate) {
      const matchingPreset = getMatchingPreset(initialData.startDate, initialData.endDate);
      setSelectedPreset(matchingPreset);
      setIsCustomRange(matchingPreset === '');
    }
  }, [initialData?.startDate, initialData?.endDate]);

  // Load data from localStorage only on first mount and if no initialData
  useEffect(() => {
    if (!loadedFromStorage && !initialData) {
      const savedStockCode = loadFromLocalStorage<string>(STORAGE_KEYS.STOCK_CODE, "");
      const savedBrokers = loadFromLocalStorage<string[]>(STORAGE_KEYS.SELECTED_BROKERS, []);

      if (savedStockCode) {
        setStockCode(savedStockCode);
      }
      if (savedBrokers.length > 0) {
        setSelectedBrokers(savedBrokers);
      }

      setLoadedFromStorage(true);
    }
  }, [loadedFromStorage, initialData]);

  const handleSubmit = () => {
    if (selectedBrokers.length === 0 || !stockCode || !startDate || !endDate) {
      alert("Please fill in all fields");
      return;
    }
    onSubmit({ brokers: selectedBrokers, stockCode: stockCode.toUpperCase(), startDate, endDate });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handlePresetClick = (preset: string) => {
    setSelectedPreset(preset);
    setIsCustomRange(false);
    const newStartDate = getDateByPreset(preset);
    setStartDate(newStartDate);
    setEndDate(getTodayDate());
  };

  return (
    <Card className="w-full">
      <CardBody>
        <h2 className="text-lg font-bold mb-3">Broker Action Analyzer 🤘</h2>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-default-700 mb-1.5">
              Stock Code
            </label>
            <Input
              placeholder="e.g., FORE"
              value={stockCode}
              onValueChange={setStockCode}
              onKeyDown={handleKeyDown}
              size="sm"
              classNames={{
                input: "uppercase text-sm",
              }}
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-default-700 mb-1.5">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onValueChange={(value) => {
                  const previousValue = startDate;
                  setStartDate(value);
                  const matchingPreset = getMatchingPreset(value, endDate);
                  setSelectedPreset(matchingPreset);
                  setIsCustomRange(matchingPreset === '');
                  trackDateFilterChanged('start_date', value, previousValue);
                }}
                onKeyDown={handleKeyDown}
                size="sm"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-default-700 mb-1.5">
                End Date
              </label>
              <Input
                type="date"
                value={endDate}
                onValueChange={(value) => {
                  const previousValue = endDate;
                  setEndDate(value);
                  const matchingPreset = getMatchingPreset(startDate, value);
                  setSelectedPreset(matchingPreset);
                  setIsCustomRange(matchingPreset === '');
                  trackDateFilterChanged('end_date', value, previousValue);
                }}
                onKeyDown={handleKeyDown}
                size="sm"
              />
            </div>
          </div>

          {/* Quick Select Buttons */}
          <div>
            <label className="block text-xs font-medium text-default-700 mb-1.5">
              Quick Select
            </label>
            <div className="flex flex-wrap gap-1.5">
              {[
                { key: '1week', label: '1 Week' },
                { key: '1month', label: '1 Month' },
                { key: '3months', label: '3 Months' },
                { key: '6months', label: '6 Months' },
                { key: '1year', label: '1 Year' },
              ].map((preset) => (
                <Button
                  key={preset.key}
                  size="sm"
                  variant={selectedPreset === preset.key ? "solid" : "flat"}
                  color={selectedPreset === preset.key ? "primary" : "default"}
                  className={`text-xs px-3 h-7 ${
                    selectedPreset === preset.key ? "font-semibold" : ""
                  }`}
                  onPress={() => handlePresetClick(preset.key)}
                >
                  {preset.label}
                </Button>
              ))}
              {isCustomRange && (
                <Button
                  size="sm"
                  variant="solid"
                  color="primary"
                  className="text-xs px-3 h-7 font-semibold"
                >
                  Custom ({formatDateRangeDuration(startDate, endDate)})
                </Button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-default-700 mb-1.5">
              Select Brokers
            </label>
            <Autocomplete
              defaultItems={BROKERS.filter((b) => !selectedBrokers.includes(b.code))}
              placeholder={
                selectedBrokers.length >= 7
                  ? "Maximum 7 brokers reached"
                  : selectedBrokers.length >= 5
                  ? `Type to search brokers... (${7 - selectedBrokers.length} remaining)`
                  : "Type to search brokers..."
              }
              size="sm"
              variant="bordered"
              isDisabled={selectedBrokers.length >= 7}
              onSelectionChange={(key) => {
                if (key && !selectedBrokers.includes(key as string)) {
                  if (selectedBrokers.length >= 7) {
                    addToast({
                      title: "Maximum Brokers Reached",
                      description: "You can only select up to 7 brokers. Please remove some brokers first.",
                      color: "warning",
                    });
                    return;
                  }
                  const broker = BROKERS.find((b) => b.code === key);
                  if (broker) {
                    trackBrokerSelection(broker.code, broker.name, broker.group as 'Asing' | 'Lokal' | 'Pemerintah', 'autocomplete');
                  }
                  setSelectedBrokers([...selectedBrokers, key as string]);
                }
              }}
              classNames={{
                base: "w-full",
                listbox: "max-h-60",
              }}
            >
              {(broker) => (
                <AutocompleteItem
                  key={broker.code}
                  textValue={`${broker.code} - ${broker.name}`}
                >
                  <div className="flex items-center justify-between gap-2 w-full">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs">{broker.code}</span>
                      <span className="text-xs text-default-500">{broker.name}</span>
                    </div>
                    <Chip
                      size="sm"
                      variant="flat"
                      color={getBrokerGroupColor(broker.group)}
                      className="text-[10px]"
                    >
                      {getBrokerGroupDisplayName(broker.group)}
                    </Chip>
                  </div>
                </AutocompleteItem>
              )}
            </Autocomplete>

            {/* Selected Broker Chips */}
            {selectedBrokers.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {selectedBrokers.map((brokerCode) => {
                  const broker = BROKERS.find((b) => b.code === brokerCode);
                  if (!broker) return null;

                  return (
                    <Chip
                      key={broker.code}
                      size="sm"
                      variant="flat"
                      color={getBrokerGroupColor(broker.group)}
                      classNames={{
                        base: "h-6",
                        content: "text-xs",
                      }}
                      onClose={() => {
                        trackBrokerSelection(broker.code, broker.name, broker.group as 'Asing' | 'Lokal' | 'Pemerintah', 'chip_removal');
                        setSelectedBrokers(selectedBrokers.filter((b) => b !== brokerCode));
                      }}
                    >
                      {broker.code} - {broker.name}
                    </Chip>
                  );
                })}
              </div>
            )}

            <p className={`text-[10px] mt-1 ${
              selectedBrokers.length >= 7
                ? "text-warning font-semibold"
                : selectedBrokers.length >= 5
                ? "text-default-600"
                : "text-default-500"
            }`}>
              {selectedBrokers.length > 0
                ? `${selectedBrokers.length}/7 broker(s) selected: ${selectedBrokers.join(", ")}`
                : "0/7 brokers selected (maximum 7 brokers)"}
            </p>
          </div>

          <Button
            color="primary"
            size="md"
            className="w-full font-semibold mt-2"
            onPress={handleSubmit}
          >
            <span>Analyze</span>
            <kbd className="ml-2 px-2 py-0.5 text-xs font-semibold text-default-foreground bg-default-100 opacity-35 border border-default-300 rounded-md">
              ↵ Enter
            </kbd>
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// Main page component
function AnalyzerPage({ shareSlug }: { shareSlug?: string }) {
  const { trackAnalysisInitiated, trackAnalysisCompleted, trackAnalysisFailed, trackChartToggled, trackShareLinkClicked, trackBrokerFlowButtonClicked } = useAnalytics();
  const router = useRouter();

  // Track page view
  useTrackPageView({
    pageTitle: 'Broker Calendar',
  });

  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    brokers: string[];
    stockCode: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  // TradingView Chart States
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);

  // Share Feature States
  const [isShareModalOpen, setIsShareModalOpen] = useState(false);
  const [shareData, setShareData] = useState<{
    symbol: string;
    from: string;
    to: string;
    broker_code: string[];
  } | null>(null);

  // Broker Flow Chart States
  const [isBrokerFlowModalOpen, setIsBrokerFlowModalOpen] = useState(false);

  const handleAnalyze = async (data: {
    brokers: string[];
    stockCode: string;
    startDate: string;
    endDate: string;
  }) => {
    setFormData(data);
    setIsLoading(true);

    const startTime = Date.now();

    // Track analysis initiation
    trackAnalysisInitiated(data.stockCode, data.brokers.length, data.startDate, data.endDate);

    try {
      const result = await analyzeData(
        data.brokers,
        data.stockCode,
        data.startDate,
        data.endDate
      );
      setAnalysisResult(result);

      // Save to localStorage after successful analysis
      saveToLocalStorage(STORAGE_KEYS.STOCK_CODE, data.stockCode);
      saveToLocalStorage(STORAGE_KEYS.SELECTED_BROKERS, data.brokers);

      // Track analysis completion
      const duration = Date.now() - startTime;
      trackAnalysisCompleted(
        data.stockCode,
        duration,
        result.dailyData.length,
        result.phase
      );

      // Set chart symbol for TradingView (load in background)
      setChartSymbol(data.stockCode.toUpperCase());
    } catch (error) {
      // Track analysis failure
      const duration = Date.now() - startTime;
      trackAnalysisFailed(
        data.stockCode,
        'api',
        error instanceof Error ? error.message : 'Unknown error',
        duration
      );

      addToast({
        title: "Analysis Failed",
        description: error instanceof Error ? error.message : "Failed to fetch broker data. Please try again.",
        color: "danger",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle shared link
  const handleSharedLink = async (shareSlug: string) => {
    try {
      setIsLoading(true);
      const response = await getSharedLink(shareSlug);

      // Track share link click (Firebase only - backend tracks automatically)
      trackShareLinkClicked(shareSlug, 'direct');

      // Auto-analyze with shared parameters
      await handleAnalyze({
        brokers: response.data.queryParams.broker_code,
        stockCode: response.data.queryParams.symbol,
        startDate: response.data.queryParams.from,
        endDate: response.data.queryParams.to,
      });
    } catch (error) {
      addToast({
        title: "Invalid Share Link",
        description: "This share link is invalid or has expired.",
        color: "danger",
      });
      // Clear the share parameter from URL
      router.replace('/broker-calendar', { scroll: false });
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut for toggling chart modal (Cmd/Ctrl + K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Check for Cmd/Ctrl + K
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        // Toggle chart modal if symbol is available
        if (chartSymbol) {
          trackChartToggled(chartSymbol, 'keyboard_shortcut', true);
          setIsChartModalOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chartSymbol, trackChartToggled]);

  // Detect share link in URL
  useEffect(() => {
    if (shareSlug && !analysisResult && !isLoading) {
      handleSharedLink(shareSlug);
    }
  }, [shareSlug]);

  // Update chartSymbol and shareData when analysis completes
  useEffect(() => {
    if (analysisResult && formData?.stockCode) {
      setChartSymbol(formData.stockCode);

      // Update share data when analysis completes
      setShareData({
        symbol: formData.stockCode,
        from: formData.startDate,
        to: formData.endDate,
        broker_code: formData.brokers,
      });
    } else {
      setChartSymbol(null);
      setShareData(null);
    }
  }, [analysisResult, formData]);

  return (
    <div className="w-full h-full">
      <AnimatePresence mode="wait">
        {!analysisResult && !isLoading && (
          <motion.div
            key="single-column"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full max-w-3xl mx-auto"
          >
            <InputSection onSubmit={handleAnalyze} />
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            key="loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex justify-center items-center py-12"
          >
            <Spinner size="lg" color="primary" />
          </motion.div>
        )}

        {analysisResult && !isLoading && (
          <motion.div
            key="two-column"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-100px)]"
          >
            {/* Left Column - Control & Summary Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="lg:col-span-1 overflow-y-auto pr-2 space-y-4"
            >
              <InputSection onSubmit={handleAnalyze} initialData={formData || undefined} />
              <ExecutiveSummary result={analysisResult} startDate={formData?.startDate || ""} endDate={formData?.endDate || ""} />
              <div>
                <h3 className="text-sm font-bold mb-2 text-default-700">
                  Broker Summary
                </h3>
                <BrokerSummaryTable brokerSummary={analysisResult.brokerSummary} />
              </div>
            </motion.div>

            {/* Right Column - Calendar Visualization */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.2 }}
              className="lg:col-span-2 overflow-y-auto pr-2"
            >
              <Card>
                <CardBody>
                  <h2 className="text-xl font-bold mb-4">Calendar View</h2>
                  <CalendarView dailyData={analysisResult.dailyData} />
                </CardBody>
              </Card>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* TradingView Floating Action Button */}
      <AnimatePresence>
        {chartSymbol && (
          <ChartFloatingButton
            onClick={() => {
              trackChartToggled(chartSymbol, 'button_click');
              setIsChartModalOpen(true);
            }}
            symbol={chartSymbol}
          />
        )}
      </AnimatePresence>

      {/* Share Floating Action Button */}
      <AnimatePresence>
        {chartSymbol && (
          <ShareFloatingButton
            onPress={() => setIsShareModalOpen(true)}
          />
        )}
      </AnimatePresence>

      {/* TradingView Chart Modal */}
      <TradingViewModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        symbol={chartSymbol || ""}
      />

      {/* Share Modal */}
      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
        shareData={shareData}
      />

      {/* Broker Flow Floating Action Button */}
      <AnimatePresence>
        {analysisResult && formData && (
          <BrokerFlowFloatingButton
            onPress={() => {
              // Calculate date range days
              const startDate = new Date(formData.startDate);
              const endDate = new Date(formData.endDate);
              const dateRangeDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

              trackBrokerFlowButtonClicked(
                formData.stockCode,
                formData.brokers.length,
                dateRangeDays
              );
              setIsBrokerFlowModalOpen(true);
            }}
          />
        )}
      </AnimatePresence>

      {/* Broker Flow Chart Modal */}
      <BrokerFlowModal
        isOpen={isBrokerFlowModalOpen}
        onClose={() => setIsBrokerFlowModalOpen(false)}
        data={analysisResult?.dailyData.map(day => ({
          date: day.date,
          close_price: day.closingPrice,
          brokers: day.brokers.reduce((acc, broker) => {
            acc[broker.broker] = {
              value: broker.buyValue - broker.sellValue,
              volume: broker.buyLot - broker.sellLot
            };
            return acc;
          }, {} as Record<string, { value: number; volume: number }>)
        })) || []}
        brokers={formData?.brokers || []}
        symbol={formData?.stockCode || ""}
        isLoading={isLoading}
      />
    </div>
  );
}

// Client component that receives shareSlug from server component
export default function BrokerCalendarClient({ shareSlug }: BrokerCalendarClientProps) {
  return <AnalyzerPage shareSlug={shareSlug} />;
}
