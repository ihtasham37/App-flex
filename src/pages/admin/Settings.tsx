import React, { useState } from 'react';
import { GlassCard } from '../../components/ui/GlassCard';
import { Shield, Settings as SettingsIcon, Bell, Database, Lock, Save, Globe, Megaphone, Image as ImageIcon, Link as LinkIcon, X } from 'lucide-react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { useSettings } from '../../context/SettingsContext';

export default function AdminSettings() {
  const { settings, updateSettings, loading } = useSettings();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState(settings);

  // Sync local state if settings change (e.g., initial load)
  React.useEffect(() => {
    setFormData(settings);
  }, [settings]);

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateSettings(formData);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error saving settings:', error);
      alert('Failed to save settings.');
    } finally {
      setIsSaving(false);
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
    <div className="space-y-8 max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h1 className="text-2xl font-black text-gray-900">Platform Settings</h1>
          <p className="text-sm text-gray-500 font-medium">Configure AppFlix branding and system alerts.</p>
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
        {/* App Branding Section */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Globe className="text-blue-600" size={20} />
            <h2 className="text-lg font-black text-slate-800">App Branding</h2>
          </div>
          
          <div className="grid gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">App Name</label>
              <Input 
                value={formData.appName}
                onChange={(e) => setFormData({ ...formData, appName: e.target.value })}
                placeholder="e.g. AppFlix"
                className="rounded-xl"
              />
              <p className="text-[10px] text-slate-400 font-medium">This name will appear in the header and titles across the app.</p>
            </div>
          </div>
        </GlassCard>

        {/* Data & Cache Management Section */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Database className="text-orange-600" size={20} />
            <h2 className="text-lg font-black text-slate-800">Data & Cache Management</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Catalog Version</label>
              <div className="flex gap-2">
                <Input 
                  type="number"
                  value={formData.catalogVersion || 1}
                  onChange={(e) => setFormData({ ...formData, catalogVersion: parseInt(e.target.value) || 1 })}
                  className="rounded-xl flex-1"
                />
                <Button 
                  type="button"
                  onClick={() => setFormData({ ...formData, catalogVersion: (formData.catalogVersion || 0) + 1 })}
                  variant="outline"
                  className="rounded-xl px-4 border-orange-200 text-orange-600 hover:bg-orange-50"
                  title="Increment Version"
                >
                  +1
                </Button>
              </div>
              <p className="text-[10px] text-slate-400 font-medium">
                Change this number to force all users to fetch new data from the server. Use this after adding or editing apps.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Support & Social Links Section */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <Shield className="text-emerald-600" size={20} />
            <h2 className="text-lg font-black text-slate-800">Support & Social Links</h2>
          </div>
          
          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Support Email</label>
              <div className="relative">
                <Globe className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  value={formData.supportEmail || ''}
                  onChange={(e) => setFormData({ ...formData, supportEmail: e.target.value })}
                  placeholder="support@example.com"
                  className="rounded-xl pl-10"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Used for "Help with Email" in user account.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">WhatsApp Support Number</label>
              <div className="relative">
                <Megaphone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  value={formData.supportWhatsapp || ''}
                  onChange={(e) => setFormData({ ...formData, supportWhatsapp: e.target.value })}
                  placeholder="+923000000000"
                  className="rounded-xl pl-10"
                />
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Include country code (e.g. +92...).</p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-6">
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">WhatsApp Channel Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  value={formData.whatsappChannel || ''}
                  onChange={(e) => setFormData({ ...formData, whatsappChannel: e.target.value })}
                  placeholder="https://whatsapp.com/channel/..."
                  className="rounded-xl pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Telegram Group/Channel Link</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  value={formData.telegramLink || ''}
                  onChange={(e) => setFormData({ ...formData, telegramLink: e.target.value })}
                  placeholder="https://t.me/..."
                  className="rounded-xl pl-10"
                />
              </div>
            </div>
          </div>
        </GlassCard>

        {/* Update Banner Section */}
        <GlassCard className="p-6 sm:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4">
            <div className="flex items-center gap-3">
              <Megaphone className="text-purple-600" size={20} />
              <h2 className="text-lg font-black text-slate-800">Update Popup Banner</h2>
            </div>
            <button 
              onClick={handleBannerToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none ${formData.updateBanner.enabled ? 'bg-purple-600' : 'bg-slate-200'}`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.updateBanner.enabled ? 'translate-x-6' : 'translate-x-1'}`} />
            </button>
          </div>

          <div className={`space-y-5 transition-opacity ${formData.updateBanner.enabled ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Banner Heading</label>
              <Input 
                value={formData.updateBanner.heading}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  updateBanner: { ...formData.updateBanner, heading: e.target.value } 
                })}
                placeholder="e.g. New Version Available! Update Now."
                className="rounded-xl"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Banner Description</label>
              <textarea 
                value={formData.updateBanner.description}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  updateBanner: { ...formData.updateBanner, description: e.target.value } 
                })}
                placeholder="Briefly explain what's new in this update..."
                className="w-full min-h-[80px] px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-sm font-medium transition-all"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Banner Image URL</label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input 
                    value={formData.updateBanner.image}
                    onChange={(e) => setFormData({ 
                      ...formData, 
                      updateBanner: { ...formData.updateBanner, image: e.target.value } 
                    })}
                    placeholder="https://example.com/banner.png"
                    className="rounded-xl"
                  />
                </div>
                {formData.updateBanner.image && (
                  <div className="w-12 h-10 rounded-lg overflow-hidden border border-slate-200 bg-slate-50">
                    <img src={formData.updateBanner.image} alt="Preview" className="w-full h-full object-cover" />
                  </div>
                )}
              </div>
              <p className="text-[10px] text-slate-400 font-medium">Shown as a featured image in the update popup.</p>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Action Link (e.g. Play Store URL)</label>
              <div className="relative">
                <LinkIcon className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <Input 
                  value={formData.updateBanner.link}
                  onChange={(e) => setFormData({ 
                    ...formData, 
                    updateBanner: { ...formData.updateBanner, link: e.target.value } 
                  })}
                  placeholder="https://play.google.com/store/apps/details?id=..."
                  className="rounded-xl pl-10"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-black text-slate-500 uppercase tracking-wider">Banner Button Text</label>
              <Input 
                value={formData.updateBanner.buttonText || ''}
                onChange={(e) => setFormData({ 
                  ...formData, 
                  updateBanner: { ...formData.updateBanner, buttonText: e.target.value } 
                })}
                placeholder="e.g. Update Now, Install App, Get Started"
                className="rounded-xl"
              />
              <p className="text-[10px] text-slate-400 font-medium">Text that appears on the main action button.</p>
            </div>

            <div className="p-3 bg-blue-50 border border-blue-100 rounded-2xl">
              <p className="text-[11px] text-blue-700 font-bold leading-relaxed">
                <Bell size={12} className="inline mr-1 mb-0.5" /> 
                Note: This banner is linked to the "Catalog Version" above. Whenever you increment the Catalog Version (+1), this banner will automatically show again to all users who have already seen it.
              </p>
            </div>
          </div>
        </GlassCard>

        {/* Maintenance / Dangerous Section */}
        <div className="bg-red-50/50 border border-red-100 rounded-2xl p-6 flex flex-col sm:flex-row items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-red-100 flex items-center justify-center text-red-600 shrink-0">
            <Lock size={24} />
          </div>
          <div className="flex-1 text-center sm:text-left">
            <h3 className="font-black text-red-900">Maintenance Mode</h3>
            <p className="text-xs text-red-700 font-medium">Restrict public access to the platform. Only admins can view content.</p>
          </div>
          <Button variant="outline" className="border-red-200 text-red-600 hover:bg-red-50 rounded-xl whitespace-nowrap">Enable Mode</Button>
        </div>
      </div>
    </div>
  );
}
