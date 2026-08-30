import React, { useEffect, useState } from 'react';
import { collection, query, where, getDocs, deleteDoc, doc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { useAuth } from '../context/AuthContext';
import { useApps } from '../context/AppsContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Heart, Trash2, ExternalLink, Package } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function SavedApps() {
  const { user } = useAuth();
  const { apps } = useApps();
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
        
        if (snap.empty) {
          setSaved([]);
          setLoading(false);
          return;
        }

        const appsMap = new Map();
        apps.forEach(a => appsMap.set(a.id, a));

        setSaved(snap.docs.map(d => {
          const data = d.data();
          const localApp = appsMap.get(data.appId) || {
            id: data.appId,
            name: data.appName || 'Unknown App',
            mainImage: data.appImage || '',
            category: data.category || 'General',
            rating: data.rating || 4.5,
            itemType: data.itemType || 'app'
          };
          return {
            id: d.id,
            app: localApp,
            ...data
          };
        }));

      } catch (error) {
        console.error("Error fetching saved apps:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchSaved();
  }, [user, apps]);

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
          <p className="text-gray-500 font-medium">Quick access to your bookmarked and favorite tools</p>
        </div>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="h-28 bg-gray-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : saved.length === 0 ? (
        <GlassCard className="text-center py-16 space-y-4">
          <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto">
            <Heart size={32} />
          </div>
          <div className="space-y-1">
            <h3 className="text-xl font-bold text-gray-900">No saved applications</h3>
            <p className="text-gray-500 max-w-sm mx-auto">
              Save your favorite apps and tools to easily find and download them later.
            </p>
          </div>
          <Link to="/explore">
            <Button variant="primary">Explore Apps</Button>
          </Link>
        </GlassCard>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {saved.map(({ id, app }) => (
            <GlassCard key={id} className="flex items-center justify-between p-4 group hover:shadow-md transition-shadow">
              <div className="flex items-center gap-4">
                <img 
                  src={app.mainImage || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=150&q=80'} 
                  alt={app.name} 
                  className="w-16 h-16 rounded-2xl object-cover border border-gray-100 shadow-xs"
                />
                <div>
                  <h3 className="font-bold text-gray-900 group-hover:text-blue-600 transition-colors">
                    {app.name}
                  </h3>
                  <div className="flex items-center gap-2 text-xs font-semibold text-gray-500 mt-1">
                    <span className="capitalize">{app.category || 'General'}</span>
                    <span>•</span>
                    <span>★ {app.rating || '4.5'}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Link to={`/apps/${app.id}`}>
                  <Button size="sm" variant="ghost" className="h-9 w-9 p-0 text-gray-400 hover:text-blue-600 hover:bg-blue-50">
                    <ExternalLink size={18} />
                  </Button>
                </Link>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  onClick={() => removeSaved(id)}
                  className="h-9 w-9 p-0 text-gray-400 hover:text-red-600 hover:bg-red-50"
                >
                  <Trash2 size={18} />
                </Button>
              </div>
            </GlassCard>
          ))}
        </div>
      )}
    </div>
  );
}
