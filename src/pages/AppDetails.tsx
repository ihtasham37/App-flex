import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, useLocation, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, getDocs, addDoc, deleteDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/Button';
import { 
  Download, ArrowLeft, Star, Share2, 
  Smartphone, Heart, ShieldCheck, X, Film, Monitor,
  Edit3, Bookmark, ShieldAlert, Lock, LogIn
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { cn, isBundleItem, isPCItem } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';
import { useAds } from '../context/AdsContext';
import { useApps } from '../context/AppsContext';
import { AdSlot } from '../components/ads/AdSlot';
import { RewardedAdModal } from '../components/ads/RewardedAdModal';
import { getUserTodayDownloadCount, isRewardedDownloadRequired } from '../lib/downloadLimit';

interface AppData {
  id: string;
  name: string;
  appNumber: string;
  developer: string;
  category: string;
  version: string;
  size: string;
  rating: number;
  shortDescription?: string;
  fullDescription: string;
  mainImage: string;
  screenshots: string[];
  downloadUrl: string;
  downloadButtonText?: string;
  status?: string;
  itemType?: 'app' | 'bundle' | 'pc';
  showOnBanner?: boolean;
}

import { RelatedAppsSidebar } from '../components/RelatedAppsSidebar';
import { SEO } from '../components/SEO';

interface RelatedItemsProps {
  currentCategory: string;
  currentAppId: string;
  settings: any;
  pageVisitId?: string;
}

const RelatedItems: React.FC<RelatedItemsProps> = ({ 
  currentCategory, 
  currentAppId, 
  pageVisitId 
}) => {
  const { apps: allApps, getCategoryName } = useApps();
  const [relatedItems, setRelatedItems] = useState<AppData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function fetchRelated() {
      try {
        setLoading(true);
        const targetCat = getCategoryName(currentCategory).toLowerCase().trim();
        // Use in-memory apps from AppsContext instead of Firestore query (0 reads!)
        let items = allApps
          .filter(item => 
            getCategoryName(item.category).toLowerCase().trim() === targetCat && 
            item.id !== currentAppId && 
            (!item.status || item.status === 'published')
          ) as unknown as AppData[];

        // Shuffle
        for (let i = items.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [items[i], items[j]] = [items[j], items[i]];
        }

        // We want 2 rows (up to 10 items total, 5 items per line)
        setRelatedItems(items.slice(0, 10));
      } catch (error) {
        console.error("Error setting related items:", error);
      } finally {
        setLoading(false);
      }
    }
    if (allApps.length > 0) {
      fetchRelated();
    }
  }, [currentCategory, currentAppId, allApps, getCategoryName]);

  if (loading) return <div className="h-20 flex items-center justify-center text-xs text-slate-400">Loading Related Items...</div>;
  if (relatedItems.length === 0) return null;

  const line1 = relatedItems.slice(0, 5);
  const line2 = relatedItems.slice(5, 10);

  const renderCard = (item: AppData) => (
    <Link 
      key={item.id} 
      to={`/apps/${item.id}`} 
      onClick={() => window.scrollTo({ top: 0, left: 0, behavior: 'instant' })}
      className="group flex flex-col items-center text-center select-none"
    >
      <div className="aspect-square w-full rounded-2xl bg-white p-1 shadow-xs border border-slate-200/90 group-hover:shadow-lg transition-all overflow-hidden flex items-center justify-center group-hover:-translate-y-1">
        <img 
          src={item.mainImage} 
          alt={item.name} 
          className="w-full h-full object-cover rounded-xl" 
        />
      </div>
      <div className="w-full mt-2 px-0.5 space-y-0.5">
        <h3 className="font-black text-slate-800 text-[10px] sm:text-xs truncate leading-tight transition-colors uppercase group-hover:text-blue-600">
          {item.name}
        </h3>
        <div className="flex items-center justify-center gap-1 text-yellow-500">
          <Star size={10} fill="currentColor" />
          <span className="text-[10px] font-black text-slate-700">{item.rating || '4.5'}</span>
        </div>
      </div>
    </Link>
  );

  return (
    <section className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-8 shadow-xs space-y-5">
      <div className="flex items-center justify-between px-1 border-l-4 border-slate-900 pl-3">
        <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase italic">Related Items</h2>
      </div>

      {/* Line 1 of Related Items */}
      <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
        {line1.map(renderCard)}
      </div>

      {/* Advertisement placed directly between Line 1 and Line 2 of Related Items */}
      {line2.length > 0 && (
        <div className="py-2 border-y border-slate-100/80">
          <AdSlot page="detail" slotIndex={1} pageVisitId={pageVisitId} />
        </div>
      )}

      {/* Line 2 of Related Items */}
      {line2.length > 0 && (
        <div className="grid grid-cols-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-2 sm:gap-4">
          {line2.map(renderCard)}
        </div>
      )}
    </section>
  );
}

export default function AppDetails() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isAdmin } = useAuth();
  const { settings } = useSettings();
  const { isRewardedAdsEnabled, getRewardedAd } = useAds();
  const { getAppById, getCategoryName } = useApps();
  
  const [app, setApp] = useState<AppData | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [activeScreenshot, setActiveScreenshot] = useState<string | null>(null);
  const [showRewardedModal, setShowRewardedModal] = useState(false);
  const [pageVisitId] = useState(() => Math.random().toString(36).substring(2, 9));

  useEffect(() => {
    // Scroll to top immediately whenever navigating to a different app
    window.scrollTo({ top: 0, left: 0, behavior: 'instant' });

    async function fetchAppDetails() {
      if (!appId) return;
      try {
        setLoading(true);
        const cachedOrFetched = await getAppById(appId);
        
        if (cachedOrFetched) {
          setApp(cachedOrFetched as AppData);
          
          if (user) {
            const savedQuery = query(
              collection(db, 'saved_apps'),
              where('userId', '==', user.uid),
              where('appId', '==', appId)
            );
            const savedSnap = await getDocs(savedQuery);
            setIsSaved(!savedSnap.empty);
          }
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error("Error loading app details:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchAppDetails();
  }, [appId, user, getAppById, navigate]);

  const handleSaveApp = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (!app || saving) return;

    setSaving(true);
    try {
      const savedQuery = query(
        collection(db, 'saved_apps'),
        where('userId', '==', user.uid),
        where('appId', '==', app.id)
      );
      const savedSnap = await getDocs(savedQuery);

      if (!savedSnap.empty) {
        const deletePromises = savedSnap.docs.map(d => deleteDoc(doc(db, 'saved_apps', d.id)));
        await Promise.all(deletePromises);
        setIsSaved(false);
      } else {
        await addDoc(collection(db, 'saved_apps'), {
          userId: user.uid,
          appId: app.id,
          appName: app.name,
          appImage: app.mainImage,
          category: app.category,
          rating: app.rating || 4.5,
          version: app.version || '1.0.0',
          itemType: app.itemType || 'app',
          savedAt: serverTimestamp()
        });
        setIsSaved(true);
      }
    } catch (error) {
      console.error("Save error:", error);
    } finally {
      setSaving(false);
    }
  };

  const [downloadTriggered, setDownloadTriggered] = useState(false);

  const cleanUrl = (url?: string): string => {
    if (!url) return '';
    let cleaned = url.trim();
    if (cleaned.includes('drive.googsle.com')) {
      cleaned = cleaned.replace('drive.googsle.com', 'drive.google.com');
    }
    if (!cleaned.startsWith('http://') && !cleaned.startsWith('https://')) {
      cleaned = 'https://' + cleaned;
    }
    return cleaned;
  };

  const triggerDownloadAction = (url: string) => {
    const targetUrl = cleanUrl(url);
    if (!targetUrl) return;

    setDownloadTriggered(true);

    // Method 1: Hidden anchor click (bypasses most browser popup blockers)
    try {
      const a = document.createElement('a');
      a.href = targetUrl;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      setTimeout(() => {
        if (document.body.contains(a)) {
          document.body.removeChild(a);
        }
      }, 500);
    } catch {
      // Method 2: Direct window.open
      try {
        window.open(targetUrl, '_blank', 'noopener,noreferrer');
      } catch {
        // Method 3: Direct location redirect fallback
        window.location.assign(targetUrl);
      }
    }
  };

  const executeDownload = async () => {
    if (!app || !app.downloadUrl || !user) return;
    setDownloading(true);

    // 1. Immediately trigger download to retain user activation
    triggerDownloadAction(app.downloadUrl);

    // 2. Asynchronously record the download without blocking the user
    try {
      await addDoc(collection(db, 'downloads'), {
        userId: user.uid,
        appId: app.id,
        appName: app.name,
        appNumber: app.appNumber || '',
        category: app.category || '',
        downloadedAt: serverTimestamp()
      });
    } catch (error) {
      console.warn("Non-fatal download logging error:", error);
    } finally {
      setDownloading(false);
    }
  };

  const handleDownload = async () => {
    if (!app) return;

    // 1. If user is not logged in / signed up, redirect to login page immediately
    if (!user) {
      navigate('/login', { state: { from: location } });
      return;
    }

    // 2. Check daily download count for registered user if rewarded ads are enabled
    const hasActiveRewardedAd = isRewardedAdsEnabled() && Boolean(getRewardedAd());
    if (hasActiveRewardedAd) {
      try {
        const todayCount = await getUserTodayDownloadCount(user.uid);
        if (isRewardedDownloadRequired(todayCount)) {
          // Trigger the Rewarded Ad modal
          setShowRewardedModal(true);
          return;
        }
      } catch (err) {
        console.warn("Could not check today download count:", err);
      }
    }

    // 3. Direct secure download for registered user
    await executeDownload();
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4">
        <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-500 font-medium animate-pulse text-sm">Loading details...</p>
      </div>
    );
  }

  if (!app) return null;

  const isBundle = isBundleItem(app);
  const isPC = isPCItem(app);

  // Filter valid screenshots only
  const displayScreenshots = (app.screenshots || []).filter(s => s && s.trim() !== '').slice(0, 4);

  // Compute Category Default Description
  const itemType = app.itemType || (
    app.category?.toLowerCase().includes('pc') ? 'pc' :
    app.category?.toLowerCase().includes('bundle') ? 'bundle' : 'app'
  );

  const defaultCategoryDescription = 
    itemType === 'pc'
      ? (settings.defaultPCAppsDescription || 'Download full-version desktop software, PC utilities, Windows productivity tools, and creative applications for maximum performance on APPFLEX.')
      : itemType === 'bundle'
      ? (settings.defaultBundlesDescription || 'Download premium video editing packs, Lightroom presets, Premiere Pro templates, cinematic LUTs, overlays, and sound FX bundles on APPFLEX.')
      : (settings.defaultAppsDescription || 'Discover and download official premium Android applications with 100% security, high speed servers, and lifetime updates on APPFLEX.');

  const finalDescription = defaultCategoryDescription;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 max-w-7xl mx-auto">
      <SEO 
        title={`${app.name} Download (${app.version || 'Latest Version'})`}
        description={app.shortDescription || app.fullDescription?.substring(0, 150) || `Download ${app.name} APK version ${app.version || 'latest'} for free.`}
        image={app.mainImage}
        keywords={`${app.name}, download ${app.name}, ${app.category}, APK, APPFLEX`}
      />
      {/* Main Column */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-6">
        {/* Top Action Bar with Back & Save App */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 bg-white border border-slate-200/80 rounded-xl px-4 py-2.5 shadow-xs">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => navigate(-1)} 
              className="flex items-center gap-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back</span>
            </button>

            {isAdmin && (
              <span className="text-[10px] font-black uppercase tracking-wider bg-purple-100 text-purple-800 px-2 py-0.5 rounded-md border border-purple-200 ml-1">
                Admin View
              </span>
            )}
          </div>

          {/* Action Header Buttons: Save App + Admin Edit + Share */}
          <div className="flex items-center gap-2 flex-wrap">
            {/* Admin Direct Edit Button */}
            {isAdmin && (
              <Link to={`/admin/apps/${app.id}/edit`}>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="h-8 text-xs font-bold gap-1.5 rounded-lg border-blue-200 text-blue-700 bg-blue-50/60 hover:bg-blue-100"
                >
                  <Edit3 size={13} />
                  <span>Edit in Admin</span>
                </Button>
              </Link>
            )}

            {/* Save / Bookmark Button */}
            <button 
              onClick={handleSaveApp} 
              disabled={saving}
              title={isAdmin ? "Save to Admin Panel Quick-List" : "Save for later"}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all border",
                isSaved 
                  ? "bg-red-50 text-red-600 border-red-200 shadow-2xs" 
                  : "bg-slate-50 text-slate-700 hover:bg-slate-100 border-slate-200"
              )}
            >
              <Heart size={14} className={cn(isSaved ? "fill-red-500 text-red-500" : "text-slate-500")} />
              <span>{isSaved ? (isAdmin ? 'Saved in Admin' : 'Saved') : (isAdmin ? 'Save to Admin' : 'Save')}</span>
            </button>

            {isAdmin && isSaved && (
              <Link to="/admin/saved">
                <button 
                  className="px-2 py-1.5 rounded-lg text-[11px] font-bold text-slate-600 hover:text-blue-600 bg-slate-100 hover:bg-blue-50 border border-slate-200 transition-colors"
                  title="Open Admin Saved Manager"
                >
                  Manage in Admin →
                </button>
              </Link>
            )}

            <button 
              onClick={() => {
                const shareData = {
                  title: app.name,
                  text: app.shortDescription || `Download ${app.name} from ${settings.appName || 'Mobilio'}`,
                  url: window.location.href,
                };
                
                if (navigator.share) {
                  navigator.share(shareData);
                } else {
                  navigator.clipboard.writeText(window.location.href);
                  alert("Link copied to clipboard!");
                }
              }}
              className="p-1.5 rounded-lg text-slate-600 hover:bg-slate-100 border border-slate-200 transition-colors"
              title="Share"
            >
              <Share2 size={16} />
            </button>
          </div>
        </div>

        {/* Hero Header & Info */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-5 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-8">
            {/* Main Cover or Icon */}
            <div className={cn(
              "rounded-2xl overflow-hidden shadow-md border border-slate-200 flex-shrink-0 bg-slate-50 transition-transform hover:scale-105 duration-300",
              isBundle ? "w-40 h-32 sm:w-52 sm:h-40" : "w-32 h-32 sm:w-40 sm:h-40"
            )}>
              <img src={app.mainImage} alt={app.name} className="w-full h-full object-cover" />
            </div>
            
            <div className="flex-1 text-center sm:text-left space-y-3">
              <div className="space-y-1">
                <span className={cn(
                  "inline-block px-3 py-1 text-[11px] font-black uppercase tracking-wider rounded-lg mb-1 border shadow-xs",
                  isBundle 
                    ? "bg-purple-50 text-purple-700 border-purple-200" 
                    : "bg-blue-50 text-blue-600 border-blue-100"
                )}>
                  {getCategoryName(app.category)}
                </span>
                <h1 className="text-3xl sm:text-4xl font-black text-slate-900 leading-tight tracking-tight">{app.name}</h1>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                  {isBundle ? `By ${app.developer || settings.appName || 'AppFlix Studio'}` : `By ${app.developer || 'Verified Developer'}`}
                </p>
              </div>

              {/* Quick stats tags */}
              <div className="flex items-center justify-center sm:justify-start gap-5 pt-2 text-sm text-slate-600">
                <div className="flex items-center gap-1.5">
                  <Star size={18} fill="#FACC15" className="text-yellow-400" />
                  <span className="font-black text-slate-800 text-lg">{app.rating || '4.8'}</span>
                </div>
                {app.version && (
                  <>
                    <div className="w-px h-6 bg-slate-100 hidden sm:block" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Version</span>
                      <span className="font-bold text-slate-800">
                        {isBundle ? `Pack v${app.version}` : `v${app.version}`}
                      </span>
                    </div>
                  </>
                )}
                {app.size && app.size.trim() !== '' && (
                  <>
                    <div className="w-px h-6 bg-slate-100 hidden sm:block" />
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-black uppercase tracking-wider">Size</span>
                      <span className="font-bold text-slate-800">{app.size}</span>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Advertisement #1 (Near top, between info and download action) */}
          <AdSlot page="detail" slotIndex={0} pageVisitId={pageVisitId} className="mt-4" />

          {/* Download Action Bar */}
          <div className="mt-6 pt-6 border-t border-slate-100 flex flex-col items-stretch gap-3">
            <div className="flex flex-col sm:flex-row items-center gap-4">
              <Button 
                onClick={handleDownload}
                variant="default"
                className={cn(
                  "w-full sm:flex-1 h-14 rounded-2xl text-base font-black text-white shadow-xl transition-all active:scale-[0.98]",
                  isBundle 
                    ? "bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 shadow-purple-500/25" 
                    : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-blue-500/25"
                )}
                loading={downloading}
              >
                <Download size={22} className="mr-2" />
                <span>
                  {app.downloadButtonText && app.downloadButtonText.trim() !== '' 
                    ? app.downloadButtonText 
                    : (isBundle 
                        ? (app.size && app.size.trim() !== '' ? `Download Bundle (${app.size})` : 'Download Bundle')
                        : isPC
                        ? (app.size && app.size.trim() !== '' ? `Download PC Software (${app.size})` : 'Download PC Software')
                        : (app.size && app.size.trim() !== '' ? `Download APK (${app.size})` : 'Download APK')
                      )
                  }
                </span>
              </Button>

              <div className="flex items-center gap-2 text-[12px] font-black text-emerald-600 bg-emerald-50 px-4 py-3 rounded-2xl border border-emerald-200 whitespace-nowrap shadow-sm">
                <ShieldCheck size={20} />
                <span>
                  {isBundle ? '100% Tested Pack' : isPC ? '100% Clean Software' : '100% Clean APK'}
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* Screenshots Section - Only show if images exist */}
        {displayScreenshots.length > 0 && (
          <section className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {isBundle ? (
                  <Film size={20} className="text-purple-600" />
                ) : isPC ? (
                  <Monitor size={20} className="text-slate-900" />
                ) : (
                  <Smartphone size={20} className="text-blue-600" />
                )}
                <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase">Gallery Preview</h2>
              </div>
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 bg-slate-50 px-2 py-1 rounded-md">Tap to zoom</span>
            </div>

            {/* Compact screenshots side-by-side - Size stays same regardless of count */}
            <div className="grid grid-cols-4 gap-3 sm:gap-4 w-full">
              {displayScreenshots.map((url: string, i: number) => (
                <div 
                  key={i} 
                  onClick={() => setActiveScreenshot(url)}
                  className="aspect-[9/16] rounded-2xl overflow-hidden shadow-sm border border-slate-200 cursor-pointer group relative bg-slate-100 hover:border-blue-500 hover:shadow-lg transition-all"
                >
                  <img 
                    src={url} 
                    alt={`Screenshot ${i + 1}`} 
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" 
                    onError={(e) => (e.currentTarget.style.display = 'none')}
                  />
                  <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-all flex items-center justify-center">
                    <div className="opacity-0 group-hover:opacity-100 bg-white text-slate-900 p-2 rounded-full shadow-xl translate-y-4 group-hover:translate-y-0 transition-all duration-300">
                      {isPC ? <Monitor size={16} /> : <Smartphone size={16} />}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* Description Section */}
        <section className="bg-white border border-slate-200/80 rounded-2xl p-6 sm:p-8 shadow-xs space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-1.5 h-6 bg-blue-600 rounded-full" />
            <h2 className="text-lg font-black tracking-tight text-slate-800 uppercase">
              {isBundle ? 'What\'s Inside This Bundle' : 'Detailed Description'}
            </h2>
          </div>
          <div className="text-slate-700 font-medium leading-relaxed text-sm sm:text-base whitespace-pre-line bg-slate-50/70 p-6 rounded-2xl border border-slate-100">
            {finalDescription}
          </div>
        </section>

        {/* Related Items Section (Includes Ad #2 placed between Line 1 and Line 2) */}
        <RelatedItems 
          key={`related-${app.id}`}
          currentCategory={app.category} 
          currentAppId={app.id} 
          settings={settings}
          pageVisitId={pageVisitId}
        />
      </div>

      {/* Sidebar Column */}
      <div className="lg:col-span-4 xl:col-span-3">
        <RelatedAppsSidebar 
          key={`sidebar-${app.id}`}
          currentCategory={app.category} 
          currentAppId={app.id} 
        />
      </div>

      {/* Rewarded Ad 6 Download Modal */}
      <RewardedAdModal
        isOpen={showRewardedModal}
        onClose={() => setShowRewardedModal(false)}
        onSuccess={() => {
          executeDownload();
        }}
        appName={app.name}
      />

      {/* Screenshot Lightbox Modal */}
      <AnimatePresence>
        {activeScreenshot && (
          <div 
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-950/90 backdrop-blur-md"
            onClick={() => setActiveScreenshot(null)}
          >
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative max-w-sm w-full max-h-[90vh] rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] bg-black"
              onClick={e => e.stopPropagation()}
            >
              <img 
                src={activeScreenshot} 
                alt="Enlarged screenshot" 
                className="w-full h-full object-contain max-h-[90vh]"
              />
              <button 
                onClick={() => setActiveScreenshot(null)}
                className="absolute top-4 right-4 p-2 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors border border-white/10 backdrop-blur-md"
              >
                <X size={24} />
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
