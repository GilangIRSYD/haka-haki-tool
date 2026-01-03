/**
 * Device ID generation and persistence
 * Generates anonymous but persistent device identification
 */

import { v4 as uuidv4 } from 'uuid';

const DEVICE_ID_KEY = 'haka_haki_device_id';
const DEVICE_ID_EXPIRY_DAYS = 365;

/**
 * Get or create a persistent device ID
 * Uses localStorage with 365-day expiry, falls back to sessionStorage
 * @returns Device ID string
 */
export function getOrCreateDeviceId(): string {
  // Only run on client-side
  if (typeof window === 'undefined') {
    return uuidv4();
  }

  try {
    // Try localStorage first (persistent across sessions)
    let deviceId = localStorage.getItem(DEVICE_ID_KEY);

    if (!deviceId) {
      // Generate new device ID
      deviceId = uuidv4();
      localStorage.setItem(DEVICE_ID_KEY, deviceId);

      // Set expiry timestamp
      const expiry = Date.now() + (DEVICE_ID_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
      localStorage.setItem(`${DEVICE_ID_KEY}_expiry`, expiry.toString());
    } else {
      // Check if device ID has expired
      const expiry = parseInt(localStorage.getItem(`${DEVICE_ID_KEY}_expiry`) || '0');

      if (Date.now() > expiry) {
        // Regenerate if expired
        deviceId = uuidv4();
        localStorage.setItem(DEVICE_ID_KEY, deviceId);

        const newExpiry = Date.now() + (DEVICE_ID_EXPIRY_DAYS * 24 * 60 * 60 * 1000);
        localStorage.setItem(`${DEVICE_ID_KEY}_expiry`, newExpiry.toString());
      }
    }

    return deviceId;
  } catch (error) {
    // Fallback to sessionStorage if localStorage fails (e.g., private browsing)
    console.warn('[Device ID] localStorage unavailable, falling back to sessionStorage');

    try {
      let sessionId = sessionStorage.getItem(DEVICE_ID_KEY);

      if (!sessionId) {
        sessionId = uuidv4();
        sessionStorage.setItem(DEVICE_ID_KEY, sessionId);
      }

      return sessionId;
    } catch (sessionError) {
      // Ultimate fallback: generate new ID each time
      console.warn('[Device ID] sessionStorage unavailable, generating temporary ID');
      return uuidv4();
    }
  }
}

/**
 * Reset the device ID
 * Useful for testing or privacy requests
 */
export function resetDeviceId(): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    localStorage.removeItem(DEVICE_ID_KEY);
    localStorage.removeItem(`${DEVICE_ID_KEY}_expiry`);
  } catch (error) {
    console.warn('[Device ID] Failed to reset localStorage device ID');
  }

  try {
    sessionStorage.removeItem(DEVICE_ID_KEY);
  } catch (error) {
    console.warn('[Device ID] Failed to reset sessionStorage device ID');
  }
}

/**
 * Get device ID without generating a new one
 * @returns Device ID or null if not exists
 */
export function getDeviceId(): string | null {
  if (typeof window === 'undefined') {
    return null;
  }

  try {
    return localStorage.getItem(DEVICE_ID_KEY) || sessionStorage.getItem(DEVICE_ID_KEY) || null;
  } catch (error) {
    return null;
  }
}

/**
 * Check if device ID exists and is valid
 * @returns true if device ID exists and is not expired
 */
export function hasValidDeviceId(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  try {
    const deviceId = localStorage.getItem(DEVICE_ID_KEY);
    if (!deviceId) {
      return false;
    }

    const expiry = parseInt(localStorage.getItem(`${DEVICE_ID_KEY}_expiry`) || '0');
    return Date.now() <= expiry;
  } catch (error) {
    return false;
  }
}
