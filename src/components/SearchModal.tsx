import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, X, Star, Smartphone, Monitor, Film, ArrowRight, CornerDownLeft, Sparkles, Trash2 } from 'lucide-react';
import { useApps } from '../context/AppsContext';
import { searchItems, POPULAR_SEARCH_TAGS, SearchResult } from '../lib/searchEngine';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'motion/react';

interface SearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialQuery?: string;
}

export const SearchModal: React.FC<SearchModalProps> = ({ isOpen, onClose, initialQuery = '' }) => {
  const navigate = useNavigate();
  const { apps, categories, getCategoryName } = useApps();
  const [query, setQuery] = useState(initialQuery);
  const [typeFilter, setTypeFilter] = useState<'all' | 'app' | 'pc' | 'bundle'>('all');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Category ID to Name map
  const categoriesMap = React.useMemo(() => {
    const map: Record<string, string> = {};
    categories.forEach(c => {
      map[c.id] = c.name;
      map[c.name] = c.name;
    });
    return map;
  }, [categories]);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      try {
        const saved = localStorage.getItem('search_history');
        if (saved) setRecentSearches(JSON.parse(saved));
      } catch {}
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const res = searchItems(apps as any[], query, categoriesMap, {
      typeFilter,
      limit: 12
    });
    setResults(res);
  }, [query, typeFilter, apps, categoriesMap, isOpen]);

  const handleSelectApp = (appId: string) => {
    saveSearchQuery(query);
    onClose();
    navigate(`/apps/${appId}`);
  };

  const handleFullSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    saveSearchQuery(searchTerm);
    onClose();
    navigate(`/search?q=${encodeURIComponent(searchTerm)}`);
  };

  const saveSearchQuery = (term: string) => {
    if (!term.trim()) return;
    const clean = term.trim().toLowerCase();
    setRecentSearches(prev => {
      const updated = [clean, ...prev.filter(s => s !== clean)].slice(0, 6);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const removeRecent = (term: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setRecentSearches(prev => {
      const updated = prev.filter(s => s !== term);
      localStorage.setItem('search_history', JSON.stringify(updated));
      return updated;
    });
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem('search_history');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center p-3 sm:p-6 sm:pt-20 bg-slate-900/60 backdrop-blur-md animate-fadeIn">
      {/* Backdrop click */}
      <div className="fixed inset-0" onClick={onClose} />

      <div className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[85vh] z-10 animate-in zoom-in-95 duration-200">
        
        {/* Search Input Header */}
        <div className="p-4 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
          <div className="w-10 h-10 rounded-2xl bg-blue-600/10 text-blue-600 flex items-center justify-center flex-shrink-0">
            <Search size={20} />
          </div>
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && query.trim()) {
                handleFullSearch(query);
              } else if (e.key === 'Escape') {
                onClose();
              }
            }}
            placeholder="Search APKs, PC software, Adobe, reels, #12..."
            className="flex-1 bg-transparent border-none outline-none text-slate-800 font-bold placeholder:text-slate-400 text-base sm:text-lg"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors"
            >
              <X size={18} />
            </button>
          )}
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-2xl transition-colors text-xs font-black uppercase tracking-wider"
          >
            ESC
          </button>
        </div>

        {/* Type Filter Pills */}
        <div className="px-4 py-2.5 border-b border-slate-100 flex items-center gap-2 overflow-x-auto scrollbar-hide bg-white">
          <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 mr-1 flex-shrink-0">
            Filter:
          </span>
          {[
            { id: 'all', label: 'All Items' },
            { id: 'app', label: 'Android Apps', icon: Smartphone },
            { id: 'pc', label: 'PC Software', icon: Monitor },
            { id: 'bundle', label: 'Reels / Bundles', icon: Film },
          ].map((tab) => {
            const Icon = tab.icon;
            const active = typeFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setTypeFilter(tab.id as any)}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-black uppercase tracking-wider transition-all whitespace-nowrap",
                  active 
                    ? "bg-blue-600 text-white shadow-sm" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {Icon && <Icon size={13} />}
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* Results / Suggestions Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
          {query.trim() ? (
            results.length > 0 ? (
              <div className="space-y-2">
                <div className="flex items-center justify-between px-1">
                  <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                    Matches ({results.length})
                  </span>
                  <button
                    onClick={() => handleFullSearch(query)}
                    className="text-xs font-black text-blue-600 hover:text-blue-700 flex items-center gap-1"
                  >
                    View All in Search Page <ArrowRight size={12} />
                  </button>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  {results.map(({ item, resolvedType, resolvedCategory }) => (
                    <div
                      key={item.id}
                      onClick={() => handleSelectApp(item.id)}
                      className="group flex items-center gap-3.5 p-2.5 rounded-2xl hover:bg-blue-50/80 border border-transparent hover:border-blue-200 transition-all cursor-pointer"
                    >
                      <div className="w-12 h-12 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                        <img
                          src={item.mainImage || item.icon}
                          alt={item.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                        />
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className={cn(
                            "px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wider",
                            resolvedType === 'bundle' ? "bg-purple-100 text-purple-700" :
                            resolvedType === 'pc' ? "bg-cyan-100 text-cyan-800" :
                            "bg-blue-100 text-blue-700"
                          )}>
                            {resolvedType === 'bundle' ? 'Bundle' : resolvedType === 'pc' ? 'PC Soft' : 'APK'}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400 truncate">
                            {resolvedCategory}
                          </span>
                          {item.appNumber && (
                            <span className="text-[10px] font-bold text-slate-400">#{item.appNumber}</span>
                          )}
                        </div>
                        <h4 className="text-sm font-black text-slate-900 truncate group-hover:text-blue-600 transition-colors">
                          {item.name}
                        </h4>
                      </div>

                      <div className="flex items-center gap-2 flex-shrink-0">
                        <div className="flex items-center gap-1 text-yellow-500 text-xs font-black">
                          <Star size={12} fill="currentColor" />
                          <span>{item.rating || '4.5'}</span>
                        </div>
                        <div className="w-8 h-8 rounded-xl bg-slate-100 text-slate-400 group-hover:bg-blue-600 group-hover:text-white flex items-center justify-center transition-all">
                          <CornerDownLeft size={14} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="py-10 text-center space-y-3">
                <div className="w-14 h-14 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
                  <X size={24} />
                </div>
                <div>
                  <h4 className="text-base font-black text-slate-800">No matching items found</h4>
                  <p className="text-xs text-slate-500 font-medium mt-1">
                    Try searching for a simpler keyword like "Adobe", "CapCut", "Reels", "Office", or a number like "#12".
                  </p>
                </div>
              </div>
            )
          ) : (
            <div className="space-y-6">
              {/* Recent Searches */}
              {recentSearches.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between px-1">
                    <span className="text-[11px] font-black uppercase tracking-widest text-slate-400">
                      Recent Searches
                    </span>
                    <button
                      onClick={clearAllRecent}
                      className="text-[10px] font-black text-red-500 hover:text-red-600 uppercase tracking-wider flex items-center gap-1"
                    >
                      <Trash2 size={10} /> Clear
                    </button>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {recentSearches.map(term => (
                      <div
                        key={term}
                        onClick={() => {
                          setQuery(term);
                        }}
                        className="group flex items-center gap-2 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold transition-colors cursor-pointer"
                      >
                        <span>{term}</span>
                        <button
                          onClick={(e) => removeRecent(term, e)}
                          className="text-slate-400 hover:text-red-500 transition-colors"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Popular Trending Tags */}
              <div className="space-y-2">
                <div className="flex items-center gap-1.5 px-1 text-slate-400">
                  <Sparkles size={13} className="text-amber-500" />
                  <span className="text-[11px] font-black uppercase tracking-widest">
                    Popular Suggestions
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {POPULAR_SEARCH_TAGS.map((tag) => (
                    <button
                      key={tag.label}
                      onClick={() => setQuery(tag.label)}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white border border-slate-200/80 hover:border-blue-400 hover:bg-blue-50 text-slate-700 hover:text-blue-700 text-xs font-bold shadow-2xs transition-all active:scale-95"
                    >
                      <span>{tag.icon}</span>
                      <span>{tag.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 font-bold">
          <span className="hidden sm:inline">Press <kbd className="bg-white px-1.5 py-0.5 rounded border text-[10px]">ENTER</kbd> for full search page</span>
          {query.trim() && (
            <button
              onClick={() => handleFullSearch(query)}
              className="text-blue-600 font-black hover:underline flex items-center gap-1 ml-auto"
            >
              Search for "{query}" <ArrowRight size={12} />
            </button>
          )}
        </div>

      </div>
    </div>
  );
};
