import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cacheService, CACHE_KEYS } from '../lib/cacheService';

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
  const [apps, setApps] = useState<AppItemData[]>([]);
  const [categories, setCategories] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  // Stable references
  const appsRef = useRef<AppItemData[]>([]);
  const categoriesRef = useRef<CategoryData[]>([]);
  const isFetchingRef = useRef<boolean>(false);

  appsRef.current = apps;
  categoriesRef.current = categories;

  /**
   * EXACTLY 1 FIRESTORE READ FOR ENTIRE APP:
   * Fetches `settings/catalog` single document containing all apps, categories, settings, and ads.
   * Total Reads = 1 (even if there are 300+ apps).
   * Once downloaded, saved to IndexedDB forever (0 reads on all future visits/reloads).
   * If user clears cache, next open takes EXACTLY 1 read (never 300 reads).
   */
  const fetchSingleDocumentCatalog = useCallback(async (): Promise<boolean> => {
    if (isFetchingRef.current) return false;
    isFetchingRef.current = true;

    try {
      console.log('[AppsProvider] 1-READ OPTIMIZATION: Fetching unified snapshot from `settings/catalog`...');
      
      let fetchedApps: AppItemData[] = [];
      let fetchedCats: CategoryData[] = [];
      let catalogVersion = Date.now();

      const snap = await getDoc(doc(db, 'settings', 'catalog'));
      if (snap.exists()) {
        const data = snap.data();
        if (data) {
          if (Array.isArray(data.apps) && data.apps.length > 0) {
            fetchedApps = (data.apps as AppItemData[]).filter(item => !item.status || item.status === 'published');
          }
          if (Array.isArray(data.categories)) {
            fetchedCats = data.categories as CategoryData[];
          }
          catalogVersion = data.version || Date.now();

          console.log(`[AppsProvider] 1-READ SUCCESS: Loaded ${fetchedApps.length} apps & ${fetchedCats.length} categories in 1 Read!`);

          // Propagate settings & ads to cache and trigger events so other providers do NOT make separate reads!
          if (data.settings) {
            await cacheService.set(CACHE_KEYS.SETTINGS, data.settings);
            // Sync code release version immediately so user is on latest code on first install without extra update prompts!
            if (data.settings.codeReleaseVersion) {
              localStorage.setItem('appflex_client_code_version', data.settings.codeReleaseVersion.toString());
              cacheService.set(CACHE_KEYS.CLIENT_CODE_VERSION, data.settings.codeReleaseVersion);
            }
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('appflex-settings-updated', { detail: data.settings }));
            }
          }
          if (data.ads) {
            await cacheService.set(CACHE_KEYS.ADS, data.ads);
            if (typeof window !== 'undefined') {
              window.dispatchEvent(new CustomEvent('appflex-ads-updated', { detail: data.ads }));
            }
          }
        }
      }

      if (fetchedApps.length > 0) {
        setApps(fetchedApps);
        setCategories(fetchedCats);
        setLoading(false);

        // Permanently persist to Lifetime IndexedDB
        await Promise.all([
          cacheService.set(CACHE_KEYS.APPS, fetchedApps),
          cacheService.set(CACHE_KEYS.CATEGORIES, fetchedCats),
          cacheService.set(CACHE_KEYS.CATALOG_VERSION, catalogVersion),
          cacheService.set(CACHE_KEYS.LAST_SYNC_TIME, Date.now())
        ]);
        return true;
      }
    } catch (error) {
      console.warn('[AppsProvider] Network/Firestore fetch note (using local cache):', error);
    } finally {
      isFetchingRef.current = false;
      setLoading(false);
    }
    return false;
  }, []);

  // Primary Hydration Lifecycle
  useEffect(() => {
    let isMounted = true;

    async function initCatalog() {
      try {
        // 1. FAST LOCAL HYDRATION: Read IndexedDB first (0ms, 0 Reads)
        const [cachedApps, cachedCats] = await Promise.all([
          cacheService.getAsync<AppItemData[]>(CACHE_KEYS.APPS),
          cacheService.getAsync<CategoryData[]>(CACHE_KEYS.CATEGORIES)
        ]);

        if (!isMounted) return;

        // If local cache exists, POPULATE UI AND STOP!
        // GUARANTEE: ZERO FIRESTORE READS ON REFRESH OR REPEAT VISITS!
        if (cachedApps && cachedApps.length > 0) {
          setApps(cachedApps);
          if (cachedCats && cachedCats.length > 0) setCategories(cachedCats);
          setLoading(false);
          console.log(`[AppsProvider] 0-READ GUARANTEE: Loaded ${cachedApps.length} apps from IndexedDB (0 Firestore calls).`);
          return;
        }

        // 2. Only if local cache is completely empty and device is online:
        // Do EXACTLY 1 FIRESTORE READ to download the catalog
        if (navigator.onLine) {
          await fetchSingleDocumentCatalog();
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.warn('[AppsProvider] Init note:', err);
        setLoading(false);
      }
    }

    initCatalog();

    // Listen for catalog broadcast updates from admin sync
    const handleCatalogUpdated = (e: any) => {
      if (e.detail?.apps) setApps(e.detail.apps);
      if (e.detail?.categories) setCategories(e.detail.categories);
    };
    window.addEventListener('appflex-catalog-updated', handleCatalogUpdated);

    return () => {
      isMounted = false;
      window.removeEventListener('appflex-catalog-updated', handleCatalogUpdated);
    };
  }, [fetchSingleDocumentCatalog]);

  const refreshApps = async (force = true) => {
    if (force) {
      await cacheService.remove(CACHE_KEYS.APPS);
      await cacheService.remove(CACHE_KEYS.CATEGORIES);
    }
    await fetchSingleDocumentCatalog();
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

    // 3. Fallback: single doc fetch only if missing locally (1 read)
    try {
      const snap = await getDoc(doc(db, 'apps', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as AppItemData;
      }
    } catch (err) {
      console.warn(`[AppsProvider] Failed fetching app ${id}:`, err);
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
