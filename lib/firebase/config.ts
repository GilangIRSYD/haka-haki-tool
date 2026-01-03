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
        apiKey: 'AIzaSyBqw8qOZtgsaGJnUXrSzW_UkHdGi-MQ-jM',
        authDomain: 'haka-haki.firebaseapp.com',
        projectId: 'haka-haki',
        storageBucket: 'haka-haki.firebasestorage.app',
        messagingSenderId: '804258381448',
        appId: '1:804258381448:web:3a05363ec43c896580e93d',
        measurementId: 'G-6WTKTJJVN7',
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
