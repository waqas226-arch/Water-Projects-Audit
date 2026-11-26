/**
 * Faizan Global Relief Foundation (FGRF) - Water Projects Audit System
 * Central Cloud Database & Firebase Configuration Service
 * 
 * Configures Firebase App, Cloud Firestore with multi-tab offline persistence,
 * Firebase Authentication, and optional local emulator suite.
 * 
 * Form Reference: FGRF-WTS-AUD-002.00-26
 * Author: Syed Waqas, Manager MIS (Data Management & ERP Department - FGRF)
 */

import { initializeApp, getApps, getApp, FirebaseApp } from 'firebase/app';
import { getAuth, connectAuthEmulator, Auth } from 'firebase/auth';
import { 
  initializeFirestore, 
  getFirestore, 
  persistentLocalCache, 
  persistentMultipleTabManager, 
  connectFirestoreEmulator, 
  Firestore 
} from 'firebase/firestore';

export interface FirebaseClientConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket?: string;
  messagingSenderId?: string;
  appId?: string;
  measurementId?: string;
}

const STORAGE_CUSTOM_CONFIG_KEY = 'fgrf_firebase_custom_config_v1';

/**
 * Resolves the active Firebase configuration.
 * Priority:
 * 1. Admin UI Custom Configuration (stored in localStorage)
 * 2. Window runtime global (__FGRF_FIREBASE_CONFIG__)
 * 3. Vite Build Environment Variables (import.meta.env.VITE_FIREBASE_*)
 */
export function getFirebaseConfig(): FirebaseClientConfig | null {
  // 1. Check custom configuration from Admin UI
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      const customRaw = window.localStorage.getItem(STORAGE_CUSTOM_CONFIG_KEY);
      if (customRaw) {
        const parsed = JSON.parse(customRaw);
        if (parsed && parsed.apiKey && parsed.projectId && !parsed.apiKey.includes('YourFirebaseApiKey')) {
          return parsed;
        }
      }
    }
  } catch {}

  // 2. Check window runtime injected global
  if (typeof window !== 'undefined' && (window as any).__FGRF_FIREBASE_CONFIG__) {
    const injected = (window as any).__FGRF_FIREBASE_CONFIG__;
    if (injected.apiKey && injected.projectId) return injected;
  }

  // 3. Check Vite build-time environment variables
  const envApiKey = (import.meta as any).env?.VITE_FIREBASE_API_KEY;
  const envProjectId = (import.meta as any).env?.VITE_FIREBASE_PROJECT_ID;

  if (envApiKey && envProjectId && !envApiKey.includes('YourFirebaseApiKey') && envApiKey !== 'MY_FIREBASE_API_KEY') {
    return {
      apiKey: envApiKey,
      authDomain: (import.meta as any).env?.VITE_FIREBASE_AUTH_DOMAIN || `${envProjectId}.firebaseapp.com`,
      projectId: envProjectId,
      storageBucket: (import.meta as any).env?.VITE_FIREBASE_STORAGE_BUCKET || `${envProjectId}.appspot.com`,
      messagingSenderId: (import.meta as any).env?.VITE_FIREBASE_MESSAGING_SENDER_ID || '',
      appId: (import.meta as any).env?.VITE_FIREBASE_APP_ID || '',
      measurementId: (import.meta as any).env?.VITE_FIREBASE_MEASUREMENT_ID || '',
    };
  }

  return null;
}

/**
 * Checks whether valid Firebase credentials have been configured.
 */
export function isFirebaseConfigured(): boolean {
  const cfg = getFirebaseConfig();
  return !!(cfg && cfg.apiKey && cfg.projectId && cfg.apiKey.trim().length > 5);
}

/**
 * Saves custom Firebase configuration entered by Super Admin in the UI.
 */
export function saveCustomFirebaseConfig(config: FirebaseClientConfig): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.setItem(STORAGE_CUSTOM_CONFIG_KEY, JSON.stringify(config));
    }
  } catch (err) {
    console.error('Failed to save custom Firebase config:', err);
  }
}

/**
 * Clears custom Firebase configuration from local storage.
 */
export function clearCustomFirebaseConfig(): void {
  try {
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(STORAGE_CUSTOM_CONFIG_KEY);
    }
  } catch {}
}

let firebaseApp: FirebaseApp | null = null;
let firebaseAuth: Auth | null = null;
let firestoreDb: Firestore | null = null;
let emulatorsConnected = false;

/**
 * Initializes Firebase App, Auth, and Firestore with multi-tab offline persistence.
 * Gracefully returns null if Firebase credentials have not yet been provided.
 */
export function getFirebaseServices(): {
  app: FirebaseApp | null;
  auth: Auth | null;
  db: Firestore | null;
  isConfigured: boolean;
} {
  const config = getFirebaseConfig();

  if (!config) {
    return {
      app: null,
      auth: null,
      db: null,
      isConfigured: false,
    };
  }

  try {
    if (!firebaseApp) {
      const existingApps = getApps();
      firebaseApp = existingApps.length > 0 ? getApp() : initializeApp(config);
    }

    if (!firebaseAuth && firebaseApp) {
      firebaseAuth = getAuth(firebaseApp);
    }

    if (!firestoreDb && firebaseApp) {
      try {
        // Enable persistent local cache with multi-tab management for offline field usage
        firestoreDb = initializeFirestore(firebaseApp, {
          localCache: persistentLocalCache({
            tabManager: persistentMultipleTabManager(),
          }),
        });
      } catch (err) {
        // If initializeFirestore with cache was already called or in unsupported environment
        firestoreDb = getFirestore(firebaseApp);
      }
    }

    // Connect to local emulators if explicitly requested in environment
    const useEmulator = (import.meta as any).env?.VITE_USE_FIREBASE_EMULATOR === 'true';
    if (useEmulator && !emulatorsConnected && firebaseAuth && firestoreDb) {
      try {
        connectAuthEmulator(firebaseAuth, 'http://localhost:9099', { disableWarnings: true });
        connectFirestoreEmulator(firestoreDb, 'localhost', 8080);
        emulatorsConnected = true;
        console.log('[FGRF Firebase] Connected to local Firebase Emulators (Auth: 9099, Firestore: 8080)');
      } catch (e) {
        console.warn('[FGRF Firebase] Emulator connection notice:', e);
      }
    }

    return {
      app: firebaseApp,
      auth: firebaseAuth,
      db: firestoreDb,
      isConfigured: true,
    };
  } catch (err) {
    console.error('[FGRF Firebase] Initialization error:', err);
    return {
      app: null,
      auth: null,
      db: null,
      isConfigured: false,
    };
  }
}
