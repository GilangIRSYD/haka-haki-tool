/**
 * Valuation thresholds and scoring configuration
 * All values are based on IDX market standards
 */

// ============================================================================
// THRESHOLDS
// ============================================================================

export const THRESHOLDS = {
  // Profitability
  roe: {
    excellent: 20, // % per year
    good: 15,
    fair: 10,
    poor: 5,
  },
  netMargin: {
    excellent: 20, // %
    good: 15,
    fair: 10,
    poor: 5,
  },
  roa: {
    excellent: 10, // %
    good: 7,
    fair: 4,
    poor: 2,
  },

  // Valuation (PE Ratio)
  pe: {
    cheap: 10, // undervalued
    fair: 15,
    expensive: 20,
  },

  // Valuation (PBV)
  pbv: {
    cheap: 1.0,
    fair: 1.5,
    expensive: 2.0,
  },

  // Risk
  debtToEquity: {
    safe: 1.0, // % ratio - hutang < ekuitas (aman untuk pasar Indonesia)
    moderate: 1.5,
    risky: 2.0,
  },
  currentRatio: {
    strong: 2.0,
    adequate: 1.5,
    weak: 1.0,
  },
  altmanZScore: {
    safe: 3.0,
    moderate: 1.8,
    distress: 1.0,
  },

  // Growth
  revenueGrowth: {
    excellent: 20, // % YoY
    good: 15,
    fair: 10,
    poor: 5,
  },
  netIncomeGrowth: {
    excellent: 20,
    good: 15,
    fair: 10,
    poor: 0,
  },
};

// ============================================================================
// SCORING WEIGHTS
// ============================================================================

export const SCORING_WEIGHTS = {
  profitability: {
    roe: 0.40,
    netMargin: 0.30,
    roa: 0.30,
  },
  valuation: {
    peScore: 0.50,
    pbvScore: 0.50,
  },
  risk: {
    altmanZScore: 0.40,
    debtToEquity: 0.30,
    currentRatio: 0.30,
  },
  growth: {
    revenueGrowth: 0.50,
    netIncomeGrowth: 0.50,
  },
};

// ============================================================================
// COLOR CODES
// ============================================================================

export const SCORE_COLORS = {
  excellent: "#22c55e", // green-500
  good: "#84cc16",      // lime-500
  fair: "#eab308",      // yellow-500
  poor: "#ef4444",      // red-500
};

export const VALUATION_COLORS = {
  undervalued: "#22c55e", // green
  fair: "#eab308",        // yellow
  overvalued: "#ef4444",  // red
};
