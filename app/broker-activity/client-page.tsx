"use client";

/**
 * Broker Activity Client Page
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
import { BROKERS as BROKER_LIST } from "@/data/brokers";
import { getClientIPSync } from "@/lib/utils/client-ip";

// Types
interface StockItem {
  symbol: string;
  side: "BUY" | "SELL";
  avg_price: {
    raw: number;
    formatted: string;
  };
  volume: {
    raw: number;
    formatted: string;
  };
  value: {
    raw: number;
    formatted: string;
  };
}

interface BrokerActivityResponse {
  meta: {
    broker_code: string;
    broker_name: string;
    date: string;
    limit: number;
    transaction_type: string;
    market_board: string;
    currency: string;
  };
  formatting: {
    price: string;
    value: string;
    volume: string;
  };
  market_activity: {
    total_volume: { raw: number; formatted: string };
    total_value: { raw: number; formatted: string };
    average_price: { raw: number; formatted: string };
    accumulation_distribution: {
      label: string;
      net_value: { raw: number; formatted: string };
      net_volume: { raw: number; formatted: string };
      strength_percent: number;
    };
    buyer_count: number;
    seller_count: number;
  };
  accdist_scope: {
    top_1: { label: string; net_value: { raw: number; formatted: string } };
    top_3: { label: string; net_value: { raw: number; formatted: string } };
    top_5: { label: string; net_value: { raw: number; formatted: string } };
    top_10: { label: string; net_value: { raw: number; formatted: string } };
  };
  stocks: {
    sorting: {
      key: string;
      order: string;
      description: string;
    };
    items: StockItem[];
  };
  derived_metrics: {
    net_exposure_ratio: number;
    distribution_dominance: { score: number; label: string };
    focus_index: { value: number; label: string };
    rotation_indicator: {
      buy_stock_count: number;
      sell_stock_count: number;
      type: string;
    };
  };
  executive_summary: {
    market_bias: string;
    broker_behavior: string;
    conviction_level: string;
    risk_mode: string;
    recommended_action: string;
  };
}

interface EmittenCalendarResponse {
  symbol: string;
  brokers: string[];
  range: {
    from: string;
    to: string;
  };
  summary: {
    total_buy_value: number;
    total_buy_value_formatted: string;
    total_buy_volume: number;
    total_buy_volume_formatted: string;
    total_sell_value: number;
    total_sell_value_formatted: string;
    total_sell_volume: number;
    total_sell_volume_formatted: string;
    total_value: number;
    total_value_formatted: string;
    total_volume: number;
    total_volume_formatted: string;
    trend: string;
    strength: string;
    dominant_brokers: string[];
    distribution_brokers: string[];
    price_movement: {
      from: number;
      to: number;
      change: number;
      change_pct: number;
    };
    note: string;
  };
  data: Array<{
    date: string;
    close_price: number;
    close_price_formatted: string;
    total_value: number;
    total_value_formatted: string;
    total_volume: number;
    total_volume_formatted: string;
    signal: {
      trend: string;
      strength: string;
      note: string;
    };
    brokers: Record<string, {
      value: number;
      value_formatted: string;
      volume: number;
      volume_formatted: string;
    }>;
  }>;
}

interface DailyData {
  date: string;
  netLot: number;
  netValue: number;
  closingPrice: number;
  priceChange: number;
  priceChangePercent: number;
  brokers: Array<{
    broker: string;
    buyValue: number;
    buyLot: number;
    buyAvg: number;
    sellValue: number;
    sellLot: number;
    sellAvg: number;
  }>;
  signal?: {
    trend: string;
    strength: string;
    note: string;
  };
}

// Helper functions
function generateNonce(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

const STORAGE_KEYS = {
  BROKER_CODE: 'broker-activity-broker-code',
  START_DATE: 'broker-activity-start-date',
  END_DATE: 'broker-activity-end-date',
};

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

function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

function getDateByPreset(preset: string): string {
  const date = new Date();
  switch (preset) {
    case 'today':
      // No change, return today
      break;
    case '3days':
      date.setDate(date.getDate() - 3);
      break;
    case '1week':
      date.setDate(date.getDate() - 7);
      break;
    case '1month':
      date.setMonth(date.getMonth() - 1);
      break;
    case '3months':
      date.setMonth(date.getMonth() - 3);
      break;
    case '1year':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setDate(date.getDate() - 7);
  }
  return date.toISOString().split('T')[0];
}

function getMatchingPreset(startDate: string, endDate: string): string {
  const today = getTodayDate();
  if (endDate !== today) return '';

  const presets = ['today', '3days', '1week', '1month', '3months', '1year'];
  for (const preset of presets) {
    if (preset === 'today') {
      if (startDate === today) return preset;
    } else if (startDate === getDateByPreset(preset)) {
      return preset;
    }
  }
  return '';
}

function formatDateRangeDuration(startDate: string, endDate: string): string {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  const months = Math.floor(diffDays / 30);
  const remainingDays = diffDays % 30;

  if (months > 0 && remainingDays > 0) {
    return `${months}M ${remainingDays}D`;
  } else if (months > 0) {
    return `${months}M`;
  } else {
    return `${diffDays}D`;
  }
}

// API Functions
async function fetchBrokerActivity(
  brokerCode: string,
  startDate: string,
  endDate: string
): Promise<BrokerActivityResponse> {
  const baseUrl = 'https://api-idx.gsphomelab.org/api/v1';
  const endpoint = '/broker-activity';

  const params = new URLSearchParams({
    broker: brokerCode,
    from: startDate,
    to: endDate,
  });

  const url = `${baseUrl}${endpoint}?${params.toString()}`;
  const clientIP = getClientIPSync() || 'unknown';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-nonce': generateNonce(),
      'X-Ip-Client': clientIP,
    },
  });

  if (!response.ok) {
    throw new Error(`Broker Activity API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

async function fetchEmittenCalendar(
  symbol: string,
  brokerCode: string,
  startDate: string,
  endDate: string
): Promise<EmittenCalendarResponse> {
  const baseUrl = 'https://api-idx.gsphomelab.org/api/v1';
  const endpoint = '/broker-action-calendar';

  const params = new URLSearchParams({
    symbol: symbol,
    broker_code: brokerCode,
    from: startDate,
    to: endDate,
  });

  const url = `${baseUrl}${endpoint}?${params.toString()}`;
  const clientIP = getClientIPSync() || 'unknown';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-nonce': generateNonce(),
      'X-Ip-Client': clientIP,
    },
  });

  if (!response.ok) {
    throw new Error(`Emitten Calendar API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}

// Helper function to get broker info
function getBrokerInfo(brokerCode: string) {
  return BROKER_LIST.find((b) => b.code === brokerCode);
}

function getBrokerGroupColor(group: string): "primary" | "secondary" | "warning" | "default" {
  switch (group) {
    case "Asing":
      return "warning";
    case "Lokal":
      return "secondary";
    case "Pemerintah":
      return "primary";
    default:
      return "default";
  }
}

function getBrokerGroupCode(brokerCode: string): string {
  const broker = BROKER_LIST.find((b) => b.code === brokerCode);
  return broker?.group || "";
}

function getBrokerGroupTextColor(group: string): string {
  switch (group) {
    case "Asing":
      return "text-warning";
    case "Lokal":
      return "text-secondary";
    case "Pemerintah":
      return "text-primary";
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

// Calendar Cell Component (reused from broker-calendar)
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
      const threshold = 250;
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

          {data.signal && (
            <div className="mt-3 pt-2 border-t border-default-200">
              <div className="flex items-center gap-2 mb-1.5">
                <span className="text-[9px] text-default-500 font-semibold uppercase">Signal</span>
                <Chip
                  size="sm"
                  variant="flat"
                  color={data.signal.trend === "accumulation" ? "success" : "danger"}
                  className="h-5 text-[9px] px-2 font-semibold"
                >
                  {data.signal.trend}
                </Chip>
                <Chip
                  size="sm"
                  variant="flat"
                  color={
                    data.signal.strength === "strong" ? "success" :
                    data.signal.strength === "moderate" ? "warning" : "default"
                  }
                  className="h-5 text-[9px] px-2 font-semibold"
                >
                  {data.signal.strength}
                </Chip>
              </div>
              <p className="text-[9px] text-default-600 italic leading-tight">
                {data.signal.note}
              </p>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}

// Calendar View component
function CalendarView({ dailyData, symbol }: { dailyData: DailyData[]; symbol: string }) {
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

  const sortedMonths = Object.keys(monthlyData).sort();

  if (dailyData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 text-center">
        <div className="text-4xl mb-4">📅</div>
        <p className="text-default-500">No calendar data available for {symbol}</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {sortedMonths.map((monthKey) => renderMonth(monthKey, monthlyData[monthKey]))}
    </div>
  );
}

// Stock Card Component
function StockCard({
  stock,
  brokerCode,
  isSelected,
  onSelect
}: {
  stock: StockItem;
  brokerCode: string;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const isBuy = stock.side === "BUY";

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      whileTap={{ scale: 0.99 }}
      className={`cursor-pointer transition-all ${
        isSelected
          ? "ring-2 ring-primary"
          : "hover:shadow-md"
      }`}
      onClick={onSelect}
    >
      <Card
        className={`h-full ${
          isSelected
            ? "bg-primary/5 border-primary/50"
            : "bg-default-50/50"
        }`}
      >
        <CardBody className="px-6 py-4">
          <div className="flex items-center justify-between gap-2">
            {/* Left: Symbol + Side */}
            <div className="flex items-center gap-1.5 min-w-0 flex-1">
              <span className="text-sm font-bold truncate">{stock.symbol}</span>
              <Chip
                size="sm"
                color={isBuy ? "success" : "danger"}
                variant="flat"
                className="h-5 text-[9px] font-bold px-1.5 min-w-[38px] text-center"
              >
                {stock.side === "BUY" ? "B" : "S"}
              </Chip>
            </div>

            {/* Right: Large Value */}
            <div className={`text-base font-bold ${isBuy ? "text-success" : "text-danger"} whitespace-nowrap`}>
              {stock.value.formatted}
            </div>
          </div>

          {/* Secondary Info - Compact inline */}
          <div className="flex items-center gap-3 mt-1 text-[9px] text-default-500">
            <span className="flex items-center gap-0.5">
              <span className="opacity-60">@</span>
              <span className="font-medium">{stock.avg_price.formatted}</span>
            </span>
            <span className="flex items-center gap-0.5">
              <span className="opacity-60">vol</span>
              <span className="font-medium">{stock.volume.formatted}</span>
            </span>
          </div>
        </CardBody>
      </Card>
    </motion.div>
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
            container_id: "tradingview-widget-container-ba",
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

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!symbol) return null;

  return (
    <>
      <div
        className={`fixed inset-4 md:inset-8 lg:inset-12 z-[10001] transition-opacity duration-200 ${
          isOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
        }`}
      >
        <div className="w-full h-full bg-content1 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
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

          <div className="flex-1 p-3 min-h-0">
            <div
              id="tradingview-widget-container-ba"
              ref={widgetRef}
              className="w-full h-full rounded-lg overflow-hidden"
            />
          </div>
        </div>
      </div>

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

// Chart Floating Action Button
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
      <div className="absolute bottom-full right-0 mb-2 px-3 py-2 bg-foreground text-background text-xs rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none flex items-center gap-2">
        <span>Toggle Chart</span>
        <kbd className="px-1.5 py-0.5 text-[10px] font-semibold bg-default-100 opacity-65 text-default-foreground border border-default-300 rounded">
          ⌘ + K
        </kbd>
      </div>
    </motion.div>
  );
}

// Main page component
function BrokerActivityPage() {
  useTrackPageView({ pageTitle: 'Broker Activity' });

  const [brokerCode, setBrokerCode] = useState<string>(() =>
    loadFromLocalStorage<string>(STORAGE_KEYS.BROKER_CODE, "SS")
  );
  const [startDate, setStartDate] = useState<string>(() =>
    loadFromLocalStorage<string>(STORAGE_KEYS.START_DATE, getTodayDate())
  );
  const [endDate, setEndDate] = useState<string>(() =>
    loadFromLocalStorage<string>(STORAGE_KEYS.END_DATE, getTodayDate())
  );
  const [selectedPreset, setSelectedPreset] = useState<string>("today");
  const [isCustomRange, setIsCustomRange] = useState(false);

  const [brokerActivity, setBrokerActivity] = useState<BrokerActivityResponse | null>(null);
  const [emittenCalendar, setEmittenCalendar] = useState<EmittenCalendarResponse | null>(null);
  const [selectedStock, setSelectedStock] = useState<string | null>(null);
  const [isLoadingCalendar, setIsLoadingCalendar] = useState(false);

  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);

  const brokerInfo = getBrokerInfo(brokerCode);

  // Fetch broker activity when filters change
  useEffect(() => {
    const fetchActivity = async () => {
      try {
        const data = await fetchBrokerActivity(brokerCode, startDate, endDate);
        setBrokerActivity(data);

        // Save to localStorage
        saveToLocalStorage(STORAGE_KEYS.BROKER_CODE, brokerCode);
        saveToLocalStorage(STORAGE_KEYS.START_DATE, startDate);
        saveToLocalStorage(STORAGE_KEYS.END_DATE, endDate);

        // Update preset
        const matchingPreset = getMatchingPreset(startDate, endDate);
        setSelectedPreset(matchingPreset);
        setIsCustomRange(matchingPreset === '');

        // Clear selected stock if it's no longer in the list
        if (selectedStock && !data.stocks.items.find(s => s.symbol === selectedStock)) {
          setSelectedStock(null);
          setEmittenCalendar(null);
        }
      } catch (error) {
        addToast({
          title: "Failed to fetch broker activity",
          description: error instanceof Error ? error.message : "Unknown error",
          color: "danger",
        });
      }
    };

    fetchActivity();
  }, [brokerCode, startDate, endDate]);

  // Fetch emitten calendar when stock is selected
  useEffect(() => {
    if (selectedStock) {
      const fetchCalendar = async () => {
        setIsLoadingCalendar(true);
        try {
          const data = await fetchEmittenCalendar(selectedStock, brokerCode, startDate, endDate);
          setEmittenCalendar(data);
        } catch (error) {
          addToast({
            title: "Failed to fetch calendar data",
            description: error instanceof Error ? error.message : "Unknown error",
            color: "danger",
          });
          setEmittenCalendar(null);
        } finally {
          setIsLoadingCalendar(false);
        }
      };

      fetchCalendar();
    }
  }, [selectedStock]);

  // Update chart symbol when stock changes
  useEffect(() => {
    if (selectedStock) {
      setChartSymbol(selectedStock);
    }
  }, [selectedStock]);

  // Handle preset click
  const handlePresetClick = (preset: string) => {
    setSelectedPreset(preset);
    setIsCustomRange(false);
    if (preset === 'today') {
      const today = getTodayDate();
      setStartDate(today);
      setEndDate(today);
    } else {
      setStartDate(getDateByPreset(preset));
      setEndDate(getTodayDate());
    }
  };

  // Transform calendar data to DailyData format
  const calendarDailyData = useMemo(() => {
    if (!emittenCalendar) return [];

    return emittenCalendar.data.map((day, index) => {
      const prevDay = emittenCalendar.data[index - 1];
      const previousPrice = prevDay ? prevDay.close_price : day.close_price;
      const priceChange = day.close_price - previousPrice;
      const priceChangePercent = (priceChange / previousPrice) * 100;

      const brokersData = Object.entries(day.brokers).map(([code, data]) => {
        const value = data.value;
        const volume = data.volume;
        const isBuy = value > 0;

        return {
          broker: code,
          buyValue: isBuy ? value : 0,
          buyLot: isBuy ? volume : 0,
          buyAvg: isBuy ? (volume > 0 ? value / volume : 0) : 0,
          sellValue: !isBuy ? Math.abs(value) : 0,
          sellLot: !isBuy ? Math.abs(volume) : 0,
          sellAvg: !isBuy ? (volume !== 0 ? Math.abs(value) / Math.abs(volume) : 0) : 0,
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
        signal: day.signal ? {
          trend: day.signal.trend,
          strength: day.signal.strength,
          note: day.signal.note,
        } : undefined,
      };
    });
  }, [emittenCalendar]);

  // Handle broker change
  const handleBrokerChange = (key: React.Key | null) => {
    if (!key) return;
    const newBrokerCode = key as string;
    setBrokerCode(newBrokerCode);
    setSelectedStock(null);
    setEmittenCalendar(null);
  };

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (chartSymbol) {
          setIsChartModalOpen(prev => !prev);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [chartSymbol]);

  // Format date for display
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", { day: "2-digit", month: "short" });
  };

  return (
    <div className="w-full min-h-screen">
      {/* Top Sticky Filter Bar */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-default-200 pb-3">
        <div className="max-w-7xl mx-auto px-4 pt-4">
          <h1 className="text-xl font-bold mb-3">Broker Activity</h1>

          <div className="flex flex-wrap items-end gap-3">
            {/* Broker Selection */}
            <div className="flex-1 min-w-[200px]">
              <label className="block text-xs font-medium text-default-700 mb-1.5">
                Broker
              </label>
              <Autocomplete
                defaultItems={BROKERS}
                placeholder="Select a broker"
                size="sm"
                variant="bordered"
                selectedKey={brokerCode}
                onSelectionChange={handleBrokerChange}
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
            </div>

            {/* Date Range */}
            <div className="flex gap-2">
              <div>
                <label className="block text-xs font-medium text-default-700 mb-1.5">
                  From
                </label>
                <Input
                  type="date"
                  value={startDate}
                  onValueChange={(value) => {
                    setStartDate(value);
                    const matchingPreset = getMatchingPreset(value, endDate);
                    setSelectedPreset(matchingPreset);
                    setIsCustomRange(matchingPreset === '');
                  }}
                  size="sm"
                  className="w-36"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-default-700 mb-1.5">
                  To
                </label>
                <Input
                  type="date"
                  value={endDate}
                  onValueChange={(value) => {
                    setEndDate(value);
                    const matchingPreset = getMatchingPreset(startDate, value);
                    setSelectedPreset(matchingPreset);
                    setIsCustomRange(matchingPreset === '');
                  }}
                  size="sm"
                  className="w-36"
                />
              </div>
            </div>

            {/* Preset Buttons */}
            <div>
              <label className="block text-xs font-medium text-default-700 mb-1.5">
                Quick Select
              </label>
              <div className="flex flex-wrap gap-1">
                {[
                  { key: 'today', label: 'Today' },
                  { key: '3days', label: '3D' },
                  { key: '1week', label: '1W' },
                  { key: '1month', label: '1M' },
                  { key: '3months', label: '3M' },
                  { key: '1year', label: '1Y' },
                ].map((preset) => (
                  <Button
                    key={preset.key}
                    size="sm"
                    variant={selectedPreset === preset.key ? "solid" : "flat"}
                    color={selectedPreset === preset.key ? "primary" : "default"}
                    className={`text-xs px-3 h-8 ${
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
                    className="text-xs px-3 h-8 font-semibold"
                  >
                    Custom ({formatDateRangeDuration(startDate, endDate)})
                  </Button>
                )}
              </div>
            </div>
          </div>

          {/* Broker Info & Summary */}
          {brokerActivity && (
            <div className="mt-3 flex items-center gap-3">
              <span className="text-sm">
                <span className="font-semibold">{brokerCode}</span>
                <span className="text-default-500 ml-1">
                  ({brokerInfo?.name || 'Unknown'})
                </span>
              </span>
              <span className="text-default-400">•</span>
              <span className="text-sm text-default-600">
                {formatDate(startDate)} - {formatDate(endDate)}
                <span className="text-default-400 ml-1">
                  ({formatDateRangeDuration(startDate, endDate)})
                </span>
              </span>
              <span className="text-default-400">•</span>
              <Chip
                size="sm"
                variant="flat"
                color={
                  brokerActivity.market_activity.accumulation_distribution.label === "Accumulation"
                    ? "success"
                    : brokerActivity.market_activity.accumulation_distribution.label === "Distribution"
                    ? "danger"
                    : "default"
                }
                className="h-6 text-[10px] font-semibold px-2"
              >
                {brokerActivity.market_activity.accumulation_distribution.label}
              </Chip>
              <span className="text-default-400">•</span>
              <span className="text-sm text-default-600">
                Total Value: <span className="font-semibold">{brokerActivity.market_activity.total_value.formatted}</span>
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        {brokerActivity ? (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            {/* Left Panel - Stock List (40%) */}
            <div className="lg:col-span-2 space-y-3">
              <h2 className="text-sm font-bold text-default-700">
                Stock Transactions ({brokerActivity.stocks.items.length})
              </h2>

              <div className="grid grid-cols-1 gap-2">
                {brokerActivity.stocks.items.map((stock) => (
                  <StockCard
                    key={stock.symbol}
                    stock={stock}
                    brokerCode={brokerCode}
                    isSelected={selectedStock === stock.symbol}
                    onSelect={() => setSelectedStock(stock.symbol)}
                  />
                ))}
              </div>
            </div>

            {/* Right Panel - Calendar View (60%) */}
            <div className="lg:col-span-3">
              {!selectedStock ? (
                <div className="flex flex-col items-center justify-center h-[calc(100vh-250px)] border-2 border-dashed border-default-300 rounded-xl">
                  <div className="text-6xl mb-4">📊</div>
                  <p className="text-lg font-semibold text-default-600">Select a stock to view daily activity</p>
                  <p className="text-sm text-default-500 mt-1">Click on any stock card from the left panel</p>
                </div>
              ) : isLoadingCalendar ? (
                <div className="flex items-center justify-center h-[calc(100vh-250px)]">
                  <Spinner size="lg" color="primary" />
                </div>
              ) : (
                <Card>
                  <CardBody>
                    {/* Calendar Header */}
                    <div className="flex items-center justify-between mb-4">
                      <div>
                        <h2 className="text-xl font-bold">{selectedStock}</h2>
                        <p className="text-sm text-default-500">
                          {brokerCode} - {brokerInfo?.name || 'Unknown'}
                        </p>
                      </div>
                      {brokerActivity && (
                        <div className="text-right">
                          <p className="text-xs text-default-500">Total Value</p>
                          <p className="text-lg font-bold text-primary">
                            {brokerActivity.stocks.items.find(s => s.symbol === selectedStock)?.value.formatted || '-'}
                          </p>
                          <p className="text-xs text-default-500">Total Volume</p>
                          <p className="text-sm font-semibold text-default-600">
                            {brokerActivity.stocks.items.find(s => s.symbol === selectedStock)?.volume.formatted || '-'}
                          </p>
                        </div>
                      )}
                    </div>

                    <CalendarView dailyData={calendarDailyData} symbol={selectedStock} />
                  </CardBody>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-[calc(100vh-200px)]">
            <Spinner size="lg" color="primary" />
          </div>
        )}
      </div>

      {/* TradingView Floating Action Button */}
      <AnimatePresence>
        {chartSymbol && (
          <ChartFloatingButton
            onClick={() => setIsChartModalOpen(true)}
            symbol={chartSymbol}
          />
        )}
      </AnimatePresence>

      {/* TradingView Chart Modal */}
      <TradingViewModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        symbol={chartSymbol || ""}
      />
    </div>
  );
}

export default function BrokerActivityClient() {
  return <BrokerActivityPage />;
}
