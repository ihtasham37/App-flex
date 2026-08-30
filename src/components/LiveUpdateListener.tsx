import React, { useEffect, useState, useRef } from 'react';
import { useSettings } from '../context/SettingsContext';
import { cacheService } from '../lib/cacheService';
import { Sparkles, RefreshCw, X, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from './ui/Button';

export function LiveUpdateListener() {
  const { settings } = useSettings();
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [countdown, setCountdown] = useState(3);
  const [isUpdating, setIsUpdating] = useState(false);
  const autoReloadTimer = useRef<any>(null);
  const countdownInterval = useRef<any>(null);

  const initialCodeVersion = useRef<number>(() => {
    const cached = localStorage.getItem('appflex_client_code_version');
    return cached ? parseInt(cached, 10) : 0;
  });

  const performUpdateAndReload = async () => {
    setIsUpdating(true);
    try {
      // 1. Purge APPFLEX data and catalog caches
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

      // 4. Save current version so we don't trigger again
      if (settings.codeReleaseVersion) {
        localStorage.setItem('appflex_client_code_version', settings.codeReleaseVersion.toString());
      }

      // 5. Hard reload page with timestamp bypass
      setTimeout(() => {
        window.location.reload();
      }, 300);
    } catch (err) {
      console.error('[UpdateListener] Error during update reload:', err);
      window.location.reload();
    }
  };

  useEffect(() => {
    const serverVersion = settings.codeReleaseVersion;
    if (!serverVersion || serverVersion <= 0) return;

    const localVersion = initialCodeVersion.current();

    // If first-ever launch on this device/browser, save and don't interrupt
    if (localVersion === 0) {
      localStorage.setItem('appflex_client_code_version', serverVersion.toString());
      return;
    }

    // If server version is greater than local version, a new GitHub/code update was published by admin!
    if (serverVersion > localVersion) {
      console.log(`[LiveUpdateListener] New Code Release detected: Server v${serverVersion} > Local v${localVersion}`);
      setShowUpdateModal(true);

      // Start countdown for automatic update
      setCountdown(3);
      countdownInterval.current = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval.current);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      // Trigger automatic reload after 3.5 seconds if autoReloadClients is enabled
      if (settings.autoReloadClients !== false) {
        autoReloadTimer.current = setTimeout(() => {
          performUpdateAndReload();
        }, 3500);
      }
    }

    return () => {
      if (autoReloadTimer.current) clearTimeout(autoReloadTimer.current);
      if (countdownInterval.current) clearInterval(countdownInterval.current);
    };
  }, [settings.codeReleaseVersion]);

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
                  onClick={() => setShowUpdateModal(false)}
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
