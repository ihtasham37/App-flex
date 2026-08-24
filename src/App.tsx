import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { SettingsProvider } from './context/SettingsContext';
import { AdsProvider } from './context/AdsContext';
import { AppsProvider } from './context/AppsContext';
import { MainLayout } from './components/layout/MainLayout';
import { PWALandingPage } from './components/PWALandingPage';
import { PWAUpdater } from './components/PWAUpdater';
import { LoadingScreen } from './components/LoadingScreen';
import { useSettings } from './context/SettingsContext';

// Pages
import Home from './pages/Home';
import Explore from './pages/Explore';
import Bundles from './pages/Bundles';
import PCApps from './pages/PCApps';
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
  const { loading: settingsLoading } = useSettings();
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

  // Final check: is the user actually in the app?
  const isInApp = isStandalone || isAndroidWebView || isCapacitorOrNative || isAndroidTWA || isUrlAppFlag;

  if (authLoading || settingsLoading) return <LoadingScreen />;

  const path = location.pathname;
  const isAuthOrAdmin = path.startsWith('/login') || path.startsWith('/signup') || path.startsWith('/admin') || isAdmin;

  // Show PWALandingPage if:
  // 1. Not currently in standalone app mode
  // 2. AND not on an admin/auth page
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
            <Router>
              <AppContent />
            </Router>
          </AppsProvider>
        </AdsProvider>
      </SettingsProvider>
    </AuthProvider>
  );
}
