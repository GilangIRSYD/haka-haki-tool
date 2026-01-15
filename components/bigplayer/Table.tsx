"use client";

import { BigPlayerMovementAggregated } from "./types";
import {
  formatCompactNumber,
  formatPercentage,
  getRelativeDateLabel,
  getNationalityIcon,
  getBadgeIcons,
  getActionTypeDisplay,
  formatBrokers,
} from "@/lib/utils/format";

interface BigPlayerTableProps {
  data: BigPlayerMovementAggregated[];
  loading?: boolean;
}

export function BigPlayerTable({ data, loading = false }: BigPlayerTableProps) {
  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]" />
          <p className="mt-2 text-sm text-default-500">Loading data...</p>
        </div>
      </div>
    );
  }

  if (data.length === 0) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <p className="text-lg text-default-500">No data found</p>
          <p className="mt-1 text-sm text-default-400">
            Try adjusting your filters or date range
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto overflow-y-auto">
      <table className="w-full text-sm relative">
        <thead className="sticky top-0 z-50 bg-default-50 shadow-sm">
          <tr className="border-b border-default-200">
            <th className="px-3 py-3 text-left font-semibold text-default-700 whitespace-nowrap">
              Date
            </th>
            <th className="px-3 py-3 text-left font-semibold text-default-700 whitespace-nowrap">
              Symbol
            </th>
            <th className="px-3 py-3 text-left font-semibold text-default-700 whitespace-nowrap">
              Investor
            </th>
            <th className="px-3 py-3 text-center font-semibold text-default-700 whitespace-nowrap">
              Action
            </th>
            <th className="px-3 py-3 text-right font-semibold text-default-700 whitespace-nowrap">
              Net Value
            </th>
            <th className="px-3 py-3 text-right font-semibold text-default-700 whitespace-nowrap">
              Change %
            </th>
            <th className="px-3 py-3 text-right font-semibold text-default-700 whitespace-nowrap">
              Holding %
            </th>
            <th className="px-3 py-3 text-left font-semibold text-default-700 whitespace-nowrap">
              Broker
            </th>
          </tr>
        </thead>
        <tbody>
          {data.map((item) => {
            const actionDisplay = getActionTypeDisplay(item.action_type);
            const nationalityIcon = getNationalityIcon(item.nationality);
            const badgeIcons = getBadgeIcons(item.badges);
            const brokerString = formatBrokers(item.brokers);
            const relativeDate = getRelativeDateLabel(item.date);

            return (
              <tr
                key={item.key}
                className="border-b border-default-100 transition-colors hover:bg-default-50"
              >
                {/* Date */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-xs text-default-600">{relativeDate}</span>
                </td>

                {/* Symbol */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="font-bold text-default-700">{item.symbol}</span>
                </td>

                {/* Investor + Nationality + Badges */}
                <td className="px-3 py-3 min-w-[200px] max-w-[250px]">
                  <div className="flex items-center gap-1">
                    <span className="truncate font-medium text-default-700">
                      {item.name}
                    </span>
                    {nationalityIcon && (
                      <span className="shrink-0" title={item.nationality}>
                        {nationalityIcon}
                      </span>
                    )}
                    {badgeIcons && (
                      <span className="shrink-0" title={item.badges.join(", ")}>
                        {badgeIcons}
                      </span>
                    )}
                  </div>
                  {item.entry_count > 1 && (
                    <div className="mt-0.5 text-[10px] text-default-400">
                      {item.entry_count} entries merged
                    </div>
                  )}
                </td>

                {/* Action */}
                <td className="px-3 py-3 text-center whitespace-nowrap">
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold ${actionDisplay.bgClass} ${actionDisplay.colorClass}`}
                  >
                    {actionDisplay.icon}
                    {actionDisplay.label}
                  </span>
                </td>

                {/* Net Value */}
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <span className="font-medium text-default-700">
                    {formatCompactNumber(item.total_change_value)}
                  </span>
                </td>

                {/* Change % */}
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <span
                    className={`font-semibold ${
                      item.avg_change_percentage >= 0
                        ? "text-success"
                        : "text-danger"
                    }`}
                  >
                    {formatPercentage(
                      item.avg_change_percentage.toString(),
                      2
                    )}
                  </span>
                </td>

                {/* Holding % */}
                <td className="px-3 py-3 text-right whitespace-nowrap">
                  <span className="text-default-600">
                    {formatPercentage(item.current_holding_percentage, 2)}
                  </span>
                </td>

                {/* Broker */}
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-xs text-default-500 font-mono">
                    {brokerString}
                  </span>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
