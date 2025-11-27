import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { extractTextFromFile } from '../utils/pdfExtractor';
import { parseTableFile, formatTableSummary } from '../utils/tableParser';

interface ChatInputProps {
  onSend: (message: string, displayMessage?: string, fileName?: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isTableFile, setIsTableFile] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File size must be less than 10MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setAttachedFile(file);
    setIsExtractingFile(true);

    const extension = file.name.split('.').pop()?.toLowerCase();
    const isTable = extension === 'csv' || extension === 'xlsx' || extension === 'xls';
    setIsTableFile(isTable);

    try {
      console.log('Starting to process file:', file.name, 'Type:', file.type);
      
      let content: string;
      
      if (isTable) {
        // Parse CSV/Excel files as tables
        const tableData = await parseTableFile(file);
        content = formatTableSummary(tableData);
        console.log('Parsed table:', tableData.rowCount, 'rows ×', tableData.columnCount, 'columns');
      } else {
        // Extract text from documents
        content = await extractTextFromFile(file);
        console.log('Extracted content length:', content.length);
      }
      
      setFileContent(content);
      
      if (!content || content.trim().length === 0) {
        alert('Could not extract data from the file. The file might be empty or in an unsupported format.');
        setAttachedFile(null);
        setFileContent('');
        setIsTableFile(false);
      }
    } catch (error) {
      console.error('Error processing file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error reading file: ${errorMessage}\nPlease try another file.`);
      setAttachedFile(null);
      setFileContent('');
      setIsTableFile(false);
    } finally {
      setIsExtractingFile(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFileContent('');
    setIsTableFile(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || fileContent) && !disabled && !isExtractingFile) {
      const userInput = input.trim();
      let fullContent = userInput;
      let displayContent = userInput;
      
      if (fileContent) {
        // Full content for AI includes the file text
        fullContent += `\n\n[Attached File: ${attachedFile?.name}]\n\n${fileContent}`;
        // Display content only shows the file name, not the extracted text
        displayContent = userInput ? `${userInput}\n\n📎 Attached: ${attachedFile?.name}` : `📎 Attached: ${attachedFile?.name}`;
      }
      
      onSend(fullContent, displayContent, attachedFile?.name);
      setInput('');
      handleRemoveFile();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t border-slate-200/50 bg-white/80 backdrop-blur-xl p-6 shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-t from-slate-50/50 to-transparent pointer-events-none"></div>
      {attachedFile && (
        <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between bg-gradient-to-r from-slate-100/80 via-blue-50/50 to-indigo-50/30 p-4 rounded-2xl border border-slate-200/50 shadow-lg backdrop-blur-sm relative z-10">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isTableFile ? 'bg-green-100' : 'bg-white/60'}`}>
              {isTableFile ? (
                <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              ) : (
                <Paperclip className="w-4 h-4 text-slate-600" />
              )}
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold text-slate-700">
                {isExtractingFile ? 'Processing...' : attachedFile.name}
              </span>
              {isTableFile && !isExtractingFile && (
                <span className="text-xs text-green-600">📊 Table data will be formatted</span>
              )}
            </div>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-2 hover:bg-white/80 rounded-xl transition-all hover:shadow-md"
            aria-label="Remove file"
            title="Remove file"
          >
            <X className="w-4 h-4 text-slate-600" />
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex gap-3 relative z-10">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isExtractingFile}
          className="p-3.5 text-slate-600 hover:bg-white/80 rounded-2xl transition-all disabled:text-gray-400 disabled:cursor-not-allowed border border-slate-200/50 hover:border-slate-300 hover:shadow-lg backdrop-blur-sm bg-white/60 group"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5 transition-transform group-hover:rotate-12" />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          onChange={handleFileSelect}
          accept=".pdf,.txt,.md,.doc,.docx,.csv,.xlsx,.xls"
          className="hidden"
          aria-label="Upload file"
        />

        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Type your message..."
          disabled={disabled || isExtractingFile}
          className="flex-1 px-5 py-3.5 border border-slate-200/50 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-400/50 focus:border-blue-400/50 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all shadow-sm placeholder-slate-400 bg-white/60 backdrop-blur-sm hover:bg-white/80 focus:bg-white"
        />

        <button
          type="submit"
          disabled={disabled || (!input.trim() && !fileContent) || isExtractingFile}
          className="px-8 py-3.5 bg-gradient-to-r from-slate-700 via-blue-600 to-indigo-600 text-white rounded-2xl hover:from-slate-800 hover:via-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-blue-500/50 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2.5 font-semibold shadow-xl hover:shadow-2xl hover:scale-[1.02] active:scale-[0.98] relative overflow-hidden group"
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-200%] group-hover:translate-x-[200%] transition-transform duration-700"></div>
          <Send className="w-5 h-5 relative z-10" />
          <span className="relative z-10">Send</span>
        </button>
      </div>
    </form>
  );
}
