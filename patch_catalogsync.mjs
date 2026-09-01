import fs from 'fs';

const file = 'src/lib/catalogSync.ts';
let content = fs.readFileSync(file, 'utf8');

const target = `    // 2. Update global settings with the new catalogVersion and codeReleaseVersion together
    const nextCodeVersion = (globalSettings.codeReleaseVersion || 1) + 1;
    await setDoc(doc(db, 'settings', 'global'), {
      ...globalSettings,
      catalogVersion: newVersion,
      lastCatalogUpdate: newVersion,
      codeReleaseVersion: nextCodeVersion,
      codeReleaseNote: globalSettings.codeReleaseNote || 'Complete 1-Click System Sync Updated.'
    }, { merge: true });

    // 3. Update local cache
    await Promise.all([
      cacheService.set(CACHE_KEYS.APPS, allApps),
      cacheService.set(CACHE_KEYS.CATEGORIES, allCats),
      cacheService.set(CACHE_KEYS.SETTINGS, {
        ...globalSettings,
        catalogVersion: newVersion,
        lastCatalogUpdate: newVersion,
        codeReleaseVersion: nextCodeVersion
      }),
      cacheService.set(CACHE_KEYS.ADS, adsSettings),
      cacheService.set(CACHE_KEYS.CATALOG_VERSION, newVersion),
      cacheService.set(CACHE_KEYS.CLIENT_CODE_VERSION, nextCodeVersion),
      cacheService.set(CACHE_KEYS.LAST_SYNC_TIME, Date.now())
    ]);

    if (typeof localStorage !== 'undefined') {
      localStorage.setItem('appflex_client_code_version', nextCodeVersion.toString());
    }`;

const replacement = `    // 2. Update global settings with the new catalogVersion
    await setDoc(doc(db, 'settings', 'global'), {
      ...globalSettings,
      catalogVersion: newVersion,
      lastCatalogUpdate: newVersion
    }, { merge: true });

    // 3. Update local cache
    await Promise.all([
      cacheService.set(CACHE_KEYS.APPS, allApps),
      cacheService.set(CACHE_KEYS.CATEGORIES, allCats),
      cacheService.set(CACHE_KEYS.SETTINGS, {
        ...globalSettings,
        catalogVersion: newVersion,
        lastCatalogUpdate: newVersion
      }),
      cacheService.set(CACHE_KEYS.ADS, adsSettings),
      cacheService.set(CACHE_KEYS.CATALOG_VERSION, newVersion),
      cacheService.set(CACHE_KEYS.LAST_SYNC_TIME, Date.now())
    ]);`;

if (content.includes(target)) {
  fs.writeFileSync(file, content.replace(target, replacement));
  console.log("SUCCESS patch_catalogsync.mjs");
} else {
  console.log("FAILED to patch catalogSync.ts");
}
