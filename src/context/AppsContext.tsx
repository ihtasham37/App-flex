import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { collection, getDocs, doc, getDoc, query, where, Timestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cacheService, CACHE_KEYS, DEFAULT_CACHE_TTL } from '../lib/cacheService';
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

  // Try loading from localStorage cache first for 0ms instant startup & 0 Firestore reads
  const [apps, setApps] = useState<AppItemData[]>(() => {
    return cacheService.get<AppItemData[]>(CACHE_KEYS.APPS, DEFAULT_CACHE_TTL * 30) || [];
  });

  const [categories, setCategories] = useState<CategoryData[]>(() => {
    return cacheService.get<CategoryData[]>(CACHE_KEYS.CATEGORIES, DEFAULT_CACHE_TTL * 30) || [];
  });

  const [loading, setLoading] = useState<boolean>(() => {
    const cached = cacheService.get<AppItemData[]>(CACHE_KEYS.APPS, DEFAULT_CACHE_TTL * 30);
    return !cached || cached.length === 0;
  });

  const lastCatalogVersion = useRef<number | null>(
    localStorage.getItem('catalog_version_cached') ? parseInt(localStorage.getItem('catalog_version_cached')!) : null
  );

  const lastSyncTime = useRef<number>(
    localStorage.getItem('appflex_last_sync_time') ? parseInt(localStorage.getItem('appflex_last_sync_time')!) : 0
  );

  const fetchCatalog = useCallback(async (force = false) => {
    // 1. Check if we already have apps in cache and the version hasn't changed
    const currentApps = cacheService.get<AppItemData[]>(CACHE_KEYS.APPS, DEFAULT_CACHE_TTL * 30) || [];
    const currentCats = cacheService.get<CategoryData[]>(CACHE_KEYS.CATEGORIES, DEFAULT_CACHE_TTL * 30) || [];
    
    // SMART CACHE: If version matches and we have data, DO NOT FETCH ANYTHING
    // This is the "Zero Read" path for 99% of user sessions.
    if (!force && 
        settings.catalogVersion !== undefined && 
        lastCatalogVersion.current === settings.catalogVersion && 
        currentApps.length > 0) {
      setApps(currentApps);
      setCategories(currentCats);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Determine if we do a Full Fetch or Delta Fetch
      const isFullFetch = force || currentApps.length === 0 || lastSyncTime.current === 0;
      console.log(`[AppsProvider] Starting ${isFullFetch ? 'Full' : 'Delta'} Sync (DB: ${settings.catalogVersion || '?'})...`);

      let appsSnap;
      let catsSnap;

      if (isFullFetch) {
        // Full Fetch Path
        [appsSnap, catsSnap] = await Promise.all([
          getDocs(collection(db, 'apps')),
          getDocs(collection(db, 'categories'))
        ]);
      } else {
        // Delta Fetch Path - Fetch ONLY items updated since last sync
        const lastSyncTimestamp = Timestamp.fromMillis(lastSyncTime.current);
        const appsQuery = query(collection(db, 'apps'), where('updatedAt', '>', lastSyncTimestamp));
        const catsQuery = query(collection(db, 'categories'), where('updatedAt', '>', lastSyncTimestamp));
        
        [appsSnap, catsSnap] = await Promise.all([
          getDocs(appsQuery),
          getDocs(catsQuery)
        ]);
      }

      // Process Incoming Apps
      const incomingApps = appsSnap.docs.map(d => ({ id: d.id, ...d.data() } as AppItemData));
      let mergedApps = isFullFetch ? incomingApps : [...currentApps];

      if (!isFullFetch && incomingApps.length > 0) {
        // Merge Delta Logic
        incomingApps.forEach(newApp => {
          const idx = mergedApps.findIndex(a => a.id === newApp.id);
          if (idx > -1) {
            mergedApps[idx] = newApp;
          } else {
            mergedApps.push(newApp);
          }
        });
      }

      // Final Filter: Only show published apps to visitors
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

      // Update State
      setApps(finalApps);
      setCategories(mergedCats);

      // Save to cache & update metadata
      if (finalApps.length > 0 || isFullFetch) {
        cacheService.set(CACHE_KEYS.APPS, finalApps);
        cacheService.set(CACHE_KEYS.CATEGORIES, mergedCats);
        
        const now = Date.now();
        localStorage.setItem('appflex_last_sync_time', now.toString());
        lastSyncTime.current = now;

        if (settings.catalogVersion !== undefined) {
          localStorage.setItem('catalog_version_cached', settings.catalogVersion.toString());
          lastCatalogVersion.current = settings.catalogVersion;
        }
      }

      console.log(`[AppsProvider] Sync Success: Merged ${finalApps.length} apps total.`);
    } catch (err) {
      console.error('[AppsProvider] Sync error:', err);
      // Fallback to existing state if fetch fails
      if (currentApps.length > 0) {
        setApps(currentApps);
        setCategories(currentCats);
      }
    } finally {
      setLoading(false);
    }
  }, [settings.catalogVersion]);

  useEffect(() => {
    // Only trigger fetch when settings are loaded and we have a version to compare
    if (settings.catalogVersion !== undefined) {
      fetchCatalog(false);
    }
  }, [fetchCatalog, settings.catalogVersion]);

  const refreshApps = async (force = true) => {
    if (force) {
      cacheService.remove(CACHE_KEYS.APPS);
      cacheService.remove(CACHE_KEYS.CATEGORIES);
    }
    await fetchCatalog(force);
  };

  const getCategoryName = useCallback((catIdOrName?: string): string => {
    if (!catIdOrName) return 'General';
    const found = categories.find(
      c => c.id === catIdOrName || c.name?.toLowerCase().trim() === catIdOrName.toLowerCase().trim()
    );
    return found ? found.name : catIdOrName;
  }, [categories]);

  const getAppById = async (id: string): Promise<AppItemData | null> => {
    // 1. Check in-memory state / cached list first (0 reads!)
    const found = apps.find(a => a.id === id);
    if (found) return found;

    // 2. Check localStorage cache
    const cached = cacheService.get<AppItemData[]>(CACHE_KEYS.APPS, DEFAULT_CACHE_TTL);
    if (cached) {
      const cachedFound = cached.find(a => a.id === id);
      if (cachedFound) return cachedFound;
    }

    // 3. Fallback: single doc fetch only if not in cache (1 read only)
    try {
      const snap = await getDoc(doc(db, 'apps', id));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() } as AppItemData;
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
