import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, addDoc, serverTimestamp, onSnapshot, doc, updateDoc, increment, getDocs, setDoc } from 'firebase/firestore';
import { db, auth } from '../../lib/firebase';
import { GlassCard } from '../../components/ui/GlassCard';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { 
  Package, Info, Image as ImageIcon, 
  Save, ArrowLeft, Smartphone, Star, Film, Layers, Monitor
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { rebuildAndSyncCatalog } from '../../lib/catalogSync';

export default function AdminAddApp() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const [formData, setFormData] = useState({
    itemType: 'app' as 'app' | 'bundle' | 'pc',
    name: '',
    appNumber: '',
    developer: '',
    category: '',
    version: '1.0.0',
    size: '',
    rating: '4.8',
    shortDescription: '',
    fullDescription: '',
    mainImage: '',
    downloadUrl: '',
    downloadButtonText: '',
    status: 'published',
    showOnBanner: false,
  });

  // Maximum 4 screenshots
  const [screenshots, setScreenshots] = useState<string[]>(['', '', '', '']);

  useEffect(() => {
    // Real-time listener for categories
    const unsub = onSnapshot(collection(db, 'categories'), (snap) => {
      const cats = snap.docs.map(doc => ({ id: doc.id, ...doc.data() as { name: string; mainType?: string } }));
      setCategories(cats);
    });
    return () => unsub();
  }, []);

  // Filter categories matching the selected itemType
  const availableCategories = categories.filter(c => (c.mainType || 'app') === formData.itemType);

  useEffect(() => {
    if (availableCategories.length > 0 && !formData.category) {
      setFormData(prev => ({ ...prev, category: availableCategories[0].name }));
    }
  }, [formData.itemType, availableCategories]);

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
    setLoading(true);
    setError('');

    try {
      const validScreenshots = screenshots
        .map(s => s.trim())
        .filter(s => s !== '')
        .slice(0, 4);
      
      const itemData = {
        ...formData,
        category: formData.category || (formData.itemType === 'bundle' ? 'Video LUTs' : formData.itemType === 'pc' ? 'Utilities' : 'Tools'),
        rating: parseFloat(formData.rating) || 4.5,
        screenshots: validScreenshots,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        createdBy: auth.currentUser?.uid,
      };

      await addDoc(collection(db, 'apps'), itemData);
      
      // Auto-rebuild the 1-read snapshot immediately
      try {
        await rebuildAndSyncCatalog();
      } catch (err) {
        console.warn('Snapshot rebuild note:', err);
      }

      navigate('/admin/apps');
    } catch (err: any) {
      setError(err.message || 'Failed to save item');
    } finally {
      setLoading(false);
    }
  };

  const isBundle = formData.itemType === 'bundle';
  const isPC = formData.itemType === 'pc';

  return (
    <div className="max-w-5xl mx-auto space-y-8 pb-16">
      <div className="flex items-center justify-between">
        <Button variant="ghost" size="sm" onClick={() => navigate('/admin/apps')} className="flex items-center gap-2">
          <ArrowLeft size={18} />
          Back to App Management
        </Button>
        <h1 className="text-2xl font-black text-gray-900">
          Add New {isBundle ? 'Video Bundle' : isPC ? 'PC Soft' : 'Android App'}
        </h1>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-[2fr_1fr] gap-8">
        <div className="space-y-8">
          
          {/* Main Item Type Selector (3 Options) */}
          <GlassCard className="p-6 border-2 border-blue-100 bg-blue-50/20" hover={false}>
            <div className="flex items-center gap-2 text-blue-600 mb-3">
              <Layers size={20} />
              <h2 className="font-black uppercase tracking-widest text-xs">Choose Main Type</h2>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {/* App */}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, itemType: 'app', category: '' }))}
                className={cn(
                  "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all font-black text-[10px]",
                  formData.itemType === 'app'
                    ? "border-blue-600 bg-blue-600 text-white shadow-md shadow-blue-500/20" 
                    : "border-slate-200 bg-white text-slate-700 hover:border-blue-300"
                )}
              >
                <Smartphone size={18} />
                <span>Android App</span>
              </button>

              {/* PC */}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, itemType: 'pc', category: '' }))}
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

              {/* Bundle */}
              <button
                type="button"
                onClick={() => setFormData(prev => ({ ...prev, itemType: 'bundle', category: '' }))}
                className={cn(
                  "p-3 rounded-xl border-2 flex flex-col items-center gap-1 transition-all font-black text-[10px]",
                  formData.itemType === 'bundle'
                    ? "border-purple-600 bg-purple-600 text-white shadow-md shadow-purple-500/20" 
                    : "border-slate-200 bg-white text-slate-700 hover:border-purple-300"
                )}
              >
                <Film size={18} />
                <span>Video Bundle</span>
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
                placeholder={isBundle ? "e.g. 50+ Cinematic LUTs Pack" : isPC ? "e.g. Adobe Premiere Pro" : "e.g. CapCut Pro Mod"}
                value={formData.name}
                onChange={handleChange}
                required
              />
              <Input
                label="Item Number / Unique ID"
                name="appNumber"
                placeholder="e.g. 1005"
                value={formData.appNumber}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-6">
              <Input
                label={isBundle ? "Creator / Studio Name" : isPC ? "Publisher" : "Developer / Studio"}
                name="developer"
                placeholder={isBundle ? "e.g. CreatorStudio" : isPC ? "e.g. Adobe" : "e.g. Bytedance"}
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
                  className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 outline-none focus:border-blue-500 font-bold text-xs"
                >
                  {availableCategories.map((cat) => (
                    <option key={cat.id} value={cat.name}>
                      {cat.name}
                    </option>
                  ))}
                  {availableCategories.length === 0 && (
                    <>
                      {isBundle && (
                        <>
                          <option value="Cinematic LUTs">Cinematic LUTs</option>
                          <option value="CapCut Templates">CapCut Templates</option>
                          <option value="Premiere Presets">Premiere Presets</option>
                          <option value="4K Overlays">4K Overlays</option>
                        </>
                      )}
                      {isPC && (
                        <>
                          <option value="Editors">Editors</option>
                          <option value="Tools">Tools</option>
                          <option value="PC Games">PC Games</option>
                          <option value="Anti-Virus">Anti-Virus</option>
                        </>
                      )}
                      {!isBundle && !isPC && (
                        <>
                          <option value="Tools">Tools</option>
                          <option value="Photography">Photography</option>
                          <option value="Productivity">Productivity</option>
                          <option value="Entertainment">Entertainment</option>
                        </>
                      )}
                    </>
                  )}
                </select>
              </div>
            </div>

            <div className="grid sm:grid-cols-3 gap-6">
              <Input
                label={isBundle ? "Items / Version" : "Version"}
                name="version"
                placeholder={isBundle ? "50+ Presets / v1.0" : "1.0.0"}
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
                <h2 className="font-black uppercase tracking-widest text-sm">Preview Screenshots (4 Fixed Slots)</h2>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              {screenshots.map((url, idx) => (
                <div key={idx} className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-600">Screenshot / Preview {idx + 1}</label>
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
              <h2 className="font-black uppercase tracking-widest text-sm">Media & Direct Link</h2>
            </div>

            <Input
              label={isBundle ? "Main Cover / Thumbnail URL" : "Main Icon Image URL"}
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

            {/* 2s Banner Auto-Slide Toggle */}
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
              loading={loading}
            >
              <Save size={18} className="mr-2" />
              Save & Publish {isBundle ? 'Bundle' : isPC ? 'PC Software' : 'App'}
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
