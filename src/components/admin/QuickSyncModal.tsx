import React, { useState } from 'react';
import { useSettings } from '../../context/SettingsContext';
import { useApps } from '../../context/AppsContext';
import { syncCatalogSnapshot } from '../../lib/catalogSync';
import { GlassCard } from '../ui/GlassCard';
import { Button } from '../ui/Button';
import { Sparkles, RefreshCw, Layers, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface QuickSyncModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function QuickSyncModal({ isOpen, onClose }: QuickSyncModalProps) {
  const { settings, broadcastCodeUpdate } = useSettings();
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
      // 1. Rebuild single document snapshot for 1-read optimization
      await syncCatalogSnapshot();
      // 2. Broadcast code update
      const codeRes = await broadcastCodeUpdate(note.trim() || 'Comprehensive catalog and code sync released.');
      await refreshApps(false);
      setSuccessResult({
        catalogVersion: (settings.catalogVersion || 1) + 1,
        codeVersion: codeRes.codeVersion,
        type: 'all'
      });
    } catch (err) {
      console.error('Failed to broadcast sync:', err);
      alert('Failed to broadcast sync. Check Firestore permissions.');
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
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
            <Sparkles size={24} />
          </div>
          <div>
            <h2 className="text-xl font-black text-slate-900">Broadcast Instant Sync</h2>
            <p className="text-xs text-slate-500 font-bold">1-Read Snapshot & Realtime Update Engine</p>
          </div>
        </div>

        {/* Success Alert */}
        {successResult && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-900 flex items-start gap-3">
            <CheckCircle2 size={20} className="text-emerald-600 flex-shrink-0 mt-0.5" />
            <div className="text-xs font-bold space-y-1">
              <p className="font-black text-emerald-800">Broadcast Successfully Sent to All Users!</p>
              <div className="flex flex-wrap gap-2 text-[11px] text-emerald-700 pt-1">
                {successResult.catalogVersion && (
                  <span className="bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Catalog Version: v{successResult.catalogVersion} (1 Read Ready)
                  </span>
                )}
                {successResult.codeVersion && (
                  <span className="bg-emerald-100/80 px-2 py-0.5 rounded-md">
                    Code Release: v{successResult.codeVersion}
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Note Input */}
        <div className="space-y-2 mb-6">
          <label className="text-xs font-black uppercase tracking-wider text-slate-600">
            Update Changelog Note (Optional)
          </label>
          <input
            type="text"
            placeholder="e.g. Added 50 new PC software and Lightroom presets..."
            value={note}
            onChange={(e) => setNote(e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500 text-xs text-slate-800 placeholder:text-slate-400 font-medium"
          />
        </div>

        {/* Current Versions Info */}
        <div className="grid grid-cols-2 gap-3 mb-6 p-3.5 rounded-2xl bg-slate-50 border border-slate-100">
          <div className="text-center">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Catalog</span>
            <p className="text-sm font-black text-slate-800">
              v{settings.catalogVersion || 1}
            </p>
          </div>
          <div className="text-center border-l border-slate-200">
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Current Code Version</span>
            <p className="text-sm font-black text-slate-800">
              v{settings.codeReleaseVersion || 1}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-3">
          <Button
            onClick={handleSyncAll}
            disabled={isSyncing}
            className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-black text-xs py-3.5 rounded-xl shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
          >
            <Sparkles size={16} className={isSyncing ? 'animate-spin' : ''} />
            <span>{isSyncing ? 'Updating App...' : 'Publish & Update App Now (1-Click)'}</span>
          </Button>

          
        </div>
      </div>
    </div>
  );
}
