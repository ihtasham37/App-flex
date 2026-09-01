import React, { useEffect, useState } from 'react';
import { collection, deleteDoc, doc, updateDoc, increment, getDocs, setDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { Link } from 'react-router-dom';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { 
  Plus, Search, Edit3, Trash2, 
  Eye, Smartphone, Film, Layers, Monitor
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApps } from '../../context/AppsContext';

export default function AdminApps() {
  const { apps, categories: ctxCategories } = useApps();
  const [items, setItems] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'app' | 'bundle' | 'pc'>('all');

  useEffect(() => {
    // 0 Reads! Uses unified context snapshot
    setItems(apps);
    // Categories are also provided by useApps context!
    // No getDocs or onSnapshot used here!
    setLoading(false);
  }, [apps]);

  const getCategoryName = (catId: string) => {
    if (!catId) return 'General';
    const cat = ctxCategories.find(c => c.id === catId || c.name?.toLowerCase().trim() === catId?.toLowerCase().trim());
    return cat ? cat.name : catId;
  };

  const handleDelete = async (itemId: string, name: string) => {
    if (window.confirm(`Are you sure you want to delete "${name}"? This action cannot be undone.`)) {
      try {
        await deleteDoc(doc(db, 'apps', itemId));
        
        // Rebuild the unified snapshot
        try {
        } catch (err) {
          console.warn('Catalog sync failed:', err);
        }
      } catch (error) {
        console.error("Delete error:", error);
      }
    }
  };

  const getItemType = (item: any) => {
    if (item.itemType) return item.itemType === 'pc' ? 'pc' : item.itemType === 'bundle' ? 'bundle' : 'app';
    const cat = item.category?.toLowerCase() || '';
    if (cat.includes('bundle')) return 'bundle';
    if (cat.includes('pc')) return 'pc';
    return 'app';
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = 
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.appNumber?.includes(searchTerm) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    const type = getItemType(item);
    const matchesType = typeFilter === 'all' || type === typeFilter;

    return matchesSearch && matchesType;
  });

  const appsCount = items.filter(i => getItemType(i) === 'app').length;
  const bundlesCount = items.filter(i => getItemType(i) === 'bundle').length;
  const pcCount = items.filter(i => getItemType(i) === 'pc').length;

  return (
    <div className="space-y-6">
      
      {/* Top Action Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900">Content & App Management</h1>
          <p className="text-xs text-slate-500 font-medium mt-0.5">Manage Apps, PC Software, and Video Bundles in one unified console.</p>
        </div>
        <div className="flex items-center gap-2.5">
          <Link to="/admin/apps/new">
            <Button variant="gradient" className="shadow-md shadow-blue-500/20 text-xs font-bold h-10 px-4 rounded-xl">
              <Plus size={16} className="mr-1.5" /> Add App / PC / Bundle
            </Button>
          </Link>
        </div>
      </div>

      {/* Main Filter Tabs (All, Apps, Video Bundles, PC) */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-3 overflow-x-auto scrollbar-hide">
        <button
          onClick={() => setTypeFilter('all')}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
            typeFilter === 'all'
              ? "bg-slate-900 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Layers size={14} />
          <span>All ({items.length})</span>
        </button>

        <button
          onClick={() => setTypeFilter('app')}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
            typeFilter === 'app'
              ? "bg-blue-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Smartphone size={14} />
          <span>Apps ({appsCount})</span>
        </button>

        <button
          onClick={() => setTypeFilter('pc')}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
            typeFilter === 'pc'
              ? "bg-slate-700 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Monitor size={14} />
          <span>PC Software ({pcCount})</span>
        </button>

        <button
          onClick={() => setTypeFilter('bundle')}
          className={cn(
            "px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 whitespace-nowrap",
            typeFilter === 'bundle'
              ? "bg-purple-600 text-white shadow-xs"
              : "bg-white text-slate-600 hover:bg-slate-100 border border-slate-200"
          )}
        >
          <Film size={14} />
          <span>Video Bundles ({bundlesCount})</span>
        </button>
      </div>

      <GlassCard className="p-6 bg-white border border-slate-200 shadow-xs" hover={false}>
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <Input 
            placeholder="Search by title, ID or category..."
            icon={<Search size={18} />}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="bg-slate-50 border-slate-200 rounded-xl"
          />
        </div>

        {loading ? (
          <div className="py-20 text-center text-slate-400 font-bold animate-pulse text-xs">Syncing items live...</div>
        ) : (
          <div className="overflow-x-auto -mx-6">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/50">
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Type & Title</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">ID</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Category</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">Status</th>
                  <th className="px-6 py-3.5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredItems.map((item) => {
                  const type = getItemType(item);

                  return (
                    <tr key={item.id} className="hover:bg-slate-50/70 transition-colors group">
                      
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-11 h-11 rounded-xl bg-slate-100 overflow-hidden flex-shrink-0 border border-slate-200">
                            <img src={item.mainImage} alt={item.name} className="w-full h-full object-cover" />
                          </div>
                          <div>
                            <div className="flex items-center gap-1.5">
                              <span className={cn(
                                "text-[8px] font-black uppercase px-1.5 py-0.2 rounded",
                                type === 'bundle' ? "bg-purple-100 text-purple-700" : 
                                type === 'pc' ? "bg-slate-100 text-slate-700" : "bg-blue-100 text-blue-700"
                              )}>
                                {type.toUpperCase()}
                              </span>
                              <p className="font-bold text-slate-900 text-xs group-hover:text-blue-600 transition-colors">{item.name}</p>
                            </div>
                            <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">
                              {type === 'bundle' ? item.version : `v${item.version || '1.0.0'}`} • {item.size || 'Free'}
                            </p>
                          </div>
                        </div>
                      </td>

                      <td className="px-6 py-4">
                        <span className="text-xs font-bold text-slate-500">#{item.appNumber || item.id.slice(0, 4)}</span>
                      </td>

                      <td className="px-6 py-4">
                        <span className="px-2.5 py-0.5 bg-slate-100 text-slate-700 rounded-md text-[10px] font-bold uppercase">
                          {getCategoryName(item.category)}
                        </span>
                      </td>

                      <td className="px-6 py-4">
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-1.5">
                            <div className={cn("w-2 h-2 rounded-full", item.status === 'published' ? 'bg-emerald-500' : 'bg-amber-500')} />
                            <span className="text-xs font-bold capitalize">{item.status || 'published'}</span>
                          </div>
                          {item.showOnBanner && (
                            <span className="px-1.5 py-0.2 bg-amber-50 text-amber-700 rounded text-[8px] font-black uppercase tracking-wider w-fit border border-amber-200">
                              2s Banner
                            </span>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          <Link to={`/apps/${item.id}`}>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-blue-600 rounded-lg" title="View Live Page">
                              <Eye size={16} />
                            </Button>
                          </Link>
                          <Link to={`/admin/apps/${item.id}/edit`}>
                            <Button variant="ghost" size="icon" className="w-8 h-8 text-slate-400 hover:text-purple-600 rounded-lg" title="Edit Item">
                              <Edit3 size={16} />
                            </Button>
                          </Link>
                          <Button 
                            variant="ghost" 
                            size="icon" 
                            className="w-8 h-8 text-slate-400 hover:text-red-500 rounded-lg"
                            onClick={() => handleDelete(item.id, item.name)}
                            title="Delete Item"
                          >
                            <Trash2 size={16} />
                          </Button>
                        </div>
                      </td>

                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredItems.length === 0 && (
              <div className="py-14 text-center space-y-2">
                <p className="text-slate-400 font-bold text-xs">No matching items found</p>
                <Link to="/admin/apps/new">
                  <Button variant="outline" size="sm" className="mt-2 text-xs font-bold rounded-xl">
                    <Plus size={14} className="mr-1" /> Add Your First Item
                  </Button>
                </Link>
              </div>
            )}
          </div>
        )}
      </GlassCard>
    </div>
  );
}
