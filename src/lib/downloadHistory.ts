/**
 * 0-READ DOWNLOAD HISTORY STORAGE
 * Stores download history records locally so opening the Downloads tab consumes 0 Firestore reads.
 */

export interface LocalDownloadRecord {
  id: string;
  appId: string;
  appName: string;
  appImage?: string;
  downloadUrl?: string;
  category?: string;
  downloadedAt: number;
}

const DL_HISTORY_PREFIX = 'appflex_download_history_v2_';

function getHistoryKey(userId?: string | null): string {
  return `${DL_HISTORY_PREFIX}${userId || 'guest'}`;
}

export function getLocalDownloads(userId?: string | null): LocalDownloadRecord[] {
  try {
    const raw = localStorage.getItem(getHistoryKey(userId));
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveLocalDownload(userId: string | undefined | null, record: Omit<LocalDownloadRecord, 'id' | 'downloadedAt'>): void {
  try {
    const list = getLocalDownloads(userId);
    const newRecord: LocalDownloadRecord = {
      ...record,
      id: `${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      downloadedAt: Date.now(),
    };
    const updated = [newRecord, ...list.filter(item => item.appId !== record.appId)].slice(0, 50);
    localStorage.setItem(getHistoryKey(userId), JSON.stringify(updated));
  } catch {}
}
