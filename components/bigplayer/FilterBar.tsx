"use client";

import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { DatePreset } from "./types";

interface FilterBarProps {
  datePreset: DatePreset;
  dateStart: string;
  dateEnd: string;
  symbolSearch: string;
  actionType: "all" | "buy" | "sell" | "other";
  onDatePresetChange: (preset: DatePreset) => void;
  onDateStartChange: (date: string) => void;
  onDateEndChange: (date: string) => void;
  onSymbolSearchChange: (search: string) => void;
  onActionTypeChange: (type: "all" | "buy" | "sell" | "other") => void;
  onApplyFilters: () => void;
  loading?: boolean;
}

export function FilterBar({
  datePreset,
  dateStart,
  dateEnd,
  symbolSearch,
  actionType,
  onDatePresetChange,
  onDateStartChange,
  onDateEndChange,
  onSymbolSearchChange,
  onActionTypeChange,
  onApplyFilters,
  loading = false,
}: FilterBarProps) {
  return (
    <div className="space-y-4">
      {/* Date Presets */}
      <div className="flex flex-wrap gap-2">
        <Chip
          className="cursor-pointer transition-colors hover:bg-default-100"
          color={datePreset === "today" ? "primary" : "default"}
          variant={datePreset === "today" ? "solid" : "bordered"}
          onClick={() => onDatePresetChange("today")}
        >
          Today
        </Chip>
        <Chip
          className="cursor-pointer transition-colors hover:bg-default-100"
          color={datePreset === "3days" ? "primary" : "default"}
          variant={datePreset === "3days" ? "solid" : "bordered"}
          onClick={() => onDatePresetChange("3days")}
        >
          3D
        </Chip>
        <Chip
          className="cursor-pointer transition-colors hover:bg-default-100"
          color={datePreset === "5days" ? "primary" : "default"}
          variant={datePreset === "5days" ? "solid" : "bordered"}
          onClick={() => onDatePresetChange("5days")}
        >
          5D
        </Chip>
        <Chip
          className="cursor-pointer transition-colors hover:bg-default-100"
          color={datePreset === "7days" ? "primary" : "default"}
          variant={datePreset === "7days" ? "solid" : "bordered"}
          onClick={() => onDatePresetChange("7days")}
        >
          7D
        </Chip>
        <Chip
          className="cursor-pointer transition-colors hover:bg-default-100"
          color={datePreset === "1month" ? "primary" : "default"}
          variant={datePreset === "1month" ? "solid" : "bordered"}
          onClick={() => onDatePresetChange("1month")}
        >
          1M
        </Chip>
        <Chip
          className="cursor-pointer transition-colors hover:bg-default-100"
          color={datePreset === "3months" ? "primary" : "default"}
          variant={datePreset === "3months" ? "solid" : "bordered"}
          onClick={() => onDatePresetChange("3months")}
        >
          3M
        </Chip>
        <Chip
          className="cursor-pointer transition-colors hover:bg-default-100"
          color={datePreset === "6months" ? "primary" : "default"}
          variant={datePreset === "6months" ? "solid" : "bordered"}
          onClick={() => onDatePresetChange("6months")}
        >
          6M
        </Chip>
        <Chip
          className="cursor-pointer transition-colors hover:bg-default-100"
          color={datePreset === "1year" ? "primary" : "default"}
          variant={datePreset === "1year" ? "solid" : "bordered"}
          onClick={() => onDatePresetChange("1year")}
        >
          1Y
        </Chip>
        <Chip
          className="cursor-pointer transition-colors hover:bg-default-100"
          color={datePreset === "custom" ? "primary" : "default"}
          variant={datePreset === "custom" ? "solid" : "bordered"}
          onClick={() => onDatePresetChange("custom")}
        >
          Custom
        </Chip>
      </div>

      {/* Custom Date Range */}
      {datePreset === "custom" && (
        <div className="flex flex-wrap gap-3">
          <div className="flex-1 min-w-[150px]">
            <Input
              type="date"
              label="Start Date"
              value={dateStart}
              onChange={(e) => onDateStartChange(e.target.value)}
              classNames={{
                input: "text-sm",
              }}
            />
          </div>
          <div className="flex-1 min-w-[150px]">
            <Input
              type="date"
              label="End Date"
              value={dateEnd}
              onChange={(e) => onDateEndChange(e.target.value)}
              classNames={{
                input: "text-sm",
              }}
            />
          </div>
        </div>
      )}

      {/* Symbol Search & Action Type Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="flex-1 min-w-[200px] max-w-[400px]">
          <Input
            placeholder="Search by symbol or investor name..."
            startContent={<span className="text-default-400">🔍</span>}
            value={symbolSearch}
            onChange={(e) => onSymbolSearchChange(e.target.value)}
            classNames={{
              input: "text-sm",
            }}
            onClear={() => onSymbolSearchChange("")}
            isClearable
          />
        </div>

        <div className="flex gap-2 items-center">
          <Button
            size="sm"
            color={actionType === "all" ? "primary" : "default"}
            variant={actionType === "all" ? "solid" : "bordered"}
            onPress={() => onActionTypeChange("all")}
          >
            All
          </Button>
          <Button
            size="sm"
            color={actionType === "buy" ? "success" : "default"}
            variant={actionType === "buy" ? "solid" : "bordered"}
            onPress={() => onActionTypeChange("buy")}
          >
            Buy
          </Button>
          <Button
            size="sm"
            color={actionType === "sell" ? "danger" : "default"}
            variant={actionType === "sell" ? "solid" : "bordered"}
            onPress={() => onActionTypeChange("sell")}
          >
            Sell
          </Button>
          <Button
            size="sm"
            color={actionType === "other" ? "warning" : "default"}
            variant={actionType === "other" ? "solid" : "bordered"}
            onPress={() => onActionTypeChange("other")}
          >
            Other
          </Button>
        </div>
      </div>

      {/* Apply Button (for custom date range) */}
      {datePreset === "custom" && (
        <div>
          <Button
            color="primary"
            onPress={onApplyFilters}
            isLoading={loading}
            className="font-medium"
          >
            Apply Filters
          </Button>
        </div>
      )}
    </div>
  );
}
