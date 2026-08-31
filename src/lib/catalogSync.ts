import { doc, setDoc, getDocs, collection, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { cacheService, CACHE_KEYS } from './cacheService';

export interface UnifiedCatalogSnapshot {
  apps: any[];
  categories: any[];
  settings?: any;
  ads?: any;
  version: number;
  updatedAt?: any;
}

/**
 * Rebuilds the unified single-document snapshot in Firestore (`settings/catalog`).
 * This bundles all apps, categories, settings, and ads into a SINGLE document.
 * 
 * Result:
 * - Brand-new users load EVERYTHING in EXACTLY 1 FIRESTORE READ!
 * - Repeat users and reloads use 0 FIRESTORE READS (Lifetime IndexedDB)!
 */
export async function rebuildAndSyncCatalog() {
  try {
    console.log('[CatalogSync] Building single-document unified snapshot...');

    const [appsSnap, catsSnap, globalSnap, adsSnap] = await Promise.all([
      getDocs(collection(db, 'apps')),
      getDocs(collection(db, 'categories')),
      getDoc(doc(db, 'settings', 'global')),
      getDoc(doc(db, 'settings', 'ads'))
    ]);

    const allApps = appsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((item: any) => !item.status || item.status === 'published');

    const allCats = catsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }));

    const globalSettings = globalSnap.exists() ? globalSnap.data() : {};
    const adsSettings = adsSnap.exists() ? adsSnap.data() : {};

    const newVersion = Date.now();

    const snapshotData: UnifiedCatalogSnapshot = {
      apps: allApps,
      categories: allCats,
      settings: globalSettings,
      ads: adsSettings,
      version: newVersion,
      updatedAt: serverTimestamp()
    };

    // 1. Write the unified snapshot document
    await setDoc(doc(db, 'settings', 'catalog'), snapshotData);

    // 2. Update global settings with the new catalogVersion
    await setDoc(doc(db, 'settings', 'global'), {
      ...globalSettings,
      catalogVersion: newVersion,
      lastCatalogUpdate: newVersion
    }, { merge: true });

    // 3. Update local cache for admin
    await Promise.all([
      cacheService.set(CACHE_KEYS.APPS, allApps),
      cacheService.set(CACHE_KEYS.CATEGORIES, allCats),
      cacheService.set(CACHE_KEYS.CATALOG_VERSION, newVersion)
    ]);

    console.log(`[CatalogSync] Unified snapshot generated: ${allApps.length} apps, ${allCats.length} cats, Version: ${newVersion}`);
    return { success: true, count: allApps.length, version: newVersion };
  } catch (error) {
    console.error('[CatalogSync] Failed rebuilding catalog snapshot:', error);
    throw error;
  }
}

export const syncCatalogSnapshot = rebuildAndSyncCatalog;
