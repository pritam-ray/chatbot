import { useState, useRef } from 'react';
import { Send, Paperclip, X, Mic } from 'lucide-react';
import { createPortal } from 'react-dom';
import { ImageAttachmentManager } from './ImageAttachmentManager';
import { AudioRecorder } from './AudioRecorder';
import { Attachment, transcribeAudio } from '../services/azureOpenAI';

interface ChatInputProps {
  onSend: (message: string, displayMessage?: string, attachments?: Attachment[]) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [imageAttachments, setImageAttachments] = useState<Attachment[]>([]);
  const [showAudioRecorder, setShowAudioRecorder] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      alert('File size must be less than 20MB');
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    try {
      const reader = new FileReader();
      reader.onload = (event) => {
        const dataUrl = event.target?.result as string;
        const extension = file.name.split('.').pop()?.toLowerCase();
        const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '');
        
        const newAttachment: Attachment = {
          id: `file-${Date.now()}`,
          type: isImage ? 'image' : 'document',
          name: file.name,
          mimeType: file.type,
          size: file.size,
          dataUrl,
          previewUrl: isImage ? dataUrl : undefined,
          source: 'upload',
        };
        setImageAttachments(prev => [...prev, newAttachment]);
      };
      reader.readAsDataURL(file);
    } catch (error) {
      console.error('Error loading file:', error);
      alert('Failed to load file. Please try again.');
    } finally {
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleAudioRecordingComplete = async (audioBlob: Blob, duration: number) => {
    setShowAudioRecorder(false);
    setIsTranscribing(true);
    
    try {
      const transcribedText = await transcribeAudio(audioBlob);
      setInput(prev => prev ? `${prev} ${transcribedText}` : transcribedText);
    } catch (error) {
      console.error('Error transcribing audio:', error);
      alert('Failed to transcribe audio. Please try again or type your message.');
    } finally {
      setIsTranscribing(false);
    }
  };

  const handleCancelAudioRecording = () => {
    setShowAudioRecorder(false);
  };

  const sendMessage = () => {
    if ((input.trim() || imageAttachments.length > 0) && !disabled) {
      const userInput = input.trim();
      
      onSend(userInput, userInput, imageAttachments);
      setInput('');
      setImageAttachments([]);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage();
  };

  return (
    <>
      <form 
        onSubmit={handleSubmit} 
        className="border-t border-black/5 bg-[#f7f7f8] px-6 py-4"
        aria-label="Message input form"
      >
      {imageAttachments.length > 0 && (
        <div className="max-w-3xl mx-auto mb-4">
          <ImageAttachmentManager
            attachments={imageAttachments}
            onAttachmentsChange={setImageAttachments}
            disabled={disabled}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto relative">
        <div className="bg-white border border-black/10 rounded-[32px] px-3 py-2 flex items-end gap-3 shadow-sm">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled}
            className="p-2.5 text-gray-600 hover:bg-[#f4f4f6] rounded-2xl transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            title="Attach files (Images, PDFs, Documents)"
            aria-label="Attach file"
          >
            <Paperclip className="w-5 h-5" />
          </button>

          <input
            ref={fileInputRef}
            type="file"
            onChange={handleFileSelect}
            accept=".pdf,.txt,.md,.doc,.docx,.csv,.xlsx,.xls,.jpg,.jpeg,.png,.gif,.webp,.bmp"
            className="hidden"
            aria-label="Upload file"
            aria-describedby="file-types-description"
          />
          <span id="file-types-description" className="sr-only">
            Supported file types: PDF, TXT, MD, DOC, DOCX, CSV, XLSX, XLS, JPG, PNG, GIF, WebP
          </span>

          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                sendMessage();
              }
            }}
            placeholder="Message ChatGPT..."
            disabled={disabled}
            rows={1}
            className="flex-1 resize-none px-1 pb-1 pt-2 border-none bg-transparent focus:outline-none focus:ring-0 disabled:text-gray-400 text-[15px] leading-6"
            aria-label="Message input"
          />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowAudioRecorder(true)}
              disabled={disabled || isTranscribing}
              className={`p-2.5 rounded-2xl transition-colors ${
                isTranscribing 
                  ? 'text-blue-500 animate-pulse' 
                  : 'text-gray-600 hover:bg-[#f4f4f6]'
              } disabled:text-gray-400 disabled:cursor-not-allowed`}
              aria-label={isTranscribing ? 'Transcribing audio...' : 'Voice input'}
              title={isTranscribing ? 'Transcribing audio...' : 'Record audio message'}
            >
              <Mic className="w-5 h-5" />
            </button>
            <button
              type="submit"
              disabled={disabled || (!input.trim() && imageAttachments.length === 0)}
              className="w-11 h-11 bg-[#10a37f] text-white rounded-full flex items-center justify-center hover:bg-[#0d805f] focus:outline-none focus:ring-2 focus:ring-[#0d805f]/40 disabled:bg-gray-400 disabled:cursor-not-allowed"
              aria-label="Send message"
            >
              <Send className="w-5 h-5" aria-hidden="true" />
            </button>
          </div>
        </div>
      </div>
      <p className="max-w-3xl mx-auto text-center text-xs text-gray-500 mt-3">
        ChatGPT can make mistakes. Consider checking important information.
      </p>
    </form>

      {showAudioRecorder && createPortal(
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="max-w-2xl w-full">
            <AudioRecorder
              onRecordingComplete={handleAudioRecordingComplete}
              onCancel={handleCancelAudioRecording}
            />
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
