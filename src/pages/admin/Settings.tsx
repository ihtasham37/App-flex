import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useApps } from '../../context/AppsContext';
import { syncCatalogSnapshot } from '../../lib/catalogSync';
import { GlassCard } from '../../components/ui/GlassCard';
import { Button } from '../../components/ui/Button';
import { 
  Save, 
  RefreshCw, 
  CheckCircle2, 
  Smartphone, 
  Megaphone, 
  Layers, 
  Lock, 
  Upload, 
  Sparkles,
  AlertTriangle,
  Zap,
  Globe
} from 'lucide-react';

export default function AdminSettings() {
  const { settings, updateSettings, broadcastCodeUpdate, syncAllCatalogAndCode, loading } = useSettings();
  const { refreshApps } = useApps();
  const [formData, setFormData] = useState({ ...settings });
  const [broadcastNote, setBroadcastNote] = useState('');
  const [isBroadcasting, setIsBroadcasting] = useState(false);
  const [broadcastSuccess, setBroadcastSuccess] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(formData);
      alert('Settings updated successfully!');
    } catch (err) {
      console.error('Failed to save settings:', err);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleBroadcastCode = async () => {
    setIsBroadcasting(true);
    setBroadcastSuccess(null);
    try {
      const res = await broadcastCodeUpdate(broadcastNote.trim() || 'New feature update released.');
      setBroadcastSuccess(`Code Release v${res.codeVersion} broadcasted! Active users will auto-update.`);
      setTimeout(() => setBroadcastSuccess(null), 6000);
    } catch (err) {
      console.error('Broadcast failed:', err);
      alert('Failed to broadcast code update.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleFullSync = async () => {
    setIsBroadcasting(true);
    setBroadcastSuccess(null);
    try {
      // 1. Rebuild 1-read snapshot
      await syncCatalogSnapshot();
      // 2. Broadcast code
      const res = await syncAllCatalogAndCode(broadcastNote.trim() || 'Complete catalog and frontend code sync applied.');
      await refreshApps(false);
      setBroadcastSuccess(`1-Read Snapshot & Complete Sync Broadcasted (Code v${res.codeVersion} + Catalog v${res.catalogVersion})!`);
      setTimeout(() => setBroadcastSuccess(null), 6000);
    } catch (err) {
      console.error('Full sync failed:', err);
      alert('Failed to perform full sync.');
    } finally {
      setIsBroadcasting(false);
    }
  };

  const handleBannerToggle = () => {
    setFormData(prev => ({
      ...prev,
      updateBanner: { ...prev.updateBanner, enabled: !prev.updateBanner.enabled }
    }));
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 font-medium">Configure AppFlix branding, 1-read optimization, and system alerts.</p>
        </div>
        <Button 
          onClick={handleSave} 
          loading={isSaving}
          className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20 rounded-xl"
        >
          <Save size={18} className="mr-2" />
          Save Changes
        </Button>
      </div>

      <div className="grid gap-6">
        
        {/* Instant Live Broadcast Center (1-Read Architecture) */}
        <GlassCard className="p-6 sm:p-8 space-y-6 border-2 border-blue-500/30 bg-gradient-to-br from-blue-50/50 via-indigo-50/30 to-white relative overflow-hidden">
          <div className="flex items-center gap-3 border-b border-blue-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/20">
              <Sparkles size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">1-Read Snapshot & Live Broadcast Center</h2>
              <p className="text-xs text-slate-500 font-bold">Bundle 300+ apps into 1 single Firestore document read</p>
            </div>
          </div>

          {broadcastSuccess && (
            <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-center gap-3 animate-fadeIn">
              <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0" />
              <span className="text-xs font-black">{broadcastSuccess}</span>
            </div>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-black uppercase tracking-wider text-slate-700">
                Changelog Note (Shown to app users upon sync)
              </label>
              <input
                type="text"
                placeholder="e.g. Added 50 new PC software items, updated Lightroom presets..."
                value={broadcastNote}
                onChange={(e) => setBroadcastNote(e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 font-medium"
              />
            </div>

            <div className="grid sm:grid-cols-2 gap-3 pt-2">
              <Button
                onClick={handleFullSync}
                disabled={isBroadcasting}
                className="bg-blue-600 hover:bg-blue-700 text-white font-black text-xs py-3.5 rounded-xl shadow-lg shadow-blue-600/25 flex items-center justify-center gap-2"
              >
                <Sparkles size={16} className={isBroadcasting ? 'animate-spin' : ''} />
                <span>{isBroadcasting ? 'Broadcasting Snapshot...' : '1-Click Full System Broadcast (Catalog + Code)'}</span>
              </Button>

              <Button
                onClick={handleBroadcastCode}
                disabled={isBroadcasting}
                variant="outline"
                className="font-bold text-xs py-3.5 rounded-xl border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-2"
              >
                <RefreshCw size={16} className={isBroadcasting ? 'animate-spin' : ''} />
                <span>Broadcast Code Release Only</span>
              </Button>
            </div>
          </div>
        </GlassCard>

        {/* App Branding Section */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">App Branding & Details</h2>
              <p className="text-xs text-slate-500 font-bold">Customize app name, tagline, and contact email</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">App Name</label>
              <input
                type="text"
                value={formData.appName || ''}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800"
              />
            </div>
          </div>
        </GlassCard>

      </div>
    </div>
  );
}
