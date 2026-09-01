import { doc, setDoc, getDocs, collection, getDoc, serverTimestamp } from 'firebase/firestore';
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
 * - Even after clearing browser cache: EXACTLY 1 FIRESTORE READ!
 */
export async function rebuildAndSyncCatalog(options?: { incrementCodeVersion?: boolean; note?: string }) {
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

    let updatedCodeVersion = globalSettings.codeReleaseVersion || 1;
    if (options?.incrementCodeVersion) {
      updatedCodeVersion += 1;
    }

    const updatedGlobalSettings = {
      ...globalSettings,
      codeReleaseVersion: updatedCodeVersion,
      codeReleaseNote: options?.note || globalSettings.codeReleaseNote || 'Catalog & Code Release',
      catalogVersion: newVersion,
      lastCatalogUpdate: newVersion
    };

    const snapshotData: UnifiedCatalogSnapshot = {
      apps: allApps,
      categories: allCats,
      settings: updatedGlobalSettings,
      ads: adsSettings,
      version: newVersion,
      updatedAt: serverTimestamp()
    };

    // 1. Write the unified snapshot document
    await setDoc(doc(db, 'settings', 'catalog'), snapshotData);

    // 2. Update global settings doc with catalogVersion and optional codeReleaseVersion
    await setDoc(doc(db, 'settings', 'global'), updatedGlobalSettings, { merge: true });

    // 3. Update local cache
    await Promise.all([
      cacheService.set(CACHE_KEYS.APPS, allApps),
      cacheService.set(CACHE_KEYS.CATEGORIES, allCats),
      cacheService.set(CACHE_KEYS.SETTINGS, updatedGlobalSettings),
      cacheService.set(CACHE_KEYS.ADS, adsSettings),
      cacheService.set(CACHE_KEYS.CATALOG_VERSION, newVersion),
      cacheService.set(CACHE_KEYS.LAST_SYNC_TIME, Date.now())
    ]);

    // 4. Dispatch custom events for in-memory contexts
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appflex-settings-updated', { detail: updatedGlobalSettings }));
      window.dispatchEvent(new CustomEvent('appflex-ads-updated', { detail: adsSettings }));
      window.dispatchEvent(new CustomEvent('appflex-catalog-updated', { detail: { apps: allApps, categories: allCats } }));
    }

    console.log(`[CatalogSync] Snapshot generated: ${allApps.length} apps, ${allCats.length} cats, Version: ${newVersion}, Code Ver: v${updatedCodeVersion}`);
    return { success: true, count: allApps.length, version: newVersion, codeVersion: updatedCodeVersion };
  } catch (error) {
    console.error('[CatalogSync] Failed rebuilding catalog snapshot:', error);
    throw error;
  }
}

export const syncCatalogSnapshot = rebuildAndSyncCatalog;

