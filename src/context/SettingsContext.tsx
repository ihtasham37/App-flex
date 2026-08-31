import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cacheService, CACHE_KEYS } from '../lib/cacheService';

export interface AppSettings {
  appName: string;
  contactEmail: string;
  version: string;
  updateBanner?: {
    enabled: boolean;
    title?: string;
    heading?: string;
    description?: string;
    buttonText?: string;
    buttonUrl?: string;
    link?: string;
    version?: string;
    image?: string;
  };
  enableComments?: boolean;
  enableRatings?: boolean;
  catalogVersion?: number;
  lastCatalogUpdate?: any;
  codeReleaseVersion?: number;
  codeReleaseNote?: string;
  autoReloadClients?: boolean;
  whatsappChannel?: string;
  telegramLink?: string;
  supportEmail?: string;
  supportWhatsapp?: string;
  defaultAppsDescription?: string;
  defaultPCAppsDescription?: string;
  defaultBundlesDescription?: string;
}

interface SettingsContextType {
  settings: AppSettings;
  loading: boolean;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  broadcastCodeUpdate: (note?: string) => Promise<{ codeVersion: number }>;
  syncAllCatalogAndCode: (note?: string) => Promise<{ codeVersion: number; catalogVersion: number }>;
  fetchSettings: () => Promise<void>;
}

const defaultSettings: AppSettings = {
  appName: 'AppFlix',
  contactEmail: 'contact@appflix.com',
  version: '2.4.0',
  updateBanner: {
    enabled: false,
    title: 'New Version Available!',
    description: 'A brand new version of AppFlix with faster downloads and offline mode is now live.',
    buttonText: 'Update App',
    buttonUrl: '',
    version: '2.5.0'
  },
  enableComments: true,
  enableRatings: true,
  catalogVersion: 1,
  codeReleaseVersion: 1,
  codeReleaseNote: 'Initial Release',
  autoReloadClients: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getInitialSettings = (): AppSettings => {
  const cachedSettings = cacheService.get<AppSettings>(CACHE_KEYS.SETTINGS);
  if (cachedSettings) return cachedSettings;
  
  const cachedName = typeof window !== 'undefined' ? localStorage.getItem('app_flix_name') : null;
  return {
    ...defaultSettings,
    appName: cachedName || defaultSettings.appName
  };
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const [loading, setLoading] = useState(false);

  const applySettings = (data: AppSettings) => {
    setSettings(data);
    cacheService.set(CACHE_KEYS.SETTINGS, data);
    if (data.appName) {
      localStorage.setItem('app_flix_name', data.appName);
      document.title = `${data.appName} - Premium App Marketplace`;
    }
  };

  const fetchSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'global'));
      if (snap.exists()) {
        const data = snap.data() as AppSettings;
        applySettings(data);
      }
    } catch (e) {
      console.warn('[SettingsProvider] Settings fetch note:', e);
    }
  };

  useEffect(() => {
    // 1. If we have cached settings, apply title immediately
    const cached = cacheService.get<AppSettings>(CACHE_KEYS.SETTINGS);
    if (cached) {
      applySettings(cached);
    } else if (navigator.onLine) {
      // 2. Fetch once only if cache is completely absent
      fetchSettings();
    }
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    applySettings(updated);
    await setDoc(doc(db, 'settings', 'global'), updated, { merge: true });
  };

  const broadcastCodeUpdate = async (note = 'New Code Release Live!') => {
    const currentVer = settings.codeReleaseVersion || 1;
    const nextVer = currentVer + 1;
    const updated: AppSettings = {
      ...settings,
      codeReleaseVersion: nextVer,
      codeReleaseNote: note,
    };
    applySettings(updated);
    await setDoc(doc(db, 'settings', 'global'), updated, { merge: true });
    return { codeVersion: nextVer };
  };

  const syncAllCatalogAndCode = async (note = 'Complete System Sync Live!') => {
    const currentCode = settings.codeReleaseVersion || 1;
    const nextCode = currentCode + 1;
    const nextCatalog = Date.now();
    const updated: AppSettings = {
      ...settings,
      codeReleaseVersion: nextCode,
      codeReleaseNote: note,
      catalogVersion: nextCatalog,
      lastCatalogUpdate: nextCatalog
    };
    applySettings(updated);
    await setDoc(doc(db, 'settings', 'global'), updated, { merge: true });
    return { codeVersion: nextCode, catalogVersion: nextCatalog };
  };

  return (
    <SettingsContext.Provider value={{
      settings,
      loading,
      updateSettings,
      broadcastCodeUpdate,
      syncAllCatalogAndCode,
      fetchSettings
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (!context) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
