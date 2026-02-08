"use client";

import { LineChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, CartesianGrid, Dot } from "recharts";

interface ShareholderNumber {
  shareholder_date: string;
  total_share: string;
  change: number;
  change_formatted: string;
}

interface InvestorGrowthChartProps {
  shareholderNumbers: ShareholderNumber[];
}

export function InvestorGrowthChart({ shareholderNumbers }: InvestorGrowthChartProps) {
  // Process data - reverse to show oldest to newest
  const sortedData = [...shareholderNumbers].reverse();

  // Format data for chart
  const chartData = sortedData.map(item => {
    const date = new Date(item.shareholder_date);
    const monthYear = date.toLocaleDateString('id-ID', { month: 'short', year: '2-digit' });
    const totalShare = parseInt(item.total_share.replace(/,/g, ''));

    return {
      date: monthYear,
      shareholders: totalShare,
      change: item.change,
      changeFormatted: item.change_formatted,
    };
  });

  // Get latest change
  const latestChange = sortedData[sortedData.length - 1]?.change || 0;
  const latestChangeFormatted = sortedData[sortedData.length - 1]?.change_formatted || "0";

  // Determine trend color
  const trendColor = latestChange >= 0 ? "#22c55e" : "#ef4444"; // green or red

  // Custom tooltip
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-violet-900 border border-violet-700 rounded-lg p-2 shadow-lg">
          <p className="text-xs text-violet-400">{label}</p>
          <p className="text-sm font-semibold text-white">
            {data.shareholders.toLocaleString()} shareholders
          </p>
          <p className={`text-xs font-semibold ${
            data.change >= 0 ? "text-green-400" : "text-red-400"
          }`}>
            {data.changeFormatted}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-violet-300">
          Pertumbuhan Investor
        </h3>
        <div className="text-right">
          <p className="text-xs text-violet-400">Bulan Ini</p>
          <p className={`text-sm font-bold ${latestChange >= 0 ? "text-green-400" : "text-red-400"}`}>
            {latestChangeFormatted}
          </p>
        </div>
      </div>

      <div className="h-32">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart
            data={chartData}
            margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#7c3aed" strokeOpacity={0.3} />
            <XAxis
              dataKey="date"
              tick={{ fill: "#a78bfa", fontSize: 10 }}
              stroke="#7c3aed"
            />
            <YAxis
              tick={{ fill: "#a78bfa", fontSize: 10 }}
              stroke="#7c3aed"
              width={40}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="shareholders"
              stroke={trendColor}
              strokeWidth={2}
              dot={{ fill: trendColor, r: 4 }}
              activeDot={{ r: 6, stroke: trendColor, strokeWidth: 2 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Summary */}
      <div className="flex justify-between text-xs">
        <span className="text-violet-400">
          Terendah: {chartData[0]?.shareholders.toLocaleString()}
        </span>
        <span className="text-violet-400">
          Tertinggi: {chartData[chartData.length - 1]?.shareholders.toLocaleString()}
        </span>
      </div>
    </div>
  );
}
