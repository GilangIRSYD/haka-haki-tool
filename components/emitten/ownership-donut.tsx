"use client";

import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

interface ShareholderData {
  name: string;
  value: number;
  percentage: string;
  badges?: string[];
  [key: string]: string | number | string[] | undefined;
}

interface OwnershipDonutProps {
  shareholders: Array<{
    name: string;
    percentage: string;
    badges?: string[];
  }>;
  freeFloat?: string;
  marketCap?: string;
}

// Generate colors for chart slices
const COLORS = [
  "#8b5cf6",  // violet-500
  "#06b6d4",  // cyan-500
  "#a855f7",  // purple-500
  "#ec4899",  // pink-500
  "#f59e0b",  // amber-500
  "#10b981",  // emerald-500
  "#3b82f6",  // blue-500
  "#f97316",  // orange-500
  "#14b8a6",  // teal-500
  "#6366f1",  // indigo-500
];

export function OwnershipDonut({ shareholders, freeFloat = "0%", marketCap }: OwnershipDonutProps) {
  // Create chart data from all individual shareholders
  const data: ShareholderData[] = shareholders.map((sh, index) => ({
    name: sh.name,
    value: parseFloat(sh.percentage) || 0,
    percentage: sh.percentage,
    badges: sh.badges,
  }));

  // Add free float as a separate entry
  const freeFloatPct = parseFloat(freeFloat) || 0;
  if (freeFloatPct > 0) {
    data.push({
      name: "Free Float",
      value: freeFloatPct,
      percentage: freeFloat,
    });
  }

  // Assign colors to each entry
  const coloredData = data.map((item, index) => ({
    ...item,
    color: COLORS[index % COLORS.length],
  }));

  // Custom tooltip
  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-violet-900 border border-violet-700 rounded-lg p-2 shadow-lg">
          <p className="text-sm font-semibold text-white">{data.name}</p>
          <p className="text-xs text-violet-300">{data.percentage}</p>
          {data.badges && data.badges.length > 0 && (
            <div className="flex gap-1 mt-1">
              {data.badges.map((badge: string, idx: number) => (
                <span key={idx} className="text-xs bg-violet-700 text-violet-200 px-1.5 py-0.5 rounded">
                  {badge}
                </span>
              ))}
            </div>
          )}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-violet-300">
        Struktur Kepemilikan
      </h3>

      <div className="relative h-48">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={coloredData}
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={70}
              paddingAngle={2}
              dataKey="value"
            >
              {coloredData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={entry.color}
                  stroke="none"
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
          </PieChart>
        </ResponsiveContainer>

        {/* Center Label - Free Float Highlight with Market Cap */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <p className="text-xs text-violet-400">Free Float</p>
            <p className="text-lg font-bold text-white">{freeFloat}</p>
            {marketCap && (
              <>
                <div className="h-1 bg-violet-800/50 my-0.5"></div>
                <p className="text-[9px] text-violet-400 leading-tight">Market Cap</p>
                <p className="text-xs font-semibold text-white">{marketCap}</p>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="space-y-2 max-h-48 overflow-y-auto">
        {coloredData.map((item, index) => (
          <div key={index} className="flex items-center justify-between">
            <div className="flex items-center gap-2 flex-1 min-w-0">
              <div
                className="w-3 h-3 rounded-full flex-shrink-0"
                style={{ backgroundColor: item.color }}
              />
              <div className="flex flex-col min-w-0 flex-1">
                <span className="text-xs text-violet-300 truncate" title={item.name}>
                  {item.name}
                </span>
                {item.badges && item.badges.length > 0 && (
                  <div className="flex gap-1 flex-wrap">
                    {item.badges.map((badge, badgeIdx) => (
                      <span key={badgeIdx} className="text-xs bg-violet-700 text-violet-200 px-1.5 py-0.5 rounded">
                        {badge}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <span className="text-xs font-semibold text-white flex-shrink-0 ml-2">
              {item.percentage}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
