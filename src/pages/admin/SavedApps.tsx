import React, { useEffect, useState } from 'react';
import { 
  collection, query, where, onSnapshot, deleteDoc, doc, 
  getDocs, setDoc, updateDoc, increment, serverTimestamp 
} from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { useAuth } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Bookmark, Edit3, Trash2, ExternalLink, Smartphone, 
  Monitor, Film, Search, Star, Layers, CheckCircle2, 
  AlertCircle, Sparkles, RefreshCw, X, Eye, EyeOff
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { rebuildAndSyncCatalog } from '../../lib/catalogSync';
import { useApps } from '../../context/AppsContext';

interface SavedAppRecord {
  savedDocId: string;
  appId: string;
  savedAt?: any;
  appData: any;
}

export default function AdminSavedApps() {
  const { apps: ctxApps, categories: ctxCategories } = useApps();
  const { user } = useAuth();
  const [savedItems, setSavedItems] = useState<SavedAppRecord[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'app' | 'bundle' | 'pc'>('all');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);

  useEffect(() => {
    setCategories(ctxCategories);
    if (!user) {
      setLoading(false);
      return;
    }

    import('firebase/firestore').then(({ getDocs, query, where, collection }) => {
      const q = query(collection(db, 'saved_apps'), where('userId', '==', user.uid));
      getDocs(q).then((savedSnap) => {
        const savedDocs = savedSnap.docs.map(d => ({
          savedDocId: d.id,
          appId: d.data().appId,
          savedAt: d.data().savedAt,
          fallbackData: d.data()
        }));

        const appsMap = new Map();
        ctxApps.forEach(d => appsMap.set(d.id, d));

        const combined = savedDocs.map(item => {
          const liveApp = appsMap.get(item.appId);
          return {
            savedDocId: item.savedDocId,
            appId: item.appId,
            savedAt: item.savedAt,
            appData: liveApp || {
              id: item.appId,
              name: item.fallbackData.appName || 'Deleted / Missing App',
              mainImage: item.fallbackData.appImage || '',
              category: item.fallbackData.category || 'General',
              rating: item.fallbackData.rating || 4.5,
              version: item.fallbackData.version || '1.0',
              itemType: item.fallbackData.itemType || 'app',
              isDeleted: true
            }
          };
        });

        setSavedItems(combined);
        setLoading(false);
      }).catch(err => {
        console.error(err);
        setLoading(false);
      });
    });
  }, [user, ctxApps, ctxCategories]);

  const getCategoryName = (catId: string) => {
    if (!catId) return 'General';
    const cat = categories.find(c => c.id === catId || c.name?.toLowerCase().trim() === catId?.toLowerCase().trim());
    return cat ? cat.name : catId;
  };

  const getItemType = (item: any) => {
    if (item.itemType) return item.itemType === 'pc' ? 'pc' : item.itemType === 'bundle' ? 'bundle' : 'app';
    const cat = item.category?.toLowerCase() || '';
    if (cat.includes('bundle')) return 'bundle';
    if (cat.includes('pc')) return 'pc';
    return 'app';
  };

  // 1. Remove from saved list only (Unbookmark)
  const handleRemoveFromSaved = async (savedDocId: string) => {
    try {
      setActionLoading(savedDocId);
      await deleteDoc(doc(db, 'saved_apps', savedDocId));
    } catch (error) {
      console.error("Error removing bookmark:", error);
    } finally {
      setActionLoading(null);
    }
  };

  // 2. Permanently Delete App from Store & Database
  const handlePermanentDelete = async (appId: string, savedDocId: string) => {
    try {
      setActionLoading(savedDocId);
      
      // Delete from apps collection
      await deleteDoc(doc(db, 'apps', appId));

      // Also clean up any bookmark records
      try {
        await deleteDoc(doc(db, 'saved_apps', savedDocId));
      } catch {}

      // Sync unified snapshot for 33k users
      try {
        await rebuildAndSyncCatalog();
      } catch (err) {
        console.warn('Catalog sync failed:', err);
      }

      setDeleteConfirm(null);
    } catch (error) {
      console.error("Permanent delete error:", error);
      alert("Failed to delete app. Check console.");
    } finally {
      setActionLoading(null);
    }
  };

  // 3. Quick Status Toggle (Published / Draft)
  const handleToggleStatus = async (appId: string, currentStatus: string) => {
    try {
      const newStatus = currentStatus === 'draft' ? 'published' : 'draft';
      await updateDoc(doc(db, 'apps', appId), {
        status: newStatus,
        updatedAt: serverTimestamp()
      });

      // Update catalog snapshot
      try {
        await rebuildAndSyncCatalog();
      } catch {}
    } catch (error) {
      console.error("Status toggle error:", error);
    }
  };

  // Filter items
  const filteredItems = savedItems.filter(({ appData }) => {
    const matchesSearch = 
      appData.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      appData.appNumber?.toString().includes(searchTerm) ||
      appData.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const type = getItemType(appData);
    const matchesType = typeFilter === 'all' || type === typeFilter;

    return matchesSearch && matchesType;
  });

  const apkCount = savedItems.filter(i => getItemType(i.appData) === 'app').length;
  const pcCount = savedItems.filter(i => getItemType(i.appData) === 'pc').length;
  const bundleCount = savedItems.filter(i => getItemType(i.appData) === 'bundle').length;

  return (
    <div className="space-y-6">
      
      {/* Header & Description */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-red-50 text-red-600 flex items-center justify-center">
              <Bookmark size={22} />
            </div>
            <div>
              <h1 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">Admin Saved & Bookmarked Items</h1>
              <p className="text-xs text-slate-500 font-medium">
                Apps and bundles saved by Admin from live site for quick editing, deletion, and management.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link to="/">
            <Button variant="outline" size="sm" className="text-xs font-bold gap-1.5 rounded-xl border-slate-200">
              <ExternalLink size={14} />
              Browse Live Site
            </Button>
          </Link>
          <Link to="/admin/apps/new">
            <Button variant="gradient" size="sm" className="text-xs font-black gap-1.5 rounded-xl shadow-md shadow-blue-500/20">
              Add New App
            </Button>
          </Link>
        </div>
      </div>

      {/* Metrics Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Saved</span>
          <p className="text-2xl font-black text-slate-900 mt-1">{savedItems.length}</p>
        </div>
        <div className="bg-blue-50/60 p-4 rounded-xl border border-blue-100 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-blue-600">Android APKs</span>
          <p className="text-2xl font-black text-blue-900 mt-1">{apkCount}</p>
        </div>
        <div className="bg-cyan-50/60 p-4 rounded-xl border border-cyan-100 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-cyan-700">PC Software</span>
          <p className="text-2xl font-black text-cyan-900 mt-1">{pcCount}</p>
        </div>
        <div className="bg-purple-50/60 p-4 rounded-xl border border-purple-100 shadow-2xs">
          <span className="text-[10px] font-black uppercase tracking-wider text-purple-600">Reels & Bundles</span>
          <p className="text-2xl font-black text-purple-900 mt-1">{bundleCount}</p>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <Input
              type="text"
              placeholder="Search saved items by name, category, or #12..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-10 text-xs rounded-xl bg-slate-50 border-slate-200"
            />
            {searchTerm && (
              <button 
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X size={14} />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-hide">
            {[
              { id: 'all', label: 'All' },
              { id: 'app', label: 'Android Apps', icon: Smartphone },
              { id: 'pc', label: 'PC Software', icon: Monitor },
              { id: 'bundle', label: 'Bundles', icon: Film },
            ].map(tab => {
              const Icon = tab.icon;
              const active = typeFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setTypeFilter(tab.id as any)}
                  className={cn(
                    "flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border",
                    active 
                      ? "bg-slate-900 text-white border-slate-900" 
                      : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {Icon && <Icon size={13} />}
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Items List */}
      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-20 bg-slate-100 rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : filteredItems.length > 0 ? (
        <div className="space-y-3">
          {filteredItems.map(({ savedDocId, appId, appData }) => {
            const itemType = getItemType(appData);
            const isDraft = appData.status === 'draft';
            const isMissing = appData.isDeleted;

            return (
              <div 
                key={savedDocId}
                className={cn(
                  "bg-white p-4 rounded-2xl border transition-all flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-2xs hover:shadow-md",
                  isMissing ? "border-red-200 bg-red-50/30" : isDraft ? "border-amber-200 bg-amber-50/20" : "border-slate-200/90 hover:border-blue-300"
                )}
              >
                {/* App Info Left */}
                <div className="flex items-center gap-3.5 min-w-0 flex-1">
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex-shrink-0">
                    <img 
                      src={appData.mainImage || '/placeholder.png'} 
                      alt={appData.name} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        (e.target as HTMLElement).style.display = 'none';
                      }}
                    />
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex flex-wrap items-center gap-1.5">
                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                        itemType === 'bundle' ? "bg-purple-100 text-purple-700" :
                        itemType === 'pc' ? "bg-cyan-100 text-cyan-800" :
                        "bg-blue-100 text-blue-700"
                      )}>
                        {itemType === 'bundle' ? 'Reels Bundle' : itemType === 'pc' ? 'PC Software' : 'Android APK'}
                      </span>

                      <span className="text-[10px] font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {getCategoryName(appData.category)}
                      </span>

                      {appData.appNumber && (
                        <span className="text-[10px] font-black text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded">
                          #{appData.appNumber}
                        </span>
                      )}

                      <span className={cn(
                        "px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider",
                        isDraft ? "bg-amber-100 text-amber-700" : "bg-emerald-100 text-emerald-700"
                      )}>
                        {isDraft ? 'Draft' : 'Published'}
                      </span>

                      {isMissing && (
                        <span className="px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-red-100 text-red-700">
                          App Removed
                        </span>
                      )}
                    </div>

                    <h3 className="font-black text-slate-900 text-sm sm:text-base truncate">
                      {appData.name}
                    </h3>

                    <div className="flex items-center gap-3 text-xs text-slate-400 font-medium">
                      <div className="flex items-center gap-1 text-yellow-500 font-bold">
                        <Star size={12} fill="currentColor" />
                        <span>{appData.rating || '4.5'}</span>
                      </div>
                      {appData.version && <span>• v{appData.version}</span>}
                      {appData.size && <span>• {appData.size}</span>}
                    </div>
                  </div>
                </div>

                {/* Actions Right */}
                <div className="flex items-center gap-1.5 sm:gap-2 self-end sm:self-center flex-shrink-0 flex-wrap">
                  
                  {/* 1. View on live website */}
                  <Link to={`/apps/${appId}`} target="_blank" rel="noopener noreferrer">
                    <button
                      className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-blue-50 border border-slate-200 transition-colors"
                      title="View on Live Site"
                    >
                      <Eye size={16} />
                    </button>
                  </Link>

                  {/* 2. Toggle Status (Publish / Draft) */}
                  <button
                    onClick={() => handleToggleStatus(appId, appData.status || 'published')}
                    className={cn(
                      "px-2.5 py-2 rounded-xl text-xs font-bold border transition-colors flex items-center gap-1",
                      isDraft 
                        ? "text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border-emerald-200" 
                        : "text-amber-700 bg-amber-50 hover:bg-amber-100 border-amber-200"
                    )}
                    title={isDraft ? "Publish Item" : "Set to Draft"}
                  >
                    {isDraft ? <Eye size={14} /> : <EyeOff size={14} />}
                    <span className="hidden md:inline">{isDraft ? 'Publish' : 'Draft'}</span>
                  </button>

                  {/* 3. Edit App Button */}
                  <Link to={`/admin/apps/${appId}/edit`}>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="text-xs font-bold h-9 rounded-xl border-blue-200 text-blue-700 bg-blue-50/50 hover:bg-blue-100 gap-1.5"
                    >
                      <Edit3 size={14} />
                      <span>Edit</span>
                    </Button>
                  </Link>

                  {/* 4. Delete Permanently (From Database) */}
                  <Button 
                    variant="ghost" 
                    size="sm" 
                    className="text-xs font-bold h-9 rounded-xl text-red-600 hover:bg-red-50 gap-1.5"
                    onClick={() => setDeleteConfirm({ id: appId, name: appData.name })}
                  >
                    <Trash2 size={14} />
                    <span>Delete App</span>
                  </Button>

                  {/* 5. Remove Bookmark Only */}
                  <button
                    onClick={() => handleRemoveFromSaved(savedDocId)}
                    disabled={actionLoading === savedDocId}
                    className="p-2 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
                    title="Remove from saved bookmarks"
                  >
                    <X size={16} />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        /* Empty State */
        <div className="bg-white rounded-2xl border border-slate-200 p-12 text-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-red-50 text-red-400 flex items-center justify-center mx-auto">
            <Bookmark size={30} />
          </div>
          <div className="space-y-1 max-w-md mx-auto">
            <h3 className="text-lg font-black text-slate-900">No Saved Items in Admin Quick-List</h3>
            <p className="text-xs text-slate-500 font-medium leading-relaxed">
              When you browse the live website as an Admin, click the <span className="font-bold text-red-500">"Save" (Heart / Bookmark)</span> button on any app, PC software, or bundle. It will immediately show up here for fast 1-click editing and deletion!
            </p>
          </div>
          <div>
            <Link to="/">
              <Button variant="gradient" size="sm" className="rounded-xl px-6 font-bold">
                Explore Live Website to Bookmark Apps
              </Button>
            </Link>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-xl bg-red-100 text-red-600 flex items-center justify-center">
              <AlertCircle size={24} />
            </div>

            <div className="space-y-1.5">
              <h3 className="text-lg font-black text-slate-900">Permanently Delete App?</h3>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Are you sure you want to delete <span className="font-black text-slate-900">"{deleteConfirm.name}"</span>? This will permanently remove it from the live catalog, downloads, and search.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <Button 
                variant="outline" 
                size="sm" 
                className="rounded-xl font-bold"
                onClick={() => setDeleteConfirm(null)}
              >
                Cancel
              </Button>
              <Button 
                variant="danger" 
                size="sm" 
                className="rounded-xl font-black bg-red-600 hover:bg-red-700 text-white"
                onClick={() => {
                  const target = savedItems.find(s => s.appId === deleteConfirm.id);
                  if (target) {
                    handlePermanentDelete(deleteConfirm.id, target.savedDocId);
                  }
                }}
              >
                Confirm Delete
              </Button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
