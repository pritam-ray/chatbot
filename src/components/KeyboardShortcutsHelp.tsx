import { useState } from 'react';
import { createPortal } from 'react-dom';
import { Keyboard, X } from 'lucide-react';

export function KeyboardShortcutsHelp() {
  const [isOpen, setIsOpen] = useState(false);

  const shortcuts = [
    { keys: 'Ctrl + Shift + T', description: 'Toggle theme (light/dark/auto)' },
    { keys: 'Ctrl + /', description: 'Focus message input' },
    { keys: 'Ctrl + Shift + C', description: 'Clear all messages' },
    { keys: 'Ctrl + ?', description: 'Show keyboard shortcuts' },
    { keys: 'Escape', description: 'Close modals/dialogs' },
    { keys: 'Enter', description: 'Send message (in input field)' },
  ];

  const modalContent = isOpen && (
    <div
      className="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-[9999]"
      onClick={() => setIsOpen(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="shortcuts-title"
    >
      <div
        className="bg-white dark:bg-slate-800 rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-6 relative z-[10000]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-blue-500 to-indigo-600 dark:from-blue-600 dark:to-indigo-700 rounded-xl">
              <Keyboard className="w-6 h-6 text-white" />
            </div>
            <h2
              id="shortcuts-title"
              className="text-2xl font-bold text-slate-800 dark:text-white"
            >
              Keyboard Shortcuts
            </h2>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors p-1 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg"
            aria-label="Close shortcuts help"
          >
            <X className="w-6 h-6" />
          </button>
        </div>

        <div className="space-y-3">
          {shortcuts.map((shortcut, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <span className="text-slate-700 dark:text-slate-300">
                {shortcut.description}
              </span>
              <kbd className="px-3 py-1.5 bg-white dark:bg-slate-800 border-2 border-slate-300 dark:border-slate-600 rounded-lg font-mono text-sm text-slate-800 dark:text-slate-200 shadow-sm">
                {shortcut.keys}
              </kbd>
            </div>
          ))}
        </div>

        <div className="pt-4 border-t border-slate-200 dark:border-slate-700">
          <p className="text-sm text-slate-600 dark:text-slate-400 text-center">
            Press <kbd className="px-2 py-1 bg-slate-100 dark:bg-slate-700 border border-slate-300 dark:border-slate-600 rounded font-mono text-xs">Ctrl + ?</kbd> anytime to show this help
          </p>
        </div>
      </div>
    </div>
  );

  return (
    <>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2.5 hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm group relative"
        aria-label="Keyboard shortcuts help"
        title="Keyboard shortcuts (Ctrl + ?)"
      >
        <Keyboard className="w-5 h-5 text-white/90 group-hover:text-white transition-colors" />
      </button>

      {modalContent && createPortal(modalContent, document.body)}
    </>
  );
}
