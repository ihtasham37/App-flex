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
  const { settings, updateSettings, loading } = useSettings();
  const [formData, setFormData] = useState({ ...settings });
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

  if (loading) return <div>Loading...</div>;

  return (
    <div className="space-y-8 max-w-4xl pb-12">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 font-medium">Configure AppFlix branding and platform details.</p>
        </div>
      </div>

      <div className="space-y-8 mt-8">
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="w-10 h-10 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
              <Smartphone size={20} />
            </div>
            <div>
              <h2 className="text-lg font-black text-slate-900">App Branding & Details</h2>
              <p className="text-xs text-slate-500 font-bold">Customize app name and contact email</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">App Name</label>
              <input
                type="text"
                value={formData.appName || ''}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black uppercase tracking-wider text-slate-600">Contact Email</label>
              <input
                type="email"
                value={formData.contactEmail || ''}
                onChange={(e) => setFormData({ ...formData, contactEmail: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isSaving}
              variant="gradient"
              className="px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 shadow-lg shadow-blue-500/20"
            >
              <Save size={16} />
              <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
            </Button>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
