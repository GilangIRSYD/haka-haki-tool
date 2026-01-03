/**
 * Environment variables validation and type-safe access
 */

const envSchema = {
  firebaseApiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  firebaseAuthDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  firebaseProjectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  firebaseStorageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  firebaseMessagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  firebaseAppId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
  firebaseMeasurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
  appEnv: process.env.NEXT_PUBLIC_APP_ENV || 'development',
};

// Type-safe environment variables
export const env = {
  get firebaseApiKey() {
    if (!envSchema.firebaseApiKey) {
      throw new Error('NEXT_PUBLIC_FIREBASE_API_KEY is not defined');
    }
    return envSchema.firebaseApiKey;
  },
  get firebaseAuthDomain() {
    if (!envSchema.firebaseAuthDomain) {
      throw new Error('NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN is not defined');
    }
    return envSchema.firebaseAuthDomain;
  },
  get firebaseProjectId() {
    if (!envSchema.firebaseProjectId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_PROJECT_ID is not defined');
    }
    return envSchema.firebaseProjectId;
  },
  get firebaseStorageBucket() {
    if (!envSchema.firebaseStorageBucket) {
      throw new Error('NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET is not defined');
    }
    return envSchema.firebaseStorageBucket;
  },
  get firebaseMessagingSenderId() {
    if (!envSchema.firebaseMessagingSenderId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID is not defined');
    }
    return envSchema.firebaseMessagingSenderId;
  },
  get firebaseAppId() {
    if (!envSchema.firebaseAppId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_APP_ID is not defined');
    }
    return envSchema.firebaseAppId;
  },
  get firebaseMeasurementId() {
    if (!envSchema.firebaseMeasurementId) {
      throw new Error('NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID is not defined');
    }
    return envSchema.firebaseMeasurementId;
  },
  get appEnv() {
    return envSchema.appEnv as 'development' | 'production';
  },
  get isDevelopment() {
    return envSchema.appEnv === 'development';
  },
  get isProduction() {
    return envSchema.appEnv === 'production';
  },
} as const;

export type Env = typeof env;
