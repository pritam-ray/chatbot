import { useState, useEffect } from 'react';
import { Database, Trash2, TrendingUp, HardDrive } from 'lucide-react';
import { getCacheStats, clearCache } from '../utils/cache';

export function CacheManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({ totalEntries: 0, totalHits: 0, cacheSize: 0 });

  const updateStats = () => {
    const currentStats = getCacheStats();
    setStats(currentStats);
  };

  useEffect(() => {
    if (isOpen) {
      updateStats();
    }
  }, [isOpen]);

  const handleClearCache = () => {
    if (window.confirm('Are you sure you want to clear all cached responses?')) {
      clearCache();
      updateStats();
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm group relative"
        aria-label="Cache Manager"
        title="Cache Manager"
      >
        <Database className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
        {stats.totalEntries > 0 && (
          <span className="absolute -top-1 -right-1 w-4 h-4 bg-green-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg">
            {stats.totalEntries > 9 ? '9+' : stats.totalEntries}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={() => setIsOpen(false)}>
          <div 
            className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl">
                  <Database className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                  Response Cache
                </h2>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <Database className="w-4 h-4" />
                    <span className="font-medium">Cached Responses</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                    {stats.totalEntries}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <TrendingUp className="w-4 h-4" />
                    <span className="font-medium">Total Cache Hits</span>
                  </div>
                  <span className="text-2xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                    {stats.totalHits}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-slate-700">
                    <HardDrive className="w-4 h-4" />
                    <span className="font-medium">Storage Used</span>
                  </div>
                  <span className="text-lg font-bold text-slate-700">
                    {formatBytes(stats.cacheSize)}
                  </span>
                </div>
              </div>

              <div className="bg-blue-50/50 border border-blue-200/50 rounded-xl p-4">
                <p className="text-sm text-slate-700 leading-relaxed">
                  <strong className="text-blue-700">💡 How it works:</strong> Repeated questions are served instantly from cache, 
                  saving API tokens and reducing response time. Cache expires after 7 days.
                </p>
              </div>

              {stats.totalEntries > 0 && (
                <button
                  onClick={handleClearCache}
                  className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
                >
                  <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
                  Clear All Cache
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
