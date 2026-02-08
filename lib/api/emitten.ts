import { getClientIPSync } from "@/lib/utils/client-ip";

/**
 * Generate random hex string for x-nonce header
 * @returns A unique nonce string
 */
function generateNonce(): string {
  return Array.from({ length: 32 }, () =>
    Math.floor(Math.random() * 16).toString(16)
  ).join('');
}

/**
 * Base URL for API requests
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-idx.gsphomelab.org';

// ============================================================================
// Types
// ============================================================================

export interface EmittenInfo {
  symbol: string;
  name: string;
  price: string;
  change: string;
  previous: string;
  percentage: number;
  sector: string;
  sub_sector: string;
  market_cap?: string;
  volume?: string;
  value?: string;
}

export interface KeyStats {
  closure_fin_items_results: Array<{
    keystats_name: string;
    fin_name_results: Array<{
      fitem: {
        id: string;
        name: string;
        value: string;
      };
    }>;
  }>;
  stats?: {
    current_share_outstanding: string;
    market_cap: string;
    enterprise_value: string;
    free_float: string;
  };
}

export interface Profile {
  background: string;
  shareholder?: Array<{
    name: string;
    percentage: string;
    badges?: string[];
  }>;
  shareholder_numbers?: Array<{
    shareholder_date: string;
    total_share: string;
    change: number;
    change_formatted: string;
  }>;
  subsidiary?: Array<{
    company: string;
    percentage: string;
    types: string;
    value: string;
  }>;
  history?: {
    amount: string;
    board: string;
    date: string;
    price: string;
    registrar: string;
    shares: string;
    underwriters: string[];
    administrative_bureau: string;
    free_float: string;
  };
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Fetch emitten info (price, sector, etc.)
 * @param symbol Emitten symbol (e.g., "BBCA")
 * @returns Emitten info data
 */
export async function fetchEmittenInfo(symbol: string): Promise<EmittenInfo> {
  const url = `${BASE_URL}/api/v1/emitten/${symbol}/info`;
  const clientIP = getClientIPSync() || 'unknown';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-nonce': generateNonce(),
      'X-Ip-Client': clientIP,
    },
  });

  if (!response.ok) {
    throw new Error(`Emitten Info API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch emitten key stats (PE, PBV, ROE, etc.)
 * @param symbol Emitten symbol (e.g., "BBCA")
 * @returns Key stats data
 */
export async function fetchEmittenKeyStats(symbol: string): Promise<KeyStats> {
  const url = `${BASE_URL}/api/v1/emitten/${symbol}/key-stats`;
  const clientIP = getClientIPSync() || 'unknown';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-nonce': generateNonce(),
      'X-Ip-Client': clientIP,
    },
  });

  if (!response.ok) {
    throw new Error(`Emitten Key Stats API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch emitten profile (background, shareholders, etc.)
 * @param symbol Emitten symbol (e.g., "BBCA")
 * @returns Profile data
 */
export async function fetchEmittenProfile(symbol: string): Promise<Profile> {
  const url = `${BASE_URL}/api/v1/emitten/${symbol}/profile`;
  const clientIP = getClientIPSync() || 'unknown';

  const response = await fetch(url, {
    method: 'GET',
    headers: {
      'x-nonce': generateNonce(),
      'X-Ip-Client': clientIP,
    },
  });

  if (!response.ok) {
    throw new Error(`Emitten Profile API Error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();
  return data.data;
}

/**
 * Fetch all emitten data in parallel
 * @param symbol Emitten symbol (e.g., "BBCA")
 * @returns Object containing info, keyStats, and profile
 */
export async function fetchAllEmittenData(symbol: string) {
  const [info, keyStats, profile] = await Promise.all([
    fetchEmittenInfo(symbol),
    fetchEmittenKeyStats(symbol),
    fetchEmittenProfile(symbol),
  ]);

  return { info, keyStats, profile };
}
