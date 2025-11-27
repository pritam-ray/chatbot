import { useState, useRef, useEffect } from 'react';
import { Play, X, Terminal, RefreshCw, Copy, Check } from 'lucide-react';
import { createPortal } from 'react-dom';

interface CodeSandboxProps {
  initialCode?: string;
  onClose: () => void;
}

export function CodeSandbox({ initialCode = '', onClose }: CodeSandboxProps) {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState<string[]>([]);
  const [isRunning, setIsRunning] = useState(false);
  const [copied, setCopied] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Create sandboxed HTML document
  const createSandboxHTML = (userCode: string) => {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <style>
    body { 
      font-family: system-ui, -apple-system, sans-serif; 
      padding: 20px; 
      background: #f9fafb;
    }
    pre { 
      background: white; 
      padding: 12px; 
      border-radius: 8px; 
      border: 1px solid #e5e7eb;
      white-space: pre-wrap;
      word-wrap: break-word;
    }
  </style>
</head>
<body>
  <div id="output"></div>
  <script>
    // Override console methods to capture output
    const outputDiv = document.getElementById('output');
    const originalConsole = {
      log: console.log,
      error: console.error,
      warn: console.warn,
      info: console.info
    };

    function addOutput(message, type = 'log') {
      const colors = {
        log: '#1f2937',
        error: '#dc2626',
        warn: '#f59e0b',
        info: '#3b82f6'
      };
      
      const pre = document.createElement('pre');
      pre.style.color = colors[type];
      pre.textContent = message;
      outputDiv.appendChild(pre);
      
      // Send message to parent
      window.parent.postMessage({ type: 'console', level: type, message }, '*');
    }

    console.log = (...args) => {
      const message = args.map(arg => {
        if (typeof arg === 'object') {
          try { return JSON.stringify(arg, null, 2); }
          catch { return String(arg); }
        }
        return String(arg);
      }).join(' ');
      addOutput(message, 'log');
      originalConsole.log(...args);
    };

    console.error = (...args) => {
      const message = args.map(String).join(' ');
      addOutput('Error: ' + message, 'error');
      originalConsole.error(...args);
    };

    console.warn = (...args) => {
      const message = args.map(String).join(' ');
      addOutput('Warning: ' + message, 'warn');
      originalConsole.warn(...args);
    };

    console.info = (...args) => {
      const message = args.map(String).join(' ');
      addOutput(message, 'info');
      originalConsole.info(...args);
    };

    // Catch runtime errors
    window.onerror = function(message, source, lineno, colno, error) {
      addOutput(\`Error at line \${lineno}: \${message}\`, 'error');
      return true;
    };

    // Execute user code
    try {
      ${userCode}
    } catch (error) {
      addOutput('Execution Error: ' + error.message, 'error');
    }
  </script>
</body>
</html>
    `;
  };

  // Handle messages from iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'console') {
        setOutput(prev => [...prev, `[${event.data.level}] ${event.data.message}`]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const runCode = () => {
    if (!iframeRef.current) return;

    setIsRunning(true);
    setOutput([]);

    // Add execution start message
    setOutput(['> Executing code...']);

    // Create new iframe content
    const sandboxHTML = createSandboxHTML(code);
    const blob = new Blob([sandboxHTML], { type: 'text/html' });
    const url = URL.createObjectURL(blob);

    // Load the sandbox
    iframeRef.current.src = url;

    // Cleanup
    setTimeout(() => {
      URL.revokeObjectURL(url);
      setIsRunning(false);
    }, 100);
  };

  const clearOutput = () => {
    setOutput([]);
    if (iframeRef.current) {
      iframeRef.current.src = 'about:blank';
    }
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return createPortal(
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[95vw] h-[90vh] flex flex-col border border-slate-200 dark:border-slate-700">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-3">
            <Terminal className="w-5 h-5 text-theme-primary" />
            <h2 className="text-lg font-semibold text-slate-800 dark:text-slate-200">
              JavaScript Sandbox
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            aria-label="Close sandbox"
          >
            <X className="w-5 h-5 text-slate-600 dark:text-slate-400" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 flex overflow-hidden">
          {/* Code Editor */}
          <div className="flex-1 flex flex-col border-r border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Code Editor
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={copyCode}
                  className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                  aria-label="Copy code"
                >
                  {copied ? (
                    <>
                      <Check className="w-4 h-4" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="w-4 h-4" />
                      Copy
                    </>
                  )}
                </button>
                <button
                  onClick={runCode}
                  disabled={isRunning}
                  className="px-3 py-1.5 text-sm bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
                  aria-label="Run code"
                >
                  <Play className="w-4 h-4" />
                  Run Code
                </button>
              </div>
            </div>
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="flex-1 p-4 font-mono text-base bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 resize-none focus:outline-none leading-relaxed"
              placeholder="// Write your JavaScript code here&#10;console.log('Hello, World!');"
              spellCheck={false}
            />
          </div>

          {/* Output Panel */}
          <div className="flex-1 flex flex-col">
            <div className="flex items-center justify-between px-4 py-2 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-700">
              <span className="text-sm font-medium text-slate-600 dark:text-slate-400">
                Console Output
              </span>
              <button
                onClick={clearOutput}
                className="px-3 py-1.5 text-sm bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors flex items-center gap-2"
                aria-label="Clear output"
              >
                <RefreshCw className="w-4 h-4" />
                Clear
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 bg-slate-50 dark:bg-slate-900/50">
              {output.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 dark:text-slate-600 text-sm">
                  Output will appear here...
                </div>
              ) : (
                <div className="font-mono text-base space-y-2">
                  {output.map((line, index) => {
                    const isError = line.includes('[error]');
                    const isWarn = line.includes('[warn]');
                    const isInfo = line.includes('[info]');
                    
                    return (
                      <div
                        key={index}
                        className={`p-3 rounded-lg ${
                          isError
                            ? 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                            : isWarn
                            ? 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-400'
                            : isInfo
                            ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                            : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300'
                        }`}
                      >
                        {line}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Hidden iframe for sandboxed execution */}
        <iframe
          ref={iframeRef}
          sandbox="allow-scripts"
          style={{ display: 'none' }}
          title="Code execution sandbox"
        />

        {/* Footer */}
        <div className="px-4 py-3 bg-slate-50 dark:bg-slate-800/50 border-t border-slate-200 dark:border-slate-700">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            <strong>Note:</strong> Code runs in a sandboxed environment with no access to external resources, network, or localStorage.
          </p>
        </div>
      </div>
    </div>,
    document.body
  );
}
