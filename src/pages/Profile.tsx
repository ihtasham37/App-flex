import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { cn } from '../lib/utils';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { 
  User, Mail, Settings, 
  LogOut, Download, Heart, ChevronRight, ShieldCheck,
  MessageCircle, MessageSquare, Send
} from 'lucide-react';
import { auth, db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { signOut } from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';
import { AdSlot } from '../components/ads/AdSlot';

export default function Profile() {
  const { user, profile, isAdmin } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();

  const [savedCount, setSavedCount] = useState<number>(0);
  const [loadingStats, setLoadingStats] = useState<boolean>(true);

  useEffect(() => {
    if (!user) return;
    let isMounted = true;
    const fetchSaved = async () => {
      try {
        const snap = await getDocs(query(collection(db, 'saved_apps'), where('userId', '==', user.uid)));
        if (isMounted) {
          setSavedCount(snap.size);
          setLoadingStats(false);
        }
      } catch (err) {
        console.warn('Could not fetch user saved count:', err);
        if (isMounted) setLoadingStats(false);
      }
    };
    fetchSaved();
    return () => { isMounted = false; };
  }, [user]);

  const handleLogout = async () => {
    await signOut(auth);
    navigate('/');
  };

  const menuItems = [
    { label: 'Saved Applications', icon: Heart, path: '/saved', color: 'text-pink-500' },
    { label: 'Edit Name & Password', icon: Settings, path: '/settings', color: 'text-purple-500' },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Profile Header */}
      <GlassCard className="p-8 border-none shadow-xl bg-gradient-to-br from-blue-600 to-purple-600 text-white" hover={false}>
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="w-24 h-24 rounded-full bg-white/20 backdrop-blur-md border-4 border-white/30 flex items-center justify-center">
            <User size={48} className="text-white" />
          </div>
          <div className="space-y-1">
            <h1 className="text-2xl font-black">{profile?.name || 'User'}</h1>
            <p className="text-blue-100 font-medium">{profile?.email}</p>
          </div>
          <div className="flex gap-4 pt-2">
            <div className="text-center px-4">
               <p className="text-[10px] font-black uppercase text-blue-200">Saved Apps</p>
               <p className="text-xl font-black">{loadingStats ? '...' : savedCount}</p>
            </div>
          </div>
        </div>
      </GlassCard>

      {/* Menu Options */}
      <div className="space-y-4">
        {isAdmin && (
          <Link to="/admin">
            <GlassCard className="p-4 flex items-center justify-between mb-6 bg-blue-600 text-white border-none shadow-lg shadow-blue-200">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
                  <ShieldCheck size={20} className="text-white" />
                </div>
                <div>
                  <p className="text-[10px] font-black uppercase text-blue-100">Administrator</p>
                  <span className="font-bold">Open Admin Panel</span>
                </div>
              </div>
              <ChevronRight className="text-white/50" />
            </GlassCard>
          </Link>
        )}
        
        <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">My Dashboard</h3>
        {menuItems.map((item) => (
          <Link key={item.label} to={item.path}>
            <GlassCard className="p-4 flex items-center justify-between mb-3">
              <div className="flex items-center gap-4">
                <div className={cn("w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center", item.color)}>
                  <item.icon size={20} />
                </div>
                <span className="font-bold text-gray-900">{item.label}</span>
              </div>
              <ChevronRight className="text-gray-300" />
            </GlassCard>
          </Link>
        ))}

        {/* Help & Support Section */}
        {(settings.supportEmail || settings.supportWhatsapp) && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Help & Support</h3>
            <div className="grid grid-cols-2 gap-3">
              {settings.supportEmail && (
                <a href={`mailto:${settings.supportEmail}`}>
                  <GlassCard className="p-4 flex flex-col items-center gap-2 text-center" hover={true}>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <Mail size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight text-gray-900">Email Support</span>
                  </GlassCard>
                </a>
              )}
              {settings.supportWhatsapp && (
                <a href={`https://wa.me/${settings.supportWhatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noopener noreferrer">
                  <GlassCard className="p-4 flex flex-col items-center gap-2 text-center" hover={true}>
                    <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <MessageCircle size={20} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-tight text-gray-900">WhatsApp Help</span>
                  </GlassCard>
                </a>
              )}
            </div>
          </div>
        )}

        {/* Join Our Community Section */}
        {(settings.whatsappChannel || settings.telegramLink) && (
          <div className="space-y-4 pt-4">
            <h3 className="text-sm font-black text-gray-400 uppercase tracking-widest ml-1">Join Our Community</h3>
            {settings.whatsappChannel && (
              <a href={settings.whatsappChannel} target="_blank" rel="noopener noreferrer">
                <GlassCard className="p-4 flex items-center justify-between mb-3 border-emerald-100 bg-emerald-50/20" hover={true}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-lg shadow-emerald-600/20">
                      <MessageSquare size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">WhatsApp Channel</span>
                      <span className="text-[10px] font-medium text-emerald-600">Official updates & templates</span>
                    </div>
                  </div>
                  <div className="bg-emerald-600 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full">Join</div>
                </GlassCard>
              </a>
            )}
            {settings.telegramLink && (
              <a href={settings.telegramLink} target="_blank" rel="noopener noreferrer">
                <GlassCard className="p-4 flex items-center justify-between mb-3 border-blue-100 bg-blue-50/20" hover={true}>
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-xl bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-500/20">
                      <Send size={20} />
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-slate-900">Telegram Community</span>
                      <span className="text-[10px] font-medium text-blue-600">Join 50k+ members</span>
                    </div>
                  </div>
                  <div className="bg-blue-500 text-white text-[9px] font-black uppercase px-2.5 py-1 rounded-full">Join</div>
                </GlassCard>
              </a>
            )}
          </div>
        )}
        
        {/* Profile Advertisement */}
        <AdSlot page="profile" slotIndex={0} />

        <div className="pt-4">
          <button onClick={handleLogout} className="w-full">
            <GlassCard className="p-4 flex items-center gap-4 text-red-500" hover={true}>
              <div className="w-10 h-10 rounded-xl bg-red-50 flex items-center justify-center">
                <LogOut size={20} />
              </div>
              <span className="font-bold">Logout Session</span>
            </GlassCard>
          </button>
        </div>
      </div>

      <div className="text-center pt-8">
        <p className="text-[10px] font-black text-gray-300 uppercase tracking-widest">User ID: {profile?.uid}</p>
      </div>
    </div>
  );
}
