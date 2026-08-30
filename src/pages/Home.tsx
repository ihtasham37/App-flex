import React, { useEffect, useState, useMemo } from 'react';
import { Button } from '../components/ui/Button';
import { Star, Film, ArrowRight, ShieldCheck, Smartphone, Monitor, Search as SearchIcon, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, isAppItem, isBundleItem, isPCItem } from '../lib/utils';
import { useSettings } from '../context/SettingsContext';
import { useApps } from '../context/AppsContext';
import { AdSlot } from '../components/ads/AdSlot';
import { SEO } from '../components/SEO';

interface AppData {
  id: string;
  name: string;
  category: string;
  developer?: string;
  mainImage: string;
  shortDescription?: string;
  fullDescription?: string;
  appNumber?: string;
  rating?: number | string;
  version?: string;
  size?: string;
  status?: string;
  itemType?: 'app' | 'bundle' | 'pc';
  showOnBanner?: boolean;
}

interface HomeLine {
  key: string;
  type: 'app' | 'bundle' | 'pc';
  title: string;
  items: AppData[];
  seeAllPath: string;
}

export default function Home() {
  const { settings } = useSettings();
  const { apps, getCategoryName, loading: appsLoading } = useApps();
  const [currentBannerIndex, setCurrentBannerIndex] = useState(0);
  const [pageVisitId] = useState(() => Math.random().toString(36).substring(2, 9));

  // Compute banner apps stably
  const bannerApps = useMemo<AppData[]>(() => {
    if (!apps || apps.length === 0) return [];
    const banners = apps.filter(item => item.isBanner || (item as any).showOnBanner);
    return banners.length > 0 ? banners : apps.slice(0, 5);
  }, [apps]);

  // Derive lines cleanly with useMemo so scroll / re-render never shakes or flickers
  const lines = useMemo<HomeLine[]>(() => {
    if (!apps || apps.length === 0) return [];

    const appsOnly = apps.filter(isAppItem);
    const bundlesOnly = apps.filter(isBundleItem);
    const pcOnly = apps.filter(isPCItem);

    const groupItems = (items: AppData[]) => {
      const groups: { [cat: string]: AppData[] } = {};
      items.forEach(item => {
        const cat = getCategoryName(item.category);
        if (!groups[cat]) groups[cat] = [];
        groups[cat].push(item);
      });
      return groups;
    };

    const appGroups = groupItems(appsOnly);
    const bundleGroups = groupItems(bundlesOnly);
    const pcGroups = groupItems(pcOnly);

    const allLines: HomeLine[] = [];

    // 1. Featured lines
    if (bundlesOnly.length > 0) {
      allLines.push({
        key: 'top-bundles',
        type: 'bundle',
        title: 'Trending Video Bundles',
        items: bundlesOnly,
        seeAllPath: '/bundles'
      });
    }

    if (appsOnly.length > 0) {
      allLines.push({
        key: 'top-apps',
        type: 'app',
        title: 'Popular Android Apps',
        items: appsOnly,
        seeAllPath: '/explore'
      });
    }

    if (pcOnly.length > 0) {
      allLines.push({
        key: 'top-pc',
        type: 'pc',
        title: 'PC & Windows Software',
        items: pcOnly,
        seeAllPath: '/pc'
      });
    }

    // 2. Category lines
    Object.entries(bundleGroups).forEach(([catName, list]) => {
      if (list.length > 0) {
        allLines.push({
          key: `bundle-cat-${catName}`,
          type: 'bundle',
          title: catName,
          items: list,
          seeAllPath: '/bundles'
        });
      }
    });

    Object.entries(appGroups).forEach(([catName, list]) => {
      if (list.length > 0) {
        allLines.push({
          key: `app-cat-${catName}`,
          type: 'app',
          title: catName,
          items: list,
          seeAllPath: `/explore?category=${encodeURIComponent(catName)}`
        });
      }
    });

    Object.entries(pcGroups).forEach(([catName, list]) => {
      if (list.length > 0) {
        allLines.push({
          key: `pc-cat-${catName}`,
          type: 'pc',
          title: catName,
          items: list,
          seeAllPath: '/pc'
        });
      }
    });

    return allLines;
  }, [apps, getCategoryName]);

  // Auto-rotate Banner Every 4 Seconds (smooth and non-intrusive)
  useEffect(() => {
    if (bannerApps.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentBannerIndex(prev => (prev + 1) % bannerApps.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [bannerApps.length]);

  const activeBanner = bannerApps[currentBannerIndex] || null;

  const renderHomeLine = (
    type: 'app' | 'bundle' | 'pc',
    title: string,
    items: AppData[],
    seeAllPath: string
  ) => {
    if (!items || items.length === 0) return null;

    let icon = <Smartphone size={17} className="text-blue-600" />;
    let borderLeftColor = "border-blue-600";
    let textColor = "text-blue-600";
    let hoverBorder = "hover:border-blue-400";
    let hoverText = "group-hover:text-blue-600";

    if (type === 'bundle') {
      icon = <Film size={17} className="text-purple-600" />;
      borderLeftColor = "border-purple-600";
      textColor = "text-purple-600";
      hoverBorder = "hover:border-purple-400";
      hoverText = "group-hover:text-purple-600";
    } else if (type === 'pc') {
      icon = <Monitor size={17} className="text-cyan-600" />;
      borderLeftColor = "border-cyan-600";
      textColor = "text-cyan-600";
      hoverBorder = "hover:border-cyan-400";
      hoverText = "group-hover:text-cyan-600";
    }

    const isWideFormat = type === 'bundle' || type === 'pc';

    return (
      <section className="space-y-2.5">
        {/* Section Header with Title & See All */}
        <div className="flex items-center justify-between px-1">
          <div className={`flex items-center gap-2 border-l-4 ${borderLeftColor} pl-2.5`}>
            {icon}
            <h2 className="text-sm sm:text-base font-black text-slate-800 tracking-tight uppercase italic">
              {title}
            </h2>
          </div>
          
          <Link 
            to={seeAllPath} 
            className={`text-[11px] font-black ${textColor} hover:underline flex items-center gap-0.5 uppercase tracking-wider`}
          >
            See All <ArrowRight size={13} />
          </Link>
        </div>

        {/* CARDS DISPLAY */}
        {isWideFormat ? (
          <div className="flex gap-2.5 sm:gap-3 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
            {items.map((item) => (
              <Link 
                key={item.id} 
                to={`/apps/${item.id}`} 
                className="snap-start shrink-0 w-[calc(48.5%-5px)] min-w-[155px] sm:w-[260px] md:w-[calc(33.333%-8px)] max-w-[340px] group block select-none"
              >
                <div className={`p-2 sm:p-2.5 bg-white rounded-2xl border border-slate-200/90 ${hoverBorder} shadow-xs hover:shadow-md transition-all flex items-center gap-2.5 sm:gap-3 h-[74px] sm:h-[82px] text-left`}>
                  <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0 shadow-xs">
                    <img 
                      src={item.mainImage} 
                      alt={item.name} 
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                    />
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5 sm:space-y-1">
                    <h3 className={`font-black text-slate-900 text-[10px] sm:text-xs line-clamp-2 ${hoverText} transition-colors uppercase leading-tight sm:leading-snug`}>
                      {item.name}
                    </h3>
                    <div className="flex items-center gap-1.5 text-[9px] sm:text-[10px] font-bold text-slate-400">
                      <span className="text-yellow-500 flex items-center gap-0.5 font-black">
                        <Star size={9} fill="currentColor" /> {item.rating || '4.5'}
                      </span>
                      {item.size && item.size.trim() !== '' && (
                        <>
                          <span>•</span>
                          <span className="uppercase text-slate-500 font-semibold truncate">{item.size}</span>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="flex gap-2.5 sm:gap-3.5 overflow-x-auto pb-3 pt-1 scrollbar-hide snap-x snap-mandatory -mx-1 px-1">
            {items.map((item) => (
              <Link 
                key={item.id} 
                to={`/apps/${item.id}`} 
                className="snap-start shrink-0 w-[74px] sm:w-[90px] lg:w-[98px] group flex flex-col items-center text-center select-none"
              >
                <div className={`aspect-square w-full rounded-2xl bg-white p-1 shadow-xs border border-slate-200/90 ${hoverBorder} group-hover:shadow-md transition-all overflow-hidden flex items-center justify-center group-hover:-translate-y-1`}>
                  <img 
                    src={item.mainImage} 
                    alt={item.name} 
                    loading="lazy"
                    className="w-full h-full object-cover rounded-xl" 
                  />
                </div>
                <div className="w-full mt-1.5 px-0.5 space-y-0.5">
                  <h3 className={`font-black text-slate-800 text-[10px] sm:text-[11px] truncate leading-tight uppercase ${hoverText} transition-colors`}>
                    {item.name}
                  </h3>
                  <div className="flex items-center justify-center gap-0.5 text-yellow-500">
                    <Star size={9} fill="currentColor" />
                    <span className="text-[9px] font-black text-slate-700">{item.rating || '4.5'}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 relative max-w-7xl mx-auto">
      <SEO 
        title="Verified Android APKs, PC Software & Video Bundles" 
        description="Download 100% verified, safe, and fast Android apps, PC software, Lightroom presets, cinematic LUTs, and video editing bundles on APPFLEX."
        keywords="APKs, PC software, Lightroom presets, Premiere Pro templates, APPFLEX, download apps, video bundles"
      />
      <div className="lg:col-span-8 xl:col-span-9 space-y-6">
        {/* Quick Search Widget */}
        <div className="bg-white rounded-2xl p-3.5 sm:p-4 border border-slate-200/90 shadow-xs space-y-2.5">
          <Link to="/search" className="block group">
            <div className="flex items-center gap-3 px-3.5 py-2.5 bg-slate-50 group-hover:bg-blue-50/70 border border-slate-200/80 group-hover:border-blue-300 rounded-xl transition-all shadow-2xs">
              <SearchIcon size={18} className="text-blue-600 group-hover:scale-110 transition-transform flex-shrink-0" />
              <span className="text-slate-400 group-hover:text-slate-600 text-xs sm:text-sm font-bold flex-1">
                Search 300+ Android APKs, PC Soft, Reels, #12...
              </span>
              <span className="text-[10px] font-black text-blue-600 bg-white group-hover:bg-blue-600 group-hover:text-white px-2.5 py-1 rounded-lg border border-slate-200/80 transition-all uppercase tracking-wider hidden xs:inline">
                Search
              </span>
            </div>
          </Link>

          {/* Quick Trending Suggestions */}
          <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-hide -mx-1 px-1">
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-shrink-0 flex items-center gap-1">
              <Sparkles size={11} className="text-amber-500" /> Hot:
            </span>
            {[
              { label: 'Photoshop', q: 'Adobe Photoshop' },
              { label: 'CapCut', q: 'CapCut' },
              { label: 'Gym Reels', q: 'Gym Reels' },
              { label: 'InPage Urdu', q: 'InPage Urdu' },
              { label: 'Office PC', q: 'WPS Office' },
              { label: 'Presets', q: 'Lightroom Presets' },
              { label: 'Video AI', q: 'Topaz Video' },
            ].map(tag => (
              <Link
                key={tag.label}
                to={`/search?q=${encodeURIComponent(tag.q)}`}
                className="px-2.5 py-1 rounded-lg bg-slate-100/80 hover:bg-blue-50 text-slate-600 hover:text-blue-600 text-[11px] font-bold transition-colors whitespace-nowrap"
              >
                {tag.label}
              </Link>
            ))}
          </div>
        </div>

        {/* 1. Hero Banner */}
        {activeBanner ? (
          <section className="relative w-full aspect-[16/8] sm:aspect-[21/8] lg:aspect-[21/7] rounded-2xl overflow-hidden shadow-md border border-slate-200/90 bg-slate-950 select-none group">
            <Link to={`/apps/${activeBanner.id}`} className="block w-full h-full">
              <div className="absolute inset-0">
                <img 
                  src={activeBanner.mainImage} 
                  alt={activeBanner.name} 
                  className="w-full h-full object-cover opacity-85 group-hover:scale-105 transition-all duration-700 ease-out" 
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/45 to-transparent" />
              </div>
              <div className="absolute bottom-0 left-0 p-4 sm:p-6 w-full flex items-end justify-between gap-3">
                <div className="space-y-1.5 max-w-md">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1 bg-yellow-400 text-slate-950 px-2 py-0.5 rounded-md text-[11px] font-black shadow-xs">
                      <Star size={12} fill="currentColor" />
                      <span>{activeBanner.rating || '4.8'}</span>
                    </div>
                    <span className="px-2 py-0.5 bg-blue-600/90 backdrop-blur-md text-white text-[10px] font-extrabold rounded-md uppercase tracking-wider">
                      {activeBanner.category}
                    </span>
                  </div>
                  <h1 className="text-lg sm:text-2xl font-black text-white tracking-tight leading-tight uppercase italic">{activeBanner.name}</h1>
                </div>
                <Button variant="gradient" size="sm" className="rounded-xl px-4 h-9 text-xs font-bold shadow-lg">View Now</Button>
              </div>
            </Link>
          </section>
        ) : null}

        {/* 2. Category Lines with Ads after every 5 lines */}
        <div className="space-y-7">
          {lines.map((line, idx) => (
            <React.Fragment key={line.key}>
              {renderHomeLine(line.type, line.title, line.items, line.seeAllPath)}
              
              {/* Show Ad after every 5 lines */}
              {(idx + 1) % 5 === 0 && (
                <div className="pt-1">
                  <AdSlot page="home" slotIndex={Math.floor((idx + 1) / 5) - 1} pageVisitId={pageVisitId} />
                </div>
              )}
            </React.Fragment>
          ))}
        </div>

        {/* Safety Badge */}
        <div className="p-5 bg-white rounded-2xl border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center border border-emerald-100 flex-shrink-0">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h4 className="text-sm font-black text-slate-800">100% Safe & Tested Files</h4>
              <p className="text-[12px] text-slate-500 font-medium italic">Verified by {settings.appName || 'APPFLEX'} Safety Team</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
