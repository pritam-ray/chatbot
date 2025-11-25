import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { extractTextFromFile } from '../utils/pdfExtractor';

interface ChatInputProps {
  onSend: (message: string, displayMessage?: string, fileName?: string) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isExtractingFile, setIsExtractingFile] = useState(false);
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

    try {
      console.log('Starting to extract text from:', file.name, 'Type:', file.type);
      const content = await extractTextFromFile(file);
      console.log('Extracted content length:', content.length);
      setFileContent(content);
      if (!content || content.trim().length === 0) {
        alert('Could not extract text from the file. The file might be empty or in an unsupported format.');
        setAttachedFile(null);
        setFileContent('');
      }
    } catch (error) {
      console.error('Error extracting file content:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Error reading file: ${errorMessage}\nPlease try another file.`);
      setAttachedFile(null);
      setFileContent('');
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
            <div className="p-2 bg-white/60 rounded-lg">
              <Paperclip className="w-4 h-4 text-slate-600" />
            </div>
            <span className="text-sm font-semibold text-slate-700">
              {isExtractingFile ? 'Processing...' : attachedFile.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-2 hover:bg-white/80 rounded-xl transition-all hover:shadow-md"
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
          accept=".pdf,.txt,.md,.doc,.docx"
          className="hidden"
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
