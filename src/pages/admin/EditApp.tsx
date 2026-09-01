import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { doc, getDoc, updateDoc, serverTimestamp, collection, increment, getDocs, setDoc } from 'firebase/firestore';
import { db } from '../../lib/firebase';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { 
  Package, Info, Image as ImageIcon, 
  Save, ArrowLeft, Smartphone, Star, Film, Layers, Monitor
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useApps } from '../../context/AppsContext';

export default function AdminEditApp() {
  const { apps: ctxApps, categories: ctxCategories } = useApps();
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    itemType: 'app' as 'app' | 'bundle' | 'pc',
    name: '',
    appNumber: '',
    developer: '',
    category: '',
    version: '',
    size: '',
    rating: '4.5',
    shortDescription: '',
    fullDescription: '',
    mainImage: '',
    downloadUrl: '',
    downloadButtonText: '',
    status: 'published',
    showOnBanner: false,
  });

  const [screenshots, setScreenshots] = useState<string[]>(['', '', '', '']);

  useEffect(() => {
    // 0 reads - using context categories
    setCategories(ctxCategories);
  }, [ctxCategories]);

  useEffect(() => {
    async function fetchData() {
      if (!appId) return;
      try {
        // 0 reads - get from context instead of getDoc
        const contextApp = ctxApps.find(a => a.id === appId);
        
        if (contextApp) {
          const data = contextApp as any;
          const rawCat = data.category || '';
          const matchedCat = categories.find(c => c.id === rawCat || c.name?.toLowerCase().trim() === rawCat.toLowerCase().trim());
          const resolvedCategory = matchedCat ? matchedCat.name : rawCat;

          setFormData({
            itemType: data.itemType === 'pc' ? 'pc' : data.itemType === 'bundle' ? 'bundle' : (resolvedCategory?.toLowerCase().includes('pc') ? 'pc' : resolvedCategory?.toLowerCase().includes('bundle') ? 'bundle' : 'app'),
            name: data.name || '',
            appNumber: data.appNumber || '',
            developer: data.developer || '',
            category: resolvedCategory,
            version: data.version || '1.0.0',
            size: data.size || '',
            rating: data.rating?.toString() || '4.5',
            shortDescription: data.shortDescription || '',
            fullDescription: data.fullDescription || '',
            mainImage: data.mainImage || '',
            downloadUrl: data.downloadUrl || '',
            downloadButtonText: data.downloadButtonText || '',
            status: data.status || 'published',
            showOnBanner: data.showOnBanner || false,
          });

          const currentScreenshots = data.screenshots || [];
          setScreenshots([
            currentScreenshots[0] || '',
            currentScreenshots[1] || '',
            currentScreenshots[2] || '',
            currentScreenshots[3] || '',
          ]);
        }
      } catch (err: any) {
        setError("Error loading item details.");
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [appId]);

  const availableCategories = categories.filter(c => (c.mainType || 'app') === formData.itemType);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setFormData(prev => ({ ...prev, [name]: checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleScreenshotChange = (index: number, value: string) => {
    const newScreenshots = [...screenshots];
    newScreenshots[index] = value;
    setScreenshots(newScreenshots);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!appId) return;

    setSaving(true);
    setError('');

    try {
      const validScreenshots = screenshots
        .map(s => s.trim())
        .filter(s => s !== '')
        .slice(0, 4);

      const updateData = {
        ...formData,
        rating: parseFloat(formData.rating) || 4.5,
        screenshots: validScreenshots,
        updatedAt: serverTimestamp(),
      };

      await updateDoc(doc(db, 'apps', appId), updateData);

      navigate('/admin/apps');
    } catch (err: any) {
      setError(err.message || 'Failed to update item');
    } finally {
      setSaving(false);
    }
  };

  const isBundle = formData.itemType === 'bundle';
  const isPC = formData.itemType === 'pc';

  if (loading) {
    return <div className="py-20 text-center text-slate-400 font-bold animate-pulse text-xs">Loading details live...</div>;
  }

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/apps')} className="flex items-center gap-2">
          <ArrowLeft size={18} />
          Back to App Management
        </Button>
        <h1 className="text-2xl font-black text-gray-900">
          Edit {isBundle ? 'Video Bundle' : isPC ? 'PC Soft' : 'Android App'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[2fr_1fr] gap-8">
        <div className="space-y-8">
          
          {/* Main Item Type Selector */}
          <GlassCard className="p-6 border-2 border-blue-100 bg-blue-50/20" hover={false}>
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <Layers size={20} />
              <h2 className="font-black uppercase tracking-widest text-xs">Main Type</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, itemType: 'app' }))}
                className={cn(
                  "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all font-black text-[10px]",
                  formData.itemType === 'app'
                    ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                )}
              >
                <Smartphone size={18} />
                <span>App</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, itemType: 'pc' }))}
                className={cn(
                  "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all font-black text-[10px]",
                  formData.itemType === 'pc'
                    ? "border-slate-900 bg-slate-900 text-white shadow-md shadow-black/20" 
                    : "border-slate-200 bg-white text-slate-700 hover:border-slate-400"
                )}
              >
                <Monitor size={18} />
                <span>PC Soft</span>
              </button>

              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, itemType: 'bundle' }))}
                className={cn(
                  "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all font-black text-[10px]",
                  formData.itemType === 'bundle'
                    ? "border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-500/20" 
                    : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                )}
              >
                <Film size={18} />
                <span>Bundle</span>
              </button>
            </div>
          </GlassCard>

          {/* Basic Info */}
          <GlassCard className="p-8 space-y-6 bg-white border border-slate-200" hover={false}>
            <div className="flex items-center gap-2 text-blue-600 mb-2">
              <Package size={20} />
              <h2 className="font-black uppercase tracking-widest text-sm">
                {isBundle ? 'Video Bundle Information' : isPC ? 'PC Software Information' : 'App Information'}
              </h2>
            </div>
            
            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label={isBundle ? "Bundle Title" : isPC ? "Software Name" : "App Name"}
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Item Number / ID"
                name="appNumber"
                value={formData.appNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label={isBundle ? "Creator / Studio Name" : isPC ? "Publisher" : "Developer Name"}
                name="developer"
                value={formData.developer}
                onChange={handleChange}
                required
              />
              <div className="flex flex-col gap-1.5 w-full">
                <label className="text-sm font-medium text-gray-700 ml-1">Sub-Category</label>
                <select
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  {availableCategories.length === 0 && (
                    <option value={formData.category}>{formData.category || 'General'}</option>
                  )}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <Input
                label={isBundle ? "Items / Version" : "Version"}
                name="version"
                value={formData.version}
                onChange={handleChange}
                required
              />
              <Input
                label={isBundle ? "Pack Size (Optional)" : "File Size (Optional)"}
                name="size"
                placeholder={isBundle ? "e.g. 450 MB (Leave empty to hide)" : "e.g. 64 MB (Leave empty to hide)"}
                value={formData.size}
                onChange={handleChange}
              />
              <Input
                label="Rating (1.0 - 5.0)"
                name="rating"
                type="number"
                step="0.1"
                min="1.0"
                max="5.0"
                icon={<Star size={18} />}
                value={formData.rating}
                onChange={handleChange}
                required
              />
            </div>
          </GlassCard>



          {/* Screenshots - Exactly 4 slots in 1 row */}
          <GlassCard className="p-8 space-y-6 bg-white border border-slate-200" hover={false}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-pink-600">
                <Smartphone size={20} />
                <h2 className="font-black uppercase tracking-widest text-sm">Preview Screenshots (Max 4)</h2>
              </div>
              <span className="text-xs font-bold text-slate-400">4 Slots Fixed</span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {screenshots.map((url, idx) => (
                <div key={idx} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Screenshot {idx + 1}</label>
                  <Input
                    placeholder={`https://i.ibb.co/... (Screenshot ${idx + 1})`}
                    value={url}
                    onChange={(e) => handleScreenshotChange(idx, e.target.value)}
                  />
                </div>
              ))}
            </div>

            {/* Live 4-column Preview */}
            <div className="pt-2 border-t border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Live 4-Screen Row Preview:</p>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {screenshots.map((url, idx) => (
                  <div key={idx} className="aspect-[9/16] bg-slate-100 rounded-xl overflow-hidden border border-slate-200 flex flex-col items-center justify-center relative">
                    {url.trim() ? (
                      <img 
                        src={url} 
                        alt={`Preview ${idx + 1}`} 
                        className="w-full h-full object-cover" 
                        onError={(e) => (e.currentTarget.src = '')} 
                      />
                    ) : (
                      <div className="text-center p-1 text-slate-400">
                        <Smartphone size={18} className="mx-auto mb-1 opacity-50" />
                        <span className="text-[10px] font-bold">Slot {idx + 1}</span>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </GlassCard>
        </div>

        {/* Sidebar Controls */}
        <div className="space-y-8">
          <GlassCard className="p-8 space-y-6 bg-white border border-slate-200" hover={false}>
            <div className="flex items-center gap-2 text-orange-600 mb-2">
              <ImageIcon size={20} />
              <h2 className="font-black uppercase tracking-widest text-sm">Media & Links</h2>
            </div>

            <Input
              label={isBundle ? "Main Cover Thumbnail URL" : "Main Icon Image URL"}
              name="mainImage"
              placeholder="https://i.ibb.co/..."
              icon={<ImageIcon size={20} />}
              value={formData.mainImage}
              onChange={handleChange}
              required
            />
            {formData.mainImage && (
              <div className="w-28 h-28 mx-auto rounded-2xl bg-gray-100 overflow-hidden border border-gray-200 shadow-inner">
                <img src={formData.mainImage} alt="Main Preview" className="w-full h-full object-cover" />
              </div>
            )}

            <Input
              label="MediaFire Direct Download URL"
              name="downloadUrl"
              placeholder="https://www.mediafire.com/file/..."
              value={formData.downloadUrl}
              onChange={handleChange}
              required
            />

            <Input
              label="Custom Download Button Text (Optional)"
              name="downloadButtonText"
              placeholder="e.g. Download Now, Play Store, Get App"
              value={formData.downloadButtonText}
              onChange={handleChange}
            />
          </GlassCard>

          <GlassCard className="p-8 space-y-6 bg-white border border-slate-200" hover={false}>
            <div className="flex items-center gap-2 text-indigo-600 mb-2">
              <Save size={20} />
              <h2 className="font-black uppercase tracking-widest text-sm">Publishing</h2>
            </div>

            <div className="flex items-start gap-3 p-4 bg-amber-50/70 border border-amber-200 rounded-xl">
              <input 
                type="checkbox" 
                id="showOnBanner"
                name="showOnBanner"
                checked={formData.showOnBanner}
                onChange={handleChange}
                className="w-5 h-5 rounded border-amber-300 text-amber-600 focus:ring-amber-500 mt-0.5"
              />
              <label htmlFor="showOnBanner" className="text-xs font-bold text-amber-950 cursor-pointer">
                Feature on Top Rotating Banner (Auto-switches every 2s)
              </label>
            </div>

            <div className="flex flex-col gap-1.5 w-full">
              <label className="text-sm font-medium text-gray-700 ml-1">Status</label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-none font-bold text-xs"
              >
                <option value="published">Published (Live to visitors)</option>
                <option value="draft">Draft (Hidden)</option>
              </select>
            </div>

            {error && <p className="text-red-500 text-xs font-bold">{error}</p>}

            <Button
              type="submit"
              variant="gradient"
              className="w-full py-6 rounded-xl font-bold shadow-lg text-xs"
              loading={saving}
            >
              <Save size={18} className="mr-2" />
              Update {isBundle ? 'Bundle' : isPC ? 'PC Software' : 'App'}
            </Button>

            <Button
              type="button"
              variant="outline"
              className="w-full rounded-xl text-xs"
              onClick={() => navigate('/admin/apps')}
            >
              Cancel
            </Button>
          </GlassCard>
        </div>
      </form>
    </div>
  );
}
