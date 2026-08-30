import React, { useState } from 'react';
import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  LayoutDashboard, Package, Users, 
  LogOut, ShieldCheck, Menu, X, User, Tag, ExternalLink, Settings, Megaphone, Bookmark
} from 'lucide-react';
import { auth } from '../../lib/firebase';
import { signOut } from 'firebase/auth';
import { cn } from '../../lib/utils';
import { useSettings } from '../../context/SettingsContext';
import { AppLogo } from '../../components/ui/AppLogo';

export default function AdminLayout() {
  const { settings } = useSettings();
  const location = useLocation();
  const navigate = useNavigate();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const menuItems = [
    { icon: LayoutDashboard, label: 'Dashboard (Analytics)', path: '/admin' },
    { icon: Bookmark, label: 'Saved Items (Quick Manager)', path: '/admin/saved' },
    { icon: Tag, label: 'Create & Manage Categories', path: '/admin/categories' },
    { icon: Package, label: 'App Management', path: '/admin/apps' },
    { icon: Users, label: 'User Management', path: '/admin/users' },
    { icon: Megaphone, label: '📢 Ads Center', path: '/admin/ads' },
    { icon: Settings, label: 'Platform Settings', path: '/admin/settings' },
  ];

  const SidebarContent = () => (
    <>
      <div className="p-6">
        <div className="flex items-center justify-between">
          <Link to="/" className="flex items-center gap-3">
            <AppLogo size={38} showGlow />
            <div className="flex flex-col">
              <span className="text-lg font-black text-gray-900 tracking-tight leading-none">{settings.appName}</span>
              <span className="text-[10px] font-bold text-blue-600 tracking-widest uppercase">Admin Panel</span>
            </div>
          </Link>
          <button className="lg:hidden text-gray-500" onClick={() => setIsSidebarOpen(false)}>
            <X size={22} />
          </button>
        </div>
      </div>

      <nav className="flex-1 px-4 space-y-1.5 mt-2">
        <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Admin Modules</p>
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link 
              key={item.path} 
              to={item.path}
              onClick={() => setIsSidebarOpen(false)}
              className={cn(
                "flex items-center gap-3 px-4 py-3 rounded-xl font-bold text-xs transition-all",
                isActive 
                  ? "bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                  : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
              )}
            >
              <item.icon size={18} />
              {item.label}
            </Link>
          );
        })}

        <div className="pt-4 border-t border-slate-100 mt-4 mx-1">
          <p className="px-3 text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2">Account</p>
          <Link 
            to="/profile"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all"
          >
            <User size={18} className="text-blue-600" />
            My User Account
          </Link>
          <Link 
            to="/"
            className="flex items-center gap-3 px-4 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-all"
          >
            <ExternalLink size={18} className="text-indigo-600" />
            View Live Website
          </Link>
        </div>
      </nav>

      <div className="p-4 border-t border-slate-100">
        <button 
          onClick={handleLogout}
          className="flex items-center justify-center gap-2 px-4 py-2.5 w-full rounded-xl font-bold text-xs text-red-600 bg-red-50 hover:bg-red-100 transition-colors"
        >
          <LogOut size={16} />
          Logout Admin Session
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex w-64 bg-white border-r border-slate-200 flex-col h-screen sticky top-0">
        <SidebarContent />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-50 lg:hidden backdrop-blur-xs"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Mobile Sidebar */}
      <aside className={cn(
        "fixed top-0 left-0 bottom-0 w-64 bg-white z-[60] lg:hidden transform transition-transform duration-300 ease-in-out flex flex-col shadow-2xl",
        isSidebarOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <SidebarContent />
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 overflow-auto">
        {/* Top bar */}
        <header className="bg-white/90 backdrop-blur-md border-b border-slate-200 h-16 sticky top-0 z-30 px-4 md:px-8 flex items-center justify-between">
           <div className="flex items-center gap-3">
             <button 
                onClick={() => setIsSidebarOpen(true)}
                className="lg:hidden w-9 h-9 flex items-center justify-center text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
             >
                <Menu size={22} />
             </button>
             <h2 className="font-black text-slate-900 text-sm md:text-base uppercase tracking-tight">
               {menuItems.find(i => i.path === location.pathname)?.label || 'Admin Control Panel'}
             </h2>
           </div>

           <div className="flex items-center gap-3">
              <Link to="/profile">
                <div className="flex items-center gap-2 bg-blue-50 px-3 py-1.5 rounded-lg border border-blue-200 text-blue-700 font-bold text-xs">
                   <User size={16} />
                   <span>Admin Profile</span>
                </div>
              </Link>
           </div>
        </header>

        <div className="p-4 md:p-8 max-w-6xl mx-auto">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
