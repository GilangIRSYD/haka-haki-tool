"use client";

import { FundamentalScore as ScoreType } from "@/lib/utils/valuation";

interface FundamentalScoreProps {
  score: ScoreType;
}

export function FundamentalScore({ score }: FundamentalScoreProps) {
  const categories = [
    {
      name: "Profitability",
      value: score.profitability,
      color: getBarColor(score.profitability),
      description: "ROE, Net Margin, ROA",
      formula: "ROE (40%) + Net Margin (30%) + ROA (30%)",
    },
    {
      name: "Valuation",
      value: score.valuation,
      color: getBarColor(score.valuation),
      description: "PE, PBV vs IHSG",
      formula: "PE Score (50%) + PBV Score (50%)",
    },
    {
      name: "Risk",
      value: score.risk,
      color: getBarColor(score.risk),
      description: "Altman Z-Score, D/E, Current Ratio",
      formula: "Altman Z-Score (50%) + D/E (30%) + Current Ratio (20%)",
    },
    {
      name: "Growth",
      value: score.growth,
      color: getBarColor(score.growth),
      description: "Revenue, Net Income Growth",
      formula: "Revenue Growth (50%) + Net Income Growth (50%)",
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-violet-300">
          Fundamental Health Score
        </h3>
        <div className="flex items-center gap-2">
          <span className="text-xs text-violet-400">Overall:</span>
          <span
            className="text-sm font-bold px-2 py-1 rounded"
            style={{
              backgroundColor: getBarColor(score.overall),
              color: "white",
            }}
          >
            {score.overall}
          </span>
        </div>
      </div>

      <div className="space-y-3">
        {categories.map((cat) => (
          <div key={cat.name} className="space-y-1 group relative">
            <div className="flex justify-between items-center">
              <span className="text-xs text-violet-300">{cat.name}</span>
              <span className="text-xs font-semibold" style={{ color: cat.color }}>
                {cat.value}
              </span>
            </div>
            <div className="h-2 bg-violet-900 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min(cat.value, 100)}%`,
                  backgroundColor: cat.color,
                }}
              />
            </div>
            <p className="text-xs text-violet-400">{cat.description}</p>

            {/* Formula Tooltip - Show on hover */}
            <div className="absolute left-0 -bottom-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
              <div className="bg-violet-950 border border-violet-700 rounded-lg p-2 shadow-xl mb-1 ml-2">
                <p className="text-[10px] text-violet-300 whitespace-nowrap">
                  <span className="font-semibold">Rumus:</span> {cat.formula}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function getBarColor(score: number): string {
  if (score >= 80) return "#22c55e"; // green-500
  if (score >= 60) return "#84cc16"; // lime-500
  if (score >= 40) return "#eab308"; // yellow-500
  return "#ef4444"; // red-500
}
