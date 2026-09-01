/**
 * 0-READ FAST SAVED APPS STORAGE
 * Keeps saved app IDs in localStorage for instant retrieval and 0 Firestore reads.
 */

import { db } from './firebase';
import { doc, setDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';

const SAVED_KEY_PREFIX = 'appflex_saved_apps_v2_';

function getSavedKey(userId: string): string {
  return `${SAVED_KEY_PREFIX}${userId}`;
}

export function getLocalSavedAppIds(userId?: string | null): string[] {
  if (!userId) return [];
  try {
    const raw = localStorage.getItem(getSavedKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function isAppSavedLocally(userId?: string | null, appId?: string): boolean {
  if (!userId || !appId) return false;
  const ids = getLocalSavedAppIds(userId);
  return ids.includes(appId);
}

export function toggleLocalSavedApp(userId: string, appId: string, appData?: any): boolean {
  if (!userId || !appId) return false;
  const ids = getLocalSavedAppIds(userId);
  const exists = ids.includes(appId);
  let updated: string[];
  if (exists) {
    updated = ids.filter(id => id !== appId);
  } else {
    updated = [...ids, appId];
  }
  try {
    localStorage.setItem(getSavedKey(userId), JSON.stringify(updated));
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('appflex-saved-apps-changed', { detail: { count: updated.length, ids: updated } }));
    }
  } catch {}

  // Async Firestore sync
  const docId = `${userId}_${appId}`;
  if (exists) {
    deleteDoc(doc(db, 'saved_apps', docId)).catch(() => {});
  } else {
    setDoc(doc(db, 'saved_apps', docId), {
      userId,
      appId,
      appName: appData?.name || '',
      appImage: appData?.mainImage || appData?.icon || '',
      category: appData?.category || 'General',
      savedAt: serverTimestamp()
    }, { merge: true }).catch(() => {});
  }

  return !exists;
}
