"use client";

interface LiquidityInfoProps {
  marketCap?: string;
  freeFloat?: string;
}

export function LiquidityInfo({ marketCap = "-", freeFloat = "-" }: LiquidityInfoProps) {
  // Parse market cap string to number (e.g., "21,970 B" -> 21970000000000)
  const parseMarketCap = (mc: string): number => {
    if (mc === "-" || mc === "NA") return 0;

    const parts = mc.trim().split(" ");
    if (parts.length !== 2) return 0;

    const num = parseFloat(parts[0].replace(/,/g, ""));
    const unit = parts[1].toUpperCase();

    if (isNaN(num)) return 0;

    switch (unit) {
      case "T":
        return num * 1000000000000;
      case "B":
        return num * 1000000000;
      case "M":
        return num * 1000000;
      default:
        return 0;
    }
  };

  // Format market cap to readable string with T conversion
  const formatMarketCap = (mc: string): string => {
    if (mc === "-" || mc === "NA") return "-";

    const value = parseMarketCap(mc);
    if (value === 0) return mc;

    // Convert to T if >= 1 trillion
    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(1)} T`;
    } else if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)} B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} M`;
    }
    return `${value.toLocaleString('id-ID')}`;
  };

  // Parse free float percentage (e.g., "23.40%" -> 23.40)
  const parseFreeFloat = (ff: string): number => {
    if (ff === "-" || ff === "NA") return 0;
    const parsed = parseFloat(ff.replace(/[%]/g, ""));
    return isNaN(parsed) ? 0 : parsed;
  };

  // Calculate Adjusted Market Cap
  const mcValue = parseMarketCap(marketCap);
  const ffValue = parseFreeFloat(freeFloat);
  const adjustedMC = mcValue * (ffValue / 100);

  // Format adjusted MC to readable string
  const formatAdjustedMC = (value: number): string => {
    if (value === 0) return "-";

    if (value >= 1000000000000) {
      return `${(value / 1000000000000).toFixed(1)} T`;
    } else if (value >= 1000000000) {
      return `${(value / 1000000000).toFixed(1)} B`;
    } else if (value >= 1000000) {
      return `${(value / 1000000).toFixed(1)} M`;
    }
    return `${value.toLocaleString('id-ID')}`;
  };

  // Determine liquidity badge
  const getLiquidityBadge = (adjustedMC: number): { label: string; emoji: string; color: string } => {
    if (adjustedMC < 1000000000000) {
      return { label: "Rendah", emoji: "🔴", color: "bg-red-500/20 text-red-300 border-red-500/30" };
    } else if (adjustedMC < 5000000000000) {
      return { label: "Sedang", emoji: "🟡", color: "bg-yellow-500/20 text-yellow-300 border-yellow-500/30" };
    } else {
      return { label: "Tinggi", emoji: "🟢", color: "bg-green-500/20 text-green-300 border-green-500/30" };
    }
  };

  const badge = getLiquidityBadge(adjustedMC);

  return (
    <div className="bg-gradient-to-r from-violet-600/20 to-violet-500/20 border border-violet-500/30 rounded-lg p-3">
      <h3 className="text-xs font-semibold text-violet-300 mb-2 flex items-center gap-1">
        <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-pulse"></span>
        Likuiditas & Market Cap
      </h3>

      {/* Info Grid */}
      <div className="space-y-1.5 text-xs">
        <div className="flex justify-between items-center">
          <span className="text-violet-400">Market Cap</span>
          <span className="font-semibold text-white">{formatMarketCap(marketCap)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-violet-400">Adjusted MC</span>
          <span className="font-semibold text-white">{formatAdjustedMC(adjustedMC)}</span>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-violet-400">Free Float</span>
          <span className="font-semibold text-white">{freeFloat}</span>
        </div>

        <div className="h-px bg-violet-500/20 my-1"></div>

        <div className="flex justify-between items-center">
          <span className="text-violet-400">Likuiditas</span>
          <span className={`px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.color}`}>
            {badge.emoji} {badge.label}
          </span>
        </div>
      </div>
    </div>
  );
}
