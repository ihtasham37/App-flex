import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, doc, getDoc, query, where, Timestamp } from 'firebase/firestore';
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

  // Load from synchronous lifetime storage first for instant 0ms startup
  const [apps, setApps] = useState<AppItemData[]>(() => {
    return cacheService.get<AppItemData[]>(CACHE_KEYS.APPS) || [];
  });

  const [categories, setCategories] = useState<CategoryData[]>(() => {
    return cacheService.get<CategoryData[]>(CACHE_KEYS.CATEGORIES) || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = cacheService.get<AppItemData[]>(CACHE_KEYS.APPS);
    return !cached || cached.length === 0;
  });

  // Keep stable refs to avoid recreating fetchCatalog and triggering re-render loops
  const appsRef = useRef<AppItemData[]>(apps);
  appsRef.current = apps;

  const categoriesRef = useRef<CategoryData[]>(categories);
  categoriesRef.current = categories;

  const isSyncingRef = useRef<boolean>(false);

  // Hydrate from high-capacity IndexedDB on mount (ensures large 50MB+ datasets load fully)
  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        const idbApps = await cacheService.getAsync<AppItemData[]>(CACHE_KEYS.APPS);
        const idbCats = await cacheService.getAsync<CategoryData[]>(CACHE_KEYS.CATEGORIES);
        if (isMounted && idbApps && idbApps.length > 0) {
          setApps(idbApps);
          if (idbCats && idbCats.length > 0) setCategories(idbCats);
          setLoading(false);
        }
      } catch (err) {
        console.warn('[AppsProvider] IndexedDB initial hydration note:', err);
      }
    })();
    return () => {
      isMounted = false;
    };
  }, []);

  const fetchCatalog = useCallback(async (force = false) => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;

    // 1. Retrieve current lifetime cached apps
    const currentApps = appsRef.current.length > 0 
      ? appsRef.current 
      : (await cacheService.getAsync<AppItemData[]>(CACHE_KEYS.APPS)) || [];
    
    const currentCats = categoriesRef.current.length > 0 
      ? categoriesRef.current 
      : (await cacheService.getAsync<CategoryData[]>(CACHE_KEYS.CATEGORIES)) || [];
      
    const cachedVer = cacheService.get<number>(CACHE_KEYS.CATALOG_VERSION);
    const syncTime = cacheService.get<number>(CACHE_KEYS.LAST_SYNC_TIME) || 0;

    // SMART LIFETIME ZERO-READ PATH:
    // If we have cached apps and catalogVersion hasn't changed on server, DO NOT QUERY FIRESTORE!
    // Result: 0 Reads used on all repeated visits & 0 lag.
    if (!force && 
        settings.catalogVersion !== undefined && 
        cachedVer === settings.catalogVersion && 
        currentApps.length > 0) {
      setApps(currentApps);
      setCategories(currentCats);
      setLoading(false);
      isSyncingRef.current = false;
      return;
    }

    try {
      // Determine whether we do a full initial fetch or a targeted Delta sync
      const isFullFetch = force || currentApps.length === 0 || syncTime === 0;
      console.log(`[AppsProvider] Running ${isFullFetch ? 'Full' : 'Delta'} sync (Server v${settings.catalogVersion || 1} vs Local v${cachedVer || 0})...`);

      let appsSnap;
      let catsSnap;

      if (isFullFetch) {
        // Full Fetch Path (Only on very first install / visit)
        [appsSnap, catsSnap] = await Promise.all([
          getDocs(collection(db, 'apps')),
          getDocs(collection(db, 'categories'))
        ]);
      } else {
        // Targeted Delta Sync: Fetch ONLY items created or updated since last sync!
        // This consumes ONLY 1 read per newly added app!
        const lastTimestamp = Timestamp.fromMillis(syncTime);
        const appsQuery = query(collection(db, 'apps'), where('updatedAt', '>', lastTimestamp));
        const catsQuery = query(collection(db, 'categories'), where('updatedAt', '>', lastTimestamp));

        [appsSnap, catsSnap] = await Promise.all([
          getDocs(appsQuery),
          getDocs(catsQuery)
        ]);
      }

      // Process Incoming Apps
      const incomingApps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AppItemData));
      let mergedApps = isFullFetch ? incomingApps : [...currentApps];

      if (!isFullFetch && incomingApps.length > 0) {
        // Merge newly added or edited apps into our permanent dataset
        incomingApps.forEach(newApp => {
          const idx = mergedApps.findIndex(a => a.id === newApp.id);
          if (idx > -1) {
            mergedApps[idx] = newApp;
          } else {
            mergedApps.unshift(newApp);
          }
        });
      }

      // Filter published apps for public views
      const finalApps = mergedApps.filter(item => !item.status || item.status === 'published');

      // Process Incoming Categories
      const incomingCats = catsSnap.docs.map(d => ({ id: d.id, ...d.data() } as CategoryData));
      let mergedCats = isFullFetch ? incomingCats : [...currentCats];
      
      if (!isFullFetch && incomingCats.length > 0) {
        incomingCats.forEach(newCat => {
          const idx = mergedCats.findIndex(c => c.id === newCat.id);
          if (idx > -1) {
            mergedCats[idx] = newCat;
          } else {
            mergedCats.push(newCat);
          }
        });
      }

      // Update In-Memory State
      setApps(finalApps);
      setCategories(mergedCats);

      // Save Permanently to Lifetime Storage (IndexedDB + LocalStorage)
      if (finalApps.length > 0 || isFullFetch) {
        cacheService.set(CACHE_KEYS.APPS, finalApps);
        cacheService.set(CACHE_KEYS.CATEGORIES, mergedCats);
        
        const now = Date.now();
        cacheService.set(CACHE_KEYS.LAST_SYNC_TIME, now);

        if (settings.catalogVersion !== undefined) {
          cacheService.set(CACHE_KEYS.CATALOG_VERSION, settings.catalogVersion);
        }
      }

      console.log(`[AppsProvider] Lifetime sync complete. ${finalApps.length} total items permanently cached.`);
    } catch (err) {
      console.error('[AppsProvider] Sync error, using lifetime cache:', err);
      // Fallback cleanly to permanent cache
      if (currentApps.length > 0) {
        setApps(currentApps);
        setCategories(currentCats);
      }
    } finally {
      setLoading(false);
      isSyncingRef.current = false;
    }
  }, [settings.catalogVersion]);

  useEffect(() => {
    if (settings.catalogVersion !== undefined) {
      fetchCatalog(false);
    }
  }, [fetchCatalog, settings.catalogVersion]);

  const refreshApps = async (force = true) => {
    if (force) {
      cacheService.remove(CACHE_KEYS.APPS);
      cacheService.remove(CACHE_KEYS.CATEGORIES);
      cacheService.remove(CACHE_KEYS.LAST_SYNC_TIME);
      cacheService.remove(CACHE_KEYS.CATALOG_VERSION);
    }
    await fetchCatalog(force);
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
    const found = appsRef.current.find(a => a.id === id);
    if (found) return found;

    // 2. Check lifetime storage (0 reads)
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
