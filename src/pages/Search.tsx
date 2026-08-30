import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { 
  Search as SearchIcon, Filter, X, Star, Smartphone, Monitor, Film, 
  Download, ArrowRight, Sparkles, Trash2, ArrowUpDown, ShieldCheck, 
  Layers, CheckCircle2, ChevronRight 
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { AdSlot } from '../components/ads/AdSlot';
import { DesktopSidebar } from '../components/DesktopSidebar';
import { SEO } from '../components/SEO';
import { useApps } from '../context/AppsContext';
import { searchItems, POPULAR_SEARCH_TAGS, SearchResult, resolveItemType } from '../lib/searchEngine';
import { cn } from '../lib/utils';

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { apps, categories, getCategoryName, loading: appsLoading } = useApps();

  const urlQuery = searchParams.get('q') || searchParams.get('search') || '';
  const urlType = (searchParams.get('type') as any) || 'all';
  const urlCategory = searchParams.get('category') || 'All';

  const [searchTerm, setSearchTerm] = useState(urlQuery);
  const [typeFilter, setTypeFilter] = useState<'all' | 'app' | 'pc' | 'bundle'>(
    ['all', 'app', 'pc', 'bundle'].includes(urlType) ? urlType : 'all'
  );
  const [categoryFilter, setCategoryFilter] = useState<string>(urlCategory);
  const [sortBy, setSortBy] = useState<'relevant' | 'rating' | 'newest' | 'alphabetical'>('relevant');
  const [searchHistory, setSearchHistory] = useState<string[]>([]);
  const [pageVisitId] = useState(() => Math.random().toString(36).substring(2, 9));

  // Build category mapping
  const categoriesMap = useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => {
      map[c.id] = c.name;
      map[c.name] = c.name;
    });
    return map;
  }, [categories]);

  // Load search history
  useEffect(() => {
    try {
      const saved = localStorage.getItem('search_history');
      if (saved) setSearchHistory(JSON.parse(saved));
    } catch {}
  }, []);

  // Sync state if URL search query changes externally
  useEffect(() => {
    if (urlQuery !== searchTerm) {
      setSearchTerm(urlQuery);
    }
  }, [urlQuery]);

  // Save to history helper
  const saveToHistory = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim().toLowerCase();
    setSearchHistory(prev => {
      const updated = [clean, ...prev.filter(h => h !== clean)].slice(0, 8);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const removeFromHistory = (term: string) => {
    setSearchHistory(prev => {
      const updated = prev.filter(h => h !== term);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('search_history');
  };

  // Sync URL search params
  const updateUrlParams = (newQuery: string, newType: string, newCat: string) => {
    const params = new URLSearchParams();
    if (newQuery.trim()) params.set('q', newQuery.trim());
    if (newType !== 'all') params.set('type', newType);
    if (newCat !== 'All') params.set('category', newCat);
    setSearchParams(params, { replace: true });
  };

  const handleQueryChange = (text: string) => {
    setSearchTerm(text);
    updateUrlParams(text, typeFilter, categoryFilter);
  };

  const handleTypeSelect = (type: 'all' | 'app' | 'pc' | 'bundle') => {
    setTypeFilter(type);
    setCategoryFilter('All');
    updateUrlParams(searchTerm, type, 'All');
  };

  const handleCategorySelect = (cat: string) => {
    setCategoryFilter(cat);
    updateUrlParams(searchTerm, typeFilter, cat);
  };

  const handleSearchSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (searchTerm.trim()) {
      saveToHistory(searchTerm);
    }
  };

  // Compute Search Results
  const rawResults = useMemo(() => {
    if (!apps || apps.length === 0) return [];
    return searchItems(apps as any[], searchTerm, categoriesMap, {
      typeFilter,
      categoryFilter,
      limit: 200
    });
  }, [apps, searchTerm, typeFilter, categoryFilter, categoriesMap]);

  // Sort Results
  const searchResults = useMemo(() => {
    const list = [...rawResults];
    if (sortBy === 'rating') {
      list.sort((a, b) => {
        const rA = parseFloat(String(a.item.rating || '0'));
        const rB = parseFloat(String(b.item.rating || '0'));
        return rB - rA;
      });
    } else if (sortBy === 'alphabetical') {
      list.sort((a, b) => a.item.name.localeCompare(b.item.name));
    } else if (sortBy === 'newest') {
      list.sort((a, b) => {
        const timeA = a.item.updatedAt?.seconds || a.item.createdAt?.seconds || 0;
        const timeB = b.item.updatedAt?.seconds || b.item.createdAt?.seconds || 0;
        return timeB - timeA;
      });
    }
    return list;
  }, [rawResults, sortBy]);

  // Available dynamic categories for active type
  const availableCategories = useMemo(() => {
    const allPublished = (apps as any[]).filter(i => !i.status || i.status === 'published');
    const filteredByType = typeFilter === 'all' 
      ? allPublished 
      : allPublished.filter(i => resolveItemType(i) === typeFilter);

    const set = new Set<string>();
    filteredByType.forEach(i => {
      const name = categoriesMap[i.category || ''] || i.category;
      if (name) set.add(name);
    });

    return ['All', ...Array.from(set).sort()];
  }, [apps, typeFilter, categoriesMap]);

  // All published apps for sidebar
  const allPublished = useMemo(() => {
    return (apps as any[]).filter(item => !item.status || item.status === 'published');
  }, [apps]);

  const trendingApps = useMemo(() => {
    return allPublished.slice(0, 5);
  }, [allPublished]);

  const sidebarCategories = useMemo(() => {
    return Array.from(new Set(allPublished.map(i => categoriesMap[i.category || ''] || i.category).filter(Boolean)));
  }, [allPublished, categoriesMap]);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 pb-24 max-w-7xl mx-auto px-2 sm:px-4">
      <SEO 
        title={searchTerm ? `Search "${searchTerm}" - Fast Downloads` : "Smart Search - APKs, PC Software & Video Bundles"}
        description="Search hundreds of Android APKs, PC software, Adobe collections, video bundles, and Lightroom presets on APPFLEX."
        keywords="search apps, find APK, PC software download, video bundle search, APPFLEX search"
      />

      {/* Main Search Area */}
      <div className="lg:col-span-8 xl:col-span-9 space-y-6">
        
        {/* Search Bar & Header */}
        <div className="bg-white rounded-3xl p-4 sm:p-6 border border-slate-200/90 shadow-sm space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2 uppercase italic">
              <SearchIcon size={24} className="text-blue-600" />
              <span>Smart Search Engine</span>
            </h1>
            <span className="text-[11px] font-black uppercase tracking-widest text-slate-400 bg-slate-100 px-3 py-1 rounded-xl">
              {apps.length} Total Items
            </span>
          </div>

          {/* Search Input Box */}
          <form onSubmit={handleSearchSubmit} className="relative">
            <div className="relative flex items-center">
              <div className="absolute left-4 text-blue-600 pointer-events-none">
                <SearchIcon size={22} />
              </div>
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => handleQueryChange(e.target.value)}
                placeholder="Search by name, category, Adobe, CapCut, reels, #12..."
                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-slate-900 font-bold placeholder:text-slate-400 focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-base outline-none shadow-inner"
              />
              {searchTerm && (
                <button
                  type="button"
                  onClick={() => handleQueryChange('')}
                  className="absolute right-3.5 p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-200/80 transition-colors"
                >
                  <X size={18} />
                </button>
              )}
            </div>
          </form>

          {/* Type Filter Buttons */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all', label: 'All Items', icon: Layers },
              { id: 'app', label: 'Android Apps', icon: Smartphone },
              { id: 'pc', label: 'PC Software', icon: Monitor },
              { id: 'bundle', label: 'Reels / Bundles', icon: Film },
            ].map((tab) => {
              const Icon = tab.icon;
              const active = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleTypeSelect(tab.id as any)}
                  className={cn(
                    "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap border shadow-2xs",
                    active
                      ? "bg-blue-600 border-blue-600 text-white shadow-blue-500/20"
                      : "bg-white border-slate-200 text-slate-600 hover:border-slate-300 hover:bg-slate-50"
                  )}
                >
                  <Icon size={14} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Category Pills */}
          {availableCategories.length > 1 && (
            <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-hide -mx-1 px-1">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 flex-shrink-0">
                Categories:
              </span>
              {availableCategories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => handleCategorySelect(cat)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-[11px] font-bold transition-all whitespace-nowrap border",
                    categoryFilter.toLowerCase() === cat.toLowerCase()
                      ? "bg-slate-800 border-slate-800 text-white font-black"
                      : "bg-slate-50 border-slate-200/80 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Ad Placement */}
        <AdSlot page="search" slotIndex={0} pageVisitId={pageVisitId} className="my-2" />

        {/* Search Results Area */}
        <div className="space-y-4">
          
          {/* Results Bar & Sort Control */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-4 bg-blue-600 rounded-full" />
              <p className="text-xs font-black text-slate-500 uppercase tracking-widest">
                {searchTerm ? (
                  <>Found <span className="text-blue-600 font-extrabold">{searchResults.length}</span> results for "{searchTerm}"</>
                ) : (
                  <>Showing <span className="text-blue-600 font-extrabold">{searchResults.length}</span> items</>
                )}
              </p>
            </div>

            {/* Sort Selector */}
            <div className="flex items-center gap-2 self-end sm:self-auto">
              <ArrowUpDown size={14} className="text-slate-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-700 outline-none focus:border-blue-400 cursor-pointer shadow-2xs"
              >
                <option value="relevant">Most Relevant</option>
                <option value="rating">Highest Rated</option>
                <option value="newest">Newest Added</option>
                <option value="alphabetical">Alphabetical (A-Z)</option>
              </select>
            </div>
          </div>

          {/* Results List */}
          {searchResults.length > 0 ? (
            <div className="grid grid-cols-1 gap-3">
              <AnimatePresence>
                {searchResults.map(({ item, resolvedType, resolvedCategory }, idx) => (
                  <motion.div
                    key={item.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: Math.min(idx * 0.03, 0.3) }}
                  >
                    <Link to={`/apps/${item.id}`} className="block group">
                      <GlassCard className="p-3.5 sm:p-4 rounded-2xl border-slate-200/80 hover:border-blue-400 hover:shadow-lg transition-all flex items-center gap-3 sm:gap-5 bg-white">
                        
                        {/* App Icon */}
                        <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-2xl overflow-hidden bg-slate-50 flex-shrink-0 border border-slate-200/90 shadow-2xs group-hover:scale-102 transition-transform">
                          <img
                            src={item.mainImage || item.icon}
                            alt={item.name}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                        </div>

                        {/* App Meta Info */}
                        <div className="flex-1 min-w-0 space-y-1">
                          
                          {/* Badges */}
                          <div className="flex flex-wrap items-center gap-1.5">
                            <span className={cn(
                              "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider border",
                              resolvedType === 'bundle' ? "bg-purple-50 text-purple-700 border-purple-200" :
                              resolvedType === 'pc' ? "bg-cyan-50 text-cyan-800 border-cyan-200" :
                              "bg-blue-50 text-blue-700 border-blue-200"
                            )}>
                              {resolvedType === 'bundle' ? 'Reel Bundle' : resolvedType === 'pc' ? 'PC Software' : 'Android APK'}
                            </span>

                            <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md truncate max-w-[150px]">
                              {resolvedCategory}
                            </span>

                            {item.appNumber && (
                              <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded-md">
                                #{item.appNumber}
                              </span>
                            )}
                          </div>

                          {/* App Name */}
                          <h3 className="text-base sm:text-lg font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors leading-tight">
                            {item.name}
                          </h3>

                          {/* App Sub-Meta */}
                          <div className="flex items-center gap-3 text-xs text-slate-500 font-medium">
                            <div className="flex items-center gap-1 text-yellow-500 font-black">
                              <Star size={13} fill="currentColor" />
                              <span className="text-slate-800">{item.rating || '4.5'}</span>
                            </div>
                            {item.size && (
                              <span>• {item.size}</span>
                            )}
                            {item.version && (
                              <span className="hidden xs:inline">• v{item.version}</span>
                            )}
                          </div>
                        </div>

                        {/* Action Arrow */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <span className="hidden sm:inline-block text-[11px] font-black text-blue-600 bg-blue-50 px-3.5 py-2 rounded-xl border border-blue-100 group-hover:bg-blue-600 group-hover:text-white transition-all uppercase tracking-wider">
                            Details
                          </span>
                          <div className="w-9 h-9 rounded-xl bg-slate-50 group-hover:bg-blue-50 group-hover:text-blue-600 text-slate-400 flex items-center justify-center transition-all border border-slate-100">
                            <ChevronRight size={18} />
                          </div>
                        </div>

                      </GlassCard>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          ) : (
            /* No Results Fallback with Smart Recommendations */
            <div className="bg-white rounded-3xl border border-slate-200/90 p-8 sm:p-12 text-center space-y-6 shadow-sm">
              <div className="w-16 h-16 rounded-full bg-blue-50 text-blue-600 flex items-center justify-center mx-auto shadow-inner">
                <SearchIcon size={28} />
              </div>
              
              <div className="space-y-1 max-w-md mx-auto">
                <h3 className="text-xl font-black text-slate-900 tracking-tight">No Exact Matches Found</h3>
                <p className="text-sm text-slate-500 font-medium">
                  We couldn't find matches for "{searchTerm}". Try one of the popular search suggestions below:
                </p>
              </div>

              {/* Popular Suggested Tags */}
              <div className="flex flex-wrap justify-center gap-2 max-w-xl mx-auto pt-2">
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag.label}
                    onClick={() => handleQueryChange(tag.label)}
                    className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-blue-50 hover:border-blue-300 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 hover:text-blue-700 transition-all shadow-2xs active:scale-95"
                  >
                    <span>{tag.icon}</span>
                    <span>{tag.label}</span>
                  </button>
                ))}
              </div>

              <div>
                <Button
                  onClick={() => {
                    setSearchTerm('');
                    setTypeFilter('all');
                    setCategoryFilter('All');
                    updateUrlParams('', 'all', 'All');
                  }}
                  variant="outline"
                  className="rounded-xl px-6 font-bold"
                >
                  Reset All Filters
                </Button>
              </div>
            </div>
          )}

          {/* Recent Searches Section & Suggestions Cloud */}
          {searchHistory.length > 0 && (
            <div className="bg-white rounded-3xl p-5 border border-slate-200/80 space-y-3 shadow-2xs mt-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Sparkles size={16} className="text-amber-500" />
                  <h3 className="text-xs font-black uppercase tracking-widest text-slate-500">
                    Your Recent Searches
                  </h3>
                </div>
                <button
                  onClick={clearHistory}
                  className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-wider flex items-center gap-1"
                >
                  <Trash2 size={11} /> Clear All
                </button>
              </div>

              <div className="flex flex-wrap gap-2">
                {searchHistory.map((term) => (
                  <div
                    key={term}
                    onClick={() => handleQueryChange(term)}
                    className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-colors cursor-pointer border border-transparent hover:border-blue-200"
                  >
                    <span>{term}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFromHistory(term);
                      }}
                      className="text-slate-400 hover:text-red-500 transition-colors"
                    >
                      <X size={12} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* Sidebar with Categories and Top Rated */}
      <div className="lg:col-span-4 xl:col-span-3">
        <DesktopSidebar 
          categories={sidebarCategories} 
          trendingApps={trendingApps} 
        />
      </div>

    </div>
  );
}
