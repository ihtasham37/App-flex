import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, orderBy, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Heart, Trash2, ExternalLink, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SavedApps() {
  const { user, isAdmin } = useAuth();
  const [saved, setSaved] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchSaved() {
      if (!user) return;
      try {
        const q = query(
          collection(db, 'saved_apps'),
          where('userId', '==', user.uid)
        );
        const snap = await getDocs(q);
        
        const appIds = snap.docs.map(d => d.data().appId);
        if (appIds.length === 0) {
          setSaved([]);
          setLoading(false);
          return;
        }

        const appsRef = collection(db, 'apps');
        const appsSnap = await getDocs(query(
          appsRef, 
          where('__name__', 'in', appIds),
          where('status', '==', 'published')
        ));
        
        const appsMap = new Map();
        appsSnap.docs.forEach(d => appsMap.set(d.id, { id: d.id, ...d.data() }));

        setSaved(snap.docs.map(d => ({
          id: d.id,
          app: appsMap.get(d.data().appId),
          ...d.data()
        })).filter(s => s.app)); 

      } catch (error) {
        console.error("Error fetching saved apps:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [user]);

  const removeSaved = async (id: string) => {
    try {
      await deleteDoc(doc(db, 'saved_apps', id));
      setSaved(saved.filter(s => s.id !== id));
    } catch (error) {
      console.error("Error removing saved app:", error);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <h1 className="text-3xl font-black text-gray-900">Saved Applications</h1>
          <p className="text-gray-500 font-medium">Quickly access apps you've bookmarked for later.</p>
        </div>
        {isAdmin && (
          <Link to="/admin/saved">
            <Button variant="outline" size="sm" className="rounded-xl border-purple-200 text-purple-700 bg-purple-50 hover:bg-purple-100 font-black text-xs gap-1.5 shadow-2xs">
              ⚡ Open Admin Saved Manager
            </Button>
          </Link>
        )}
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[1,2,3,4].map(i => (
            <div key={i} className="h-32 bg-gray-200 rounded-[32px] animate-pulse" />
          ))}
        </div>
      ) : saved.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {saved.map((item) => (
            <GlassCard key={item.id} className="p-4 flex gap-4 items-center group">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gray-50 flex-shrink-0">
                <img src={item.app.mainImage} alt={item.app.name} className="w-full h-full object-cover" />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 truncate">{item.app.name}</h3>
                <p className="text-xs text-gray-400 font-medium">{item.app.category}</p>
                <div className="flex gap-2 mt-3">
                  <Link to={`/apps/${item.app.id}`} className="flex-1">
                    <Button variant="outline" size="sm" className="w-full text-[10px] h-8 rounded-lg border-blue-100 text-blue-600 font-black uppercase">
                      View
                    </Button>
                  </Link>
                  <Button 
                    variant="ghost" 
                    size="icon" 
                    className="w-8 h-8 rounded-lg text-red-400 hover:text-red-500 hover:bg-red-50"
                    onClick={() => removeSaved(item.id)}
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-6">
           <div className="w-24 h-24 bg-pink-50 rounded-full flex items-center justify-center mx-auto text-pink-300">
             <Heart size={48} fill="currentColor" />
           </div>
           <div className="space-y-2">
             <h3 className="text-xl font-bold text-gray-900">Your Wishlist is Empty</h3>
             <p className="text-gray-500 max-w-xs mx-auto">Save applications you like and find them easily when you're ready to download.</p>
           </div>
           <Link to="/explore">
             <Button variant="gradient">Discover Apps</Button>
           </Link>
        </div>
      )}
    </div>
  );
}
