import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cacheService, CACHE_KEYS } from '../lib/cacheService';
import { useSettings } from './SettingsContext';

export interface AppItemData {
  id: string;
  name: string;
  category: string;
  categoryName?: string;
  icon: string;
  mainImage?: string;
  rating?: string;
  size?: string;
  downloads?: string | number;
  downloadUrl?: string;
  bannerImage?: string;
  isBanner?: boolean;
  itemType?: 'app' | 'game' | 'bundle' | 'pc';
  fullDescription?: string;
  screenshots?: string[];
  status?: string;
  updatedAt?: any;
  createdAt?: any;
  appNumber?: string;
  downloadButtonText?: string;
}

export interface CategoryData {
  id: string;
  name: string;
  icon?: string;
  itemType?: string;
  mainType?: string;
}

interface AppsContextType {
  apps: AppItemData[];
  categories: CategoryData[];
  loading: boolean;
  getCategoryName: (catIdOrName?: string) => string;
  refreshApps: (force?: boolean) => Promise<void>;
  getAppById: (id: string) => Promise<AppItemData | null>;
}

const AppsContext = createContext<AppsContextType | undefined>(undefined);

export const AppsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { settings } = useSettings();

  const [apps, setApps] = useState<AppItemData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Stable references
  const appsRef = useRef<AppItemData[]>([]);
  const categoriesRef = useRef<CategoryData[]>([]);
  const isSyncingRef = useRef<boolean>(false);

  appsRef.current = apps;
  categoriesRef.current = categories;

  /**
   * ULTRA-OPTIMIZED 1-READ FETCHER:
   * First tries to fetch `settings/catalog` (exactly 1 document read for all 300+ apps).
   * Fallback to direct collections only if catalog snapshot document is not yet built by admin.
   */
  const fetchCatalogFromFirestore = useCallback(async (currentLocalApps: AppItemData[], currentLocalCats: CategoryData[]) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    try {
      console.log(`[AppsProvider] Fetching 1-Document Snapshot (Server v${settings.catalogVersion || 1})...`);

      // ATTEMPT 1: Single document read (`settings/catalog`) = EXACTLY 1 READ!
      let fetchedApps: AppItemData[] = [];
      let fetchedCats: CategoryData[] = [];

      try {
        const catalogSnap = await getDoc(doc(db, 'settings', 'catalog'));
        if (catalogSnap.exists()) {
          const data = catalogSnap.data();
          if (data && Array.isArray(data.apps) && data.apps.length > 0) {
            fetchedApps = (data.apps as AppItemData[]).filter(item => !item.status || item.status === 'published');
            fetchedCats = (data.categories || []) as CategoryData[];
            console.log(`[AppsProvider] SUCCESS: Loaded entire catalog (${fetchedApps.length} apps) with 1 SINGLE FIRESTORE READ!`);
          }
        }
      } catch (e) {
        console.warn('[AppsProvider] Single catalog document read note:', e);
      }

      // ATTEMPT 2: Fallback if single document snapshot wasn't available yet
      if (fetchedApps.length === 0) {
        console.log('[AppsProvider] Fallback: Fetching from collections...');
        const [appsSnap, catsSnap] = await Promise.all([
          getDocs(collection(db, 'apps')),
          getDocs(collection(db, 'categories'))
        ]);

        fetchedApps = appsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as AppItemData))
          .filter(item => !item.status || item.status === 'published');

        fetchedCats = catsSnap.docs
          .map(d => ({ id: d.id, ...d.data() } as CategoryData));
      }

      // Update state
      setApps(fetchedApps);
      setCategories(fetchedCats);
      setLoading(false);

      // Save Permanently to Lifetime IndexedDB
      await Promise.all([
        cacheService.set(CACHE_KEYS.APPS, fetchedApps),
        cacheService.set(CACHE_KEYS.CATEGORIES, fetchedCats),
        cacheService.set(CACHE_KEYS.CATALOG_VERSION, settings.catalogVersion || 1),
        cacheService.set(CACHE_KEYS.LAST_SYNC_TIME, Date.now())
      ]);

      console.log(`[AppsProvider] Saved to Permanent IndexedDB: ${fetchedApps.length} items.`);
    } catch (err) {
      console.warn('[AppsProvider] Network/fetch note, using local cache:', err);
      if (currentLocalApps.length > 0) {
        setApps(currentLocalApps);
        setCategories(currentLocalCats);
      }
      setLoading(false);
    } finally {
      isSyncingRef.current = false;
    }
  }, [settings.catalogVersion]);

  // Primary Hydration & Zero-Read Check
  useEffect(() => {
    let isMounted = true;

    async function initCatalog() {
      try {
        // 1. Read IndexedDB lifetime storage
        const [cachedApps, cachedCats, cachedVer] = await Promise.all([
          cacheService.getAsync<AppItemData[]>(CACHE_KEYS.APPS),
          cacheService.getAsync<CategoryData[]>(CACHE_KEYS.CATEGORIES),
          cacheService.getAsync<number>(CACHE_KEYS.CATALOG_VERSION)
        ]);

        if (!isMounted) return;

        const hasCachedApps = cachedApps && cachedApps.length > 0;
        const currentServerVersion = settings.catalogVersion || 1;
        const localVersion = cachedVer || 0;

        if (hasCachedApps) {
          // Immediately populate UI with 0ms latency
          setApps(cachedApps);
          if (cachedCats && cachedCats.length > 0) setCategories(cachedCats);
          setLoading(false);

          // ZERO FIRESTORE READS PATH:
          // If offline OR local version matches server version, STOP HERE! 0 Firestore reads!
          if (!navigator.onLine || localVersion >= currentServerVersion) {
            console.log(`[AppsProvider] 0-Read Active (Version ${localVersion}): No network calls.`);
            return;
          }
        }

        // If offline and no cache, stop loading cleanly
        if (!navigator.onLine) {
          setLoading(false);
          return;
        }

        // Fetch (uses the 1-Document read technique)
        await fetchCatalogFromFirestore(cachedApps || [], cachedCats || []);
      } catch (err) {
        console.warn('[AppsProvider] Catalog initialization note:', err);
        setLoading(false);
      }
    }

    initCatalog();

    return () => {
      isMounted = false;
    };
  }, [fetchCatalogFromFirestore, settings.catalogVersion]);

  const refreshApps = async (force = true) => {
    if (force) {
      await cacheService.remove(CACHE_KEYS.APPS);
      await cacheService.remove(CACHE_KEYS.CATEGORIES);
      await cacheService.remove(CACHE_KEYS.CATALOG_VERSION);
    }
    await fetchCatalogFromFirestore([], []);
  };

  const getCategoryName = useCallback((catIdOrName?: string): string => {
    if (!catIdOrName) return 'General';
    const found = categoriesRef.current.find(
      c => c.id === catIdOrName || c.name?.toLowerCase().trim() === catIdOrName.toLowerCase().trim()
    );
    return found ? found.name : catIdOrName;
  }, []);

  const getAppById = async (id: string): Promise<AppItemData | null> => {
    // 1. Check in-memory state (0 reads)
    const inMem = appsRef.current.find(a => a.id === id);
    if (inMem) return inMem;

    // 2. Check IndexedDB lifetime storage (0 reads)
    const cached = await cacheService.getAsync<AppItemData[]>(CACHE_KEYS.APPS);
    if (cached) {
      const cachedFound = cached.find(a => a.id === id);
      if (cachedFound) return cachedFound;
    }

    // 3. Fallback: single doc fetch only if document is missing locally (1 read)
    try {
      const snap = await getDoc(doc(db, 'apps', id));
      if (snap.exists()) {
        const item = { id: snap.id, ...snap.data() } as AppItemData;
        return item;
      }
    } catch (err) {
      console.warn(`[AppsProvider] Failed fetching single app ${id}:`, err);
    }
    return null;
  };

  return (
    <AppsContext.Provider value={{ apps, categories, loading, getCategoryName, refreshApps, getAppById }}>
      {children}
    </AppsContext.Provider>
  );
};

export const useApps = () => {
  const context = useContext(AppsContext);
  if (!context) {
    throw new Error('useApps must be used within an AppsProvider');
  }
  return context;
};
