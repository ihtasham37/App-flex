/**
 * Returns whether the next download requires watching Ad 6 based on current daily count:
 * Count 0-4 (1st to 5th download) -> FREE (false)
 * Count 5 (6th download) -> REQUIRES AD 6 (true)
 * Count 6 (7th download) -> FREE (false)
 * Count 7 (8th download) -> REQUIRES AD 6 (true)
 * Count 8 (9th download) -> FREE (false)
 * Count 9 (10th download) -> REQUIRES AD 6 (true)
 * Count 10 (11th download) -> FREE (false)
 * Count 11 (12th download) -> REQUIRES AD 6 (true)
 * Count 12 (13th download) -> FREE (false)
 * Count 13 (14th download) -> REQUIRES AD 6 (true)
 */
export function isRewardedDownloadRequired(todayDownloadCount: number): boolean {
  if (todayDownloadCount < 5) {
    return false;
  }
  // If count is 5, 7, 9, 11, 13... next download is 6, 8, 10, 12, 14 (which requires Ad 6)
  return todayDownloadCount % 2 === 1;
}

const DL_COUNT_KEY_PREFIX = 'appflex_daily_dl_count_v2_';

function getTodayKey(userId: string): string {
  const dateStr = new Date().toISOString().split('T')[0];
  return `${DL_COUNT_KEY_PREFIX}${userId}_${dateStr}`;
}

/**
 * Fetches the total number of downloads performed by the user today (from 00:00:00 local time).
 * 0 FIRESTORE READS (stored & synced locally per user/device).
 */
export async function getUserTodayDownloadCount(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const key = getTodayKey(userId);
    const stored = localStorage.getItem(key);
    return stored ? parseInt(stored, 10) || 0 : 0;
  } catch {
    return 0;
  }
}

/**
 * Increments the local count of downloads performed today.
 */
export function incrementUserTodayDownloadCount(userId: string): number {
  if (!userId) return 1;
  try {
    const key = getTodayKey(userId);
    const current = parseInt(localStorage.getItem(key) || '0', 10) || 0;
    const updated = current + 1;
    localStorage.setItem(key, updated.toString());
    return updated;
  } catch {
    return 1;
  }
}

