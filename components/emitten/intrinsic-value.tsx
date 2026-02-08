"use client";

import { IntrinsicValueResult } from "@/lib/utils/valuation";

interface IntrinsicValueProps {
  data: IntrinsicValueResult;
  valuationMode?: "conservative" | "moderate" | "aggressive";
}

export function IntrinsicValue({ data, valuationMode = "moderate" }: IntrinsicValueProps) {
  const { range, currentPrice, upside, status } = data;

  const modeLabels = {
    conservative: "Konservatif",
    moderate: "Moderat",
    aggressive: "Agresif",
  };

  const modeMultipliers = {
    conservative: { label: "Diskon", values: ["15%", "20%", "15%", "10%"] },
    moderate: { label: "Normal", values: ["0%", "0%", "0%", "0%"] },
    aggressive: { label: "Premium", values: ["+15%", "+20%", "+15%", "+10%"] },
  };

  // Calculate position percentage for gauge (0-100%)
  // The gauge shows from range.low to range.high
  const gaugeMin = range.low * 0.8;
  const gaugeMax = range.high * 1.2;
  const currentPosition = ((currentPrice - gaugeMin) / (gaugeMax - gaugeMin)) * 100;

  const statusColors = {
    undervalued: "#22c55e", // green
    fair: "#eab308",        // yellow
    overvalued: "#ef4444",  // red
  };

  const statusLabels = {
    undervalued: "Undervalued",
    fair: "Fair Value",
    overvalued: "Overvalued",
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-violet-300">
          Intrinsic Value Analysis
        </h3>
        <span className="text-xs bg-violet-700 text-violet-200 px-2 py-1 rounded">
          {modeLabels[valuationMode]}
        </span>
      </div>

      {/* Gauge Chart */}
      <div className="relative pt-6 pb-2">
        {/* Gauge bar */}
        <div className="h-3 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-full relative">
          {/* Current price indicator */}
          <div
            className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-gray-800 rounded-full shadow-lg z-10"
            style={{
              left: `${Math.min(Math.max(currentPosition, 0), 100)}%`,
            }}
          />
        </div>

        {/* Labels */}
        <div className="flex justify-between text-xs text-violet-400 mt-1">
          <span>Rp {range.low.toFixed(0)}</span>
          <span>Rp {range.mid.toFixed(0)}</span>
          <span>Rp {range.high.toFixed(0)}</span>
        </div>
      </div>

      {/* Current Price Badge */}
      <div className="bg-violet-900/50 rounded-lg p-3">
        <div className="flex justify-between items-center">
          <span className="text-xs text-violet-400">Current Price</span>
          <span className="text-lg font-bold text-white">
            Rp {currentPrice.toFixed(0)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-violet-400">Fair Value Range</span>
          <span className="text-xs text-violet-300">
            Rp {range.low.toFixed(0)} - Rp {range.high.toFixed(0)}
          </span>
        </div>
        <div className="flex justify-between items-center mt-2">
          <span className="text-xs text-violet-400">Upside/Downside</span>
          <span
            className={`text-sm font-semibold ${
              upside >= 0 ? "text-green-400" : "text-red-400"
            }`}
          >
            {upside >= 0 ? "+" : ""}
            {upside.toFixed(1)}%
          </span>
        </div>
      </div>

      {/* Status Badge */}
      <div
        className="text-center py-2 px-4 rounded-lg"
        style={{
          backgroundColor: statusColors[status],
        }}
      >
        <p className="text-sm font-bold text-white uppercase">
          {statusLabels[status]}
        </p>
      </div>

      {/* Calculation Methods (Collapsible) */}
      <details className="text-xs">
        <summary className="cursor-pointer text-violet-400 hover:text-violet-300">
          Rumus Perhitungan ▼
        </summary>
        <div className="mt-2 space-y-2 pl-4 border-l-2 border-violet-800">
          <div>
            <div className="flex justify-between items-center">
              <span className="text-violet-400">Graham Formula:</span>
              <span className="text-violet-200">Rp {data.graham.toFixed(0)}</span>
            </div>
            <p className="text-violet-500 mt-0.5 text-[10px]">
              EPS × (8.5 + 2×g) × {modeMultipliers[valuationMode].values[0]}
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <span className="text-violet-400">Peter Lynch:</span>
              <span className="text-violet-200">Rp {data.peterLynch.toFixed(0)}</span>
            </div>
            <p className="text-violet-500 mt-0.5 text-[10px]">
              EPS × g × {modeMultipliers[valuationMode].values[1]}
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <span className="text-violet-400">IHSG Relative:</span>
              <span className="text-violet-200">Rp {data.ihsgRelative.toFixed(0)}</span>
            </div>
            <p className="text-violet-500 mt-0.5 text-[10px]">
              EPS × PE IHSG × {modeMultipliers[valuationMode].values[2]}
            </p>
          </div>
          <div>
            <div className="flex justify-between items-center">
              <span className="text-violet-400">Asset Based:</span>
              <span className="text-violet-200">Rp {data.assetBased.toFixed(0)}</span>
            </div>
            <p className="text-violet-500 mt-0.5 text-[10px]">
              BVPS × {modeMultipliers[valuationMode].values[3]}
            </p>
          </div>
        </div>
      </details>
    </div>
  );
}
