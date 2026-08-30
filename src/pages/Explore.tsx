import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Star, Smartphone } from 'lucide-react';
import { Link } from 'react-router-dom';
import { cn, isAppItem } from '../lib/utils';
import { AdSlot } from '../components/ads/AdSlot';
import { useApps } from '../context/AppsContext';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { SEO } from '../components/SEO';

interface AppData {
  id: string;
  name: string;
  category: string;
  mainImage: string;
  rating: number;
  status?: string;
  itemType?: 'app' | 'bundle' | 'pc';
}

export default function Explore() {
  const [searchParams, setSearchParams] = useSearchParams();
  const activeCategory = searchParams.get('category') || 'All';

  const { apps, categories: dbCategories, loading: appsLoading } = useApps();
  const [allItems, setAllItems] = useState<AppData[]>([]);
  const [pageVisitId] = useState(() => Math.random().toString(36).substring(2, 9));

  // Category name resolver that handles both category ID and category Name
  const getCategoryName = (catIdOrName: string) => {
    if (!catIdOrName) return 'General';
    const found = dbCategories?.find(
      c => c.id === catIdOrName || c.name.toLowerCase() === catIdOrName.toLowerCase()
    );
    return found ? found.name : catIdOrName;
  };

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
    const published = (apps as any[]).filter(item => !item.status || item.status === 'published');
    setAllItems(shuffle(published));
  }, [apps]);

  const currentTypeItems = allItems.filter(isAppItem);

  const dynamicCategories: string[] = Array.from(
    new Set(currentTypeItems.map(i => getCategoryName(i.category)).filter(Boolean))
  );
  const availableCategories: string[] = ['All', ...dynamicCategories];

  // Derive unique categories for sidebar
  const allCategories: string[] = dynamicCategories;
  const trendingApps = currentTypeItems.slice(0, 5);

  const handleCategorySelect = (cat: string) => {
    const newParams = new URLSearchParams(searchParams);
    if (cat === 'All') {
      newParams.delete('category');
    } else {
      newParams.set('category', cat);
    }
    setSearchParams(newParams);
  };

  const loading = appsLoading && currentTypeItems.length === 0;

  // Group all items by resolved category name
  const categorizedGroups: { [key: string]: AppData[] } = {};
  currentTypeItems.forEach(item => {
    const cat = getCategoryName(item.category);
    if (!categorizedGroups[cat]) categorizedGroups[cat] = [];
    categorizedGroups[cat].push(item);
  });

  // Category display order
  const catNames: string[] = Object.keys(categorizedGroups).sort((a, b) => 
    a.localeCompare(b, undefined, { numeric: true, sensitivity: 'base' })
  );

  const singleCategoryItems: AppData[] = activeCategory === 'All' 
    ? [] 
    : currentTypeItems.filter(i => getCategoryName(i.category).toLowerCase() === activeCategory.toLowerCase());

  // Helper to split array into chunks of N items (1 line = 4 items)
  const chunkArray = <T,>(arr: T[], size: number): T[][] => {
    const chunks: T[][] = [];
    for (let i = 0; i < arr.length; i += size) {
      chunks.push(arr.slice(i, i + size));
    }
    return chunks;
  };

  // Render a single line of 4 cards
  const renderLineOfCards = (items: AppData[]) => (
    <div className="grid grid-cols-4 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-4 gap-2.5 sm:gap-4">
      {items.map((item) => (
        <Link key={item.id} to={`/apps/${item.id}`} className="group flex flex-col items-center text-center select-none">
          <div className="aspect-square w-full rounded-2xl bg-white p-1 shadow-xs border border-slate-200/90 group-hover:shadow-lg transition-all overflow-hidden flex items-center justify-center group-hover:-translate-y-1 group-hover:border-blue-400">
            <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover rounded-xl" />
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
      ))}
    </div>
  );

  // Build rendered category blocks with precise 5-line ad placement
  let globalLineCount = 0;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 max-w-7xl mx-auto">
      <SEO 
        title="Explore Top Android Apps & Tools"
        description="Discover top trending Android applications, utility tools, productivity software, and APKs categorized for fast downloads on APPFLEX."
        keywords="Android apps, APKs, utility tools, productivity tools, APPFLEX explore"
      />
      <div className="lg:col-span-8 xl:col-span-9 space-y-4">
        
        {/* Type Header Bar */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-slate-200/80 pb-4 gap-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight flex items-center gap-2 uppercase italic">
              <Smartphone size={24} className="text-blue-600" />
              <span>Android Apps</span>
            </h1>
          </div>
        </div>

        {/* Category Filter Pills */}
        <div className="flex gap-2.5 overflow-x-auto pb-2 scrollbar-hide -mx-2 px-2">
          {availableCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategorySelect(cat)}
              className={cn(
                "px-4 py-2 rounded-xl text-[11px] font-black tracking-widest uppercase transition-all whitespace-nowrap border shadow-xs",
                activeCategory.toLowerCase() === cat.toLowerCase() 
                  ? "bg-blue-600 border-blue-600 text-white"
                  : "bg-white border-slate-200 text-slate-500 hover:border-slate-400"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs font-black text-slate-400 animate-pulse uppercase tracking-widest">Loading...</div>
        ) : activeCategory !== 'All' ? (
          /* Single Category View with Multi-line Ads every 5 lines */
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-1.5 h-6 rounded-full bg-blue-600" />
              <h2 className="text-xl font-black text-slate-800 uppercase italic tracking-tight">{activeCategory}</h2>
            </div>
            {singleCategoryItems.length > 0 ? (
              <div className="space-y-3.5">
                {chunkArray(singleCategoryItems, 4).map((lineItems, lineIdx) => (
                  <React.Fragment key={`single-line-${lineIdx}`}>
                    {renderLineOfCards(lineItems)}
                    {/* Show ad after every 5 lines */}
                    {(lineIdx + 1) % 5 === 0 && (
                      <div className="pt-2">
                        <AdSlot page="apps" slotIndex={Math.floor((lineIdx + 1) / 5) - 1} pageVisitId={pageVisitId} />
                      </div>
                    )}
                  </React.Fragment>
                ))}
              </div>
            ) : (
              <div className="py-20 text-center uppercase italic font-black text-slate-400">Empty Category</div>
            )}
          </div>
        ) : (
          /* All Categories View - Randomized Categories with Ads after every 5 lines */
          <div className="space-y-7">
            {catNames.map((catName) => {
              const catItems = categorizedGroups[catName] || [];
              if (catItems.length === 0) return null;

              const lines = chunkArray(catItems, 4);

              return (
                <section key={catName} className="space-y-3">
                  {/* Category Header */}
                  <div className="flex items-center justify-between px-1 border-l-4 border-slate-900 pl-3">
                    <h2 className="text-lg font-black text-slate-800 tracking-tight uppercase italic">{catName}</h2>
                    <button onClick={() => handleCategorySelect(catName)} className="text-xs font-black uppercase tracking-widest hover:underline text-blue-600">
                      See All
                    </button>
                  </div>

                  {/* Lines of 4 items with ads after every 5 lines */}
                  <div className="space-y-3.5">
                    {lines.map((lineItems, lineIdx) => {
                      globalLineCount++;
                      const currentGlobalCount = globalLineCount;
                      const showAdAfterThisLine = currentGlobalCount % 5 === 0;

                      return (
                        <React.Fragment key={`${catName}-line-${lineIdx}`}>
                          {renderLineOfCards(lineItems)}

                          {showAdAfterThisLine && (
                            <div className="pt-2">
                              <AdSlot page="apps" slotIndex={Math.floor(currentGlobalCount / 5) - 1} pageVisitId={pageVisitId} />
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
        )}
      </div>

      <div className="lg:col-span-4 xl:col-span-3">
        <DesktopSidebar categories={allCategories} trendingApps={trendingApps} />
      </div>
    </div>
  );
}
