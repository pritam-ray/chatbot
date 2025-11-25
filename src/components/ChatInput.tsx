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
    <form onSubmit={handleSubmit} className="border-t-2 border-slate-200 bg-white p-6 shadow-2xl">
      {attachedFile && (
        <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between bg-gradient-to-r from-slate-50 to-blue-50 p-4 rounded-xl border-2 border-slate-200 shadow-md">
          <div className="flex items-center gap-3">
            <Paperclip className="w-5 h-5 text-slate-600" />
            <span className="text-sm font-semibold text-slate-700">
              {isExtractingFile ? 'Processing...' : attachedFile.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1.5 hover:bg-slate-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-slate-600" />
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isExtractingFile}
          className="p-3 text-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:text-gray-400 disabled:cursor-not-allowed border-2 border-slate-200 hover:border-slate-400 hover:shadow-md"
          title="Attach file"
        >
          <Paperclip className="w-5 h-5" />
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
          className="flex-1 px-5 py-3 border-2 border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-400 focus:border-slate-400 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all shadow-sm placeholder-slate-400"
        />

        <button
          type="submit"
          disabled={disabled || (!input.trim() && !fileContent) || isExtractingFile}
          className="px-7 py-3 bg-gradient-to-r from-slate-600 via-slate-600 to-blue-600 text-white rounded-xl hover:from-slate-700 hover:via-slate-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
        >
          <Send className="w-5 h-5" />
          Send
        </button>
      </div>
    </form>
  );
}
