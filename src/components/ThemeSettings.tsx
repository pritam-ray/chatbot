import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Sun, Moon, Monitor, Check, X, Keyboard } from 'lucide-react';
import { useTheme, ThemeMode, ThemePreset } from '../contexts/ThemeContext';

interface ThemePresetInfo {
  id: ThemePreset;
  name: string;
  description: string;
  colors: {
    primary: string;
    secondary: string;
    accent: string;
  };
}

const THEME_PRESETS: ThemePresetInfo[] = [
  {
    id: 'default',
    name: 'Default',
    description: 'Classic blue and indigo',
    colors: { primary: '#3b82f6', secondary: '#6366f1', accent: '#8b5cf6' },
  },
  {
    id: 'ocean',
    name: 'Ocean',
    description: 'Calm blue and teal',
    colors: { primary: '#0891b2', secondary: '#06b6d4', accent: '#14b8a6' },
  },
  {
    id: 'sunset',
    name: 'Sunset',
    description: 'Warm orange and pink',
    colors: { primary: '#f97316', secondary: '#ec4899', accent: '#f43f5e' },
  },
  {
    id: 'forest',
    name: 'Forest',
    description: 'Natural green and emerald',
    colors: { primary: '#22c55e', secondary: '#10b981', accent: '#059669' },
  },
  {
    id: 'midnight',
    name: 'Midnight',
    description: 'Deep purple and violet',
    colors: { primary: '#7c3aed', secondary: '#8b5cf6', accent: '#a78bfa' },
  },
];

const MODE_ICONS = {
  light: Sun,
  dark: Moon,
  auto: Monitor,
};

export function ThemeSettings() {
  const [isOpen, setIsOpen] = useState(false);
  const { mode, preset, isDark, setMode, setPreset } = useTheme();

  const handleModeChange = (newMode: ThemeMode) => {
    setMode(newMode);
  };

  const handlePresetChange = (newPreset: ThemePreset) => {
    setPreset(newPreset);
  };

  const modalContent = isOpen && (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="theme-settings-title"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-2xl w-full p-6 space-y-6 relative z-[10000] max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl">
              <Palette className="w-6 h-6 text-white" />
            </div>
            <h2
              id="theme-settings-title"
              className="text-2xl font-bold text-slate-800 dark:text-white"
            >
              Theme Settings
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            aria-label="Close theme settings"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        {/* Theme Mode */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Monitor className="w-5 h-5" />
            Display Mode
          </h3>
          <div className="grid grid-cols-3 gap-3">
            {(['light', 'dark', 'auto'] as ThemeMode[]).map((themeMode) => {
              const Icon = MODE_ICONS[themeMode];
              const isActive = mode === themeMode;
              return (
                <button
                  key={themeMode}
                  onClick={() => handleModeChange(themeMode)}
                  className={`p-4 rounded-xl border-2 transition-all ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                  aria-pressed={isActive ? 'true' : 'false'}
                  aria-label={`${themeMode} mode`}
                >
                  <div className="flex flex-col items-center gap-2">
                    <Icon
                      className={`w-6 h-6 ${
                        isActive ? 'text-blue-600 dark:text-blue-400' : 'text-slate-600 dark:text-slate-400'
                      }`}
                    />
                    <span
                      className={`text-sm font-medium capitalize ${
                        isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {themeMode}
                    </span>
                    {isActive && (
                      <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-400">
            Auto mode matches your system preferences
          </p>
        </div>

        {/* Color Presets */}
        <div className="space-y-3">
          <h3 className="text-lg font-semibold text-slate-800 dark:text-white flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Color Preset
          </h3>
          <div className="grid grid-cols-1 gap-3">
            {THEME_PRESETS.map((themePreset) => {
              const isActive = preset === themePreset.id;
              return (
                <button
                  key={themePreset.id}
                  onClick={() => handlePresetChange(themePreset.id)}
                  className={`p-4 rounded-xl border-2 transition-all text-left ${
                    isActive
                      ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'border-slate-200 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600 bg-white dark:bg-slate-900'
                  }`}
                  aria-pressed={isActive ? 'true' : 'false'}
                  aria-label={`${themePreset.name} preset`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span
                          className={`font-semibold ${
                            isActive ? 'text-blue-700 dark:text-blue-300' : 'text-slate-800 dark:text-white'
                          }`}
                        >
                          {themePreset.name}
                        </span>
                        {isActive && (
                          <Check className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        )}
                      </div>
                      <p className="text-sm text-slate-600 dark:text-slate-400">
                        {themePreset.description}
                      </p>
                    </div>
                    <div className="flex gap-2 ml-4">
                      {Object.values(themePreset.colors).map((color, idx) => (
                        <div
                          key={idx}
                          className="w-8 h-8 rounded-lg shadow-sm border border-slate-200 dark:border-slate-700"
                          style={{ backgroundColor: color }}
                          aria-hidden="true"
                        />
                      ))}
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Keyboard Shortcuts Info */}
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl p-4">
          <h4 className="text-sm font-semibold text-slate-800 dark:text-white mb-3 flex items-center gap-2">
            <Keyboard className="w-4 h-4" />
            Keyboard Shortcuts
          </h4>
          <div className="space-y-2 text-sm text-slate-600 dark:text-slate-400">
            <div className="flex justify-between">
              <span>Toggle Theme</span>
              <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-mono text-xs">
                Ctrl + Shift + T
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Focus Input</span>
              <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-mono text-xs">
                Ctrl + /
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Clear Chat</span>
              <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-mono text-xs">
                Ctrl + Shift + C
              </kbd>
            </div>
            <div className="flex justify-between">
              <span>Show Shortcuts</span>
              <kbd className="px-2 py-1 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-600 rounded font-mono text-xs">
                Ctrl + ?
              </kbd>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm group relative"
        aria-label="Theme settings"
        title="Theme settings"
      >
        <Palette className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
        {isDark && (
          <span className="absolute -bottom-0.5 -right-0.5 w-2 h-2 bg-blue-500 rounded-full border border-white shadow-sm" aria-hidden="true"></span>
        )}
      </button>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
