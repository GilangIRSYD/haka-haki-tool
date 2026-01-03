/**
 * Generate unique nonce for API requests
 * @returns A unique nonce string
 */
function generateNonce(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
}

/**
 * Base URL for API requests
 */
const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://api-idx.gsphomelab.org';

// ============================================================================
// Types
// ============================================================================

export interface ShareLinkRequest {
  symbol: string;
  from: string;
  to: string;
  broker_code: string[];
  customSlug?: string;
  ttlDays?: number;
}

export interface ShareLinkResponse {
  success: boolean;
  data: {
    slug: string;
    url: string;
    expiresAt: string;
    createdAt: string;
    queryParams: {
      symbol: string;
      from: string;
      to: string;
      broker_code: string[];
    };
    isCustomSlug: boolean;
  };
}

export interface SharedLinkData {
  slug: string;
  queryParams: {
    symbol: string;
    from: string;
    to: string;
    broker_code: string[];
  };
  createdAt: string;
  expiresAt: string;
  clickCount: number;
  isCustomSlug: boolean;
  isValid: boolean;
  remainingTime: number;
}

export interface GetSharedLinkResponse {
  success: boolean;
  data: SharedLinkData;
}

// ============================================================================
// API Functions
// ============================================================================

/**
 * Create a new share link
 * @param request - Share link parameters
 * @returns Promise with created share link data
 * @throws Error if request fails
 */
export async function createShareLink(request: ShareLinkRequest): Promise<ShareLinkResponse> {
  const nonce = generateNonce();

  const response = await fetch(`${BASE_URL}/api/v1/share-link`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Nonce': nonce,
    },
    body: JSON.stringify(request),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to create share link');
  }

  return response.json();
}

/**
 * Get shared link data by slug
 * Automatically increments click count on backend
 * @param slug - Share link slug
 * @returns Promise with shared link data
 * @throws Error if share link is not found or expired
 */
export async function getSharedLink(slug: string): Promise<GetSharedLinkResponse> {
  const nonce = generateNonce();

  const response = await fetch(`${BASE_URL}/api/v1/share-link/${slug}`, {
    method: 'GET',
    headers: {
      'X-Nonce': nonce,
    },
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Invalid or expired share link');
  }

  return response.json();
}
