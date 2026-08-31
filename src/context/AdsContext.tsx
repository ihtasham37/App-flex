import React, { createContext, useContext, useState, useEffect } from 'react';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { cacheService, CACHE_KEYS } from '../lib/cacheService';

export type AdPageType = 'home' | 'apps' | 'pc' | 'bundles' | 'detail' | 'search' | 'profile';

export interface AdItem {
  id: string;
  name: string;
  type: 'banner' | 'script' | 'iframe' | 'custom';
  enabled: boolean;
  ad_code: string;
  updated_at?: string;
  click_count?: number;
}

export interface AdSettingsData {
  global_ads_enabled: boolean;
  home_ads_enabled: boolean;
  apps_ads_enabled: boolean;
  pc_ads_enabled: boolean;
  bundle_ads_enabled: boolean;
  detail_ads_enabled: boolean;
  search_ads_enabled: boolean;
  profile_ads_enabled: boolean;
  ads: {
    ad_1: AdItem;
    ad_2: AdItem;
    ad_3: AdItem;
    ad_4: AdItem;
    ad_5: AdItem;
    ad_rewarded: AdItem;
  };
}

export const defaultAdSettings: AdSettingsData = {
  global_ads_enabled: true,
  home_ads_enabled: true,
  apps_ads_enabled: true,
  pc_ads_enabled: true,
  bundle_ads_enabled: true,
  detail_ads_enabled: true,
  search_ads_enabled: true,
  profile_ads_enabled: true,
  ads: {
    ad_1: { id: 'ad_1', name: 'Standard Banner (Slot 1)', type: 'custom', enabled: true, ad_code: '' },
    ad_2: { id: 'ad_2', name: 'Standard Banner (Slot 2)', type: 'custom', enabled: true, ad_code: '' },
    ad_3: { id: 'ad_3', name: 'Inline Feed Ad (Slot 3)', type: 'custom', enabled: true, ad_code: '' },
    ad_4: { id: 'ad_4', name: 'Explore Banner (Slot 4)', type: 'custom', enabled: true, ad_code: '' },
    ad_5: { id: 'ad_5', name: 'Bottom Footer Ad (Slot 5)', type: 'custom', enabled: true, ad_code: '' },
    ad_rewarded: { id: 'ad_rewarded', name: 'Download Interstitial / Rewarded', type: 'custom', enabled: true, ad_code: '' },
  }
};

interface AdsContextType {
  adSettings: AdSettingsData;
  loading: boolean;
  updateAdSettings: (newSettings: Partial<AdSettingsData>) => Promise<void>;
  updateSingleAd: (adKey: keyof AdSettingsData['ads'], adData: Partial<AdItem>) => Promise<void>;
  getNormalAdForIndex: (page: AdPageType, slotIndex: number, pageVisitId?: string) => AdItem | null;
  getRewardedAd: () => AdItem | null;
  isRewardedAdsEnabled: () => boolean;
  isPageAdsEnabled: (page: AdPageType) => boolean;
  fetchAdsSettings: () => Promise<void>;
}

const AdsContext = createContext<AdsContextType | undefined>(undefined);

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

  const [loading, setLoading] = useState(false);

  const applyAds = (data: Partial<AdSettingsData>) => {
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
  };

  const fetchAdsSettings = async () => {
    try {
      const snap = await getDoc(doc(db, 'settings', 'ads'));
      if (snap.exists()) {
        applyAds(snap.data() as Partial<AdSettingsData>);
      }
    } catch (error) {
      console.warn('[AdsProvider] Ads fetch note:', error);
    }
  };

  useEffect(() => {
    const cached = cacheService.get<AdSettingsData>(CACHE_KEYS.ADS);
    if (cached) {
      applyAds(cached);
    } else if (navigator.onLine) {
      fetchAdsSettings();
    }
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
    applyAds(updated);
    await setDoc(doc(db, 'settings', 'ads'), updated, { merge: true });
  };

  const updateSingleAd = async (adKey: keyof AdSettingsData['ads'], adData: Partial<AdItem>) => {
    const current = adSettings.ads[adKey] || defaultAdSettings.ads[adKey];
    const updatedAds = {
      ...adSettings.ads,
      [adKey]: {
        ...current,
        ...adData,
        updated_at: new Date().toISOString()
      }
    };
    const updated: AdSettingsData = {
      ...adSettings,
      ads: updatedAds
    };
    applyAds(updated);
    await setDoc(doc(db, 'settings', 'ads'), updated, { merge: true });
  };

  const isPageAdsEnabled = (page: AdPageType): boolean => {
    if (!adSettings.global_ads_enabled) return false;
    switch (page) {
      case 'home': return adSettings.home_ads_enabled;
      case 'apps': return adSettings.apps_ads_enabled;
      case 'pc': return adSettings.pc_ads_enabled;
      case 'bundles': return adSettings.bundle_ads_enabled;
      case 'detail': return adSettings.detail_ads_enabled;
      case 'search': return adSettings.search_ads_enabled;
      case 'profile': return adSettings.profile_ads_enabled;
      default: return true;
    }
  };

  const getNormalAdForIndex = (page: AdPageType, slotIndex: number, pageVisitId?: string): AdItem | null => {
    if (!isPageAdsEnabled(page)) return null;

    const normalKeys: (keyof AdSettingsData['ads'])[] = ['ad_1', 'ad_2', 'ad_3', 'ad_4', 'ad_5'];
    const activeAds = normalKeys
      .map(k => adSettings.ads[k])
      .filter(a => a && a.enabled && a.ad_code && a.ad_code.trim().length > 0);

    if (activeAds.length === 0) return null;

    // Pick predictable ad slot or round robin
    const selected = activeAds[slotIndex % activeAds.length];
    return selected || null;
  };

  const getRewardedAd = (): AdItem | null => {
    if (!adSettings.global_ads_enabled) return null;
    const ad = adSettings.ads.ad_rewarded;
    if (ad && ad.enabled && ad.ad_code && ad.ad_code.trim().length > 0) {
      return ad;
    }
    return null;
  };

  const isRewardedAdsEnabled = (): boolean => {
    if (!adSettings.global_ads_enabled) return false;
    const ad = adSettings.ads.ad_rewarded;
    return Boolean(ad && ad.enabled && ad.ad_code && ad.ad_code.trim().length > 0);
  };

  return (
    <AdsContext.Provider value={{
      adSettings,
      loading,
      updateAdSettings,
      updateSingleAd,
      getNormalAdForIndex,
      getRewardedAd,
      isRewardedAdsEnabled,
      isPageAdsEnabled,
      fetchAdsSettings
    }}>
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
