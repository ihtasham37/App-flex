import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useApps } from '../../context/AppsContext';
import { 
  Zap, RefreshCw, Sparkles, CheckCircle2, ShieldCheck, 
  Layers, Globe, AlertCircle, X, ArrowRight, Smartphone
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { Button } from '../ui/Button';
import { Input } from '../ui/Input';

interface QuickSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSyncModal({ isOpen, onClose }: QuickSyncModalProps) {
  const { settings, syncAllCatalogAndCode, broadcastCodeUpdate, updateSettings } = useSettings();
  const { refreshApps } = useApps();

  const [note, setNote] = useState('');
  const [isSyncing, setIsSyncing] = useState(false);
  const [successResult, setSuccessResult] = useState<{
    catalogVersion?: number;
    codeVersion?: number;
    type: 'all' | 'code' | 'catalog';
  } | null>(null);

  if (!isOpen) return null;

  const handleSyncAll = async () => {
    setIsSyncing(true);
    setSuccessResult(null);
    try {
      const res = await syncAllCatalogAndCode(note.trim() || 'New features and catalog updates broadcasted.');
      await refreshApps(true);
      setSuccessResult({ ...res, type: 'all' });
    } catch (err) {
      console.error('Failed to broadcast full sync:', err);
      alert('Failed to broadcast sync. Check Firestore permissions.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCodeOnly = async () => {
    setIsSyncing(true);
    setSuccessResult(null);
    try {
      const res = await broadcastCodeUpdate(note.trim() || 'Code & feature update released.');
      setSuccessResult({ codeVersion: res.codeVersion, type: 'code' });
    } catch (err) {
      console.error('Failed to broadcast code update:', err);
      alert('Failed to broadcast code update.');
    } finally {
      setIsSyncing(false);
    }
  };

  const handleSyncCatalogOnly = async () => {
    setIsSyncing(true);
    setSuccessResult(null);
    try {
      const nextCat = (settings.catalogVersion || 1) + 1;
      await updateSettings({
        catalogVersion: nextCat,
        lastCatalogUpdate: Date.now(),
      });
      await refreshApps(true);
      setSuccessResult({ catalogVersion: nextCat, type: 'catalog' });
    } catch (err) {
      console.error('Failed to sync catalog:', err);
      alert('Failed to sync catalog.');
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 w-8 h-8 flex items-center justify-center rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
        >
          <X size={20} />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3.5 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-amber-500 to-orange-600 flex items-center justify-center text-white shadow-lg shadow-orange-500/25 flex-shrink-0">
            <Zap size={24} className="fill-current" />
          </div>
          <div>
            <h3 className="text-xl font-black text-slate-900">
              Broadcast Live Sync
            </h3>
            <p className="text-xs text-slate-500 font-medium">
              Push new GitHub code & app changes to all user devices instantly.
            </p>
          </div>
        </div>

        {/* Success Alert */}
        {successResult && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200/80 text-emerald-900 animate-fadeIn">
            <div className="flex items-center gap-2 font-black text-sm text-emerald-800">
              <CheckCircle2 size={18} className="text-emerald-600" />
              <span>Update Broadcasted Successfully!</span>
            </div>
            <p className="text-xs text-emerald-700 mt-1 leading-relaxed">
              All active mobile and desktop users will now automatically reload and download the newest build.
            </p>
            <div className="mt-2.5 flex items-center gap-3 text-[11px] font-bold text-emerald-800">
              {successResult.codeVersion && (
                <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  Code Release: v{successResult.codeVersion}
                </span>
              )}
              {successResult.catalogVersion && (
                <span className="bg-white px-2.5 py-1 rounded-lg border border-emerald-200 shadow-2xs">
                  Catalog Version: v{successResult.catalogVersion}
                </span>
              )}
            </div>
          </div>
        )}

        {/* Current State Info */}
        <div className="grid grid-cols-2 gap-3 mb-5 p-3.5 bg-slate-50 rounded-2xl border border-slate-100 text-xs">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Active Code Build
            </span>
            <span className="font-black text-slate-800 text-sm">
              v{settings.codeReleaseVersion || 1}
            </span>
          </div>
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400 block">
              Catalog Version
            </span>
            <span className="font-black text-slate-800 text-sm">
              v{settings.catalogVersion || 1}
            </span>
          </div>
        </div>

        {/* Release Note Input */}
        <div className="space-y-1.5 mb-6">
          <label className="text-xs font-black text-slate-700 uppercase tracking-wider">
            Release Note / What's New? (Optional)
          </label>
          <Input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Added new features from GitHub, faster downloads, UI improvements..."
            className="rounded-xl text-xs py-2.5"
          />
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Primary 1-Click Sync */}
          <Button
            onClick={handleSyncAll}
            loading={isSyncing}
            className="w-full h-13 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-700 hover:via-indigo-700 hover:to-purple-700 text-white font-black text-sm shadow-xl shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <Sparkles size={18} />
            <span>⚡ Sync Everything (Code + Apps)</span>
          </Button>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <Button
              type="button"
              variant="outline"
              onClick={handleSyncCodeOnly}
              disabled={isSyncing}
              className="rounded-xl text-xs font-bold py-2.5 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5"
            >
              <Smartphone size={15} className="text-indigo-600" />
              <span>Sync Code Only</span>
            </Button>

            <Button
              type="button"
              variant="outline"
              onClick={handleSyncCatalogOnly}
              disabled={isSyncing}
              className="rounded-xl text-xs font-bold py-2.5 border-slate-200 hover:bg-slate-50 flex items-center justify-center gap-1.5"
            >
              <Layers size={15} className="text-orange-600" />
              <span>Sync Catalog Only</span>
            </Button>
          </div>
        </div>

        <p className="text-[11px] text-slate-400 text-center mt-5 font-medium">
          Whenever you push new code to GitHub, click <b>"Sync Everything"</b> to auto-update all user mobiles.
        </p>
      </div>
    </div>
  );
}
