import React, { useEffect, useState } from 'react';
import { Star, Film, ArrowRight, ShieldCheck, Download, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, isBundleItem } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { AdSlot } from '../components/ads/AdSlot';
import { useApps } from '../context/AppsContext';
import { SEO } from '../components/SEO';

export default function Bundles() {
  const { apps, categories: dbCategories, loading: appsLoading } = useApps();
  const [bundles, setBundles] = useState<any[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [allItems, setAllItems] = useState<any[]>([]);
  const [pageVisitId] = useState(() => Math.random().toString(36).substring(2, 9));

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!apps) return;
    const items = (apps as any[]).filter(i => !i.status || i.status === 'published');
    
    // Sort items by date (newest first) instead of shuffling
    const sortedItems = [...items].sort((a, b) => {
      const dateA = a.updatedAt?.seconds || a.createdAt?.seconds || 0;
      const dateB = b.updatedAt?.seconds || b.createdAt?.seconds || 0;
      return dateB - dateA;
    });
    
    setAllItems(sortedItems);
    
    // STRICT filter: ONLY items that are bundles
    const bundleItems = sortedItems.filter(isBundleItem);
    setBundles(bundleItems);
  }, [apps]);

  const loading = appsLoading && bundles.length === 0;

  // Category name resolver that handles both category ID and category Name
  const getCategoryName = (catIdOrName: string) => {
    if (!catIdOrName) return 'General';
    const found = dbCategories?.find(
      c => c.id === catIdOrName || c.name.toLowerCase() === catIdOrName.toLowerCase()
    );
    return found ? found.name : catIdOrName;
  };

  // Derive unique categories for sidebar
  const allCategories = Array.from(new Set(allItems.map(i => getCategoryName(i.category)).filter(Boolean)));
  const trendingApps = allItems.filter(i => !i.itemType || i.itemType === 'app').slice(0, 5);

  // Group bundles by resolved category NAME for UI display
  const groupedBundles: { [key: string]: any[] } = {};
  bundles.forEach(bundle => {
    const catName = getCategoryName(bundle.category);
    if (!groupedBundles[catName]) groupedBundles[catName] = [];
    groupedBundles[catName].push(bundle);
  });

  // Extract category pills from database and grouped items
  useEffect(() => {
    const itemCats = Object.keys(groupedBundles);
    const dbCats = (dbCategories || [])
      .filter(c => c.itemType === 'bundle' || (c as any).mainType === 'bundle')
      .map(c => c.name);
    const uniqueCats = Array.from(new Set([...dbCats, ...itemCats])).filter(Boolean);
    
    // Sort pills: All, AI REELS, then others
    const sortedPills = uniqueCats.sort((a, b) => {
      if (a.toLowerCase() === 'ai reels') return -1;
      if (b.toLowerCase() === 'ai reels') return 1;
      return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
    });
    
    setCategories(['All', ...sortedPills]);
  }, [dbCategories, bundles]);

  // Category display order: AI REELS first, then BUNDLE 1, 2, 3...
  const allCatNames = Object.keys(groupedBundles).sort((a, b) => {
    if (a.toLowerCase() === 'ai reels') return -1;
    if (b.toLowerCase() === 'ai reels') return 1;
    return a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' });
  });

  // Helper to split array into chunks of N items (1 line = 4 items on desktop)
  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // Render a single bundle card
  const renderSingleCard = (bundle: any) => {
    const imageSrc = bundle.mainImage || bundle.imageUrl || bundle.icon || 'https://i.etsystatic.com/47600983/r/il/b60acb/5881826130/il_1140xN.5881826130_3sh5.jpg';
    return (
      <Link 
        key={bundle.id} 
        to={`/apps/${bundle.id}`} 
        className="group block"
      >
        {/* Wide Landscape Card Box */}
        <div className="p-2.5 sm:p-2.5 bg-white rounded-2xl border border-slate-200/90 hover:border-purple-400 shadow-xs hover:shadow-lg transition-all flex items-center gap-3 sm:gap-3 h-[76px] sm:h-[82px] text-left">
          
          {/* Left Image Thumbnail */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-100 border border-slate-100 shrink-0 shadow-xs flex items-center justify-center p-0.5">
            <img 
              src={imageSrc} 
              alt={bundle.name} 
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300 rounded-lg" 
              onError={(e) => {
                (e.target as HTMLElement).setAttribute('src', 'https://i.etsystatic.com/47600983/r/il/b60acb/5881826130/il_1140xN.5881826130_3sh5.jpg');
              }}
            />
          </div>
          
          {/* Right Info - Clear Title & Metadata */}
          <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5 sm:space-y-1">
            <h3 className="font-black text-slate-900 text-xs sm:text-xs line-clamp-2 group-hover:text-purple-600 transition-colors uppercase leading-tight sm:leading-snug">
              {bundle.name}
            </h3>
            
            <div className="flex items-center gap-2 text-[10px] sm:text-[10px] font-bold text-slate-400">
              <span className="text-yellow-500 flex items-center gap-0.5 font-black">
                <Star size={10} fill="currentColor" /> {bundle.rating || '4.8'}
              </span>
              {bundle.size && bundle.size.trim() !== '' && (
                <>
                  <span>•</span>
                  <span className="uppercase text-slate-500 font-semibold truncate">{bundle.size}</span>
                </>
              )}
            </div>
          </div>

        </div>
      </Link>
    );
  };

  // Global continuous line counter across all categories for strict 5-line ads
  let globalLineCount = 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 max-w-7xl mx-auto">
      <SEO 
        title="Video Editing Bundles, Lightroom Presets & LUT Packs"
        description="Download high quality video editing bundles, Lightroom presets, Premiere Pro templates, cinematic LUTs, overlays, and sound FX packs on APPFLEX."
        keywords="video bundles, Lightroom presets, Premiere Pro templates, cinematic LUTs, sound FX, video editing packs, APPFLEX"
      />
      {/* Main Content */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-4">
        
        {/* Header Banner - Strictly for Video Bundles */}
        <div className="bg-gradient-to-r from-purple-700 via-indigo-700 to-blue-700 rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/20 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg">
              <Film size={14} className="fill-white" />
              <span>Video & Creator Bundles</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight uppercase italic">
              Premium Video Bundles
            </h1>
            <p className="text-purple-100 text-sm font-medium leading-relaxed italic">
              Verified LUTs, Presets and Creator Packs.
            </p>
          </div>
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-white/10 to-transparent pointer-events-none" />
        </div>

        {/* Category Pills */}
        {categories.length > 1 && (
          <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-5 py-2 rounded-2xl text-[11px] font-black tracking-widest uppercase transition-all whitespace-nowrap border shadow-sm",
                  activeCategory.toLowerCase() === cat.toLowerCase() 
                    ? "bg-purple-600 border-purple-600 text-white shadow-lg" 
                    : "bg-white border-slate-200 text-slate-500 hover:border-purple-300"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="py-12 text-center text-xs font-black text-slate-400 animate-pulse uppercase tracking-widest">Loading...</div>
        ) : activeCategory !== 'All' ? (
          /* Single Category View with strict 5-line ad placement */
          <div className="space-y-4 pt-2">
            <div className="flex items-center gap-2 border-l-4 border-purple-600 pl-3">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-800 uppercase italic">
                {activeCategory}
              </h2>
            </div>
            {(() => {
              const catItems = groupedBundles[activeCategory] || [];
              if (catItems.length === 0) {
                return (
                  <div className="py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                    No items found in this category.
                  </div>
                );
              }

              const chunkSize = isMobile ? 1 : 4;
              const adInterval = isMobile ? 6 : 5;
              const lines = chunkArray(catItems, chunkSize);

              return (
                <div className="space-y-3.5">
                  {lines.map((lineItems, lineIdx) => {
                    const showAdAfter = (lineIdx + 1) % adInterval === 0;
                    return (
                      <React.Fragment key={`bundle-single-line-${lineIdx}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                          {lineItems.map(renderSingleCard)}
                        </div>
                        {showAdAfter && (
                          <div className="pt-2">
                            <AdSlot page="bundle" slotIndex={Math.floor((lineIdx + 1) / adInterval) - 1} pageVisitId={pageVisitId} />
                          </div>
                        )}
                      </React.Fragment>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        ) : allCatNames.length > 0 ? (
          /* All Categories View with Continuous 5-line Counter across Categories */
          <div className="space-y-7 pt-2">
            {allCatNames.map((catName) => {
              const catItems = groupedBundles[catName] || [];
              if (catItems.length === 0) return null;

              const chunkSize = isMobile ? 1 : 4;
              const lines = chunkArray(catItems, chunkSize);

              return (
                <section key={catName} className="space-y-2.5">
                  {/* Category Title Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 border-l-4 border-purple-600 pl-3">
                      <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-800 uppercase italic">
                        {catName}
                      </h2>
                    </div>
                  </div>

                  {/* Lines of items with strictly timed ads */}
                  <div className="space-y-3.5">
                    {lines.map((lineItems, lineIdx) => {
                      globalLineCount++;
                      const currentGlobalCount = globalLineCount;
                      const adInterval = isMobile ? 6 : 5;
                      const showAdAfter = currentGlobalCount % adInterval === 0;

                      return (
                        <React.Fragment key={`${catName}-line-${lineIdx}`}>
                          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                            {lineItems.map(renderSingleCard)}
                          </div>

                          {showAdAfter && (
                            <div className="pt-2">
                              <AdSlot page="bundle" slotIndex={Math.floor(currentGlobalCount / adInterval) - 1} pageVisitId={pageVisitId} />
                            </div>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </div>
                </section>
              );
            })}
          </div>
        ) : (
          <div className="py-24 text-center space-y-4 bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm">
            <div className="w-20 h-20 bg-purple-50 rounded-full flex items-center justify-center mx-auto text-purple-400">
              <Film size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-slate-800 tracking-tight">No Bundles Yet</p>
              <p className="text-sm text-slate-500 font-medium">We're working on adding premium video bundles soon.</p>
            </div>
            <Link to="/explore">
              <Button variant="gradient" className="rounded-xl px-8">Explore Apps</Button>
            </Link>
          </div>
        )}
      </div>

      {/* Sidebar */}
      <div className="lg:col-span-4 xl:col-span-3">
        <DesktopSidebar 
          categories={allCategories} 
          trendingApps={trendingApps} 
        />
      </div>
    </div>
  );
}
