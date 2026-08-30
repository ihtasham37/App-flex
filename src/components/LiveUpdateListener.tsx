import React, { useEffect, useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { cacheService } from '../lib/cacheService';
import { Sparkles, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';

export function LiveUpdateListener() {
  const { settings } = useSettings();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isUpdating, setIsUpdating] = useState(false);
  const autoReloadTimer = useRef<any>(null);
  const countdownInterval = useRef<any>(null);

  const getStoredVersion = (): number => {
    if (typeof window === 'undefined') return 0;
    const v = localStorage.getItem('appflex_client_code_version');
    return v ? parseInt(v, 10) : 0;
  };

  const performUpdateAndReload = async () => {
    setIsUpdating(true);
    try {
      const serverVersion = settings.codeReleaseVersion || 1;
      
      // Save version FIRST to prevent loop
      localStorage.setItem('appflex_client_code_version', serverVersion.toString());

      // 1. Clear caches
      cacheService.clearAll();

      // 2. Clear Browser Cache API / Service Worker caches
      if (typeof window !== 'undefined' && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(cacheNames.map((name) => caches.delete(name)));
        } catch (e) {
          console.warn('[UpdateListener] Cache API clear error:', e);
        }
      }

      // 3. Unregister or update Service Worker if available
      if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
        try {
          const registrations = await navigator.serviceWorker.getRegistrations();
          for (const reg of registrations) {
            await reg.update();
          }
        } catch (e) {
          console.warn('[UpdateListener] SW update error:', e);
        }
      }

      // 4. Reload page
      setTimeout(() => {
        window.location.reload();
      }, 200);
    } catch (err) {
      console.error('[UpdateListener] Error during update reload:', err);
      window.location.reload();
    }
  };

  useEffect(() => {
    const serverVersion = settings.codeReleaseVersion;
    if (!serverVersion || serverVersion <= 0) return;

    const localVersion = getStoredVersion();

    // If first-ever launch on this device/browser, save and don't interrupt
    if (localVersion === 0) {
      localStorage.setItem('appflex_client_code_version', serverVersion.toString());
      return;
    }

    // If server version is strictly greater than local version, trigger once!
    if (serverVersion > localVersion) {
      console.log(`[LiveUpdateListener] New Code Release: Server v${serverVersion} > Local v${localVersion}`);
      setShowUpdateModal(true);

      // Start countdown
      setCountdown(3);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            if (countdownInterval.current) clearInterval(countdownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Automatic reload if enabled
      if (settings.autoReloadClients !== false) {
        if (autoReloadTimer.current) clearTimeout(autoReloadTimer.current);
        autoReloadTimer.current = setTimeout(() => {
          performUpdateAndReload();
        }, 3500);
      }
    } else {
      setShowUpdateModal(false);
    }

    return () => {
      if (autoReloadTimer.current) clearTimeout(autoReloadTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [settings.codeReleaseVersion, settings.autoReloadClients]);

  const handleDismiss = () => {
    // If user clicks later, update local version so modal does NOT keep popping up repeatedly
    if (settings.codeReleaseVersion) {
      localStorage.setItem('appflex_client_code_version', settings.codeReleaseVersion.toString());
    }
    setShowUpdateModal(false);
    if (autoReloadTimer.current) clearTimeout(autoReloadTimer.current);
    if (countdownInterval.current) clearInterval(countdownInterval.current);
  };

  if (!showUpdateModal) return null;

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ opacity: 0, y: 50, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 20, scale: 0.95 }}
        className="fixed bottom-5 right-5 left-5 sm:left-auto sm:w-[420px] z-[99999]"
      >
        <div className="bg-slate-900/95 backdrop-blur-xl border border-blue-500/40 text-white p-5 rounded-2xl shadow-2xl shadow-blue-500/20 relative overflow-hidden">
          {/* Ambient Glow */}
          <div className="absolute -top-10 -right-10 w-32 h-32 bg-blue-500/20 rounded-full blur-2xl pointer-events-none" />

          <div className="flex items-start gap-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/30 flex-shrink-0">
              <Sparkles size={24} className="animate-pulse" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-black uppercase tracking-widest text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-md border border-blue-400/20">
                  New Code Update
                </span>
                <span className="text-[10px] text-slate-400 font-bold">
                  v{settings.codeReleaseVersion}
                </span>
              </div>

              <h4 className="text-sm font-black text-white mt-1">
                New Features & Improvements Live!
              </h4>

              <p className="text-xs text-slate-300 mt-1 line-clamp-2 leading-relaxed">
                {settings.codeReleaseNote || 'The latest update has been released. Updating your app to load the new version...'}
              </p>

              <div className="mt-4 flex items-center gap-2.5">
                <Button
                  onClick={performUpdateAndReload}
                  disabled={isUpdating}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-500 text-white font-black text-xs rounded-xl px-4 py-2.5 shadow-md shadow-blue-600/30 flex-1 flex items-center justify-center gap-1.5"
                >
                  <RefreshCw size={14} className={isUpdating ? 'animate-spin' : ''} />
                  <span>{isUpdating ? 'Applying Update...' : `Update Now (${countdown}s)`}</span>
                </Button>

                <button 
                  onClick={handleDismiss}
                  className="px-3 py-2 text-xs font-bold text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
                >
                  Later
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
