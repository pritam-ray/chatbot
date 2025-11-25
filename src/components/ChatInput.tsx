import { useState, useRef } from 'react';
import { Send, Paperclip, X } from 'lucide-react';
import { extractTextFromFile } from '../utils/pdfExtractor';

interface ChatInputProps {
  onSend: (message: string, fileContent?: string) => void;
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
      return;
    }

    setAttachedFile(file);
    setIsExtractingFile(true);

    try {
      const content = await extractTextFromFile(file);
      setFileContent(content);
    } catch (error) {
      console.error('Error extracting file content:', error);
      alert('Error reading file. Please try another file.');
      setAttachedFile(null);
      setFileContent('');
    } finally {
      setIsExtractingFile(false);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleRemoveFile = () => {
    setAttachedFile(null);
    setFileContent('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if ((input.trim() || fileContent) && !disabled && !isExtractingFile) {
      let messageContent = input.trim();
      if (fileContent) {
        messageContent += `\n\n[Attached File: ${attachedFile?.name}]\n\n${fileContent}`;
      }
      onSend(messageContent, fileContent ? `File: ${attachedFile?.name}` : undefined);
      setInput('');
      handleRemoveFile();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="border-t-2 border-blue-200 bg-white p-6 shadow-lg">
      {attachedFile && (
        <div className="max-w-4xl mx-auto mb-4 flex items-center justify-between bg-gradient-to-r from-blue-50 to-blue-100 p-4 rounded-xl border-2 border-blue-300 shadow-md">
          <div className="flex items-center gap-3">
            <Paperclip className="w-5 h-5 text-blue-600" />
            <span className="text-sm font-semibold text-blue-900">
              {isExtractingFile ? 'Processing...' : attachedFile.name}
            </span>
          </div>
          <button
            type="button"
            onClick={handleRemoveFile}
            className="p-1.5 hover:bg-blue-200 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-blue-700" />
          </button>
        </div>
      )}

      <div className="max-w-4xl mx-auto flex gap-3">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={disabled || isExtractingFile}
          className="p-3 text-blue-600 hover:bg-blue-50 rounded-xl transition-all disabled:text-gray-400 disabled:cursor-not-allowed border-2 border-blue-200 hover:border-blue-400 hover:shadow-md"
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
          className="flex-1 px-5 py-3 border-2 border-blue-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed transition-all shadow-sm placeholder-blue-400"
        />

        <button
          type="submit"
          disabled={disabled || (!input.trim() && !fileContent) || isExtractingFile}
          className="px-7 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-xl hover:from-blue-700 hover:to-blue-800 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:from-gray-400 disabled:to-gray-400 disabled:cursor-not-allowed transition-all flex items-center gap-2 font-semibold shadow-lg hover:shadow-xl"
        >
          <Send className="w-5 h-5" />
          Send
        </button>
      </div>
    </form>
  );
}
