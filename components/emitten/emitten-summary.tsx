"use client";

import { DiamondIcon } from "@/components/icons";
import { FundamentalScore } from "@/components/emitten/fundamental-score";
import { IntrinsicValue } from "@/components/emitten/intrinsic-value";
import { OwnershipDonut } from "@/components/emitten/ownership-donut";
import { InvestorGrowthChart } from "@/components/emitten/investor-growth-chart";
import { SubsidiaryCompanies } from "@/components/emitten/subsidiary-companies";
import { LiquidityInfo } from "@/components/emitten/liquidity-info";
import { CompanyHistory } from "@/components/emitten/company-history";
import { EmittenSummarySkeleton } from "@/components/emitten/skeleton-loading";
import {
  calculateIntrinsicValue,
  calculateFundamentalScore,
  scoreProfitability,
  scoreValuation,
  scoreRisk,
  scoreGrowth,
  parsePercentage,
  parseNumber,
} from "@/lib/utils/valuation";
import type { EmittenInfo, KeyStats, Profile } from "@/lib/api/emitten";

type ValuationMode = "conservative" | "moderate" | "aggressive";

interface EmittenSummaryProps {
  emittenInfo: EmittenInfo | null;
  keyStats: KeyStats | null;
  profile: Profile | null;
  loading: boolean;
  error?: string | null;
  valuationMode?: ValuationMode;
}

export function EmittenSummary({ emittenInfo, keyStats, profile, loading, error, valuationMode = "moderate" }: EmittenSummaryProps) {
  if (loading) {
    return <EmittenSummarySkeleton />;
  }

  if (error || !emittenInfo) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-6">
        <DiamondIcon size={48} className="text-violet-600 mb-4" />
        <p className="text-violet-300 text-sm">
          {error || "Masukkan kode emitten dan tekan Enter untuk melihat data fundamental"}
        </p>
      </div>
    );
  }

  // Extract key metrics from keyStats
  const getMetricValue = (categoryName: string, metricName: string) => {
    if (!keyStats) return "-";

    const category = keyStats.closure_fin_items_results.find(
      (cat) => cat.keystats_name === categoryName
    );

    if (!category) return "-";

    const metric = category.fin_name_results.find(
      (item) => item.fitem.name === metricName
    );

    return metric?.fitem.value || "-";
  };

  const currentPE = getMetricValue("Current Valuation", "Current PE Ratio (TTM)");
  const pbv = getMetricValue("Current Valuation", "Current Price to Book Value");
  const roe = getMetricValue("Management Effectiveness", "Return on Equity (TTM)");
  const netMargin = getMetricValue("Profitability", "Net Profit Margin (Quarter)");
  const debtToEquity = getMetricValue("Solvency", "Debt to Equity Ratio (Quarter)");
  const revenueTTM = getMetricValue("Income Statement", "Revenue (TTM)");
  const netIncomeTTM = getMetricValue("Income Statement", "Net Income (TTM)");
  const epsTTM = getMetricValue("Per Share", "Current EPS (TTM)");

  // Get free float and market cap from key stats stats section
  const freeFloat = keyStats?.stats?.free_float || undefined;
  const marketCap = keyStats?.stats?.market_cap || undefined;

  // Calculate Intrinsic Value
  let intrinsicValueData = null;
  try {
    const bookValuePS = getMetricValue("Per Share", "Current Book Value Per Share");
    const revenueGrowth = getMetricValue("Growth", "Revenue (Quarter YoY Growth)");

    const parsedEPS = parsePercentage(epsTTM);
    const parsedBookValue = parsePercentage(bookValuePS);
    const parsedGrowth = parsePercentage(revenueGrowth);
    const parsedPrice = parsePercentage(emittenInfo.price);
    const parsedIHSGPE = parsePercentage(currentPE.replace("× IHSG", "").trim());

    intrinsicValueData = calculateIntrinsicValue(
      parsedEPS,
      parsedBookValue,
      parsedGrowth,
      parsedPrice,
      parsedIHSGPE,
      valuationMode
    );
  } catch (e) {
    console.error("Error calculating intrinsic value:", e);
  }

  // Calculate Fundamental Score
  let fundamentalScoreData = null;
  try {
    const altmanZScore = getMetricValue("Solvency", "Altman Z-Score (Modified)");
    const roaValue = getMetricValue("Management Effectiveness", "Return on Assets (TTM)");

    const profitabilityScore = scoreProfitability(roe, netMargin, roaValue || "-");
    const valuationScore = scoreValuation(currentPE, pbv);
    const riskScore = scoreRisk(altmanZScore, debtToEquity, "-");
    const growthScore = scoreGrowth(
      getMetricValue("Growth", "Revenue (Quarter YoY Growth)"),
      getMetricValue("Growth", "Net Income (Quarter YoY Growth)")
    );

    fundamentalScoreData = calculateFundamentalScore(
      profitabilityScore,
      valuationScore,
      riskScore,
      growthScore
    );
  } catch (e) {
    console.error("Error calculating fundamental score:", e);
  }

  return (
    <div className="h-full overflow-y-auto p-4 space-y-4">
      {/* Header - Symbol & Name */}
      <div className="text-center pb-4 border-b border-violet-800">
        <h2 className="text-2xl font-bold text-white">{emittenInfo.symbol}</h2>
        <p className="text-xs text-violet-300 mt-1">{emittenInfo.name}</p>
        <p className="text-xs text-violet-400">{emittenInfo.sector}</p>
      </div>

      {/* Price Info */}
      <div className="bg-violet-900/50 rounded-lg p-3">
        <div className="flex justify-between items-end">
          <div>
            <p className="text-xs text-violet-400">Harga Saat Ini</p>
            <p className="text-2xl font-bold text-white">Rp {emittenInfo.price}</p>
          </div>
          <div className="text-right">
            <p className={`text-sm font-medium ${
              emittenInfo.change.startsWith("-") ? "text-red-400" : "text-green-400"
            }`}>
              {emittenInfo.percentage}%
            </p>
            <p className="text-xs text-violet-400">Prev: {emittenInfo.previous}</p>
          </div>
        </div>
      </div>

      {/* Liquidity Info */}
      <LiquidityInfo
        marketCap={marketCap}
        freeFloat={freeFloat}
      />

      {/* Key Metrics Grid */}
      <div>
        <h3 className="text-sm font-semibold text-violet-300 mb-2">Key Metrics</h3>
        <div className="grid grid-cols-2 gap-2">
          <MetricCard label="PE Ratio (TTM)" value={currentPE} />
          <MetricCard label="PBV" value={pbv} />
          <MetricCard label="ROE (TTM)" value={roe} />
          <MetricCard label="Net Margin" value={netMargin} />
          <MetricCard label="Debt/Equity" value={debtToEquity} />
          <MetricCard label="EPS (TTM)" value={epsTTM} />
        </div>
      </div>

      {/* Financial Summary */}
      <div>
        <h3 className="text-sm font-semibold text-violet-300 mb-2">Ringkasan Finansial (TTM)</h3>
        <div className="space-y-2">
          <FinancialRow label="Revenue" value={revenueTTM} />
          <FinancialRow label="Net Income" value={netIncomeTTM} />
        </div>
      </div>

      {/* Intrinsic Value Analysis */}
      {intrinsicValueData && (
        <div className="border-t border-violet-800 pt-4">
          <IntrinsicValue data={intrinsicValueData} valuationMode={valuationMode} />
        </div>
      )}

      {/* Fundamental Score */}
      {fundamentalScoreData && (
        <div className="border-t border-violet-800 pt-4">
          <FundamentalScore score={fundamentalScoreData} />
        </div>
      )}

      {/* Ownership Donut Chart */}
      {profile?.shareholder && profile.shareholder.length > 0 && (
        <div className="border-t border-violet-800 pt-4">
          <OwnershipDonut
            shareholders={profile.shareholder}
            freeFloat={freeFloat || undefined}
            marketCap={marketCap}
          />
        </div>
      )}

      {/* Company History & IPO Info */}
      {profile?.history && (
        <div className="border-t border-violet-800 pt-4">
          <CompanyHistory history={profile.history} />
        </div>
      )}

      {/* Investor Growth Chart */}
      {profile?.shareholder_numbers && profile.shareholder_numbers.length > 0 && (
        <div className="border-t border-violet-800 pt-4">
          <InvestorGrowthChart shareholderNumbers={profile.shareholder_numbers} />
        </div>
      )}

      {/* Subsidiary Companies */}
      {profile?.subsidiary && profile.subsidiary.length > 0 && (
        <div className="border-t border-violet-800 pt-4">
          <SubsidiaryCompanies subsidiaries={profile.subsidiary} />
        </div>
      )}

      {/* Business Summary */}
      {profile?.background && (
        <div>
          <h3 className="text-sm font-semibold text-violet-300 mb-2">Deskripsi Bisnis</h3>
          <p className="text-xs text-violet-200 leading-relaxed">
            {profile.background}
          </p>
        </div>
      )}
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-violet-900/30 rounded p-2">
      <p className="text-xs text-violet-400">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function FinancialRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between items-center bg-violet-900/30 rounded p-2">
      <p className="text-xs text-violet-400">{label}</p>
      <p className="text-sm font-semibold text-white">{value}</p>
    </div>
  );
}
