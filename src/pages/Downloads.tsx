import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { GlassCard } from '../components/ui/GlassCard';
import { Button } from '../components/ui/Button';
import { Download, Calendar, ExternalLink, Package } from 'lucide-react';
import { Link } from 'react-router-dom';
import { getLocalDownloads, LocalDownloadRecord } from '../lib/downloadHistory';

export default function Downloads() {
  const { user } = useAuth();
  const [downloads, setDownloads] = useState<LocalDownloadRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function fetchDownloads() {
      try {
        const records = getLocalDownloads(user?.uid);
        setDownloads(records);
      } catch (error) {
        console.error("Error fetching downloads:", error);
      } finally {
        setLoading(false);
      }
    }
    fetchDownloads();
  }, [user]);

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="space-y-1">
        <h1 className="text-3xl font-black text-gray-900">Download History</h1>
        <p className="text-gray-500 font-medium">Your recent application activity and downloads.</p>
      </div>

      {loading ? (
        <div className="space-y-4">
          {[1,2,3].map(i => (
            <div key={i} className="h-24 bg-gray-200 rounded-3xl animate-pulse" />
          ))}
        </div>
      ) : downloads.length > 0 ? (
        <div className="grid gap-4">
          {downloads.map((dl) => (
            <GlassCard key={dl.id} className="p-6 flex items-center gap-6" hover={false}>
              <div className="w-14 h-14 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-600 flex-shrink-0">
                <Package size={28} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black text-gray-900 truncate">{dl.appName}</h3>
                <div className="flex items-center gap-4 mt-1">
                  <div className="flex items-center gap-1.5 text-xs text-gray-400 font-bold">
                    <Calendar size={14} />
                    {typeof dl.downloadedAt === 'number'
                      ? new Date(dl.downloadedAt).toLocaleDateString()
                      : dl.downloadedAt && typeof (dl.downloadedAt as any).toDate === 'function'
                        ? (dl.downloadedAt as any).toDate().toLocaleDateString()
                        : new Date().toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-blue-600 font-black uppercase tracking-tighter">
                    <Download size={14} />
                    Redirection Successful
                  </div>
                </div>
              </div>
              <Link to={`/apps/${dl.appId}`}>
                <Button variant="outline" size="sm" className="rounded-xl border-gray-200">
                  <ExternalLink size={16} className="mr-2" />
                  View App
                </Button>
              </Link>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center space-y-6">
           <div className="w-24 h-24 bg-blue-50 rounded-full flex items-center justify-center mx-auto text-blue-300">
             <Download size={48} />
           </div>
           <div className="space-y-2">
             <h3 className="text-xl font-bold text-gray-900">No Downloads Yet</h3>
             <p className="text-gray-500 max-w-xs mx-auto">Start exploring our marketplace and download amazing apps to see them here.</p>
           </div>
           <Link to="/explore">
             <Button variant="gradient">Explore Apps</Button>
           </Link>
        </div>
      )}
    </div>
  );
}
