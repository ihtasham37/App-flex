import { doc, setDoc, getDocs, collection, updateDoc, increment, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';

/**
 * Rebuilds the single-document catalog snapshot in Firestore (settings/catalog).
 * This allows all 33,000+ app users to fetch the entire catalog in 1 SINGLE READ instead of 300-1000 reads!
 */
export async function syncCatalogSnapshot() {
  try {
    const [appsSnap, catsSnap] = await Promise.all([
      getDocs(collection(db, 'apps')),
      getDocs(collection(db, 'categories'))
    ]);

    const allApps = appsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter((item: any) => !item.status || item.status === 'published');

    const allCats = catsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }));

    // 1. Save all apps & categories in a single document
    await setDoc(doc(db, 'settings', 'catalog'), {
      apps: allApps,
      categories: allCats,
      count: allApps.length,
      updatedAt: serverTimestamp()
    });

    // 2. Increment global catalog version so all clients get the fresh snapshot
    await updateDoc(doc(db, 'settings', 'global'), {
      catalogVersion: increment(1),
      lastCatalogUpdate: Date.now()
    });

    console.log(`[CatalogSync] Successfully built single-document catalog: ${allApps.length} apps, ${allCats.length} categories.`);
    return { success: true, count: allApps.length };
  } catch (error) {
    console.error('[CatalogSync] Failed rebuilding catalog snapshot:', error);
    throw error;
  }
}
