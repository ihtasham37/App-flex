import React, { useState, useEffect } from 'react';
import { X, ExternalLink, Download } from 'lucide-react';
import { useSettings } from '../context/SettingsContext';
import { Button } from './ui/Button';
import { motion, AnimatePresence } from 'motion/react';

export const UpdateBannerPopup = () => {
  const { settings } = useSettings();
  const [show, setShow] = useState(false);

  useEffect(() => {
    // Show banner if enabled and not already completed for the CURRENT catalog version
    const currentCatalogVersion = settings.catalogVersion || 1;
    const lastSeenCatalogVersion = parseInt(localStorage.getItem('banner_catalog_seen') || '0');
    
    if (settings.updateBanner?.enabled && lastSeenCatalogVersion < currentCatalogVersion) {
      const timer = setTimeout(() => setShow(true), 1500); // Show after 1.5s
      return () => clearTimeout(timer);
    }
  }, [settings.updateBanner?.enabled, settings.catalogVersion]);

  const handleClose = () => {
    setShow(false);
  };

  const handleUpdateClick = () => {
    // Mark the current catalog version as seen so it doesn't show again for this update
    const currentCatalogVersion = settings.catalogVersion || 1;
    localStorage.setItem('banner_catalog_seen', currentCatalogVersion.toString());
    setShow(false);
  };

  if (!settings.updateBanner?.enabled) return null;

  return (
    <AnimatePresence>
      {show && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-lg bg-white rounded-3xl overflow-hidden shadow-2xl border border-white/20"
          >

            <div className="flex flex-col">
              {/* Banner Image */}
              {settings.updateBanner.image && (
                <div className="w-full h-48 sm:h-56 bg-slate-100 overflow-hidden">
                  <img 
                    src={settings.updateBanner.image} 
                    alt="Update Banner" 
                    className="w-full h-full object-cover"
                  />
                </div>
              )}

              {/* Content */}
              <div className="p-6 sm:p-8 space-y-6 text-center">
                <div className="space-y-2">
                  <span className="px-3 py-1 bg-blue-50 text-blue-600 text-[10px] font-black uppercase tracking-widest rounded-full">
                    Official Update
                  </span>
                  <h2 className="text-2xl sm:text-3xl font-black text-slate-900 leading-tight">
                    {settings.updateBanner.heading || 'New Version Available!'}
                  </h2>
                </div>

                <p className="text-sm sm:text-base text-slate-500 font-medium leading-relaxed">
                  {settings.updateBanner.description}
                </p>

                <div className="pt-2 flex flex-col gap-3">
                  <a 
                    href={settings.updateBanner.link} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="w-full"
                    onClick={handleUpdateClick}
                  >
                    <Button className="w-full h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 flex items-center justify-center gap-2 text-lg transition-all active:scale-95">
                      <Download size={24} />
                      {settings.updateBanner.buttonText || 'Update Now'}
                    </Button>
                  </a>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
