import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { doc, onSnapshot, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cacheService, CACHE_KEYS } from '../lib/cacheService';

export interface AdItem {
  id: string; // 'ad_1' | 'ad_2' | 'ad_3' | 'ad_4' | 'ad_5' | 'ad_6'
  name: string;
  ad_code: string;
  enabled: boolean;
  ad_type: 'normal' | 'rewarded';
  updated_at?: string;
}

export interface AdSettingsData {
  global_ads_enabled: boolean;
  home_ads_enabled: boolean;
  apps_ads_enabled: boolean;
  pc_ads_enabled: boolean;
  bundle_ads_enabled: boolean;
  detail_ads_enabled: boolean;
  profile_ads_enabled: boolean;
  search_ads_enabled: boolean;
  rewarded_ads_enabled: boolean;
  ads: {
    ad_1: AdItem;
    ad_2: AdItem;
    ad_3: AdItem;
    ad_4: AdItem;
    ad_5: AdItem;
    ad_6: AdItem;
  };
}

export const defaultAdSettings: AdSettingsData = {
  global_ads_enabled: true,
  home_ads_enabled: true,
  apps_ads_enabled: true,
  pc_ads_enabled: true,
  bundle_ads_enabled: true,
  detail_ads_enabled: true,
  profile_ads_enabled: true,
  search_ads_enabled: true,
  rewarded_ads_enabled: true,
  ads: {
    ad_1: { id: 'ad_1', name: 'Advertisement 1', ad_code: '', enabled: true, ad_type: 'normal' },
    ad_2: { id: 'ad_2', name: 'Advertisement 2', ad_code: '', enabled: true, ad_type: 'normal' },
    ad_3: { id: 'ad_3', name: 'Advertisement 3', ad_code: '', enabled: true, ad_type: 'normal' },
    ad_4: { id: 'ad_4', name: 'Advertisement 4', ad_code: '', enabled: true, ad_type: 'normal' },
    ad_5: { id: 'ad_5', name: 'Advertisement 5', ad_code: '', enabled: true, ad_type: 'normal' },
    ad_6: { id: 'ad_6', name: '🎁 Rewarded Download Ad 6', ad_code: '', enabled: true, ad_type: 'rewarded' },
  }
};

export type AdPageType = 'home' | 'apps' | 'pc' | 'bundle' | 'detail' | 'profile' | 'search';

interface AdsContextType {
  adSettings: AdSettingsData;
  loading: boolean;
  updateAdSettings: (newSettings: Partial<AdSettingsData>) => Promise<void>;
  updateSingleAd: (adId: keyof AdSettingsData['ads'], adData: Partial<AdItem>) => Promise<void>;
  getNormalAdForIndex: (page: AdPageType, slotIndex: number, pageVisitId?: string) => AdItem | null;
  getRewardedAd: () => AdItem | null;
  isPageAdsEnabled: (page: AdPageType) => boolean;
  isRewardedAdsEnabled: () => boolean;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

// Deterministic Pseudo-Random Generator based on seed string
function getRNG(seedStr: string) {
  let hash = 0;
  for (let i = 0; i < seedStr.length; i++) {
    hash = (hash << 5) - hash + seedStr.charCodeAt(i);
    hash |= 0;
  }
  return function() {
    hash = (hash * 9301 + 49297) % 233280;
    return Math.abs(hash) / 233280;
  };
}

export const AdsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [adSettings, setAdSettings] = useState<AdSettingsData>(() => {
    const cached = cacheService.get<AdSettingsData>(CACHE_KEYS.ADS);
    if (cached) {
      return {
        ...defaultAdSettings,
        ...cached,
        ads: {
          ...defaultAdSettings.ads,
          ...(cached.ads || {})
        }
      };
    }
    return defaultAdSettings;
  });
  
  const [loading, setLoading] = useState(() => {
    return !cacheService.get<AdSettingsData>(CACHE_KEYS.ADS);
  });

  // Session seed for randomized page ad cycles
  const [sessionSeed] = useState(() => Math.random().toString(36).substring(2, 9));

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'settings', 'ads'), (snap) => {
      if (snap.exists()) {
        const data = snap.data() as Partial<AdSettingsData>;
        const merged: AdSettingsData = {
          ...defaultAdSettings,
          ...data,
          ads: {
            ...defaultAdSettings.ads,
            ...(data.ads || {})
          }
        };
        setAdSettings(merged);
        cacheService.set(CACHE_KEYS.ADS, merged);
      } else {
        // We no longer automatically initialize for every user to avoid "Missing or insufficient permissions" warnings.
        // Admins can initialize from the Admin Ads Center by saving settings.
        setAdSettings(defaultAdSettings);
      }
      setLoading(false);
    }, (error) => {
      console.error("Ads settings listener failed:", error);
      setLoading(false);
    });

    return () => unsub();
  }, []);

  const updateAdSettings = async (newSettings: Partial<AdSettingsData>) => {
    const updated: AdSettingsData = {
      ...adSettings,
      ...newSettings,
      ads: {
        ...adSettings.ads,
        ...(newSettings.ads || {})
      }
    };
    cacheService.set(CACHE_KEYS.ADS, updated);
    await setDoc(doc(db, 'settings', 'ads'), updated);
  };

  const updateSingleAd = async (adId: keyof AdSettingsData['ads'], adData: Partial<AdItem>) => {
    const updatedAds = {
      ...adSettings.ads,
      [adId]: {
        ...adSettings.ads[adId],
        ...adData,
        updated_at: new Date().toISOString()
      }
    };
    const updated: AdSettingsData = {
      ...adSettings,
      ads: updatedAds
    };
    cacheService.set(CACHE_KEYS.ADS, updated);
    await setDoc(doc(db, 'settings', 'ads'), updated);
  };

  // Helper to check if ads are enabled for a specific page
  const isPageAdsEnabled = (page: AdPageType): boolean => {
    if (!adSettings.global_ads_enabled) return false;
    switch (page) {
      case 'home': return adSettings.home_ads_enabled;
      case 'apps': return adSettings.apps_ads_enabled;
      case 'pc': return adSettings.pc_ads_enabled;
      case 'bundle': return adSettings.bundle_ads_enabled;
      case 'detail': return adSettings.detail_ads_enabled;
      case 'profile': return adSettings.profile_ads_enabled;
      case 'search': return adSettings.search_ads_enabled ?? true;
      default: return false;
    }
  };

  const isRewardedAdsEnabled = (): boolean => {
    if (!adSettings.global_ads_enabled) return false;
    return adSettings.rewarded_ads_enabled;
  };

  // Active enabled normal ads list (from ad_1 to ad_5)
  const activeNormalAds = useMemo(() => {
    const normalAdKeys: (keyof AdSettingsData['ads'])[] = ['ad_1', 'ad_2', 'ad_3', 'ad_4', 'ad_5'];
    return normalAdKeys
      .map(key => adSettings.ads[key])
      .filter(ad => ad && ad.enabled && ad.ad_code && ad.ad_code.trim().length > 0);
  }, [adSettings]);

  // Randomized selector with anti-consecutive duplicate rule
  const getNormalAdForIndex = (page: AdPageType, slotIndex: number, pageVisitId?: string): AdItem | null => {
    if (!isPageAdsEnabled(page)) return null;
    if (activeNormalAds.length === 0) return null;

    const n = activeNormalAds.length;
    if (n === 1) return activeNormalAds[0];

    // Seed combining page, visit ID, and session
    const seed = `${pageVisitId || sessionSeed}-${page}-visit`;
    const rng = getRNG(seed);

    let lastIndex = -1;
    let currentIndex = 0;

    // Simulate slot selection up to the requested slotIndex
    for (let step = 0; step <= slotIndex; step++) {
      const rand = rng();
      if (step === 0) {
        currentIndex = Math.floor(rand * n);
      } else {
        // Pick from other (n - 1) ads to strictly guarantee no consecutive duplicate
        const pickOther = Math.floor(rand * (n - 1));
        currentIndex = pickOther >= lastIndex ? pickOther + 1 : pickOther;
      }
      lastIndex = currentIndex;
    }

    return activeNormalAds[currentIndex] || activeNormalAds[0];
  };

  // Rewarded Ad 6 getter
  const getRewardedAd = (): AdItem | null => {
    if (!isRewardedAdsEnabled()) return null;
    const ad6 = adSettings.ads.ad_6;
    if (!ad6 || !ad6.enabled || !ad6.ad_code || ad6.ad_code.trim().length === 0) {
      return null;
    }
    return ad6;
  };

  return (
    <AdsContext.Provider
      value={{
        adSettings,
        loading,
        updateAdSettings,
        updateSingleAd,
        getNormalAdForIndex,
        getRewardedAd,
        isPageAdsEnabled,
        isRewardedAdsEnabled,
      }}
    >
      {children}
    </AdsContext.Provider>
  );
};

export const useAds = () => {
  const context = useContext(AdsContext);
  if (!context) {
    throw new Error('useAds must be used within an AdsProvider');
  }
  return context;
};
