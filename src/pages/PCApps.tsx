import React, { useEffect, useState } from 'react';
import { Monitor, Star, ArrowRight, ShieldCheck, Download, Sparkles, Laptop } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, isPCItem } from '../lib/utils';
import { Button } from '../components/ui/Button';
import { AdSlot } from '../components/ads/AdSlot';
import { useApps } from '../context/AppsContext';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { SEO } from '../components/SEO';

interface AppData {
  id: string;
  name: string;
  category: string;
  mainImage: string;
  rating: string;
  size: string;
  itemType?: string;
  status?: string;
}

export default function PCApps() {
  const { apps, categories: dbCategories, loading: appsLoading } = useApps();
  const [items, setItems] = useState<AppData[]>([]);
  const [activeCategory, setActiveCategory] = useState('All');
  const [categories, setCategories] = useState<string[]>(['All']);
  const [pageVisitId] = useState(() => Math.random().toString(36).substring(2, 9));

  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 640);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const shuffle = <T,>(array: T[]): T[] => {
    const newArr = [...array];
    for (let i = newArr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
    }
    return newArr;
  };

  useEffect(() => {
    if (!apps) return;
    const pcItems = (apps as any[])
      .filter(isPCItem)
      .filter(i => !i.status || i.status === 'published');
    
    setItems(shuffle(pcItems));
  }, [apps]);

  const loading = appsLoading && items.length === 0;

  // Category name resolver that handles both category ID and category Name
  const getCategoryName = (catIdOrName: string) => {
    if (!catIdOrName) return 'System Utilities & Recovery';
    const found = dbCategories?.find(
      c => c.id === catIdOrName || c.name.toLowerCase() === catIdOrName.toLowerCase()
    );
    return found ? found.name : catIdOrName;
  };

  // Group by resolved category name for sectional display
  const groupedItems: { [key: string]: AppData[] } = {};
  items.forEach(item => {
    const catName = getCategoryName(item.category);
    if (!groupedItems[catName]) groupedItems[catName] = [];
    groupedItems[catName].push(item);
  });

  // Randomize category order on the page
  const allCatNames = shuffle(Object.keys(groupedItems));

  // Helper to split array into chunks of N items (1 line = 4 items on desktop)
  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // Extract category pills from database and grouped items
  useEffect(() => {
    const itemCats = Object.keys(groupedItems);
    const dbCats = (dbCategories || [])
      .filter(c => c.itemType === 'pc' || (c as any).mainType === 'pc')
      .map(c => c.name);
    const uniqueCats = Array.from(new Set([...dbCats, ...itemCats])).filter(Boolean);
    setCategories(['All', ...uniqueCats]);
  }, [dbCategories, items]);

  // Render a single PC card
  const renderSingleCard = (item: AppData) => {
    const imageSrc = (item as any).mainImage || (item as any).imageUrl || (item as any).icon || 'https://icons.iconarchive.com/icons/custom-icon-design/office/128/application-icon.png';
    return (
      <Link 
        key={item.id} 
        to={`/apps/${item.id}`} 
        className="group block"
      >
        {/* Wide Landscape Card Box */}
        <div className="p-2.5 sm:p-2.5 bg-white rounded-2xl border border-slate-200/90 hover:border-cyan-500 shadow-xs hover:shadow-lg transition-all flex items-center gap-3 sm:gap-3 h-[76px] sm:h-[82px] text-left">
          
          {/* Left Image Thumbnail */}
          <div className="w-13 h-13 sm:w-14 sm:h-14 rounded-xl overflow-hidden bg-slate-50 border border-slate-100 shrink-0 shadow-xs flex items-center justify-center p-1">
            <img 
              src={imageSrc} 
              alt={item.name} 
              className="w-full h-full object-contain group-hover:scale-105 transition-transform duration-300" 
              onError={(e) => {
                (e.target as HTMLElement).setAttribute('src', 'https://icons.iconarchive.com/icons/custom-icon-design/office/128/application-icon.png');
              }}
            />
          </div>
          
          {/* Right Info - Clear Title & Metadata */}
          <div className="flex-1 min-w-0 flex flex-col justify-center space-y-0.5 sm:space-y-1">
            <h3 className="font-black text-slate-900 text-xs sm:text-xs line-clamp-2 group-hover:text-cyan-600 transition-colors uppercase leading-tight sm:leading-snug">
              {item.name}
            </h3>
            
            <div className="flex items-center gap-2 text-[10px] sm:text-[10px] font-bold text-slate-400">
              <span className="text-yellow-500 flex items-center gap-0.5 font-black">
                <Star size={10} fill="currentColor" /> {item.rating || '4.8'}
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
    );
  };

  // Global continuous line counter across all categories for strict 5-line ads
  let globalLineCount = 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 max-w-7xl mx-auto">
      <SEO 
        title="PC Software, Windows Utilities & Desktop Applications"
        description="Download full version PC software, Windows tools, office productivity applications, and desktop utilities for maximum performance on APPFLEX."
        keywords="PC software, Windows apps, desktop software, PC utilities, Windows tools, APPFLEX PC"
      />
      {/* Main Content */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-4">
        
        {/* Header Banner */}
        <div className="bg-gradient-to-r from-slate-800 via-slate-900 to-black rounded-3xl p-6 sm:p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 space-y-3 max-w-lg">
            <div className="inline-flex items-center gap-2 px-3 py-1 bg-white/10 backdrop-blur-md rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 shadow-lg">
              <Laptop size={14} className="text-cyan-400" />
              <span>Premium PC Software</span>
            </div>
            <h1 className="text-2xl sm:text-4xl font-black tracking-tight leading-tight uppercase italic">
              Download PC Software
            </h1>
            <p className="text-slate-400 text-sm font-medium leading-relaxed italic">
              Verified software, utilities and tools for your PC.
            </p>
          </div>
          <Monitor size={150} className="absolute -right-5 -bottom-5 text-white/5 -rotate-12" />
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
                    ? "bg-slate-900 border-slate-900 text-white shadow-lg" 
                    : "bg-white border-slate-200 text-slate-500 hover:border-cyan-400"
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
            <div className="flex items-center gap-2 border-l-4 border-cyan-600 pl-3">
              <h2 className="text-sm sm:text-base font-black tracking-tight text-slate-800 uppercase italic">
                {activeCategory}
              </h2>
            </div>
            {(() => {
              const catItems = groupedItems[activeCategory] || [];
              if (catItems.length === 0) {
                return (
                  <div className="py-16 text-center text-slate-400 text-xs font-bold uppercase tracking-wider">
                    No software found in this category.
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
                      <React.Fragment key={`pc-single-line-${lineIdx}`}>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-2.5 sm:gap-3">
                          {lineItems.map(renderSingleCard)}
                        </div>
                        {showAdAfter && (
                          <div className="pt-2">
                            <AdSlot page="pc" slotIndex={Math.floor((lineIdx + 1) / adInterval) - 1} pageVisitId={pageVisitId} />
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
              const catItems = groupedItems[catName] || [];
              if (catItems.length === 0) return null;

              const chunkSize = isMobile ? 1 : 4;
              const lines = chunkArray(catItems, chunkSize);

              return (
                <section key={catName} className="space-y-2.5">
                  {/* Category Title Header */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2 border-l-4 border-cyan-600 pl-3">
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
                              <AdSlot page="pc" slotIndex={Math.floor(currentGlobalCount / adInterval) - 1} pageVisitId={pageVisitId} />
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
          <div className="py-24 text-center bg-white rounded-3xl border border-slate-200/80 p-8 shadow-sm space-y-4">
            <div className="w-20 h-20 bg-cyan-50 rounded-full flex items-center justify-center mx-auto text-cyan-500">
              <Monitor size={40} />
            </div>
            <div className="space-y-1">
              <p className="text-xl font-black text-slate-800 tracking-tight">No PC Software Found</p>
              <p className="text-sm text-slate-500 font-medium">Try checking another category or explore Android apps.</p>
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
          categories={Array.from(new Set(items.map(i => i.category).filter(Boolean)))} 
          trendingApps={items.slice(0, 5)} 
        />
      </div>
    </div>
  );
}

