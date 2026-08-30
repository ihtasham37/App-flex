import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cacheService, CACHE_KEYS, DEFAULT_CACHE_TTL } from '../lib/cacheService';

interface UpdateBanner {
  enabled: boolean;
  heading: string;
  description: string;
  image: string;
  link: string;
  buttonText: string;
}

export interface AppSettings {
  appName: string;
  updateBanner: UpdateBanner;
  supportEmail?: string;
  supportWhatsapp?: string;
  whatsappChannel?: string;
  telegramLink?: string;
  defaultAppsDescription?: string;
  defaultGamesDescription?: string;
  defaultPCAppsDescription?: string;
  defaultBundlesDescription?: string;
  catalogVersion?: number;
  lastCatalogUpdate?: number;
  codeReleaseVersion?: number;
  lastCodeReleaseTime?: number;
  codeReleaseNote?: string;
  autoReloadClients?: boolean;
}

interface SettingsContextType {
  settings: AppSettings;
  updateSettings: (newSettings: Partial<AppSettings>) => Promise<void>;
  broadcastCodeUpdate: (note?: string) => Promise<{ codeVersion: number }>;
  syncAllCatalogAndCode: (note?: string) => Promise<{ catalogVersion: number; codeVersion: number }>;
  loading: boolean;
}

const defaultSettings: AppSettings = {
  appName: 'AppFlix',
  updateBanner: {
    enabled: false,
    heading: 'New Version Available!',
    description: 'Experience the latest features, better performance, and enhanced security. Get the official AppFlix app from the Play Store now.',
    image: '',
    link: '',
    buttonText: 'Update Now',
  },
  supportEmail: '',
  supportWhatsapp: '',
  whatsappChannel: '',
  telegramLink: '',
  defaultAppsDescription: 'Discover and download official premium Android applications with 100% security, high speed servers, and lifetime updates on APPFLEX.',
  defaultGamesDescription: 'Download high-performance MOD games, unlimited coins/gems titles, unlocked levels, and verified APKs for the best gaming experience on APPFLEX.',
  defaultPCAppsDescription: 'Download full-version desktop software, PC utilities, Windows productivity tools, and creative applications for maximum performance on APPFLEX.',
  defaultBundlesDescription: 'Download premium video editing packs, Lightroom presets, Premiere Pro templates, cinematic LUTs, overlays, and sound FX bundles on APPFLEX.',
  catalogVersion: 1,
  lastCatalogUpdate: Date.now(),
  codeReleaseVersion: 1,
  lastCodeReleaseTime: Date.now(),
  codeReleaseNote: 'Initial production build with ultra-fast caching.',
  autoReloadClients: true,
};

const SettingsContext = createContext<SettingsContextType | undefined>(undefined);

const getInitialSettings = (): AppSettings => {
  const cachedSettings = cacheService.get<AppSettings>(CACHE_KEYS.SETTINGS, DEFAULT_CACHE_TTL);
  if (cachedSettings) return cachedSettings;
  
  const cachedName = typeof window !== 'undefined' ? localStorage.getItem('app_flix_name') : null;
  return {
    ...defaultSettings,
    appName: cachedName || defaultSettings.appName
  };
};

export const SettingsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [settings, setSettings] = useState<AppSettings>(getInitialSettings);
  const [loading, setLoading] = useState(() => {
    return !cacheService.get<AppSettings>(CACHE_KEYS.SETTINGS, DEFAULT_CACHE_TTL);
  });

  useEffect(() => {
    // Listen to global settings document
    const unsub = onSnapshot(doc(db, 'settings', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as AppSettings;
        setSettings(data);
        cacheService.set(CACHE_KEYS.SETTINGS, data);
        if (data.appName) {
          localStorage.setItem('app_flix_name', data.appName);
          document.title = `${data.appName} - Premium App Marketplace`;

          // Dynamically update Manifest
          const manifestObj = {
            name: data.appName,
            short_name: data.appName,
            description: `Discover, explore, and download top applications, games, PC softs, and bundles on ${data.appName}.`,
            start_url: '/',
            scope: '/',
            display: 'standalone',
            orientation: 'portrait',
            background_color: '#ffffff',
            theme_color: '#2563eb',
            icons: [
              {
                src: '/pwa-192x192.png',
                sizes: '192x192',
                type: 'image/png',
                purpose: 'any maskable'
              },
              {
                src: '/pwa-512x512.png',
                sizes: '512x512',
                type: 'image/png',
                purpose: 'any maskable'
              }
            ]
          };

          const stringManifest = JSON.stringify(manifestObj);
          const blob = new Blob([stringManifest], { type: 'application/json' });
          const manifestURL = URL.createObjectURL(blob);
          
          let manifestLink = document.querySelector('link[rel="manifest"]') as HTMLLinkElement;
          if (manifestLink) {
            manifestLink.setAttribute('href', manifestURL);
          }
        }
        setLoading(false);
      } else {
        // We no longer automatically initialize for every user to avoid "Missing or insufficient permissions" warnings.
        // Admins can initialize from the Admin Settings by saving settings.
        setSettings(defaultSettings);
        setLoading(false);
      }
    }, (error) => {
      console.error("Settings listener failed:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateSettings = async (newSettings: Partial<AppSettings>) => {
    const updated = { ...settings, ...newSettings };
    cacheService.set(CACHE_KEYS.SETTINGS, updated);
    await setDoc(doc(db, 'settings', 'global'), updated);
  };

  /**
   * Broadcasts a new code update release to all active and returning users.
   * Increments codeReleaseVersion in Firestore settings, prompting all mobile & desktop clients
   * to automatically reload and get latest GitHub / Vite build assets.
   */
  const broadcastCodeUpdate = async (note?: string) => {
    const nextCodeVersion = (settings.codeReleaseVersion || 1) + 1;
    const updateData: Partial<AppSettings> = {
      codeReleaseVersion: nextCodeVersion,
      lastCodeReleaseTime: Date.now(),
      codeReleaseNote: note || 'New feature update deployed and ready.',
      autoReloadClients: true,
    };

    // Also update local cache for the admin
    const updated = { ...settings, ...updateData };
    cacheService.set(CACHE_KEYS.SETTINGS, updated);
    await setDoc(doc(db, 'settings', 'global'), updated);
    return { codeVersion: nextCodeVersion };
  };

  /**
   * 1-Click Complete System Sync:
   * Increments both Catalog Version (for fresh app listings) and Code Release Version (for fresh GitHub frontend features).
   */
  const syncAllCatalogAndCode = async (note?: string) => {
    const nextCatalogVersion = (settings.catalogVersion || 1) + 1;
    const nextCodeVersion = (settings.codeReleaseVersion || 1) + 1;
    
    const updateData: Partial<AppSettings> = {
      catalogVersion: nextCatalogVersion,
      lastCatalogUpdate: Date.now(),
      codeReleaseVersion: nextCodeVersion,
      lastCodeReleaseTime: Date.now(),
      codeReleaseNote: note || 'Comprehensive platform and catalog sync applied.',
      autoReloadClients: true,
    };

    const updated = { ...settings, ...updateData };
    cacheService.set(CACHE_KEYS.SETTINGS, updated);
    await setDoc(doc(db, 'settings', 'global'), updated);
    return { catalogVersion: nextCatalogVersion, codeVersion: nextCodeVersion };
  };

  return (
    <SettingsContext.Provider value={{ 
      settings, 
      updateSettings, 
      broadcastCodeUpdate, 
      syncAllCatalogAndCode, 
      loading 
    }}>
      {children}
    </SettingsContext.Provider>
  );
};

export const useSettings = () => {
  const context = useContext(SettingsContext);
  if (context === undefined) {
    throw new Error('useSettings must be used within a SettingsProvider');
  }
  return context;
};
