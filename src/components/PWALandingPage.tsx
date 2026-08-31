import React, { useState, useEffect } from 'react';
import { Download, Smartphone, ShieldCheck, Gamepad2, CheckCircle2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useSettings } from '../context/SettingsContext';
import { AppLogo } from './ui/AppLogo';

export const PWALandingPage: React.FC = () => {
  const { settings } = useSettings();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    const handler = (e: any) => {
      e.preventDefault(); // Stop default browser mini-infobar
      setDeferredPrompt(e);
    };

    window.addEventListener('beforeinstallprompt', handler);

    const installedHandler = () => {
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setInstalling(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt) {
      setInstalling(true);
      try {
        deferredPrompt.prompt();
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to install prompt: ${outcome}`);
        if (outcome === 'accepted') {
          setInstalledSuccess(true);
          setDeferredPrompt(null);
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      }
      setInstalling(false);
    } else {
      // If no prompt event, maybe it's not supported or already installed.
      // We can just show the instruction message
      alert("Installation is managed by your browser. Tap the menu (3 dots) and select 'Install app' or 'Add to Home Screen'.");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
      <div className="max-w-md w-full space-y-8 bg-white p-8 rounded-[40px] shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-blue-500/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl" />
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-purple-500/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl" />

        {/* App Icon / Logo */}
        <div className="relative mx-auto flex justify-center">
          <AppLogo size={96} showGlow className="animate-bounce" />
        </div>

        <div className="space-y-4 relative">
          <h1 className="text-4xl font-black text-slate-900 tracking-tight uppercase italic">
            {settings.appName || 'APPFLEX'}
          </h1>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-slate-800">
              {installedSuccess ? 'App Installed Successfully!' : 'Install App for Best Experience'}
            </h2>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              {installedSuccess
                ? 'The app has been installed successfully. Please close this browser and open the app from your phone\'s home screen.'
                : 'To browse our full catalog of premium apps, games, and bundles, please download and install the official app on your device.'}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4 pt-2">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
            <ShieldCheck size={24} className="text-emerald-600" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">100% Secure</span>
          </div>
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col items-center gap-2">
            <Gamepad2 size={24} className="text-blue-600" />
            <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Fast Access</span>
          </div>
        </div>

        <div className="pt-4 space-y-4">
          {installedSuccess ? (
            <div className="space-y-3">
              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex flex-col items-center justify-center gap-2 text-emerald-700 font-bold text-sm">
                <CheckCircle2 size={32} className="text-emerald-600 mb-1" />
                <span className="text-center">Installation Complete! Check your home screen.</span>
              </div>
            </div>
          ) : (
            <>
              <Button 
                onClick={handleInstall}
                disabled={installing}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-600/30 transition-all active:scale-95"
              >
                <Download size={24} className="mr-3" />
                {installing ? 'Installing...' : 'Install App Now'}
              </Button>

              <div className="pt-2 flex flex-col items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    localStorage.setItem('pwa_installed', 'true');
                    localStorage.setItem('pwa_last_seen', Date.now().toString());
                    window.location.reload();
                  }}
                  className="text-xs font-bold text-slate-500 hover:text-blue-600 underline underline-offset-4 py-1"
                >
                  Continue to Web Store →
                </button>
              </div>
            </>
          )}

          <div className="flex items-center justify-center gap-2 text-slate-400 pt-1">
            <Smartphone size={16} />
            <p className="text-xs font-bold uppercase tracking-tighter">Available for Android & Desktop</p>
          </div>
        </div>
      </div>

      <p className="mt-12 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
        Powered by {settings.appName || 'APPFLEX'} Studio
      </p>
    </div>
  );
};
