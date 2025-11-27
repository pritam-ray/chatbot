import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Database, Trash2, TrendingUp, HardDrive, X, Power } from 'lucide-react';
import { getCacheStats, clearCache, isCacheEnabled, setCacheEnabled } from '../utils/cache';

export function CacheManager() {
  const [isOpen, setIsOpen] = useState(false);
  const [stats, setStats] = useState({ totalEntries: 0, totalHits: 0, cacheSize: 0 });
  const [cacheEnabled, setCacheEnabledState] = useState(isCacheEnabled());

  const updateStats = () => {
    const currentStats = getCacheStats();
    setStats(currentStats);
    setCacheEnabledState(isCacheEnabled());
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

  const handleToggleCache = () => {
    const newState = !cacheEnabled;
    setCacheEnabled(newState);
    setCacheEnabledState(newState);
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  };

  const modalContent = isOpen && (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]" onClick={() => setIsOpen(false)}>
      <div 
        className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 relative z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-theme-primary to-theme-secondary rounded-xl">
              <Database className="w-6 h-6 text-white" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 dark:text-white">
              Response Cache
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 transition-colors p-1 hover:bg-slate-100 rounded-lg"
            aria-label="Close cache manager"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700">
                <Database className="w-4 h-4" />
                <span className="font-medium">Cached Responses</span>
              </div>
              <span className="text-2xl font-bold text-theme-primary dark:text-theme-primary">
                {stats.totalEntries}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <TrendingUp className="w-4 h-4" />
                <span className="font-medium">Total Cache Hits</span>
              </div>
              <span className="text-2xl font-bold text-theme-accent dark:text-theme-accent">
                {stats.totalHits}
              </span>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
                <HardDrive className="w-4 h-4" />
                <span className="font-medium">Storage Used</span>
              </div>
              <span className="text-lg font-bold text-slate-700 dark:text-slate-200">
                {formatBytes(stats.cacheSize)}
              </span>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Power className={`w-5 h-5 ${cacheEnabled ? 'text-theme-primary' : 'text-slate-400 dark:text-slate-500'}`} />
                  <div>
                    <div className="font-semibold text-slate-800 dark:text-slate-200">Cache Status</div>
                    <div className="text-xs text-slate-500 dark:text-slate-400">Enable caching for faster responses</div>
                  </div>
                </div>
                <button
                  onClick={handleToggleCache}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-theme-primary focus:ring-offset-2 ${
                    cacheEnabled ? 'bg-theme-primary' : 'bg-slate-300'
                  }`}
                  aria-label={cacheEnabled ? 'Disable cache' : 'Enable cache'}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow-lg transition-transform ${
                      cacheEnabled ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            <div className="bg-theme-primary/10 border border-theme-primary/30 rounded-xl p-4">
              <p className="text-sm text-slate-700 dark:text-slate-300 leading-relaxed">
                <strong className="text-theme-primary">💡 How it works:</strong> Repeated questions are served instantly from cache, 
                saving API tokens and reducing response time. Cache expires after 7 days.
              </p>
            </div>
          </div>

          {stats.totalEntries > 0 && (
            <button
              onClick={handleClearCache}
              className="w-full bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-medium py-3 px-4 rounded-xl transition-all shadow-lg hover:shadow-xl flex items-center justify-center gap-2 group"
              aria-label="Clear all cached responses"
            >
              <Trash2 className="w-4 h-4 group-hover:scale-110 transition-transform" />
              Clear All Cache
            </button>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 border border-black/10 bg-white text-[#202123] rounded-lg hover:bg-[#ececf1] transition-colors relative"
        aria-label="Cache Manager"
        title={`Cache Manager (${cacheEnabled ? 'Enabled' : 'Disabled'})`}
      >
        <Database className="w-5 h-5" />
        {stats.totalEntries > 0 && (
          <span className={`absolute -top-1 -right-1 w-4 h-4 ${cacheEnabled ? 'bg-[#10a37f]' : 'bg-slate-400'} text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-lg`}>
            {stats.totalEntries > 9 ? '9+' : stats.totalEntries}
          </span>
        )}
        {!cacheEnabled && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full border border-white shadow-sm"></span>
        )}
      </button>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
