"use client";

/**
 * Big Broksum Client Page
 * Client component that handles all the interactive logic
 */

import { useState, useMemo, useRef, useEffect } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { addToast } from "@heroui/toast";
import { useTrackPageView } from "@/lib/hooks/useTrackPageView";
import { useAnalytics } from "@/lib/hooks/useAnalytics";
import { useRouter } from "next/navigation";
import { getClientIPSync } from "@/lib/utils/client-ip";
import { BROKERS } from "@/data/brokers";
import { motion, AnimatePresence } from "framer-motion";

interface BigBroksumClientProps {
  shareSlug?: string;
}

// Types
interface BrokerSummaryData {
  broker: string;
  buyValue: number;
  buyLot: number;
  buyAvg: number;
  sellValue: number;
  sellLot: number;
  sellAvg: number;
}

interface PeriodData {
  periodLabel: string;
  startDate: string;
  endDate: string;
  buyers: BrokerSummaryData[];
  sellers: BrokerSummaryData[];
}

interface PeriodSummary {
  netFlow: number;
  totalBuyValue: number;
  totalSellValue: number;
  totalValue: number;
  buyAvgPrice: number;
  sellAvgPrice: number;
  spread: number;
  activeBuyers: number;
  activeSellers: number;
  topBuyer: { broker: string; value: number; percentage: number } | null;
  topSeller: { broker: string; value: number; percentage: number } | null;
  foreignNet: number;
  domesticNet: number;
  bumNet: number;
  phase: "accumulation" | "distribution";
}

interface ExecutiveSummaryData {
  totalNetFlow: number;
  accumulationPeriods: number;
  distributionPeriods: number;
  trendPattern: string;
  mostConsistentBuyers: Array<{ broker: string; count: number; periods: string[] }>;
  mostConsistentSellers: Array<{ broker: string; count: number; periods: string[] }>;
  positionSwitchers: Array<{
    broker: string;
    pattern: string;
    periods: string[];
  }>;
  foreignTrend: Array<{ period: string; netFlow: number }>;
  domesticTrend: Array<{ period: string; netFlow: number }>;
  bumTrend: Array<{ period: string; netFlow: number }>;
  avgPriceRange: { min: number; max: number; change: number; changePercent: number };
  groupDomination: Array<{ period: string; dominant: string }>;
}

// Helper function to generate random hex string for x-nonce header
function generateNonce(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

// Helper function to get date based on preset
function getDateByPreset(preset: string): string {
  const date = new Date();
  switch (preset) {
    case '1week':
      date.setDate(date.getDate() - 7);
      break;
    case '3months':
      date.setMonth(date.getMonth() - 3);
      break;
    case '6months':
      date.setMonth(date.getMonth() - 6);
      break;
    case '12months':
      date.setFullYear(date.getFullYear() - 1);
      break;
    default:
      date.setMonth(date.getMonth() - 6);
  }
  return date.toISOString().split('T')[0];
}

// Helper function to get today's date
function getTodayDate(): string {
  return new Date().toISOString().split('T')[0];
}

// Helper function to format date for display
function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    day: "2-digit",
    month: "short",
    year: "numeric"
  });
}

// Divide period into 6 sub-periods
function dividePeriodInto6(startDate: string, endDate: string): Array<{ label: string; startDate: string; endDate: string }> {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
  const daysPerPeriod = Math.floor(totalDays / 6);

  const periods: Array<{ label: string; startDate: string; endDate: string }> = [];

  for (let i = 0; i < 6; i++) {
    const periodStart = new Date(start);
    periodStart.setDate(start.getDate() + (i * daysPerPeriod));

    const periodEnd = new Date(periodStart);
    if (i === 5) {
      // Last period goes to the end date
      periodEnd.setTime(end.getTime());
    } else {
      periodEnd.setDate(periodStart.getDate() + daysPerPeriod - 1);
    }

    periods.push({
      label: `Period ${i + 1}`,
      startDate: periodStart.toISOString().split('T')[0],
      endDate: periodEnd.toISOString().split('T')[0],
    });
  }

  return periods.reverse(); // Reverse to show most recent first
}

// Fetch broker summary from API
async function fetchBrokerSummary(
  stockCode: string,
  startDate: string,
  endDate: string
): Promise<{ buyers: BrokerSummaryData[]; sellers: BrokerSummaryData[] }> {
  const baseUrl = 'https://api-idx.gsphomelab.org/api/v1';
  const endpoint = '/emiten-broker-summary';

  const params = new URLSearchParams({
    symbol: stockCode,
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
  const brokerMap = new Map<string, BrokerSummaryData>();

  [...buyBrokers, ...sellBrokers].forEach((broker: BrokerSummaryData) => {
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

  const allBrokers = Array.from(brokerMap.values());

  return {
    buyers: allBrokers.filter(b => b.buyValue > 0).sort((a, b) => b.buyValue - a.buyValue),
    sellers: allBrokers.filter(b => b.sellValue > 0).sort((a, b) => b.sellValue - a.sellValue),
  };
}

// Helper function to get broker group color
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
  const broker = BROKERS.find((b) => b.code === brokerCode);
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

// Calculate period summary
function calculatePeriodSummary(periodData: PeriodData): PeriodSummary {
  const totalBuyValue = periodData.buyers.reduce((sum, b) => sum + b.buyValue, 0);
  const totalSellValue = periodData.sellers.reduce((sum, b) => sum + b.sellValue, 0);
  const netFlow = totalBuyValue - totalSellValue;
  const totalValue = totalBuyValue + totalSellValue;

  const buyAvgPrice = periodData.buyers.length > 0
    ? periodData.buyers.reduce((sum, b) => sum + b.buyAvg * b.buyLot, 0) / periodData.buyers.reduce((sum, b) => sum + b.buyLot, 0)
    : 0;

  const sellAvgPrice = periodData.sellers.length > 0
    ? periodData.sellers.reduce((sum, b) => sum + b.sellAvg * b.sellLot, 0) / periodData.sellers.reduce((sum, b) => sum + b.sellLot, 0)
    : 0;

  const spread = sellAvgPrice - buyAvgPrice;

  const topBuyer = periodData.buyers.length > 0
    ? {
        broker: periodData.buyers[0].broker,
        value: periodData.buyers[0].buyValue,
        percentage: (periodData.buyers[0].buyValue / totalBuyValue) * 100,
      }
    : null;

  const topSeller = periodData.sellers.length > 0
    ? {
        broker: periodData.sellers[0].broker,
        value: periodData.sellers[0].sellValue,
        percentage: (periodData.sellers[0].sellValue / totalSellValue) * 100,
      }
    : null;

  // Calculate group nets
  let foreignNet = 0;
  let domesticNet = 0;
  let bumNet = 0;

  [...periodData.buyers, ...periodData.sellers].forEach(broker => {
    const group = getBrokerGroupCode(broker.broker);
    const net = broker.buyValue - broker.sellValue;

    if (group === "Asing") foreignNet += net;
    if (group === "Lokal") domesticNet += net;
    if (group === "Pemerintah") bumNet += net;
  });

  return {
    netFlow,
    totalBuyValue,
    totalSellValue,
    totalValue,
    buyAvgPrice,
    sellAvgPrice,
    spread,
    activeBuyers: periodData.buyers.length,
    activeSellers: periodData.sellers.length,
    topBuyer,
    topSeller,
    foreignNet,
    domesticNet,
    bumNet,
    phase: netFlow >= 0 ? "accumulation" : "distribution",
  };
}

// Calculate executive summary
function calculateExecutiveSummary(periodsData: PeriodData[]): ExecutiveSummaryData {
  const periodSummaries = periodsData.map(p => calculatePeriodSummary(p));

  // Total metrics
  const totalNetFlow = periodSummaries.reduce((sum, s) => sum + s.netFlow, 0);
  const accumulationPeriods = periodSummaries.filter(s => s.phase === "accumulation").length;
  const distributionPeriods = periodSummaries.filter(s => s.phase === "distribution").length;

  // Trend pattern
  let trendPattern = "Mixed";
  if (accumulationPeriods >= 5) trendPattern = "Strong Accumulation";
  else if (accumulationPeriods >= 4) trendPattern = "Moderate Accumulation";
  else if (distributionPeriods >= 5) trendPattern = "Strong Distribution";
  else if (distributionPeriods >= 4) trendPattern = "Moderate Distribution";

  // Most consistent buyers/sellers
  const buyerAppearance = new Map<string, string[]>();
  const sellerAppearance = new Map<string, string[]>();

  periodsData.forEach(period => {
    period.buyers.forEach(b => {
      if (!buyerAppearance.has(b.broker)) buyerAppearance.set(b.broker, []);
      buyerAppearance.get(b.broker)!.push(period.periodLabel);
    });

    period.sellers.forEach(s => {
      if (!sellerAppearance.has(s.broker)) sellerAppearance.set(s.broker, []);
      sellerAppearance.get(s.broker)!.push(period.periodLabel);
    });
  });

  const mostConsistentBuyers = Array.from(buyerAppearance.entries())
    .filter(([_, periods]) => periods.length >= 3)
    .map(([broker, periods]) => ({ broker, count: periods.length, periods }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  const mostConsistentSellers = Array.from(sellerAppearance.entries())
    .filter(([_, periods]) => periods.length >= 3)
    .map(([broker, periods]) => ({ broker, count: periods.length, periods }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Position switchers
  const positionSwitchers: Array<{ broker: string; pattern: string; periods: string[] }> = [];

  const brokerPositions = new Map<string, string[]>();

  periodsData.forEach(period => {
    const buyers = new Set(period.buyers.map(b => b.broker));
    const sellers = new Set(period.sellers.map(s => s.broker));

    Array.from(buyers).concat(Array.from(sellers)).forEach(broker => {
      if (!brokerPositions.has(broker)) brokerPositions.set(broker, []);

      if (buyers.has(broker) && sellers.has(broker)) {
        brokerPositions.get(broker)!.push("BOTH");
      } else if (buyers.has(broker)) {
        brokerPositions.get(broker)!.push("BUY");
      } else if (sellers.has(broker)) {
        brokerPositions.get(broker)!.push("SELL");
      }
    });
  });

  brokerPositions.forEach((positions, broker) => {
    if (positions.length >= 3) {
      const positionString = positions.join(" → ");
      positionSwitchers.push({
        broker,
        pattern: positionString,
        periods: periodsData.map(p => p.periodLabel).slice(0, positions.length),
      });
    }
  });

  positionSwitchers.sort((a, b) => b.periods.length - a.periods.length);

  // Group trends
  const foreignTrend = periodsData.map((p, i) => ({
    period: p.periodLabel,
    netFlow: periodSummaries[i].foreignNet,
  }));

  const domesticTrend = periodsData.map((p, i) => ({
    period: p.periodLabel,
    netFlow: periodSummaries[i].domesticNet,
  }));

  const bumTrend = periodsData.map((p, i) => ({
    period: p.periodLabel,
    netFlow: periodSummaries[i].bumNet,
  }));

  // Average price range
  const avgPrices = periodSummaries.map(s => s.buyAvgPrice || s.sellAvgPrice).filter(p => p > 0);
  const minPrice = Math.min(...avgPrices);
  const maxPrice = Math.max(...avgPrices);
  const priceChange = maxPrice - minPrice;
  const changePercent = minPrice > 0 ? ((priceChange / minPrice) * 100) : 0;

  // Group domination per period
  const groupDomination = periodsData.map((p, i) => {
    const summary = periodSummaries[i];
    let dominant = "Balanced";

    const maxNet = Math.max(
      Math.abs(summary.foreignNet),
      Math.abs(summary.domesticNet),
      Math.abs(summary.bumNet)
    );

    if (Math.abs(summary.foreignNet) === maxNet && maxNet > 0) {
      dominant = "Foreign";
    } else if (Math.abs(summary.domesticNet) === maxNet && maxNet > 0) {
      dominant = "Domestic";
    } else if (Math.abs(summary.bumNet) === maxNet && maxNet > 0) {
      dominant = "BUMN";
    }

    return { period: p.periodLabel, dominant };
  });

  return {
    totalNetFlow,
    accumulationPeriods,
    distributionPeriods,
    trendPattern,
    mostConsistentBuyers,
    mostConsistentSellers,
    positionSwitchers: positionSwitchers.slice(0, 15),
    foreignTrend,
    domesticTrend,
    bumTrend,
    avgPriceRange: { min: minPrice, max: maxPrice, change: priceChange, changePercent },
    groupDomination,
  };
}

// Collapsible Section Component
function CollapsibleSection({
  title,
  badge,
  children,
  defaultOpen = false,
}: {
  title: string;
  badge?: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-default-200 rounded-lg overflow-hidden">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full px-3 py-2 bg-default-50 hover:bg-default-100 transition-colors flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-default-700">{title}</span>
          {badge && (
            <Chip size="sm" variant="flat" color="primary" className="text-[9px] h-4">
              {badge}
            </Chip>
          )}
        </div>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <span className="text-default-500">▼</span>
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-3 bg-content1">
              {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Executive Summary Component
function ExecutiveSummaryComponent({ data }: { data: ExecutiveSummaryData }) {
  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) return `${(absValue / 1000000000).toFixed(1)}B`;
    if (absValue >= 1000000) return `${(absValue / 1000000).toFixed(1)}M`;
    return `${(absValue / 1000).toFixed(1)}K`;
  };

  const formatPrice = (value: number) => {
    return Math.floor(value).toFixed(0);
  };

  return (
    <Card className="w-full">
      <CardBody className="p-0">
        <div className="bg-primary/10 px-4 py-3 border-b border-primary/30">
          <h2 className="text-sm font-bold text-primary">Executive Summary</h2>
        </div>

        <div className="p-4 space-y-4">
          {/* 6-Column Layout - All Metrics in 1 Row */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2">
            {/* Pattern */}
            <div className="bg-default-100 p-2.5 rounded">
              <p className="text-[8px] text-default-500 mb-0.5">Pattern</p>
              <p className="text-xs font-bold">{data.trendPattern}</p>
            </div>

            {/* Total Net Flow */}
            <div className="bg-default-100 p-2.5 rounded">
              <p className="text-[8px] text-default-500 mb-0.5">Total Net Flow</p>
              <p className={`text-xs font-bold ${data.totalNetFlow >= 0 ? 'text-success' : 'text-danger'}`}>
                {data.totalNetFlow >= 0 ? '+' : ''}{formatCurrency(data.totalNetFlow)}
              </p>
            </div>

            {/* Accumulation */}
            <div className="bg-success/10 p-2.5 rounded border border-success/30">
              <p className="text-[8px] text-success mb-0.5">Accumulation</p>
              <p className="text-lg font-bold text-success">{data.accumulationPeriods}/6</p>
            </div>

            {/* Distribution */}
            <div className="bg-danger/10 p-2.5 rounded border border-danger/30">
              <p className="text-[8px] text-danger mb-0.5">Distribution</p>
              <p className="text-lg font-bold text-danger">{data.distributionPeriods}/6</p>
            </div>

            {/* Price Range */}
            <div className="bg-default-100 p-2.5 rounded">
              <p className="text-[8px] text-default-500 mb-0.5">Price Range</p>
              <p className="text-xs font-bold">
                {formatPrice(data.avgPriceRange.min)} → {formatPrice(data.avgPriceRange.max)}
              </p>
            </div>

            {/* Price Change */}
            <div className="bg-default-100 p-2.5 rounded">
              <p className="text-[8px] text-default-500 mb-0.5">Price Change</p>
              <p className={`text-xs font-bold ${data.avgPriceRange.change >= 0 ? 'text-success' : 'text-danger'}`}>
                {data.avgPriceRange.change >= 0 ? '+' : ''}{formatPrice(data.avgPriceRange.change)}
                <span className="text-[9px] ml-0.5">({data.avgPriceRange.changePercent.toFixed(1)}%)</span>
              </p>
            </div>
          </div>

          {/* 4-Column Layout - Broker Analysis (Merged) */}
          <div>
            <h3 className="text-xs font-semibold text-default-700 mb-2">Broker Analysis</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {/* Consistent Buyers */}
              <div className="bg-default-100 rounded p-2">
                <p className="text-[9px] font-bold text-success mb-1.5">Consistent Buyers</p>
                <div className="flex flex-wrap gap-1">
                  {data.mostConsistentBuyers.length > 0 ? (
                    data.mostConsistentBuyers.map((item, i) => {
                      const brokerGroup = getBrokerGroupCode(item.broker);
                      return (
                        <Chip
                          key={i}
                          size="sm"
                          variant="flat"
                          color={getBrokerGroupColor(brokerGroup)}
                          className="text-[11px] h-6 px-2 font-black"
                        >
                          {item.broker} {item.count}x
                        </Chip>
                      );
                    })
                  ) : (
                    <p className="text-[9px] text-default-500">-</p>
                  )}
                </div>
              </div>

              {/* Consistent Sellers */}
              <div className="bg-default-100 rounded p-2">
                <p className="text-[9px] font-bold text-danger mb-1.5">Consistent Sellers</p>
                <div className="flex flex-wrap gap-1">
                  {data.mostConsistentSellers.length > 0 ? (
                    data.mostConsistentSellers.map((item, i) => {
                      const brokerGroup = getBrokerGroupCode(item.broker);
                      return (
                        <Chip
                          key={i}
                          size="sm"
                          variant="flat"
                          color={getBrokerGroupColor(brokerGroup)}
                          className="text-[11px] h-6 px-2 font-black"
                        >
                          {item.broker} {item.count}x
                        </Chip>
                      );
                    })
                  ) : (
                    <p className="text-[9px] text-default-500">-</p>
                  )}
                </div>
              </div>

              {/* Position Switchers - Part 1 */}
              <div className="bg-default-100 rounded p-2">
                <p className="text-[9px] font-bold text-default-700 mb-1.5">Position Switchers</p>
                <div className="space-y-1">
                  {data.positionSwitchers.length > 0 ? (
                    data.positionSwitchers.slice(0, 4).map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={`font-bold text-[9px] ${getBrokerGroupTextColor(getBrokerGroupCode(item.broker))}`}>
                            {item.broker}
                          </span>
                        </div>
                        <p className="text-[8px] font-mono leading-tight">
                          {item.pattern.split(' → ').map((part, idx, arr) => (
                            <span key={idx} className={
                              part === 'BUY' ? 'text-success font-bold' :
                              part === 'SELL' ? 'text-danger font-bold' :
                              'text-default-600'
                            }>
                              {part}{idx < arr.length - 1 ? ' → ' : ''}
                            </span>
                          ))}
                        </p>
                      </div>
                    ))
                  ) : (
                    <p className="text-[9px] text-default-500 text-center py-1">-</p>
                  )}
                </div>
              </div>

              {/* Position Switchers - Part 2 */}
              <div className="bg-default-100 rounded p-2">
                <p className="text-[9px] font-bold text-default-700 mb-1.5">More Switchers</p>
                <div className="space-y-1">
                  {data.positionSwitchers.length > 4 ? (
                    data.positionSwitchers.slice(4, 8).map((item, i) => (
                      <div key={i}>
                        <div className="flex items-center gap-1 mb-0.5">
                          <span className={`font-bold text-[9px] ${getBrokerGroupTextColor(getBrokerGroupCode(item.broker))}`}>
                            {item.broker}
                          </span>
                        </div>
                        <p className="text-[8px] font-mono leading-tight">
                          {item.pattern.split(' → ').map((part, idx, arr) => (
                            <span key={idx} className={
                              part === 'BUY' ? 'text-success font-bold' :
                              part === 'SELL' ? 'text-danger font-bold' :
                              'text-default-600'
                            }>
                              {part}{idx < arr.length - 1 ? ' → ' : ''}
                            </span>
                          ))}
                        </p>
                      </div>
                    ))
                  ) : data.positionSwitchers.length > 0 ? (
                    <p className="text-[9px] text-default-500 text-center py-1">No more</p>
                  ) : (
                    <p className="text-[9px] text-default-500 text-center py-1">-</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Broker Summary Table Component
function BrokerSummaryTable({
  periodData,
  index
}: {
  periodData: PeriodData;
  index: number;
}) {
  const summary = useMemo(() => calculatePeriodSummary(periodData), [periodData]);

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    const sign = value >= 0 ? '' : '-';

    if (absValue >= 1000000000) return `${sign}${(absValue / 1000000000).toFixed(1)}B`;
    if (absValue >= 1000000) return `${sign}${(absValue / 1000000).toFixed(1)}M`;
    return `${sign}${(absValue / 1000).toFixed(1)}K`;
  };

  const formatLot = (value: number) => {
    if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
    return value.toString();
  };

  const formatPrice = (value: number) => {
    return Math.floor(value).toFixed(0);
  };

  return (
    <Card className="w-full">
      <CardBody className="p-0">
        {/* Period Header */}
        <div className="bg-default-100 px-3 py-2 border-b border-default-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-bold text-default-700">
                {periodData.periodLabel}
              </h3>
              <p className="text-[10px] text-default-500">
                {formatDate(periodData.startDate)} - {formatDate(periodData.endDate)}
              </p>
            </div>
            <Chip
              size="sm"
              variant="flat"
              color={summary.phase === "accumulation" ? "success" : "danger"}
              className="text-[10px] font-semibold"
            >
              {summary.phase.toUpperCase()}
            </Chip>
          </div>
        </div>

        {/* Per Period Summary - Visual Hierarchy */}
        <div className="border-b border-default-200 bg-default-50/50 px-3 py-2 space-y-2">
          {/* Primary Metrics - Net Flow */}
          <div className="flex items-center justify-between">
            <span className="text-[10px] text-default-500 font-medium">Net Flow</span>
            <span className={`text-sm font-bold ${summary.netFlow >= 0 ? 'text-success' : 'text-danger'}`}>
              {summary.netFlow >= 0 ? '+' : ''}{formatCurrency(summary.netFlow)}
            </span>
          </div>

          {/* Secondary Metrics - Buy/Sell Values */}
          <div className="grid grid-cols-2 gap-2">
            <div className="bg-success/5 border border-success/20 rounded px-2 py-1">
              <p className="text-[9px] text-success mb-0.5">Total Buy</p>
              <p className="text-xs font-bold text-success">{formatCurrency(summary.totalBuyValue)}</p>
            </div>
            <div className="bg-danger/5 border border-danger/20 rounded px-2 py-1">
              <p className="text-[9px] text-danger mb-0.5">Total Sell</p>
              <p className="text-xs font-bold text-danger">{formatCurrency(summary.totalSellValue)}</p>
            </div>
          </div>

          {/* Tertiary Metrics - Avg Prices & Activity */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center">
              <p className="text-[8px] text-default-500">Buy Avg</p>
              <p className="text-[10px] font-bold text-success">{formatPrice(summary.buyAvgPrice)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-default-500">Sell Avg</p>
              <p className="text-[10px] font-bold text-danger">{formatPrice(summary.sellAvgPrice)}</p>
            </div>
            <div className="text-center">
              <p className="text-[8px] text-default-500">Activity</p>
              <p className="text-[10px] font-bold">{summary.activeBuyers}B/{summary.activeSellers}S</p>
            </div>
          </div>

          {/* Top Players - Separate Row */}
          {(summary.topBuyer || summary.topSeller) && (
            <div className="pt-1 border-t border-default-200/60 grid grid-cols-2 gap-2">
              {summary.topBuyer && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-success font-semibold uppercase">Buy</span>
                  <span className={`text-[10px] font-bold ${getBrokerGroupTextColor(getBrokerGroupCode(summary.topBuyer.broker))}`}>
                    {summary.topBuyer.broker}
                  </span>
                  <span className="text-[9px] text-default-600">
                    {formatCurrency(summary.topBuyer.value)} ({summary.topBuyer.percentage.toFixed(0)}%)
                  </span>
                </div>
              )}
              {summary.topSeller && (
                <div className="flex items-center gap-1.5">
                  <span className="text-[8px] text-danger font-semibold uppercase">Sell</span>
                  <span className={`text-[10px] font-bold ${getBrokerGroupTextColor(getBrokerGroupCode(summary.topSeller.broker))}`}>
                    {summary.topSeller.broker}
                  </span>
                  <span className="text-[9px] text-default-600">
                    {formatCurrency(summary.topSeller.value)} ({summary.topSeller.percentage.toFixed(0)}%)
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 gap-0">
          {/* Buyers Table */}
          <div className="border-r border-default-200">
            <div className="bg-success/10 px-3 py-2 border-b border-success/30">
              <h3 className="text-xs font-bold text-success">BUYERS</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-default-50">
                  <tr className="border-b border-default-200">
                    <th className="px-2 py-1.5 text-left font-semibold text-default-700">Broker</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-success">Value</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-success">Lot</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-success">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {periodData.buyers.map((broker, idx) => {
                    const brokerGroup = getBrokerGroupCode(broker.broker);
                    const groupTextColor = getBrokerGroupTextColor(brokerGroup);

                    return (
                      <tr
                        key={broker.broker}
                        className={`border-b border-default-100 hover:bg-default-50 transition-colors ${
                          idx % 2 === 0 ? "bg-default-100/30" : ""
                        }`}
                      >
                        <td className="px-2 py-1.5">
                          <span className={`font-bold ${groupTextColor} text-[10px]`}>
                            {broker.broker}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right text-success text-[10px]">
                          {formatCurrency(broker.buyValue)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-success text-[10px]">
                          {formatLot(broker.buyLot)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-success text-[10px]">
                          {formatPrice(broker.buyAvg)}
                        </td>
                      </tr>
                    );
                  })}
                  {periodData.buyers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-3 text-center text-default-500 text-[10px]">
                        No buyers
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Sellers Table */}
          <div>
            <div className="bg-danger/10 px-3 py-2 border-b border-danger/30">
              <h3 className="text-xs font-bold text-danger">SELLERS</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-[10px]">
                <thead className="sticky top-0 bg-default-50">
                  <tr className="border-b border-default-200">
                    <th className="px-2 py-1.5 text-left font-semibold text-default-700">Broker</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-danger">Value</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-danger">Lot</th>
                    <th className="px-2 py-1.5 text-right font-semibold text-danger">Avg</th>
                  </tr>
                </thead>
                <tbody>
                  {periodData.sellers.map((broker, idx) => {
                    const brokerGroup = getBrokerGroupCode(broker.broker);
                    const groupTextColor = getBrokerGroupTextColor(brokerGroup);

                    return (
                      <tr
                        key={broker.broker}
                        className={`border-b border-default-100 hover:bg-default-50 transition-colors ${
                          idx % 2 === 0 ? "bg-default-100/30" : ""
                        }`}
                      >
                        <td className="px-2 py-1.5">
                          <span className={`font-bold ${groupTextColor} text-[10px]`}>
                            {broker.broker}
                          </span>
                        </td>
                        <td className="px-2 py-1.5 text-right text-danger text-[10px]">
                          {formatCurrency(broker.sellValue)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-danger text-[10px]">
                          {formatLot(broker.sellLot)}
                        </td>
                        <td className="px-2 py-1.5 text-right text-danger text-[10px]">
                          {formatPrice(broker.sellAvg)}
                        </td>
                      </tr>
                    );
                  })}
                  {periodData.sellers.length === 0 && (
                    <tr>
                      <td colSpan={4} className="px-2 py-3 text-center text-default-500 text-[10px]">
                        No sellers
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

// Input Section component
function InputSection({
  onSubmit,
  isAnalyzing
}: {
  onSubmit: (data: {
    stockCode: string;
    startDate: string;
    endDate: string;
    periodPreset: string;
  }) => void;
  isAnalyzing: boolean;
}) {
  // Analytics hooks
  const {
    trackBigBroksumPresetSelected,
    trackBigBroksumCustomDateChanged,
    trackBigBroksumStockCodeEntered,
    trackBigBroksumHistoryRestored,
  } = useAnalytics();

  // Helper to get stored value from localStorage
  const getStoredValue = (key: string, defaultValue: string): string => {
    if (typeof window === 'undefined') return defaultValue;
    try {
      const item = localStorage.getItem(key);
      return item ? JSON.parse(item) : defaultValue;
    } catch (error) {
      return defaultValue;
    }
  };

  const initialStockCode = getStoredValue('bigbroksum_stockCode', 'FORE');
  const initialStartDate = getStoredValue('bigbroksum_startDate', getDateByPreset('6months'));

  const [stockCode, setStockCode] = useState(initialStockCode);
  const [startDate, setStartDate] = useState(initialStartDate);
  const [endDate, setEndDate] = useState(getTodayDate());
  const [selectedPreset, setSelectedPreset] = useState<string>("6months");
  const [isCustomRange, setIsCustomRange] = useState(false);
  const [hasRestoredHistory, setHasRestoredHistory] = useState(false);

  // Track history restoration on mount
  useEffect(() => {
    if (initialStockCode !== 'FORE' || initialStartDate !== getDateByPreset('6months')) {
      trackBigBroksumHistoryRestored(initialStockCode, initialStartDate);
      setHasRestoredHistory(true);
    }
  }, []);

  const handlePresetClick = (preset: string) => {
    const previousPreset = selectedPreset;
    setSelectedPreset(preset);
    setIsCustomRange(false);
    const newStartDate = getDateByPreset(preset);
    setStartDate(newStartDate);
    setEndDate(getTodayDate());

    // Track preset selection
    trackBigBroksumPresetSelected(
      preset as "1week" | "3months" | "6months" | "12months",
      previousPreset || undefined
    );
  };

  const handleSubmit = () => {
    if (!stockCode || !startDate || !endDate) {
      addToast({
        title: "Validation Error",
        description: "Please fill in all fields",
        color: "warning",
      });
      return;
    }

    // Track stock code entry
    trackBigBroksumStockCodeEntered(
      stockCode.toUpperCase(),
      hasRestoredHistory ? 'from_history' : 'manual_input'
    );

    onSubmit({
      stockCode: stockCode.toUpperCase(),
      startDate,
      endDate,
      periodPreset: isCustomRange ? 'custom' : selectedPreset
    });
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleSubmit();
    }
  };

  return (
    <Card className="w-full">
      <CardBody>
        <h2 className="text-lg font-bold mb-3">Big Broksum Analyzer 🤘</h2>
        <p className="text-xs text-default-500 mb-4">
          Compare broker buy/sell positions across 6 time periods to detect position changes
        </p>

        <div className="space-y-3">
          {/* Stock Code Input */}
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

          {/* Date Range Inputs */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs font-medium text-default-700 mb-1.5">
                Start Date
              </label>
              <Input
                type="date"
                value={startDate}
                onValueChange={(value) => {
                  setStartDate(value);
                  setIsCustomRange(true);
                  setSelectedPreset("");

                  // Track custom date change
                  const daysSpan = endDate ? Math.ceil((new Date(endDate).getTime() - new Date(value).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  trackBigBroksumCustomDateChanged('start_date', value, daysSpan);
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
                  setEndDate(value);
                  setIsCustomRange(true);
                  setSelectedPreset("");

                  // Track custom date change
                  const daysSpan = startDate ? Math.ceil((new Date(value).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24)) : 0;
                  trackBigBroksumCustomDateChanged('end_date', value, daysSpan);
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
                { key: '3months', label: '3 Months' },
                { key: '6months', label: '6 Months' },
                { key: '12months', label: '12 Months' },
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
            </div>
          </div>

          {/* Period Info */}
          <div className="bg-default-100 p-2 rounded-lg">
            <p className="text-[10px] text-default-600">
              <span className="font-semibold">Period Division:</span> The selected range will be divided into 6 equal periods.
              {selectedPreset === '12months' && " Each period = 2 months"}
              {selectedPreset === '6months' && " Each period = 1 month"}
              {selectedPreset === '3months' && " Each period = ~2 weeks"}
              {selectedPreset === '1week' && " Each period = ~1 day"}
            </p>
          </div>

          <Button
            color="primary"
            size="md"
            className="w-full font-semibold mt-2"
            onPress={handleSubmit}
            isDisabled={isAnalyzing}
          >
            {isAnalyzing ? (
              <>
                <Spinner size="sm" color="current" />
                <span>Analyzing...</span>
              </>
            ) : (
              <>
                <span>Analyze</span>
                <kbd className="ml-2 px-2 py-0.5 text-xs font-semibold text-default-foreground bg-default-100 opacity-35 border border-default-300 rounded-md">
                  ↵ Enter
                </kbd>
              </>
            )}
          </Button>
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
  const containerId = "bigbroksum-tradingview-widget-container";

  // Load TradingView script only once
  useEffect(() => {
    if (!scriptLoaded.current) {
      const script = document.createElement('script');
      script.src = 'https://s3.tradingview.com/tv.js';
      script.async = true;
      script.id = 'bigbroksum-tradingview-widget-script';
      script.onload = () => {
        scriptLoaded.current = true;
      };
      document.head.appendChild(script);
    }
  }, []);

  // Create widget when modal opens
  useEffect(() => {
    if (isOpen && symbol && widgetRef.current) {
      const waitForScript = () => {
        if (scriptLoaded.current && widgetRef.current) {
          // Always recreate widget when modal opens
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
            container_id: containerId,
            studies: [
              "MASimple@tv-basicstudies",
              "MACD@tv-basicstudies"
            ]
          });
          widgetCreated.current = true;
        } else {
          setTimeout(waitForScript, 100);
        }
      };

      waitForScript();
    }

    // Cleanup widget when modal closes
    return () => {
      if (widgetRef.current) {
        widgetRef.current.innerHTML = '';
        widgetCreated.current = false;
      }
    };
  }, [isOpen, symbol, containerId]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[10000] flex items-center justify-center p-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="relative w-full max-w-6xl h-[80vh] flex flex-col"
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
                  id={containerId}
                  ref={widgetRef}
                  className="w-full h-full rounded-lg overflow-hidden"
                />
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
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

// Main page component
function BigBroksumPage({ shareSlug }: { shareSlug?: string }) {
  const router = useRouter();

  // Track page view
  useTrackPageView({
    pageTitle: 'Big Broksum',
    additionalParams: {
      pageType: 'big_broksum',
    },
  });

  // Analytics hooks
  const {
    trackBigBroksumAnalysisInitiated,
    trackBigBroksumAnalysisCompleted,
    trackBigBroksumAnalysisFailed,
    trackBigBroksumSummaryViewed,
    trackBigBroksumPositionSwitchersDetected,
    trackBigBroksumConsistentTradersViewed,
    trackBigBroksumNewAnalysis,
    trackBigBroksumApiBatchCompleted,
    trackApiCallPerformance,
    trackChartToggled,
  } = useAnalytics();

  const [periodsData, setPeriodsData] = useState<PeriodData[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [stockCode, setStockCode] = useState<string>("");
  const [dateRange, setDateRange] = useState<{ startDate: string; endDate: string } | null>(null);
  const [analysisStartTime, setAnalysisStartTime] = useState<number>(0);
  const [analysesInSession, setAnalysesInSession] = useState<number>(0);

  // TradingView Chart States
  const [isChartModalOpen, setIsChartModalOpen] = useState(false);
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);

  const handleAnalyze = async (data: {
    stockCode: string;
    startDate: string;
    endDate: string;
    periodPreset: string;
  }) => {
    setIsLoading(true);
    setStockCode(data.stockCode);
    setDateRange({ startDate: data.startDate, endDate: data.endDate });
    const startTime = Date.now();
    setAnalysisStartTime(startTime);

    // Track analysis initiated
    trackBigBroksumAnalysisInitiated(
      data.stockCode,
      data.periodPreset,
      data.startDate,
      data.endDate
    );

    try {
      // Divide the period into 6 sub-periods
      const periods = dividePeriodInto6(data.startDate, data.endDate);

      let apiCallStart = Date.now();
      let successCount = 0;
      let failCount = 0;

      // Fetch data for all periods in parallel
      const results = await Promise.all(
        periods.map(async (period) => {
          const callStart = Date.now();
          try {
            const summary = await fetchBrokerSummary(data.stockCode, period.startDate, period.endDate);
            const callDuration = Date.now() - callStart;

            // Track individual API call performance
            trackApiCallPerformance(
              '/api/v1/emiten-broker-summary',
              'GET',
              callDuration,
              true,
              200
            );
            successCount++;

            return {
              periodLabel: period.label,
              startDate: period.startDate,
              endDate: period.endDate,
              buyers: summary.buyers,
              sellers: summary.sellers,
            };
          } catch (error) {
            const callDuration = Date.now() - callStart;
            failCount++;

            // Track failed API call
            trackApiCallPerformance(
              '/api/v1/emiten-broker-summary',
              'GET',
              callDuration,
              false
            );

            console.error(`Failed to fetch data for ${period.label}:`, error);
            return {
              periodLabel: period.label,
              startDate: period.startDate,
              endDate: period.endDate,
              buyers: [],
              sellers: [],
            };
          }
        })
      );

      const totalDuration = Date.now() - apiCallStart;

      // Track API batch completed
      trackBigBroksumApiBatchCompleted(
        data.stockCode,
        totalDuration,
        successCount,
        failCount
      );

      // Save to localStorage for next time
      if (typeof window !== 'undefined') {
        try {
          localStorage.setItem('bigbroksum_stockCode', JSON.stringify(data.stockCode));
          localStorage.setItem('bigbroksum_startDate', JSON.stringify(data.startDate));
        } catch (error) {
          console.error('Failed to save to localStorage:', error);
        }
      }

      // Track analysis completed
      trackBigBroksumAnalysisCompleted(
        data.stockCode,
        Date.now() - startTime,
        successCount,
        data.periodPreset
      );

      setPeriodsData(results);
      setAnalysesInSession(prev => prev + 1);

      // Set chart symbol for TradingView
      setChartSymbol(data.stockCode.toUpperCase());
    } catch (error) {
      // Track analysis failed
      trackBigBroksumAnalysisFailed(
        data.stockCode,
        'unknown',
        error instanceof Error ? error.message : 'Unknown error',
        Date.now() - startTime
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

  // Track results viewing when periodsData changes
  useEffect(() => {
    if (periodsData.length > 0) {
      const summary = calculateExecutiveSummary(periodsData);

      // Track summary viewed
      trackBigBroksumSummaryViewed(
        stockCode,
        summary.trendPattern,
        summary.accumulationPeriods,
        summary.distributionPeriods
      );

      // Track position switchers detected
      if (summary.positionSwitchers.length > 0) {
        trackBigBroksumPositionSwitchersDetected(
          stockCode,
          summary.positionSwitchers.length,
          summary.positionSwitchers[0]?.broker
        );
      }

      // Track consistent traders viewed
      trackBigBroksumConsistentTradersViewed(
        stockCode,
        summary.mostConsistentBuyers.length,
        summary.mostConsistentSellers.length
      );
    }
  }, [periodsData]); // Only depend on periodsData

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

  return (
    <div className="w-full h-full">
      <div className="w-full max-w-7xl mx-auto">
        {!periodsData.length && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full max-w-2xl mx-auto"
          >
            <InputSection onSubmit={handleAnalyze} isAnalyzing={false} />
          </motion.div>
        )}

        {isLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex flex-col items-center justify-center py-20"
          >
            <Spinner size="lg" color="primary" />
            <p className="text-sm text-default-500 mt-4">Analyzing broker movements across 6 periods...</p>
          </motion.div>
        )}

        {periodsData.length > 0 && !isLoading && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-4"
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-2xl font-bold">
                  Big Broksum - {stockCode}
                </h1>
                <p className="text-sm text-default-500">
                  {dateRange && `${formatDate(dateRange.startDate)} - ${formatDate(dateRange.endDate)}`}
                </p>
              </div>
              <Button
                size="sm"
                variant="flat"
                onPress={() => {
                  // Track new analysis button
                  trackBigBroksumNewAnalysis(stockCode, analysesInSession);

                  setPeriodsData([]);
                  setStockCode("");
                  setDateRange(null);
                  setChartSymbol(null);
                }}
              >
                New Analysis
              </Button>
            </div>

            {/* Executive Summary */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <ExecutiveSummaryComponent data={calculateExecutiveSummary(periodsData)} />
            </motion.div>

            {/* 6 Broker Summary Tables */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {periodsData.map((periodData, index) => (
                <motion.div
                  key={periodData.periodLabel}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <BrokerSummaryTable periodData={periodData} index={index} />
                </motion.div>
              ))}
            </div>

            {/* Legend */}
            <Card className="bg-default-50">
              <CardBody className="py-3">
                <div className="flex items-center justify-center gap-6 text-[10px]">
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
              </CardBody>
            </Card>
          </motion.div>
        )}
      </div>

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

      {/* TradingView Chart Modal */}
      <TradingViewModal
        isOpen={isChartModalOpen}
        onClose={() => setIsChartModalOpen(false)}
        symbol={chartSymbol || ""}
      />
    </div>
  );
}

// Client component that receives shareSlug from server component
export default function BigBroksumClient({ shareSlug }: BigBroksumClientProps) {
  return <BigBroksumPage shareSlug={shareSlug} />;
}
