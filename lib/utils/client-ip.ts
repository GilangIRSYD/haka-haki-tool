/**
 * Client IP Detection Utility
 * Fetches and caches user's public IP address
 */

const IP_STORAGE_KEY = 'user_public_ip';
const IP_STORAGE_TIMESTAMP_KEY = 'user_public_ip_timestamp';
const IP_CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

/**
 * Fetch user's public IP address
 * Uses multiple fallback services for reliability
 */
async function fetchPublicIP(): Promise<string> {
  const services = [
    'https://api.ipify.org?format=json',
    'https://ipapi.co/json/',
    'https://ifconfig.me/ip',
  ];

  for (const service of services) {
    try {
      const response = await fetch(service);

      if (!response.ok) {
        continue;
      }

      // Handle different response formats
      if (service.includes('ipify')) {
        const data = await response.json();
        return data.ip;
      } else if (service.includes('ipapi')) {
        const data = await response.json();
        return data.ip;
      } else {
        // Plain text response
        return await response.text();
      }
    } catch (error) {
      console.warn(`Failed to fetch IP from ${service}:`, error);
      continue;
    }
  }

  throw new Error('Failed to fetch public IP from all services');
}

/**
 * Get cached IP from localStorage if available and not expired
 */
function getCachedIP(): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const cachedIP = localStorage.getItem(IP_STORAGE_KEY);
    const timestamp = localStorage.getItem(IP_STORAGE_TIMESTAMP_KEY);

    if (!cachedIP || !timestamp) {
      return null;
    }

    const cacheAge = Date.now() - parseInt(timestamp, 10);

    // Return cached IP if still valid
    if (cacheAge < IP_CACHE_DURATION) {
      return cachedIP;
    }

    // Clear expired cache
    localStorage.removeItem(IP_STORAGE_KEY);
    localStorage.removeItem(IP_STORAGE_TIMESTAMP_KEY);
    return null;
  } catch (error) {
    console.warn('Failed to read cached IP:', error);
    return null;
  }
}

/**
 * Cache IP address in localStorage
 */
function cacheIP(ip: string): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(IP_STORAGE_KEY, ip);
    localStorage.setItem(IP_STORAGE_TIMESTAMP_KEY, Date.now().toString());
  } catch (error) {
    console.warn('Failed to cache IP:', error);
  }
}

/**
 * Get user's public IP address
 * Returns cached IP if available, otherwise fetches fresh IP
 *
 * @param forceRefresh - Force fetch new IP even if cached
 * @returns Promise<string> - User's public IP address
 */
export async function getClientIP(forceRefresh = false): Promise<string> {
  // Try to get cached IP first
  if (!forceRefresh) {
    const cachedIP = getCachedIP();
    if (cachedIP) {
      return cachedIP;
    }
  }

  // Fetch fresh IP
  try {
    const ip = await fetchPublicIP();
    cacheIP(ip);
    return ip;
  } catch (error) {
    console.error('Failed to fetch client IP:', error);

    // Return fallback if available (even if expired)
    const cachedIP = getCachedIP();
    if (cachedIP) {
      console.warn('Using expired cached IP as fallback');
      return cachedIP;
    }

    // Return unknown as last resort
    return 'unknown';
  }
}

/**
 * Get IP synchronously (returns cached IP or null)
 * Useful for adding to requests immediately without awaiting
 */
export function getClientIPSync(): string | null {
  return getCachedIP();
}

/**
 * Clear cached IP (useful for testing or privacy)
 */
export function clearCachedIP(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(IP_STORAGE_KEY);
    localStorage.removeItem(IP_STORAGE_TIMESTAMP_KEY);
  } catch (error) {
    console.warn('Failed to clear cached IP:', error);
  }
}

/**
 * Initialize IP detection on app load
 * Starts fetching IP in background without blocking
 */
export function initializeIPDetection(): void {
  // Start fetching IP in background
  getClientIP().catch((error) => {
    console.error('Failed to initialize IP detection:', error);
  });
}
