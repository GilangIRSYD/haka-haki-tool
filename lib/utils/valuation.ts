/**
 * Valuation and scoring utilities
 * Calculate intrinsic value and fundamental scores from key stats data
 */

import { THRESHOLDS, SCORING_WEIGHTS, SCORE_COLORS } from "@/config/valuation";

// ============================================================================
// TYPES
// ============================================================================

export interface IntrinsicValueResult {
  graham: number;
  peterLynch: number;
  ihsgRelative: number;
  assetBased: number;
  range: {
    low: number;
    mid: number;
    high: number;
  };
  currentPrice: number;
  upside: number;
  status: "undervalued" | "fair" | "overvalued";
}

export interface FundamentalScore {
  profitability: number;
  valuation: number;
  risk: number;
  growth: number;
  overall: number;
}

export interface ScoreDetail {
  score: number;
  label: string;
  color: string;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Parse percentage string to number
 * Handles formats like "15.5%", "15.5", "(15.5)"
 */
export function parsePercentage(value: string | number): number {
  if (typeof value === "number") return value;
  const cleaned = value.toString().replace(/[%(),]/g, "").trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parse number string to actual number
 * Handles formats like "1,155 B", "62 B", etc.
 */
export function parseNumber(value: string | number): number {
  if (typeof value === "number") return value;

  // Handle billions
  if (value.toString().includes("B")) {
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
    return num * 1000000000;
  }

  // Handle millions
  if (value.toString().includes("M")) {
    const num = parseFloat(value.toString().replace(/[^0-9.]/g, ""));
    return num * 1000000;
  }

  return parseFloat(value.toString()) || 0;
}

/**
 * Linear interpolation for scoring
 */
function scoreInRange(value: number, min: number, max: number): number {
  if (value >= max) return 100;
  if (value <= min) return 0;
  return ((value - min) / (max - min)) * 100;
}

/**
 * Reverse scoring (higher is worse)
 */
function scoreReverse(value: number, good: number, bad: number): number {
  if (value <= good) return 100;
  if (value >= bad) return 0;
  return 100 - ((value - good) / (bad - good)) * 100;
}

/**
 * Get color based on score
 */
export function getScoreColor(score: number): string {
  if (score >= 80) return SCORE_COLORS.excellent;
  if (score >= 60) return SCORE_COLORS.good;
  if (score >= 40) return SCORE_COLORS.fair;
  return SCORE_COLORS.poor;
}

/**
 * Get label based on score
 */
export function getScoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Fair";
  return "Poor";
}

// ============================================================================
// INTRINSIC VALUE CALCULATIONS
// ============================================================================

/**
 * Calculate intrinsic value using Benjamin Graham formula
 * Fair Value = EPS × (8.5 + 2 × g)
 * Where g = growth rate in %
 */
export function calculateGrahamValue(
  eps: number,
  growthRate: number
): number {
  const g = Math.min(Math.max(growthRate, 0), 50); // Cap growth at 50%
  return eps * (8.5 + 2 * g);
}

/**
 * Calculate fair value using Peter Lynch approach
 * Fair PE should equal growth rate
 */
export function calculatePeterLynchValue(
  eps: number,
  growthRate: number
): number {
  const g = Math.max(growthRate, 0);
  return eps * g;
}

/**
 * Calculate fair value relative to IHSG PE
 */
export function calculateIHSGRelativeValue(
  eps: number,
  ihsgPE: number
): number {
  return eps * ihsgPE;
}

/**
 * Get asset-based floor value (Book Value per Share)
 */
export function getAssetBasedValue(bookValuePerShare: number): number {
  return bookValuePerShare;
}

/**
 * Calculate comprehensive intrinsic value
 */
export function calculateIntrinsicValue(
  eps: number,
  bookValuePerShare: number,
  growthRate: number,
  currentPrice: number,
  ihsgPE: number,
  valuationMode: "conservative" | "moderate" | "aggressive" = "moderate"
): IntrinsicValueResult {
  // Calculate multipliers based on valuation mode
  const getMultiplier = (mode: "conservative" | "moderate" | "aggressive") => {
    switch (mode) {
      case "conservative":
        return {
          graham: 0.85,    // 15% discount
          peterLynch: 0.80, // 20% discount
          ihsgRelative: 0.85, // 15% discount
          assetBased: 0.90, // 10% discount
        };
      case "moderate":
        return {
          graham: 1.0,
          peterLynch: 1.0,
          ihsgRelative: 1.0,
          assetBased: 1.0,
        };
      case "aggressive":
        return {
          graham: 1.15,    // 15% premium
          peterLynch: 1.20, // 20% premium
          ihsgRelative: 1.15, // 15% premium
          assetBased: 1.10, // 10% premium
        };
    }
  };

  const multiplier = getMultiplier(valuationMode);

  // Calculate all methods with multipliers
  const graham = calculateGrahamValue(eps, growthRate) * multiplier.graham;
  const peterLynch = calculatePeterLynchValue(eps, growthRate) * multiplier.peterLynch;
  const ihsgRelative = calculateIHSGRelativeValue(eps, ihsgPE) * multiplier.ihsgRelative;
  const assetBased = getAssetBasedValue(bookValuePerShare) * multiplier.assetBased;

  // Determine range (use reasonable values)
  const values = [graham, peterLynch, ihsgRelative, assetBased].filter(
    (v) => v > 0 && v < currentPrice * 10 // Filter outliers
  );

  const low = Math.min(...values);
  const high = Math.max(...values);
  const mid = (low + high) / 2;

  // Calculate upside/downside
  const upside = ((mid - currentPrice) / currentPrice) * 100;

  // Determine status
  let status: "undervalued" | "fair" | "overvalued";
  if (upside > 20) status = "undervalued";
  else if (upside < -20) status = "overvalued";
  else status = "fair";

  return {
    graham,
    peterLynch,
    ihsgRelative,
    assetBased,
    range: { low, mid, high },
    currentPrice,
    upside,
    status,
  };
}

// ============================================================================
// FUNDAMENTAL SCORE CALCULATIONS
// ============================================================================

/**
 * Score profitability based on ROE, Net Margin, ROA
 */
export function scoreProfitability(
  roe: string | number,
  netMargin: string | number,
  roa: string | number
): ScoreDetail {
  const roeValue = parsePercentage(roe);
  const nmValue = parsePercentage(netMargin);
  const roaValue = parsePercentage(roa);

  // Score individual metrics
  const roeScore = scoreInRange(
    roeValue,
    THRESHOLDS.roe.poor,
    THRESHOLDS.roe.excellent
  );
  const nmScore = scoreInRange(
    nmValue,
    THRESHOLDS.netMargin.poor,
    THRESHOLDS.netMargin.excellent
  );
  const roaScore = scoreInRange(
    roaValue,
    THRESHOLDS.roa.poor,
    THRESHOLDS.roa.excellent
  );

  // Weighted average
  const finalScore =
    roeScore * SCORING_WEIGHTS.profitability.roe +
    nmScore * SCORING_WEIGHTS.profitability.netMargin +
    roaScore * SCORING_WEIGHTS.profitability.roa;

  return {
    score: Math.round(finalScore),
    label: getScoreLabel(finalScore),
    color: getScoreColor(finalScore),
  };
}

/**
 * Score valuation based on PE and PBV
 */
export function scoreValuation(
  pe: string | number,
  pbv: string | number,
  ihsgPE?: string | number
): ScoreDetail {
  const peValue = parsePercentage(pe);
  const pbvValue = parsePercentage(pbv);

  // Score PE (lower is better, reverse score)
  let peScore: number;
  if (ihsgPE) {
    const ihsgPEValue = parsePercentage(ihsgPE);
    // Compare to IHSG PE
    const ratio = peValue / ihsgPEValue;
    if (ratio <= 0.8) peScore = 100;
    else if (ratio <= 1.0) peScore = 80;
    else if (ratio <= 1.2) peScore = 60;
    else if (ratio <= 1.5) peScore = 40;
    else peScore = 20;
  } else {
    peScore = scoreReverse(
      peValue,
      THRESHOLDS.pe.cheap,
      THRESHOLDS.pe.expensive * 2
    );
  }

  // Score PBV (lower is better)
  const pbvScore = scoreReverse(
    pbvValue,
    THRESHOLDS.pbv.cheap,
    THRESHOLDS.pbv.expensive * 2
  );

  // Weighted average
  const finalScore =
    peScore * SCORING_WEIGHTS.valuation.peScore +
    pbvScore * SCORING_WEIGHTS.valuation.pbvScore;

  return {
    score: Math.round(finalScore),
    label: getScoreLabel(finalScore),
    color: getScoreColor(finalScore),
  };
}

/**
 * Score risk based on Altman Z-Score, D/E, Current Ratio
 */
export function scoreRisk(
  altmanZScore: string | number,
  debtToEquity: string | number,
  currentRatio: string | number
): ScoreDetail {
  const zScore = parsePercentage(altmanZScore);
  const derValue = parsePercentage(debtToEquity);
  const crValue = parsePercentage(currentRatio);

  // Score Altman Z-Score (higher is better)
  const zScoreScore = scoreInRange(
    zScore,
    THRESHOLDS.altmanZScore.distress,
    THRESHOLDS.altmanZScore.safe + 2
  );

  // Score D/E (lower is better)
  const derScore = scoreReverse(
    derValue,
    THRESHOLDS.debtToEquity.safe,
    THRESHOLDS.debtToEquity.risky
  );

  // Score Current Ratio (higher is better)
  const crScore = scoreInRange(
    crValue,
    THRESHOLDS.currentRatio.weak,
    THRESHOLDS.currentRatio.strong + 1
  );

  // Weighted average
  const finalScore =
    zScoreScore * SCORING_WEIGHTS.risk.altmanZScore +
    derScore * SCORING_WEIGHTS.risk.debtToEquity +
    crScore * SCORING_WEIGHTS.risk.currentRatio;

  return {
    score: Math.round(finalScore),
    label: getScoreLabel(finalScore),
    color: getScoreColor(finalScore),
  };
}

/**
 * Score growth based on Revenue and Net Income growth
 */
export function scoreGrowth(
  revenueGrowth: string | number,
  netIncomeGrowth: string | number
): ScoreDetail {
  const rgValue = parsePercentage(revenueGrowth);
  const nigValue = parsePercentage(netIncomeGrowth);

  // Score individual metrics
  const rgScore = scoreInRange(
    rgValue,
    THRESHOLDS.revenueGrowth.poor,
    THRESHOLDS.revenueGrowth.excellent + 10
  );
  const nigScore = scoreInRange(
    nigValue,
    THRESHOLDS.netIncomeGrowth.poor,
    THRESHOLDS.netIncomeGrowth.excellent + 10
  );

  // Weighted average
  const finalScore =
    rgScore * SCORING_WEIGHTS.growth.revenueGrowth +
    nigScore * SCORING_WEIGHTS.growth.netIncomeGrowth;

  return {
    score: Math.round(finalScore),
    label: getScoreLabel(finalScore),
    color: getScoreColor(finalScore),
  };
}

/**
 * Calculate overall fundamental score
 */
export function calculateFundamentalScore(
  profitability: ScoreDetail,
  valuation: ScoreDetail,
  risk: ScoreDetail,
  growth: ScoreDetail
): FundamentalScore {
  const overall = Math.round(
    (profitability.score * 0.25 +
      valuation.score * 0.25 +
      risk.score * 0.25 +
      growth.score * 0.25)
  );

  return {
    profitability: profitability.score,
    valuation: valuation.score,
    risk: risk.score,
    growth: growth.score,
    overall,
  };
}
