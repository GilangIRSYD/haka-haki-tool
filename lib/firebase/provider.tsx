/**
 * Firebase Provider Component
 * Wraps the application with Firebase initialization
 */

'use client';

import { useEffect } from 'react';
import { getFirebaseAnalytics } from './config';

interface FirebaseProviderProps {
  children: React.ReactNode;
}

/**
 * Firebase Provider Component
 * Initializes Firebase Analytics on client-side
 */
export function FirebaseProvider({ children }: FirebaseProviderProps) {
  useEffect(() => {
    // Initialize Firebase Analytics on mount
    if (typeof window !== 'undefined') {
      try {
        getFirebaseAnalytics();
        console.log('[Firebase] Analytics initialized');
      } catch (error) {
        console.error('[Firebase] Failed to initialize Analytics:', error);
      }
    }
  }, []);

  return <>{children}</>;
}
