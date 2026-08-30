import React from 'react';
import { Link } from 'react-router-dom';
import { Layers, Star, TrendingUp, ChevronRight } from 'lucide-react';
import { GlassCard } from './ui/GlassCard';
import { useApps } from '../context/AppsContext';

interface AppData {
  id: string;
  name: string;
  mainImage: string;
  rating: number;
  category: string;
}

interface DesktopSidebarProps {
  categories: string[];
  trendingApps: AppData[];
}

export const DesktopSidebar: React.FC<DesktopSidebarProps> = ({ categories, trendingApps }) => {
  const { getCategoryName } = useApps();

  return (
    <aside className="hidden lg:flex flex-col gap-8 w-full">
      {/* Categories Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <Layers className="text-blue-600" size={18} />
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Categories</h2>
        </div>
        <GlassCard className="p-2 border-slate-200/60 shadow-sm overflow-hidden">
          <div className="grid grid-cols-1 divide-y divide-slate-100">
            {categories.slice(0, 12).map((cat) => (
              <Link
                key={cat}
                to={`/explore?category=${encodeURIComponent(getCategoryName(cat))}`}
                className="group flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
              >
                <span className="text-sm font-bold text-slate-600 group-hover:text-blue-600 transition-colors capitalize">
                  {getCategoryName(cat)}
                </span>
                <ChevronRight size={14} className="text-slate-300 group-hover:text-blue-400 group-hover:translate-x-0.5 transition-all" />
              </Link>
            ))}
            {categories.length > 12 && (
              <Link
                to="/explore"
                className="p-3 text-center text-xs font-black text-blue-600 hover:bg-blue-50 transition-colors"
              >
                View All Categories
              </Link>
            )}
          </div>
        </GlassCard>
      </div>

      {/* Top Apps Section */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-1">
          <TrendingUp className="text-emerald-600" size={18} />
          <h2 className="text-lg font-black text-slate-800 tracking-tight">Top Rated</h2>
        </div>
        <GlassCard className="p-4 border-slate-200/60 shadow-sm space-y-4">
          {trendingApps.slice(0, 5).map((app, idx) => (
            <Link 
              key={app.id} 
              to={`/apps/${app.id}`}
              className="flex items-center gap-3 group"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-100 shadow-sm">
                  <img src={app.mainImage} alt={app.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <div className="absolute -top-1.5 -left-1.5 w-5 h-5 rounded-md bg-blue-600 text-white text-[10px] font-black flex items-center justify-center shadow-md">
                  {idx + 1}
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-sm font-bold text-slate-800 truncate group-hover:text-blue-600 transition-colors">
                  {app.name}
                </h3>
                <div className="flex items-center gap-2 mt-0.5">
                  <div className="flex items-center gap-0.5 text-yellow-500">
                    <Star size={10} fill="currentColor" />
                    <span className="text-[10px] font-black text-slate-600">{app.rating || '4.5'}</span>
                  </div>
                  <span className="text-[9px] font-bold text-slate-400 uppercase truncate">
                    {getCategoryName(app.category)}
                  </span>
                </div>
              </div>
            </Link>
          ))}
          <Link 
            to="/explore" 
            className="block w-full py-2.5 text-center text-xs font-black text-white bg-slate-800 rounded-xl hover:bg-slate-900 transition-all shadow-md shadow-slate-200"
          >
            Explore More
          </Link>
        </GlassCard>
      </div>

      {/* App Stats / Mini Footer */}
      <GlassCard className="p-5 bg-gradient-to-br from-slate-800 to-slate-900 border-none shadow-xl text-white">
        <h4 className="text-sm font-black mb-1">Weekly Picks</h4>
        <p className="text-[11px] text-slate-400 font-medium leading-relaxed mb-4">
          Our editors test and verify dozens of apps daily to bring you the best content.
        </p>
        <div className="grid grid-cols-2 gap-3">
          <div className="text-center p-2 rounded-lg bg-white/5 border border-white/5">
            <p className="text-xs font-black">500+</p>
            <p className="text-[9px] text-slate-400 uppercase font-bold">New Apps</p>
          </div>
          <div className="text-center p-2 rounded-lg bg-white/5 border border-white/5">
            <p className="text-xs font-black">100%</p>
            <p className="text-[9px] text-slate-400 uppercase font-bold">Verified</p>
          </div>
        </div>
      </GlassCard>
    </aside>
  );
};
