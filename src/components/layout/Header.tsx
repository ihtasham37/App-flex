import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useSettings } from '../../context/SettingsContext';
import { Button } from '../ui/Button';
import { AppLogo } from '../ui/AppLogo';
import { LogIn, Shield, Bookmark, Film, Smartphone, Search, Zap, MessageCircle } from 'lucide-react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../lib/firebase';

export const Header = () => {
  const { user, profile, isAdmin } = useAuth();
  const { settings } = useSettings();
  const location = useLocation();
  const searchParams = new URLSearchParams(location.search);
  const typeParam = searchParams.get('type');
  const [savedCount, setSavedCount] = useState<number>(0);

  // Fetch saved count for user real-time
  useEffect(() => {
    if (!user) {
      setSavedCount(0);
      return;
    }
    const q = query(collection(db, 'saved_apps'), where('userId', '==', user.uid));
    const unsub = onSnapshot(q, (snap) => {
      setSavedCount(snap.size);
    });
    return () => unsub();
  }, [user]);

  const isHome = location.pathname === '/';
  const isApps = location.pathname === '/explore';
  const isPC = location.pathname === '/pc';
  const isBundles = location.pathname === '/bundles';
  const isSearch = location.pathname === '/search';

  return (
    <header className="w-full bg-white/95 backdrop-blur-md border-b border-slate-200/80 sticky top-0 z-50 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 h-16 flex items-center justify-between max-w-7xl">
        
        {/* Brand Label with AppLogo */}
        <Link to="/" className="flex items-center gap-2.5 group">
          <AppLogo size={36} showGlow className="group-hover:scale-105 transition-transform" />
          <div className="flex flex-col">
            <span className="text-2xl font-black tracking-tighter text-slate-900 group-hover:text-blue-600 transition-colors uppercase italic leading-tight">
              {settings.appName || 'APPFLEX'}
            </span>
            <div className="h-0.5 w-full bg-gradient-to-r from-blue-600 via-indigo-600 to-cyan-400 rounded-full scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1.5 bg-slate-50 p-1 rounded-xl border border-slate-200/40 text-[11px] font-black uppercase tracking-wider text-slate-500">
          <Link 
            to="/" 
            className={`px-3.5 py-2 rounded-lg transition-all ${
              isHome ? 'bg-white text-blue-600 shadow-xs border border-slate-100' : 'hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Home
          </Link>
          <Link 
            to="/explore" 
            className={`px-3.5 py-2 rounded-lg transition-all ${
              isApps ? 'bg-white text-blue-600 shadow-xs border border-slate-100' : 'hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Apps
          </Link>
          <Link 
            to="/pc" 
            className={`px-3.5 py-2 rounded-lg transition-all ${
              isPC ? 'bg-white text-cyan-600 shadow-xs border border-slate-100' : 'hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            PC Soft
          </Link>
          <Link 
            to="/bundles" 
            className={`px-3.5 py-2 rounded-lg transition-all ${
              isBundles ? 'bg-white text-purple-600 shadow-xs border border-slate-100' : 'hover:text-slate-900 hover:bg-white/50'
            }`}
          >
            Bundles
          </Link>
          <Link 
            to="/search" 
            className={`px-3 py-2 rounded-lg transition-all ${
              isSearch ? 'bg-white text-blue-600 shadow-xs border border-slate-100' : 'hover:text-slate-900 hover:bg-white/50'
            }`}
            title="Search"
          >
            <Search size={14} />
          </Link>
        </nav>

        {/* Right Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Saved Apps Button */}
          {user && (
            <Link to="/saved" title="Saved Items">
              <button className="relative p-2 rounded-xl bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-600 border border-slate-200/60 transition-all active:scale-95">
                <Bookmark size={18} />
                {savedCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-white shadow-sm animate-in zoom-in duration-300">
                    {savedCount}
                  </span>
                )}
              </button>
            </Link>
          )}

          {/* WhatsApp Channel Link */}
          {settings.whatsappChannel && (
            <a href={settings.whatsappChannel} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-[10px] uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                <MessageCircle size={16} className="text-white" fill="currentColor" />
                <span className="hidden xs:inline ml-0.5">WhatsApp</span>
              </button>
            </a>
          )}
          
          {/* User Profile or Login */}
          {user ? (
            <Link to="/profile" className="flex items-center gap-3 pl-1 group">
              <div className="hidden lg:block text-right leading-none">
                <p className="text-[11px] font-black text-slate-800 uppercase tracking-tight group-hover:text-blue-600 transition-colors">{profile?.name || 'User'}</p>
                <span className="text-[9px] text-slate-400 font-bold uppercase tracking-widest">{profile?.role || 'Member'}</span>
              </div>
              <div className="w-10 h-10 rounded-xl border-2 border-slate-100 shadow-xs group-hover:border-blue-200 transition-all bg-slate-50 flex items-center justify-center text-slate-400 text-sm font-black overflow-hidden">
                {profile?.photoURL ? (
                  <img src={profile.photoURL} alt={profile.name} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-tr from-slate-100 to-slate-200 flex items-center justify-center text-slate-600">
                    {profile?.name?.[0]?.toUpperCase() || 'U'}
                  </div>
                )}
              </div>
            </Link>
          ) : (
            <Link to="/login">
              <Button variant="gradient" size="sm" className="rounded-xl px-5 h-10 font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95 transition-all">
                Login
              </Button>
            </Link>
          )}
        </div>

      </div>
    </header>
  );
};

