import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider, useSettings } from './context/SettingsContext';
import { AppsProvider } from './context/AppsContext';
import { AdsProvider } from './context/AdsContext';
import { MainLayout } from './components/layout/MainLayout';
import { PWALandingPage } from './components/PWALandingPage';
import { PWAUpdater } from './components/PWAUpdater';
import { LiveUpdateListener } from './components/LiveUpdateListener';
import { LoadingScreen } from './components/LoadingScreen';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import PCApps from './pages/PCApps';
import Bundles from './pages/Bundles';
import Search from './pages/Search';
import AppDetails from './pages/AppDetails';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import Profile from './pages/Profile';
import SavedApps from './pages/SavedApps';
import Downloads from './pages/Downloads';
import Settings from './pages/Settings';

// Admin Pages
import AdminDashboard from './pages/admin/Dashboard';
import AdminApps from './pages/admin/Apps';
import AdminAddApp from './pages/admin/AddApp';
import AdminEditApp from './pages/admin/EditApp';
import AdminUsers from './pages/admin/Users';
import AdminDownloads from './pages/admin/Downloads';
import AdminSettings from './pages/admin/Settings';
import AdminAdsCenter from './pages/admin/AdsCenter';
import AdminCategories from './pages/admin/Categories';
import AdminSavedApps from './pages/admin/SavedApps';
import AdminLayout from './pages/admin/AdminLayout';

function ProtectedRoute({ children, adminOnly = false }: { children: React.ReactNode, adminOnly?: boolean }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) return <LoadingScreen />;
  if (!user) return <Navigate to="/login" />;
  if (adminOnly && !isAdmin) return <Navigate to="/" />;

  return <>{children}</>;
}

function AppContent() {
  const { isAdmin, loading: authLoading } = useAuth();
  const { loading: settingsLoading, settings } = useSettings();
  const location = useLocation();

  // Detect Android APK / AAB / WebView / Capacitor / TWA / Standalone mode
  const userAgent = navigator.userAgent || '';
  const isAndroidWebView = /wv|WebView|Android.*Version\/[0-9]/i.test(userAgent);
  const isCapacitorOrNative = (window as any).Capacitor !== undefined || (window as any).cordova !== undefined;
  const isAndroidTWA = document.referrer.includes('android-app://');
  const isUrlAppFlag = location.search.includes('app=true') || location.search.includes('apk=true') || location.search.includes('aab=true') || location.search.includes('mode=app');

  const isStandalone = 
    window.matchMedia('(display-mode: standalone)').matches || 
    window.matchMedia('(display-mode: fullscreen)').matches || 
    window.matchMedia('(display-mode: minimal-ui)').matches || 
    (window.navigator as any).standalone === true;

  // Initialize from localStorage synchronously to eliminate the 1-second loading blink
  const [isActuallyInstalled, setIsActuallyInstalled] = useState<boolean>(() => {
    if (isStandalone || isAndroidWebView || isCapacitorOrNative || isAndroidTWA || isUrlAppFlag) return true;
    if (typeof window !== 'undefined') {
      const hasFlag = localStorage.getItem('pwa_installed') === 'true';
      const lastSeen = parseInt(localStorage.getItem('pwa_last_seen') || '0', 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      if (hasFlag && (Date.now() - lastSeen < sevenDays)) return true;
    }
    return false;
  });

  useEffect(() => {
    const checkInstallation = async () => {
      // 1. Standalone mode check (Most reliable)
      if (isStandalone || isAndroidWebView || isCapacitorOrNative || isAndroidTWA || isUrlAppFlag) {
        localStorage.setItem('pwa_installed', 'true');
        localStorage.setItem('pwa_last_seen', Date.now().toString());
        setIsActuallyInstalled(true);
        return;
      }

      // 2. Direct check via API if available (only if not in iframe)
      const isInIframe = window.self !== window.top;
      if (!isInIframe && 'getInstalledRelatedApps' in navigator) {
        try {
          const relatedApps = await (navigator as any).getInstalledRelatedApps();
          if (relatedApps && relatedApps.length > 0) {
            setIsActuallyInstalled(true);
            localStorage.setItem('pwa_installed', 'true');
            localStorage.setItem('pwa_last_seen', Date.now().toString());
            return;
          }
        } catch (e) {
          console.warn("getInstalledRelatedApps check note:", e);
        }
      }

      // 3. Browser check with time limit (7 days)
      const hasFlag = localStorage.getItem('pwa_installed') === 'true';
      const lastSeen = parseInt(localStorage.getItem('pwa_last_seen') || '0', 10);
      const sevenDays = 7 * 24 * 60 * 60 * 1000;
      
      if (hasFlag && (Date.now() - lastSeen < sevenDays)) {
        setIsActuallyInstalled(true);
      } else {
        setIsActuallyInstalled(false);
      }
    };

    checkInstallation();
  }, [isStandalone, isAndroidWebView, isCapacitorOrNative, isAndroidTWA, isUrlAppFlag]);

  // Auth and settings have instant memory fallback so no screen flash
  if (authLoading && !isActuallyInstalled) return <LoadingScreen />;

  const path = location.pathname;
  // Admin and Auth are allowed in browser for setup/login
  const isAuthOrAdmin = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/admin');

  // Final check: is the user actually in the app or recently verified?
  const isInIframe = window.self !== window.top;
  const isInApp = isStandalone || isAndroidWebView || isCapacitorOrNative || isAndroidTWA || isUrlAppFlag || isActuallyInstalled || isInIframe;

  // Show PWALandingPage if not in app and not on admin/auth page
  if (!isInApp && !isAuthOrAdmin) {
    return <PWALandingPage />;
  }

  return (
    <Routes>
      {/* User Routes */}
      <Route element={<MainLayout />}>
        <Route path="/" element={<Home />} />
        <Route path="/explore" element={<Explore />} />
        <Route path="/bundles" element={<Bundles />} />
        <Route path="/pc" element={<PCApps />} />
        <Route path="/search" element={<Search />} />
        <Route path="/apps/:appId" element={<AppDetails />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />
        
        <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />
        <Route path="/saved" element={<ProtectedRoute><SavedApps /></ProtectedRoute>} />
        <Route path="/downloads" element={<ProtectedRoute><Downloads /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      </Route>

      {/* Admin Routes */}
      <Route path="/admin" element={<ProtectedRoute adminOnly><AdminLayout /></ProtectedRoute>}>
        <Route index element={<AdminDashboard />} />
        <Route path="saved" element={<AdminSavedApps />} />
        <Route path="categories" element={<AdminCategories />} />
        <Route path="apps" element={<AdminApps />} />
        <Route path="apps/new" element={<AdminAddApp />} />
        <Route path="apps/:appId/edit" element={<AdminEditApp />} />
        <Route path="users" element={<AdminUsers />} />
        <Route path="downloads" element={<AdminDownloads />} />
        <Route path="ads" element={<AdminAdsCenter />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>
    </Routes>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SettingsProvider>
        <AdsProvider>
          <AppsProvider>
            <PWAUpdater />
            <LiveUpdateListener />
            <Router>
              <AppContent />
            </Router>
          </AppsProvider>
        </AdsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
