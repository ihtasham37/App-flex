import React, { useEffect, useState } from 'react';
import { collection, addDoc, deleteDoc, doc, serverTimestamp, updateDoc, increment, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Tag, Plus, Trash2, Smartphone, Film, Layers, Monitor, FileText, Save, CheckCircle2 } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApps } from '../../context/AppsContext';
import { useSettings } from '../../context/SettingsContext';

export default function AdminCategories() {
  const { categories: ctxCategories } = useApps();
  const { settings, updateSettings } = useSettings();
  const [categories, setCategories] = useState<any[]>([]);
  const [newCategory, setNewCategory] = useState('');
  const [selectedMainType, setSelectedMainType] = useState<'app' | 'bundle' | 'pc'>('app');
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'app' | 'bundle' | 'pc'>('all');

  // Default Descriptions State
  const [descApps, setDescApps] = useState('');
  const [descPC, setDescPC] = useState('');
  const [descBundles, setDescBundles] = useState('');
  const [savingDesc, setSavingDesc] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    // 0 reads - using unified context snapshot
    setCategories(ctxCategories);
    setLoading(false);
  }, [ctxCategories]);

  const handleAddCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategory.trim()) return;

    setAdding(true);
    try {
      const docRef = await addDoc(collection(db, 'categories'), {
        name: newCategory.trim(),
        mainType: selectedMainType,
        createdAt: serverTimestamp()
      });

      setCategories(prev => [...prev, { id: docRef.id, name: newCategory.trim(), mainType: selectedMainType }]);
      setNewCategory('');
    } catch (error) {
      console.error("Error adding category:", error);
    } finally {
      setAdding(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Are you sure you want to delete this category?')) {
      try {
        await deleteDoc(doc(db, 'categories', id));
        setCategories(prev => prev.filter(c => c.id !== id));
      } catch (error) {
        console.error("Error deleting category:", error);
      }
    }
  };

  const handleSaveDefaultDescriptions = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDesc(true);
    setSavedSuccess(false);
    try {
      await updateSettings({
        defaultAppsDescription: descApps,
        defaultPCAppsDescription: descPC,
        defaultBundlesDescription: descBundles,
      });
      try {
      } catch (err) {
        console.warn('Catalog sync failed:', err);
      }
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 4000);
    } catch (err) {
      console.error("Error updating category descriptions:", err);
    } finally {
      setSavingDesc(false);
    }
  };

  const filteredCategories = categories.filter(c => {
    if (filterType === 'all') return true;
    return (c.mainType || 'app') === filterType;
  });

  return (
    <div className="space-y-8 pb-16 max-w-6xl mx-auto">
      <div className="space-y-1">
        <h1 className="text-2xl font-black text-slate-900">Category & Default Descriptions Management</h1>
        <p className="text-xs text-slate-500 font-medium">Configure sub-categories and set default descriptions for Apps, PC Soft, and Video Bundles.</p>
      </div>

      {/* SECTION 1: Default 3 Category Descriptions Manager */}
      <GlassCard className="p-8 bg-white border border-slate-200 space-y-6" hover={false}>
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-50 text-blue-600 rounded-xl">
              <FileText size={22} />
            </div>
            <div>
              <h2 className="font-black text-base text-slate-900">Default Category Descriptions</h2>
              <p className="text-xs text-slate-500 font-medium">
                These 3 default descriptions will automatically display on item detail pages for each category without needing manual input per item.
              </p>
            </div>
          </div>
          {savedSuccess && (
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-700 bg-emerald-50 px-3 py-2 rounded-xl border border-emerald-200 animate-fade-in">
              <CheckCircle2 size={16} className="text-emerald-600" />
              <span>Descriptions Saved!</span>
            </div>
          )}
        </div>

        <form onSubmit={handleSaveDefaultDescriptions} className="space-y-6">
          <div className="grid md:grid-cols-3 gap-6">
            
            {/* 1. Android Apps Default Description */}
            <div className="space-y-2 bg-blue-50/30 p-5 rounded-2xl border border-blue-100">
              <label className="text-xs font-black text-blue-900 flex items-center gap-2 uppercase tracking-wider">
                <Smartphone size={16} className="text-blue-600" />
                1. Apps Category Default Description
              </label>
              <textarea
                rows={4}
                value={descApps}
                onChange={(e) => setDescApps(e.target.value)}
                placeholder="Enter default description for all Android Apps..."
                className="w-full bg-white border border-blue-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-blue-500 font-medium leading-relaxed"
                required
              />
            </div>

            {/* 2. PC Soft Default Description */}
            <div className="space-y-2 bg-slate-100/50 p-5 rounded-2xl border border-slate-200">
              <label className="text-xs font-black text-slate-900 flex items-center gap-2 uppercase tracking-wider">
                <Monitor size={16} className="text-slate-800" />
                2. PC Soft Category Default Description
              </label>
              <textarea
                rows={4}
                value={descPC}
                onChange={(e) => setDescPC(e.target.value)}
                placeholder="Enter default description for all PC Software..."
                className="w-full bg-white border border-slate-300 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-slate-800 font-medium leading-relaxed"
                required
              />
            </div>

            {/* 3. Video Bundles Default Description */}
            <div className="space-y-2 bg-purple-50/30 p-5 rounded-2xl border border-purple-100">
              <label className="text-xs font-black text-purple-900 flex items-center gap-2 uppercase tracking-wider">
                <Film size={16} className="text-purple-600" />
                3. Video Bundles Category Default Description
              </label>
              <textarea
                rows={4}
                value={descBundles}
                onChange={(e) => setDescBundles(e.target.value)}
                placeholder="Enter default description for all Video Bundles & Presets..."
                className="w-full bg-white border border-purple-200 rounded-xl p-3 text-xs text-slate-800 outline-none focus:border-purple-500 font-medium leading-relaxed"
                required
              />
            </div>

          </div>

          <div className="flex justify-end pt-2">
            <Button
              type="submit"
              variant="gradient"
              className="px-8 h-12 text-xs font-black rounded-xl shadow-lg uppercase tracking-wider"
              loading={savingDesc}
            >
              <Save size={18} className="mr-2" />
              Save Default Category Descriptions
            </Button>
          </div>
        </form>
      </GlassCard>

      {/* SECTION 2: Sub-Category Management */}
      <div className="grid md:grid-cols-[380px_1fr] gap-6 items-start">
        
        {/* Sub-Category Creation Form */}
        <GlassCard className="p-6 space-y-5 bg-white border border-slate-200" hover={false}>
          <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
            <Plus size={18} className="text-blue-600" />
            Add Sub-Category
          </h2>

          <form onSubmit={handleAddCategory} className="space-y-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700">Choose Main Type:</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedMainType('app')}
                  className={cn(
                    "py-2 px-1 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1",
                    selectedMainType === 'app'
                      ? "bg-blue-600 border-blue-600 text-white shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Smartphone size={16} />
                  <span>Apps</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMainType('pc')}
                  className={cn(
                    "py-2 px-1 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1",
                    selectedMainType === 'pc'
                      ? "bg-slate-900 border-slate-900 text-white shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Monitor size={16} />
                  <span>PC Soft</span>
                </button>

                <button
                  type="button"
                  onClick={() => setSelectedMainType('bundle')}
                  className={cn(
                    "py-2 px-1 rounded-xl text-[11px] font-bold border transition-all flex flex-col items-center gap-1",
                    selectedMainType === 'bundle'
                      ? "bg-purple-600 border-purple-600 text-white shadow-xs"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  <Film size={16} />
                  <span>Bundles</span>
                </button>
              </div>
            </div>

            <Input 
              label="Category Title"
              placeholder={
                selectedMainType === 'app' ? "e.g. Tools, Photography, Social" :
                selectedMainType === 'pc' ? "e.g. Editors, Anti-Virus, PC Tools" :
                "e.g. Cinematic LUTs, CapCut Presets"
              }
              value={newCategory}
              onChange={(e) => setNewCategory(e.target.value)}
              required
              icon={<Tag size={16} />}
            />

            <Button type="submit" variant="gradient" className="w-full h-11 text-xs font-bold rounded-xl" loading={adding}>
              <Plus size={16} className="mr-1.5" /> Save Sub-Category
            </Button>
          </form>
        </GlassCard>

        {/* Existing Categories List */}
        <GlassCard className="p-6 bg-white border border-slate-200" hover={false}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
            <h2 className="font-bold text-sm text-slate-900 flex items-center gap-2">
              <Layers size={18} className="text-purple-600" />
              Sub-Categories List ({filteredCategories.length})
            </h2>

            {/* Filter Tabs */}
            <div className="flex gap-1.5 flex-wrap">
              {(['all', 'app', 'pc', 'bundle'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold capitalize transition-all border",
                    filterType === t
                      ? "bg-slate-900 border-slate-900 text-white"
                      : "bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100"
                  )}
                >
                  {t === 'all' ? 'All' : t === 'app' ? 'Apps' : t === 'pc' ? 'PC' : 'Bundles'}
                </button>
              ))}
            </div>
          </div>
          
          {loading ? (
            <div className="py-12 text-center text-slate-400 font-bold animate-pulse text-xs">Loading categories...</div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {filteredCategories.map((cat) => {
                const type = cat.mainType || 'app';
                return (
                  <div key={cat.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200 group hover:border-slate-300 transition-colors">
                    <div className="flex items-center gap-2 truncate pr-2">
                      <span className={cn(
                        "w-2 h-2 rounded-full flex-shrink-0",
                        type === 'bundle' ? "bg-purple-500" : type === 'pc' ? "bg-slate-800" : "bg-blue-500"
                      )} />
                      <span className="font-bold text-xs text-slate-800 truncate">{cat.name}</span>
                    </div>
                    <button 
                      onClick={() => handleDelete(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 flex-shrink-0"
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                );
              })}
              {filteredCategories.length === 0 && (
                <div className="col-span-full py-10 text-center text-xs text-slate-400 font-semibold">
                  No sub-categories found. Use the form on the left to add one!
                </div>
              )}
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
