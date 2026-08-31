import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth } from '../lib/firebase';

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  status?: 'active' | 'banned';
  photoURL?: string;
  createdAt?: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  isAdmin: boolean;
  isBanned: boolean;
  updateProfileData: (data: Partial<UserProfile>) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PROFILE_CACHE_KEY_PREFIX = 'appflex_user_profile_v2_';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const updateProfileData = async (data: Partial<UserProfile>) => {
    if (!user) return;
    const updated = { ...(profile || { uid: user.uid, name: user.displayName || 'User', email: user.email || '', role: 'user' as const }), ...data };
    setProfile(updated);
    try {
      localStorage.setItem(`${PROFILE_CACHE_KEY_PREFIX}${user.uid}`, JSON.stringify(updated));
    } catch {}
  };

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);

      if (currentUser) {
        // Fast 0-Read Local Cache Retrieval
        const cacheKey = `${PROFILE_CACHE_KEY_PREFIX}${currentUser.uid}`;
        let cachedProfile: UserProfile | null = null;
        try {
          const raw = localStorage.getItem(cacheKey);
          if (raw) cachedProfile = JSON.parse(raw);
        } catch {}

        const isAdminUser = currentUser.email?.toLowerCase().includes('admin') || 
                            currentUser.email?.toLowerCase() === 'aliihtasham10@gmail.com' ||
                            cachedProfile?.role === 'admin';

        if (cachedProfile) {
          if (isAdminUser && cachedProfile.role !== 'admin') {
            cachedProfile.role = 'admin';
          }
          setProfile(cachedProfile);
          setLoading(false);
        } else {
          // Generate fast profile with 0 Firestore reads
          const newProfile: UserProfile = {
            uid: currentUser.uid,
            name: currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
            email: currentUser.email || '',
            role: isAdminUser ? 'admin' : 'user',
            status: 'active',
            createdAt: Date.now(),
          };
          setProfile(newProfile);
          try {
            localStorage.setItem(cacheKey, JSON.stringify(newProfile));
          } catch {}
          setLoading(false);
        }
      } else {
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  const isBanned = profile?.status === 'banned';

  return (
    <AuthContext.Provider value={{ 
      user, 
      profile, 
      loading, 
      isAdmin: profile?.role === 'admin' || user?.email?.toLowerCase() === 'aliihtasham10@gmail.com',
      isBanned,
      updateProfileData
    }}>
      {isBanned && (
        <div className="bg-red-600 text-white text-center py-2 px-4 text-xs font-bold sticky top-0 z-[100] shadow-md flex items-center justify-center gap-2">
          <span>⚠️ Your account has been suspended by the administrator. Contact support for assistance.</span>
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

