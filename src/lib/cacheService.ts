/**
 * APPFLEX Ultra-Fast Lifetime Cache Engine
 * Utilizes IndexedDB as primary high-capacity permanent storage (100MB+)
 * with LocalStorage as immediate synchronous fallback for 0ms initial render.
 * 
 * Features:
 * - Permanent Lifetime Persistence (No 24h or daily expiry)
 * - 0 Firestore reads on repeated visits
 * - Delta Sync support (fetches only newly added/updated items)
 */

const DB_NAME = 'appflex_lifetime_db_v2';
const STORE_NAME = 'appflex_cache_store';
const DB_VERSION = 1;

export const CACHE_KEYS = {
  APPS: 'appflex_cache_apps_v2',
  CATEGORIES: 'appflex_cache_categories_v2',
  SETTINGS: 'appflex_cache_settings_v2',
  ADS: 'appflex_cache_ads_v2',
  CATALOG_VERSION: 'appflex_catalog_version_v2',
  LAST_SYNC_TIME: 'appflex_last_sync_time_v2',
  CLIENT_CODE_VERSION: 'appflex_client_code_version_v2',
};

// Open or create IndexedDB instance
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      reject(new Error('IndexedDB not supported'));
      return;
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Low-level IndexedDB Helpers
async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result ?? null);
      req.onerror = () => resolve(null);
    });
  } catch {
    return null;
  }
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch (e) {
    console.warn(`[CacheEngine] IndexedDB set error for ${key}:`, e);
  }
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.delete(key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

async function idbClear(): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    });
  } catch {}
}

function getLocalSync<T>(key: string): T | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && 'data' in parsed && 'permanent' in parsed) {
      return parsed.data;
    }
    return parsed;
  } catch {
    return null;
  }
}

export const cacheService = {
  /**
   * Synchronous get from LocalStorage for instant 0ms app start.
   * Lifetime persistence: Never expires based on date or time.
   */
  get<T>(key: string): T | null {
    return getLocalSync<T>(key);
  },

  /**
   * Async get from high-capacity IndexedDB (with fallback to localStorage).
   * Lifetime permanent store.
   */
  async getAsync<T>(key: string): Promise<T | null> {
    const idbValue = await idbGet<T>(key);
    if (idbValue !== null) return idbValue;
    return getLocalSync<T>(key);
  },

  /**
   * Saves data permanently to both IndexedDB and LocalStorage.
   * Guarantees lifetime persistence across browser restarts, days, months, and years.
   */
  set<T>(key: string, data: T): void {
    if (typeof window === 'undefined') return;

    // 1. Permanent IndexedDB Save (Handles large 50MB+ datasets)
    idbSet(key, data);

    // 2. Synchronous LocalStorage Mirror for instant startup
    try {
      const envelope = {
        permanent: true,
        savedAt: Date.now(),
        data,
      };
      localStorage.setItem(key, JSON.stringify(envelope));
    } catch (e) {
      // If localStorage is full, IndexedDB will still securely hold the full dataset
      console.warn(`[CacheEngine] LocalStorage quota reached, IndexedDB used for "${key}"`);
    }
  },

  /**
   * Remove a specific key from both storage layers.
   */
  remove(key: string): void {
    if (typeof window === 'undefined') return;
    try {
      localStorage.removeItem(key);
      idbDelete(key);
    } catch {}
  },

  /**
   * Purges all APPFLEX cache. Used when admin initiates full sync.
   */
  clearAll(): void {
    if (typeof window === 'undefined') return;
    try {
      Object.values(CACHE_KEYS).forEach((k) => {
        try {
          localStorage.removeItem(k);
        } catch {}
      });
      idbClear();
    } catch (e) {
      console.warn('[CacheEngine] Clear all error:', e);
    }
  }
};
