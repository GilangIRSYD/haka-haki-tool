"use client";

import { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";
import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { motion, AnimatePresence } from "framer-motion";
import { BROKERS } from "@/data/brokers";

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

interface AnalysisResult {
  phase: "accumulation" | "distribution";
  netBuy: number;
  netSell: number;
  totalValue: number;
  insight: string;
  brokerSummary: BrokerDailyData[];
  dailyData: DailyData[];
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

// Mock analysis function
function analyzeData(
  brokers: string[],
  stockCode: string,
  startDate: string,
  endDate: string
): AnalysisResult {
  const dailyData: DailyData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let totalBuy = 0;
  let totalSell = 0;

  const brokerSummary: BrokerDailyData[] = brokers.map((broker) => ({
    broker,
    buyValue: 0,
    buyLot: 0,
    buyAvg: 0,
    sellValue: 0,
    sellLot: 0,
    sellAvg: 0,
  }));

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    const brokersData: BrokerDailyData[] = [];
    let dayNetLot = 0;
    let dayNetValue = 0;

    brokers.forEach((broker, idx) => {
      const isBuy = Math.random() > 0.45;
      const lot = Math.floor(Math.random() * 10000);
      const avgPrice = 50 + Math.random() * 100;

      if (isBuy) {
        const value = lot * avgPrice * 100;
        totalBuy += value;
        dayNetLot += lot;
        dayNetValue += value;
        brokerSummary[idx].buyValue += value;
        brokerSummary[idx].buyLot += lot;

        brokersData.push({
          broker,
          buyValue: value,
          buyLot: lot,
          buyAvg: avgPrice,
          sellValue: 0,
          sellLot: 0,
          sellAvg: 0,
        });
      } else {
        const value = lot * avgPrice * 100;
        totalSell += value;
        dayNetLot -= lot;
        dayNetValue -= value;
        brokerSummary[idx].sellValue += value;
        brokerSummary[idx].sellLot += lot;

        brokersData.push({
          broker,
          buyValue: 0,
          buyLot: 0,
          buyAvg: 0,
          sellValue: value,
          sellLot: lot,
          sellAvg: avgPrice,
        });
      }
    });

    const closingPrice = 50 + Math.random() * 100;
    const previousPrice = dailyData.length > 0 ? dailyData[dailyData.length - 1].closingPrice : closingPrice;
    const priceChange = closingPrice - previousPrice;
    const priceChangePercent = (priceChange / previousPrice) * 100;

    dailyData.push({
      date: d.toISOString().split("T")[0],
      netLot: dayNetLot,
      netValue: dayNetValue,
      closingPrice,
      priceChange,
      priceChangePercent,
      brokers: brokersData,
    });
  }

  brokerSummary.forEach((b) => {
    b.buyAvg = b.buyLot > 0 ? b.buyValue / b.buyLot / 100 : 0;
    b.sellAvg = b.sellLot > 0 ? b.sellValue / b.sellLot / 100 : 0;
  });

  const netTotal = totalBuy - totalSell;
  const phase = netTotal > 0 ? "accumulation" : "distribution";

  return {
    phase,
    netBuy: totalBuy,
    netSell: totalSell,
    totalValue: netTotal,
    insight: `Dominant ${phase} by ${brokers[0]} and ${brokers[1]} during mid-month period`,
    brokerSummary,
    dailyData: dailyData.reverse(),
  };
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

  return (
    <div
      className="relative"
      onMouseEnter={() => setShowTooltip(true)}
      onMouseLeave={() => setShowTooltip(false)}
    >
      <div
        className={`aspect-square p-1.5 rounded-lg border ${bgColor} transition-all cursor-pointer hover:scale-105 hover:shadow-lg`}
      >
        <div className="text-[11px] font-bold text-default-600 mb-0.5">
          {day}
        </div>
        <div className="text-[10px] font-bold leading-tight">
          {formatLot(data.netLot)}
        </div>
        <div className="text-[9px] text-default-500 leading-tight">
          {formatCurrency(data.netValue)}
        </div>
        <div className="text-[9px] text-default-400 leading-tight mt-0.5 flex items-center gap-1">
          <span>@{data.closingPrice.toFixed(0)}</span>
          <span className={`font-bold ${priceColor} text-[8px]`}>
            {formatPercent(data.priceChangePercent)}
          </span>
        </div>
      </div>

      {showTooltip && (
        <motion.div
          initial={{ opacity: 0, y: 10, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 10, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute z-50 w-56 bg-content1 border border-default-200 rounded-lg shadow-xl p-3 top-full left-1/2 -translate-x-1/2 mt-2"
        >
          <div className="text-xs font-semibold mb-2 text-foreground">
            {data.date}
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
    return value.toFixed(0);
  };

  return (
    <>
    <Card className="w-full">
      <CardBody className="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="border-b border-default-200 bg-default-50">
                <th className="px-2 py-2 text-left font-semibold text-default-700">BY</th>
                <th className="px-2 py-2 text-right font-semibold text-success">B.Val</th>
                <th className="px-2 py-2 text-right font-semibold text-success">B.Lot</th>
                <th className="px-2 py-2 text-right font-semibold text-success">B.Avg</th>
                <th className="px-2 py-2 text-left font-semibold text-default-700">SL</th>
                <th className="px-2 py-2 text-right font-semibold text-danger">S.Val</th>
                <th className="px-2 py-2 text-right font-semibold text-danger">S.Lot</th>
                <th className="px-2 py-2 text-right font-semibold text-danger">S.Avg</th>
              </tr>
            </thead>
            <tbody>
              {brokerSummary.map((broker, idx) => {
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
                      {broker.buyValue > 0 ? (
                        <span className={`font-bold ${groupTextColor}`}>{broker.broker}</span>
                      ) : "-"}
                    </td>
                    <td className="px-2 py-2 text-right text-success">
                      {broker.buyValue > 0 ? formatCurrency(broker.buyValue) : "-"}
                    </td>
                    <td className="px-2 py-2 text-right text-success">
                      {broker.buyValue > 0 ? formatLot(broker.buyLot) : "-"}
                    </td>
                    <td className="px-2 py-2 text-right text-success">
                      {broker.buyValue > 0 ? formatPrice(broker.buyAvg) : "-"}
                    </td>
                    <td className="px-2 py-2">
                      {broker.sellValue > 0 ? (
                        <span className={`font-bold ${groupTextColor}`}>{broker.broker}</span>
                      ) : "-"}
                    </td>
                    <td className="px-2 py-2 text-right text-danger">
                      {broker.sellValue > 0 ? formatCurrency(broker.sellValue) : "-"}
                    </td>
                    <td className="px-2 py-2 text-right text-danger">
                      {broker.sellValue > 0 ? formatLot(broker.sellLot) : "-"}
                    </td>
                    <td className="px-2 py-2 text-right text-danger">
                      {broker.sellValue > 0 ? formatPrice(broker.sellAvg) : "-"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </CardBody>
    </Card>

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
function ExecutiveSummary({ result }: { result: AnalysisResult }) {
  const isAccumulation = result.phase === "accumulation";
  const netValue = Math.abs(result.totalValue);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) return `IDR ${(value / 1000000000).toFixed(2)}B`;
    if (value >= 1000000) return `IDR ${(value / 1000000).toFixed(2)}M`;
    return `IDR ${(value / 1000).toFixed(2)}K`;
  };

  return (
    <Card className="w-full">
      <CardBody className="gap-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold mb-1">Executive Summary</h2>
            <p className="text-default-500 text-xs">Broker Analysis Result</p>
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

        <div className="bg-default-100 p-2 rounded-lg">
          <p className="text-[11px] text-default-600">{result.insight}</p>
        </div>
      </CardBody>
    </Card>
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
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>(
    initialData?.brokers || ["AK", "YU"]
  );
  const [stockCode, setStockCode] = useState(initialData?.stockCode || "FORE");
  const [startDate, setStartDate] = useState(
    initialData?.startDate || "2025-11-01"
  );
  const [endDate, setEndDate] = useState(initialData?.endDate || "2025-12-30");

  const handleSubmit = () => {
    if (selectedBrokers.length === 0 || !stockCode || !startDate || !endDate) {
      alert("Please fill in all fields");
      return;
    }
    onSubmit({ brokers: selectedBrokers, stockCode, startDate, endDate });
  };

  return (
    <Card className="w-full">
      <CardBody>
        <h2 className="text-lg font-bold mb-3">Broker Accumulation Analyzer</h2>

        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-default-700 mb-1.5">
              Stock Code
            </label>
            <Input
              placeholder="e.g., FORE"
              value={stockCode}
              onValueChange={setStockCode}
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
                onValueChange={setStartDate}
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
                onValueChange={setEndDate}
                size="sm"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-default-700 mb-1.5">
              Select Brokers
            </label>
            <Autocomplete
              defaultItems={BROKERS.filter((b) => !selectedBrokers.includes(b.code))}
              placeholder="Type to search brokers..."
              size="sm"
              variant="bordered"
              onSelectionChange={(key) => {
                if (key && !selectedBrokers.includes(key as string)) {
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
                        setSelectedBrokers(selectedBrokers.filter((b) => b !== brokerCode));
                      }}
                    >
                      {broker.code} - {broker.name}
                    </Chip>
                  );
                })}
              </div>
            )}

            <p className="text-[10px] text-default-500 mt-1">
              {selectedBrokers.length > 0
                ? `${selectedBrokers.length} broker(s) selected: ${selectedBrokers.join(", ")}`
                : "No brokers selected"}
            </p>
          </div>

          <Button
            color="primary"
            size="md"
            className="w-full font-semibold mt-2"
            onPress={handleSubmit}
          >
            Analyze
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// Main page component
export default function AnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<{
    brokers: string[];
    stockCode: string;
    startDate: string;
    endDate: string;
  } | null>(null);

  const handleAnalyze = (data: {
    brokers: string[];
    stockCode: string;
    startDate: string;
    endDate: string;
  }) => {
    setFormData(data);
    setIsLoading(true);

    setTimeout(() => {
      const result = analyzeData(
        data.brokers,
        data.stockCode,
        data.startDate,
        data.endDate
      );
      setAnalysisResult(result);
      setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="w-full h-full">
      <div className="mb-6">
        <h1 className="text-3xl font-bold mb-2">
          IDX Broker Accumulation Analyzer
        </h1>
        <p className="text-default-500 text-sm">
          Analyze broker buying and selling patterns for Indonesian stocks
        </p>
      </div>

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
            className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]"
          >
            {/* Left Column - Control & Summary Panel */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: 0.1 }}
              className="lg:col-span-1 overflow-y-auto pr-2 space-y-4"
            >
              <InputSection onSubmit={handleAnalyze} initialData={formData || undefined} />
              <ExecutiveSummary result={analysisResult} />
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
    </div>
  );
}
