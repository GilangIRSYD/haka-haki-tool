'use client';

/**
 * BrokerFlowChart Component
 * Dual-axis time-series chart showing broker flow (accumulation/distribution) with price overlay
 */

import { useMemo, useState } from 'react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  ReferenceLine,
} from 'recharts';

// ============================================================================
// Types
// ============================================================================

export interface BrokerDataPoint {
  date: string;
  close_price: number;
  brokers: Record<string, { value: number; volume: number }>;
}

export interface BrokerFlowChartProps {
  data: BrokerDataPoint[];
  brokers: string[];
  symbol?: string;
}

// Color palette for brokers (cycling through distinct colors)
const BROKER_COLORS = [
  '#ef4444', // red-500
  '#f97316', // orange-500
  '#eab308', // yellow-500
  '#22c55e', // green-500
  '#06b6d4', // cyan-500
  '#3b82f6', // blue-500
  '#8b5cf6', // violet-500
  '#d946ef', // fuchsia-500
  '#ec4899', // pink-500
  '#6366f1', // indigo-500
];

// ============================================================================
// Helper Functions
// ============================================================================

/**
 * Dynamic value formatter - automatically selects appropriate unit
 * Returns formatted value and the unit used
 */
function formatValueDynamic(value: number): { formatted: string; unit: string; divider: number } {
  const absValue = Math.abs(value);

  if (absValue >= 1000000000000) {
    // Trillions
    return {
      formatted: `${(absValue / 1000000000000).toFixed(1)}`,
      unit: 'T',
      divider: 1000000000000
    };
  } else if (absValue >= 1000000000) {
    // Billions
    return {
      formatted: `${(absValue / 1000000000).toFixed(1)}`,
      unit: 'B',
      divider: 1000000000
    };
  } else if (absValue >= 1000000) {
    // Millions
    return {
      formatted: `${(absValue / 1000000).toFixed(1)}`,
      unit: 'M',
      divider: 1000000
    };
  } else if (absValue >= 1000) {
    // Thousands
    return {
      formatted: `${(absValue / 1000).toFixed(1)}`,
      unit: 'K',
      divider: 1000
    };
  } else {
    // Raw value
    return {
      formatted: `${absValue.toFixed(0)}`,
      unit: '',
      divider: 1
    };
  }
}

/**
 * Determine the best unit for a range of values
 */
function determineOptimalUnit(values: number[]): string {
  const maxValue = Math.max(...values.map(Math.abs));

  if (maxValue >= 1000000000000) return 'T';
  if (maxValue >= 1000000000) return 'B';
  if (maxValue >= 1000000) return 'M';
  if (maxValue >= 1000) return 'K';
  return '';
}

/**
 * Get divider for a given unit
 */
function getDividerForUnit(unit: string): number {
  switch (unit) {
    case 'T': return 1000000000000;
    case 'B': return 1000000000;
    case 'M': return 1000000;
    case 'K': return 1000;
    default: return 1;
  }
}

/**
 * Format price to IDR
 */
function formatPrice(value: number): string {
  return `IDR ${value.toFixed(0)}`;
}

/**
 * Format date for display
 */
function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
}

/**
 * Generate nice tick values for Y-axis
 * Creates approximately `targetTickCount` ticks between min and max
 */
function generateNiceTicks(min: number, max: number, targetTickCount: number = 8): number[] {
  const range = max - min;
  const roughStep = range / (targetTickCount - 1);

  // Find nice step size (powers of 10, multiplied by 1, 2, or 5)
  const magnitude = Math.pow(10, Math.floor(Math.log10(roughStep)));
  const normalizedStep = roughStep / magnitude;

  let niceStep;
  if (normalizedStep < 1.5) {
    niceStep = 1 * magnitude;
  } else if (normalizedStep < 3.5) {
    niceStep = 2 * magnitude;
  } else if (normalizedStep < 7.5) {
    niceStep = 5 * magnitude;
  } else {
    niceStep = 10 * magnitude;
  }

  // Generate ticks
  const ticks: number[] = [];
  let currentTick = Math.ceil(min / niceStep) * niceStep;

  while (currentTick <= max) {
    ticks.push(Number(currentTick.toFixed(10))); // Avoid floating point precision issues
    currentTick += niceStep;
  }

  // Ensure we have at least 2 ticks
  if (ticks.length < 2) {
    return [min, max];
  }

  return ticks;
}

/**
 * Transform API data to chart format with dynamic unit
 */
function transformDataToChartFormat(
  data: BrokerDataPoint[],
  brokers: string[],
  divider: number
): Array<Record<string, any>> {
  return data.map((day) => {
    const chartPoint: Record<string, any> = {
      date: day.date,
      displayDate: formatDate(day.date),
      close_price: day.close_price,
    };

    // Add each broker's value to the chart point (divided by optimal unit)
    brokers.forEach((brokerCode) => {
      const brokerData = day.brokers[brokerCode];
      const normalizedValue = brokerData ? brokerData.value / divider : 0;
      chartPoint[brokerCode] = normalizedValue;
    });

    return chartPoint;
  });
}

// ============================================================================
// Custom Tooltip Component
// ============================================================================

function CustomTooltip({
  active,
  payload,
  label,
  brokers,
  unit,
  divider,
  chartData,
}: {
  active?: boolean;
  payload?: any[];
  label?: string;
  brokers: string[];
  unit: string;
  divider: number;
  chartData: Array<Record<string, any>>;
}) {
  if (!active || !payload || !label) return null;

  // Find the price data point
  const priceData = payload.find((p) => p.dataKey === 'close_price');
  const price = priceData?.value || 0;

  // Find current data point index and calculate previous price change
  const currentIndex = chartData.findIndex((point) => point.displayDate === label);
  let priceChangePercentage: { value: number; display: string } | null = null;

  if (currentIndex > 0 && priceData?.payload) {
    const previousPrice = chartData[currentIndex - 1].close_price;
    const priceChange = price - previousPrice;
    const percentageChange = (priceChange / previousPrice) * 100;
    const isPositive = percentageChange >= 0;

    priceChangePercentage = {
      value: percentageChange,
      display: `${isPositive ? '+' : ''}${percentageChange.toFixed(2)}%`,
    };
  }

  return (
    <div className="bg-content1 border border-default-200 rounded-lg shadow-xl p-3 max-w-xs">
      {/* Date Header */}
      <div className="text-sm font-bold mb-2 text-foreground border-b border-default-200 pb-2">
        {label}
      </div>

      {/* Price Info */}
      <div className="flex items-center justify-between text-xs mb-2">
        <span className="text-default-600">Price:</span>
        <div className="flex items-center gap-2">
          <span className="font-bold text-blue-500">{formatPrice(price)}</span>
          {priceChangePercentage && (
            <span
              className={`text-xs font-bold ${
                priceChangePercentage.value >= 0 ? 'text-success' : 'text-danger'
              }`}
            >
              {priceChangePercentage.display}
            </span>
          )}
        </div>
      </div>

      {/* Broker Flow Values */}
      <div className="space-y-1 max-h-40 overflow-y-auto">
        {brokers.map((broker) => {
          const brokerPayload = payload.find((p) => p.dataKey === broker);
          if (!brokerPayload) return null;

          const normalizedValue = brokerPayload.value;
          const valueInIDR = normalizedValue * divider;
          const isPositive = valueInIDR >= 0;

          const { formatted } = formatValueDynamic(valueInIDR);

          return (
            <div
              key={broker}
              className="flex items-center justify-between text-xs gap-3"
            >
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: brokerPayload.color }}
                />
                <span className="font-semibold">{broker}:</span>
              </div>
              <span
                className={`font-bold ${
                  isPositive ? 'text-success' : 'text-danger'
                }`}
              >
                {isPositive ? '+' : '-'}
                {formatted}{unit}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================================
// Main Chart Component
// ============================================================================

export function BrokerFlowChart({
  data,
  brokers,
  symbol = 'Stock',
}: BrokerFlowChartProps) {
  // Track active brokers (opacity = 1) vs inactive brokers (opacity = 0.15)
  const [activeBrokers, setActiveBrokers] = useState<Set<string>>(
    new Set(brokers)
  );
  const [isPriceActive, setIsPriceActive] = useState(true);

  // Collect all broker values to determine optimal unit
  const allBrokerValues = useMemo(() => {
    const values: number[] = [];
    data.forEach((day) => {
      brokers.forEach((broker) => {
        const brokerData = day.brokers[broker];
        if (brokerData) {
          values.push(brokerData.value);
        }
      });
    });
    return values;
  }, [data, brokers]);

  // Determine optimal unit based on data range
  const optimalUnit = useMemo(
    () => determineOptimalUnit(allBrokerValues),
    [allBrokerValues]
  );

  // Get the divider for the optimal unit
  const divider = useMemo(
    () => getDividerForUnit(optimalUnit),
    [optimalUnit]
  );

  // Transform data for chart with dynamic unit
  const chartData = useMemo(
    () => transformDataToChartFormat(data, brokers, divider),
    [data, brokers, divider]
  );

  // Calculate Y-axis domains (in normalized units)
  const brokerFlowDomain = useMemo(() => {
    let min = 0;
    let max = 0;

    chartData.forEach((point) => {
      brokers.forEach((broker) => {
        const value = point[broker] || 0;
        if (value < min) min = value;
        if (value > max) max = value;
      });
    });

    // Add 10% padding
    const padding = (max - min) * 0.1 || 1;
    return [min - padding, max + padding];
  }, [chartData, brokers]);

  const priceDomain = useMemo(() => {
    const prices = chartData.map((p) => p.close_price);
    const min = Math.min(...prices);
    const max = Math.max(...prices);
    const padding = (max - min) * 0.1 || 10;
    return [min - padding, max + padding];
  }, [chartData]);

  // Toggle broker opacity (active = 1.0, inactive = 0.15)
  const toggleBroker = (brokerCode: string) => {
    const newActive = new Set(activeBrokers);
    if (newActive.has(brokerCode)) {
      newActive.delete(brokerCode);
    } else {
      newActive.add(brokerCode);
    }
    setActiveBrokers(newActive);
  };

  // Get broker opacity
  const getBrokerOpacity = (brokerCode: string): number => {
    return activeBrokers.has(brokerCode) ? 1.0 : 0.15;
  };

  // Get broker color
  const getBrokerColor = (index: number) => {
    return BROKER_COLORS[index % BROKER_COLORS.length];
  };

  return (
    <div className="w-full h-full">
      {/* Chart Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-xs text-default-500 mt-1">
            Left Axis: Broker Flow ({optimalUnit || 'IDR'}) | Right Axis: Price (IDR)
          </p>
        </div>
      </div>

      {/* Chart Container */}
      <div className="w-full" style={{ height: 'calc(100% - 100px)' }}>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
          >
            <CartesianGrid
              strokeDasharray="3 3"
              stroke="currentColor"
              className="stroke-default-300/50"
            />

            {/* X-Axis: Date */}
            <XAxis
              dataKey="displayDate"
              tick={{ fill: 'currentColor', fontSize: 11 }}
              stroke="currentColor"
              className="text-default-600"
              angle={-45}
              textAnchor="end"
              height={80}
              dy={10}
            />

            {/* Left Y-Axis: Broker Flow (Dynamic Unit) */}
            <YAxis
              yAxisId="flow"
              tick={{ fill: 'currentColor', fontSize: 11 }}
              stroke="currentColor"
              className="text-default-600"
              tickFormatter={(value) => `${value.toFixed(1)}${optimalUnit}`}
              domain={brokerFlowDomain}
              ticks={generateNiceTicks(brokerFlowDomain[0], brokerFlowDomain[1], 8)}
            />

            {/* Right Y-Axis: Price */}
            <YAxis
              yAxisId="price"
              orientation="right"
              tick={{ fill: 'currentColor', fontSize: 11 }}
              stroke="currentColor"
              className="text-default-600"
              tickFormatter={(value) => value.toFixed(0)}
              domain={priceDomain}
            />

            {/* Zero Reference Line */}
            <ReferenceLine
              yAxisId="flow"
              y={0}
              stroke="currentColor"
              className="stroke-default-400"
              strokeDasharray="5 5"
            />

            {/* Custom Tooltip */}
            <Tooltip
              content={<CustomTooltip brokers={brokers} unit={optimalUnit} divider={divider} chartData={chartData} />}
              cursor={{ stroke: 'currentColor', strokeWidth: 1, strokeDasharray: '5 5' }}
            />

            {/* Legend */}
            <Legend
              verticalAlign="top"
              height={60}
              wrapperStyle={{ paddingTop: '10px' }}
            />

            {/* Price Line */}
            <Line
              yAxisId="price"
              type="monotone"
              dataKey="close_price"
              stroke="#3b82f6"
              strokeWidth={3}
              dot={false}
              name="Price (IDR)"
              activeDot={{ r: 6 }}
              strokeOpacity={isPriceActive ? 1.0 : 0.15}
              onClick={() => setIsPriceActive(!isPriceActive)}
              className="cursor-pointer"
            />

            {/* Broker Flow Lines */}
            {brokers.map((broker, index) => (
              <Line
                key={broker}
                yAxisId="flow"
                type="monotone"
                dataKey={broker}
                stroke={getBrokerColor(index)}
                strokeWidth={2}
                dot={false}
                name={`${broker} (${optimalUnit || 'IDR'})`}
                activeDot={{ r: 5 }}
                connectNulls={false}
                strokeOpacity={getBrokerOpacity(broker)}
                onClick={() => toggleBroker(broker)}
                className="cursor-pointer"
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Broker Legend (Interactive) */}
      <div className="mt-4 flex flex-wrap gap-2 items-center">
        <span className="text-xs font-semibold text-default-700 mr-2">
          Toggle Series:
        </span>

        {/* Price Toggle */}
        <button
          onClick={() => setIsPriceActive(!isPriceActive)}
          className={`px-2 py-1 rounded text-xs font-medium transition-all ${
            isPriceActive
              ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
              : 'bg-default-100 text-default-500 opacity-50'
          }`}
        >
          Price
        </button>

        {/* Broker Toggles */}
        {brokers.map((broker, index) => (
          <button
            key={broker}
            onClick={() => toggleBroker(broker)}
            className={`px-2 py-1 rounded text-xs font-medium transition-all ${
              activeBrokers.has(broker)
                ? 'text-white'
                : 'bg-default-100 text-default-500 opacity-50'
            }`}
            style={
              activeBrokers.has(broker)
                ? { backgroundColor: getBrokerColor(index) }
                : undefined
            }
          >
            {broker}
          </button>
        ))}
      </div>

      {/* Chart Info */}
      <div className="mt-3 p-2 bg-default-100 rounded-lg">
        <div className="text-[10px] text-default-600">
          <span className="font-semibold">Tip:</span> Click on legend items or buttons below to toggle series opacity.
          Dimmed series (15% opacity) are inactive but still visible.
          Positive values indicate accumulation, negative values indicate distribution.
        </div>
      </div>
    </div>
  );
}
