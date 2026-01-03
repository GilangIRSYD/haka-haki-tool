/**
 * Firebase configuration and initialization
 */

import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAnalytics, Analytics } from 'firebase/analytics';
import { env } from '@/lib/env';

let app: FirebaseApp | null = null;
let analytics: Analytics | null = null;

/**
 * Get or initialize Firebase app
 * @returns Firebase app instance
 */
export function getFirebaseApp(): FirebaseApp {
  if (!app) {
    const apps = getApps();

    if (apps.length === 0) {
      // Initialize new app
      app = initializeApp({
        apiKey: env.firebaseApiKey,
        authDomain: env.firebaseAuthDomain,
        projectId: env.firebaseProjectId,
        storageBucket: env.firebaseStorageBucket,
        messagingSenderId: env.firebaseMessagingSenderId,
        appId: env.firebaseAppId,
        measurementId: env.firebaseMeasurementId,
      });
    } else {
      // Use existing app
      app = apps[0];
    }
  }

  return app;
}

/**
 * Get or initialize Firebase Analytics
 * @returns Analytics instance or null (server-side)
 */
export function getFirebaseAnalytics(): Analytics | null {
  // Analytics only works on client-side
  if (typeof window === 'undefined') {
    return null;
  }

  if (!analytics) {
    try {
      const firebaseApp = getFirebaseApp();
      analytics = getAnalytics(firebaseApp);
    } catch (error) {
      console.error('[Firebase] Failed to initialize Analytics:', error);
      return null;
    }
  }

  return analytics;
}

/**
 * Reset Firebase instances
 * Useful for testing
 */
export function resetFirebase(): void {
  app = null;
  analytics = null;
}
