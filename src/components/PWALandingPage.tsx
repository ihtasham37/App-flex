import React, { useState, useEffect } from 'react';
import { Download, Smartphone, ShieldCheck, Gamepad2, CheckCircle2, Loader2 } from 'lucide-react';
import { Button } from './ui/Button';
import { useSettings } from '../context/SettingsContext';
import { AppLogo } from './ui/AppLogo';

export const PWALandingPage: React.FC = () => {
  const { settings } = useSettings();
  const [deferredPrompt, setDeferredPrompt] = useState<any>(() => (window as any).deferredPrompt || null);
  const [installedSuccess, setInstalledSuccess] = useState(false);
  const [installing, setInstalling] = useState(false);

  useEffect(() => {
    // Check if already captured in global window
    if ((window as any).deferredPrompt) {
      setDeferredPrompt((window as any).deferredPrompt);
    }

    const handlePrompt = (e: any) => {
      e.preventDefault();
      (window as any).deferredPrompt = e;
      setDeferredPrompt(e);
    };

    const handleCustomPrompt = () => {
      if ((window as any).deferredPrompt) {
        setDeferredPrompt((window as any).deferredPrompt);
      }
    };

    window.addEventListener('beforeinstallprompt', handlePrompt);
    window.addEventListener('pwa-prompt-available', handleCustomPrompt);

    const installedHandler = () => {
      try {
        localStorage.setItem('pwa_installed', 'true');
        localStorage.setItem('pwa_installed_permanent', 'true');
        localStorage.setItem('pwa_last_seen', Date.now().toString());
      } catch {}
      setInstalledSuccess(true);
      setDeferredPrompt(null);
      setInstalling(false);
    };
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handlePrompt);
      window.removeEventListener('pwa-prompt-available', handleCustomPrompt);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstall = async () => {
    setInstalling(true);
    let promptEvent = deferredPrompt || (window as any).deferredPrompt;

    // If not ready yet, wait briefly for the event listener to catch up
    if (!promptEvent) {
      for (let i = 0; i < 6; i++) {
        await new Promise((res) => setTimeout(res, 200));
        promptEvent = (window as any).deferredPrompt;
        if (promptEvent) break;
      }
    }

    if (promptEvent) {
      try {
        await promptEvent.prompt();
        const choice = await promptEvent.userChoice;
        if (choice && choice.outcome === 'accepted') {
          try {
            localStorage.setItem('pwa_installed', 'true');
            localStorage.setItem('pwa_installed_permanent', 'true');
            localStorage.setItem('pwa_last_seen', Date.now().toString());
          } catch {}
          setInstalledSuccess(true);
          setDeferredPrompt(null);
          (window as any).deferredPrompt = null;
        }
      } catch (err) {
        console.error("Install prompt error:", err);
      } finally {
        setInstalling(false);
      }
    } else {
      // In case the device browser automatically installed or handles it natively
      setInstalling(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col items-center justify-center p-4 sm:p-6 text-center select-none">
      <div className="max-w-md w-full space-y-6 sm:space-y-8 bg-slate-800/95 border border-slate-700/80 p-6 sm:p-8 rounded-[36px] shadow-2xl relative overflow-hidden backdrop-blur-xl">
        {/* Ambient Glows */}
        <div className="absolute top-0 right-0 w-36 h-36 bg-blue-500/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-36 h-36 bg-indigo-500/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-2xl pointer-events-none" />

        {/* App Icon */}
        <div className="relative mx-auto flex justify-center pt-2">
          <AppLogo size={96} showGlow className="animate-pulse drop-shadow-2xl" />
        </div>

        <div className="space-y-3 relative">
          <h1 className="text-3xl sm:text-4xl font-black text-white tracking-tight uppercase italic">
            {settings.appName || 'APPFLEX'}
          </h1>
          <div className="space-y-2">
            <h2 className="text-xl sm:text-2xl font-black text-slate-100">
              {installedSuccess ? 'App Installed Successfully!' : 'Install App for Best Experience'}
            </h2>
            <p className="text-slate-300 font-medium leading-relaxed text-sm max-w-sm mx-auto">
              {installedSuccess
                ? 'App is installed on your device. Open it anytime from your phone\'s home screen or browse here.'
                : 'To browse our full catalog of premium apps, games, and bundles, please download and install the official app on your device.'}
            </p>
          </div>
        </div>

        {/* Security / Feature Badges */}
        <div className="grid grid-cols-2 gap-3 pt-1">
          <div className="p-3.5 bg-slate-700/40 rounded-2xl border border-slate-600/40 flex flex-col items-center gap-1.5">
            <ShieldCheck size={24} className="text-emerald-400" />
            <span className="text-[11px] font-black text-slate-200 uppercase tracking-wider">100% Secure</span>
          </div>
          <div className="p-3.5 bg-slate-700/40 rounded-2xl border border-slate-600/40 flex flex-col items-center gap-1.5">
            <Gamepad2 size={24} className="text-blue-400" />
            <span className="text-[11px] font-black text-slate-200 uppercase tracking-wider">Fast Access</span>
          </div>
        </div>

        {/* Action / Install Section */}
        <div className="pt-2 space-y-4">
          {installedSuccess ? (
            <div className="space-y-3">
              <div className="p-5 bg-emerald-500/10 rounded-2xl border border-emerald-500/30 flex flex-col items-center justify-center gap-2 text-emerald-400 font-bold text-sm">
                <CheckCircle2 size={36} className="text-emerald-400 mb-1" />
                <span className="text-center text-white font-black text-base">Installation Complete!</span>
                <span className="text-xs text-emerald-300 font-medium">Check your phone home screen to launch.</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <Button 
                onClick={handleInstall}
                disabled={installing}
                className="w-full h-16 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white text-lg font-black uppercase tracking-widest shadow-xl shadow-blue-600/40 transition-all active:scale-95 flex items-center justify-center gap-2"
              >
                {installing ? (
                  <>
                    <Loader2 size={22} className="animate-spin" />
                    <span>INSTALLING...</span>
                  </>
                ) : (
                  <>
                    <Download size={22} className="stroke-[2.5]" />
                    <span>INSTALL APP NOW</span>
                  </>
                )}
              </Button>
            </div>
          )}

          <div className="flex items-center justify-center gap-2 text-slate-400 pt-1">
            <Smartphone size={15} />
            <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Available for Android & Desktop</p>
          </div>
        </div>
      </div>

      <p className="mt-8 text-slate-500 text-[10px] font-black uppercase tracking-[0.25em]">
        Powered by {settings.appName || 'APPFLEX'} Studio
      </p>
    </div>
  );
};
