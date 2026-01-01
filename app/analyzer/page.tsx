"use client";

import { useState, useMemo } from "react";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Select, SelectItem } from "@heroui/select";
import { Card, CardBody } from "@heroui/card";
import { Chip } from "@heroui/chip";
import { Spinner } from "@heroui/spinner";

// Types
interface DailyData {
  date: string;
  netLot: number;
  netValue: number;
}

interface AnalysisResult {
  phase: "accumulation" | "distribution";
  netBuy: number;
  netSell: number;
  totalValue: number;
  insight: string;
  dailyData: DailyData[];
}

// Mock broker data
const BROKERS = [
  { key: "AK", label: "AK" },
  { key: "BK", label: "BK" },
  { key: "YU", label: "YU" },
  { key: "BB", label: "BB" },
  { key: "CC", label: "CC" },
  { key: "DD", label: "DD" },
  { key: "EP", label: "EP" },
  { key: "GA", label: "GA" },
  { key: "HD", label: "HD" },
  { key: "IE", label: "IE" },
];

// Mock analysis function
function analyzeData(
  brokers: string[],
  stockCode: string,
  startDate: string,
  endDate: string
): AnalysisResult {
  // Generate mock daily data
  const dailyData: DailyData[] = [];
  const start = new Date(startDate);
  const end = new Date(endDate);

  let totalBuy = 0;
  let totalSell = 0;

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;

    // Generate random net buy/sell
    const isBuy = Math.random() > 0.4;
    const netLot = Math.floor(Math.random() * 50000) - 20000;
    const netValue = netLot * 100000; // Assume avg price 100 per lot

    if (netLot > 0) {
      totalBuy += netValue;
    } else {
      totalSell += Math.abs(netValue);
    }

    dailyData.push({
      date: d.toISOString().split("T")[0],
      netLot,
      netValue,
    });
  }

  const netTotal = totalBuy - totalSell;
  const phase = netTotal > 0 ? "accumulation" : "distribution";

  return {
    phase,
    netBuy: totalBuy,
    netSell: totalSell,
    totalValue: netTotal,
    insight: `Brokers ${brokers.join(" & ")} show ${
      phase === "accumulation" ? "strong accumulation" : "distribution"
    } for ${stockCode} during the selected period.`,
    dailyData: dailyData.reverse(), // Latest first
  };
}

// Calendar component
function CalendarView({ dailyData }: { dailyData: DailyData[] }) {
  // Group data by month
  const monthlyData = useMemo(() => {
    const months: Record<string, DailyData[]> = {};
    dailyData.forEach((day) => {
      const monthKey = day.date.substring(0, 7); // YYYY-MM
      if (!months[monthKey]) {
        months[monthKey] = [];
      }
      months[monthKey].push(day);
    });
    return months;
  }, [dailyData]);

  const formatCurrency = (value: number) => {
    const absValue = Math.abs(value);
    if (absValue >= 1000000000) {
      return `${(absValue / 1000000000).toFixed(1)}B`;
    }
    if (absValue >= 1000000) {
      return `${(absValue / 1000000).toFixed(1)}M`;
    }
    return `${(absValue / 1000).toFixed(1)}K`;
  };

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

    // Create a map of date to data
    const dataMap = new Map<string, DailyData>();
    days.forEach((d) => {
      const dayNum = parseInt(d.date.split("-")[2]);
      dataMap.set(dayNum.toString(), d);
    });

    const cells = [];

    // Empty cells for days before the first day of month
    for (let i = 0; i < firstDay; i++) {
      cells.push(<div key={`empty-${i}`} className="aspect-square" />);
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const data = dataMap.get(day.toString());
      const dayOfWeek = new Date(
        date.getFullYear(),
        date.getMonth(),
        day
      ).getDay();

      // Skip weekends visually
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      if (isWeekend) {
        cells.push(
          <div
            key={day}
            className="aspect-square bg-default-100/50 rounded-lg"
          />
        );
      } else if (data) {
        const isBuy = data.netLot > 0;
        const bgColor = isBuy
          ? "bg-success/10 border-success/30 hover:bg-success/20"
          : "bg-danger/10 border-danger/30 hover:bg-danger/20";

        cells.push(
          <div
            key={day}
            className={`aspect-square p-1 rounded-lg border ${bgColor} transition-colors cursor-pointer`}
          >
            <div className="text-xs font-medium text-default-600 mb-0.5">
              {day}
            </div>
            <div className="text-xs font-bold">{data.netLot.toLocaleString()}</div>
            <div className="text-[10px] text-default-500">
              {formatCurrency(data.netValue)}
            </div>
          </div>
        );
      } else {
        cells.push(
          <div
            key={day}
            className="aspect-square bg-default-100/30 rounded-lg"
          />
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

// Executive Summary component
function ExecutiveSummary({ result }: { result: AnalysisResult }) {
  const isAccumulation = result.phase === "accumulation";
  const netValue = Math.abs(result.totalValue);

  const formatCurrency = (value: number) => {
    if (value >= 1000000000) {
      return `IDR ${(value / 1000000000).toFixed(2)}B`;
    }
    if (value >= 1000000) {
      return `IDR ${(value / 1000000).toFixed(2)}M`;
    }
    return `IDR ${(value / 1000).toFixed(2)}K`;
  };

  return (
    <Card className="w-full">
      <CardBody className="gap-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1">Executive Summary</h2>
            <p className="text-default-500 text-sm">Broker Analysis Result</p>
          </div>
          <Chip
            color={isAccumulation ? "success" : "danger"}
            variant="flat"
            size="lg"
            className="font-semibold"
          >
            {isAccumulation ? "ACCUMULATION" : "DISTRIBUTION"}
          </Chip>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div
            className={`p-4 rounded-lg ${
              isAccumulation
                ? "bg-success/10 border border-success/30"
                : "bg-default-100"
            }`}
          >
            <p className="text-sm text-default-500 mb-1">Net Buy</p>
            <p className="text-xl font-bold text-success">
              {formatCurrency(result.netBuy)}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg ${
              !isAccumulation
                ? "bg-danger/10 border border-danger/30"
                : "bg-default-100"
            }`}
          >
            <p className="text-sm text-default-500 mb-1">Net Sell</p>
            <p className="text-xl font-bold text-danger">
              {formatCurrency(result.netSell)}
            </p>
          </div>

          <div
            className={`p-4 rounded-lg ${
              isAccumulation
                ? "bg-success/10 border border-success/30"
                : "bg-danger/10 border border-danger/30"
            }`}
          >
            <p className="text-sm text-default-500 mb-1">Net Total</p>
            <p
              className={`text-xl font-bold ${
                isAccumulation ? "text-success" : "text-danger"
              }`}
            >
              {isAccumulation ? "+" : "-"}
              {formatCurrency(netValue)}
            </p>
          </div>
        </div>

        <div className="bg-default-100 p-4 rounded-lg">
          <p className="text-sm text-default-600">{result.insight}</p>
        </div>
      </CardBody>
    </Card>
  );
}

// Input Section component
function InputSection({
  onSubmit,
}: {
  onSubmit: (data: {
    brokers: string[];
    stockCode: string;
    startDate: string;
    endDate: string;
  }) => void;
}) {
  const [selectedBrokers, setSelectedBrokers] = useState<string[]>(["AK", "YU"]);
  const [stockCode, setStockCode] = useState("FORE");
  const [startDate, setStartDate] = useState("2025-11-01");
  const [endDate, setEndDate] = useState("2025-12-30");

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
        <h2 className="text-xl font-bold mb-4">Broker Accumulation Analyzer</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="lg:col-span-1">
            <label className="block text-sm font-medium text-default-700 mb-2">
              Stock Code
            </label>
            <Input
              placeholder="e.g., FORE"
              value={stockCode}
              onValueChange={setStockCode}
              classNames={{
                input: "uppercase",
              }}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-default-700 mb-2">
              Start Date
            </label>
            <Input
              type="date"
              value={startDate}
              onValueChange={setStartDate}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-default-700 mb-2">
              End Date
            </label>
            <Input
              type="date"
              value={endDate}
              onValueChange={setEndDate}
            />
          </div>

          <div className="flex items-end">
            <Button
              color="primary"
              size="lg"
              className="w-full font-semibold"
              onPress={handleSubmit}
            >
              Analyze
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <label className="block text-sm font-medium text-default-700 mb-2">
            Select Brokers
          </label>
          <div className="flex flex-wrap gap-2">
            {BROKERS.map((broker) => (
              <Chip
                key={broker.key}
                className="cursor-pointer"
                color={
                  selectedBrokers.includes(broker.key) ? "primary" : "default"
                }
                variant={selectedBrokers.includes(broker.key) ? "solid" : "bordered"}
                onClick={() => {
                  if (selectedBrokers.includes(broker.key)) {
                    setSelectedBrokers(
                      selectedBrokers.filter((b) => b !== broker.key)
                    );
                  } else {
                    setSelectedBrokers([...selectedBrokers, broker.key]);
                  }
                }}
              >
                {broker.label}
              </Chip>
            ))}
          </div>
          <p className="text-xs text-default-500 mt-2">
            {selectedBrokers.length > 0
              ? `${selectedBrokers.length} broker(s) selected`
              : "No brokers selected"}
          </p>
        </div>
      </CardBody>
    </Card>
  );
}

// Main page component
export default function AnalyzerPage() {
  const [analysisResult, setAnalysisResult] = useState<AnalysisResult | null>(
    null
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleAnalyze = (data: {
    brokers: string[];
    stockCode: string;
    startDate: string;
    endDate: string;
  }) => {
    setIsLoading(true);
    // Simulate API call
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
    <div className="w-full max-w-7xl mx-auto p-6 space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          IDX Broker Accumulation Analyzer
        </h1>
        <p className="text-default-500">
          Analyze broker buying and selling patterns for Indonesian stocks
        </p>
      </div>

      <InputSection onSubmit={handleAnalyze} />

      {isLoading && (
        <div className="flex justify-center items-center py-12">
          <Spinner size="lg" color="primary" />
        </div>
      )}

      {analysisResult && !isLoading && (
        <>
          <ExecutiveSummary result={analysisResult} />
          <Card>
            <CardBody>
              <h2 className="text-2xl font-bold mb-4">Calendar View</h2>
              <CalendarView dailyData={analysisResult.dailyData} />
            </CardBody>
          </Card>
        </>
      )}
    </div>
  );
}
