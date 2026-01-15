import { BigPlayerResponse } from "@/components/bigplayer/types";

function generateNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

export interface BigPlayerParams {
  dateStart: string;
  dateEnd: string;
  crawlType?: "ALL" | "PARTIAL";
  page?: number;
}

/**
 * Fetch Big Player Movement data from IDX API
 * @param params - Query parameters
 * @returns Promise with Big Player data
 */
export async function fetchBigPlayerMovement(
  params: BigPlayerParams
): Promise<BigPlayerResponse> {
  const baseUrl = 'https://api-idx.gsphomelab.org/api/v1';
  const endpoint = '/big-players';

  const queryParams = new URLSearchParams({
    date_start: params.dateStart,
    date_end: params.dateEnd,
    crawl_type: params.crawlType || "ALL",
  });

  if (params.crawlType === "PARTIAL" && params.page) {
    queryParams.append("page", params.page.toString());
  }

  const url = `${baseUrl}${endpoint}?${queryParams.toString()}`;

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        "X-Nonce": generateNonce(),
      },
    });

    if (!response.ok) {
      throw new Error(
        `Big Player Movement API Error: ${response.status} ${response.statusText}`
      );
    }

    const data: BigPlayerResponse = await response.json();
    return data;
  } catch (error) {
    console.error("Failed to fetch Big Player Movement:", error);
    throw error;
  }
}

/**
 * Calculate days between two dates
 */
export function getDaysDifference(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);
  const diffTime = Math.abs(end.getTime() - start.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Determine crawl type based on date range
 * - ALL: for date range <= 90 days (3 months)
 * - PARTIAL: for date range > 90 days (with pagination)
 */
export function getCrawlTypeForDateRange(
  startDate: string,
  endDate: string
): "ALL" | "PARTIAL" {
  const days = getDaysDifference(startDate, endDate);
  return days <= 90 ? "ALL" : "PARTIAL";
}
