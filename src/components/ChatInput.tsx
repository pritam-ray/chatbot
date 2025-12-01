import { useState, useRef } from 'react';
import { Send, Paperclip, X, Edit, Mic } from 'lucide-react';
import { createPortal } from 'react-dom';
import { extractTextFromFile } from '../utils/pdfExtractor';
import { parseTableFile, formatTableSummary, ParsedTable } from '../utils/tableParser';
import { TableEditor } from './TableEditor';
import { ImageAttachmentManager } from './ImageAttachmentManager';
import { AudioRecorder } from './AudioRecorder';
import { Attachment, transcribeAudio } from '../services/azureOpenAI';

interface ChatInputProps {
  onSend: (message: string, displayMessage?: string, attachments?: Attachment[]) => void;
  disabled: boolean;
}

export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState('');
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [isExtractingFile, setIsExtractingFile] = useState(false);
  const [isTableFile, setIsTableFile] = useState(false);
  const [tableData, setTableData] = useState<ParsedTable | null>(null);
  const [showTableEditor, setShowTableEditor] = useState(false);
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

    const extension = file.name.split('.').pop()?.toLowerCase();
    const isImage = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp'].includes(extension || '');

    // Handle image files
    if (isImage) {
      try {
        const reader = new FileReader();
        reader.onload = (event) => {
          const dataUrl = event.target?.result as string;
          const newAttachment: Attachment = {
            id: `img-${Date.now()}`,
            type: 'image',
            name: file.name,
            mimeType: file.type,
            size: file.size,
            dataUrl,
            previewUrl: dataUrl,
            source: 'upload',
          };
          setImageAttachments(prev => [...prev, newAttachment]);
        };
        reader.readAsDataURL(file);
      } catch (error) {
        console.error('Error loading image:', error);
        alert('Failed to load image. Please try again.');
      } finally {
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      }
      return;
    }

    // Handle document files
    setAttachedFile(file);
    setIsExtractingFile(true);

    const isTable = extension === 'csv' || extension === 'xlsx' || extension === 'xls';
    setIsTableFile(isTable);

    try {
      console.log('Starting to process file:', file.name, 'Type:', file.type);
      
      let content: string;
      
      if (isTable) {
        // Parse CSV/Excel files as tables
        const parsedTable = await parseTableFile(file);
        setTableData(parsedTable);
        content = formatTableSummary(parsedTable);
        console.log('Parsed table:', parsedTable.rowCount, 'rows ×', parsedTable.columnCount, 'columns');
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
    setTableData(null);
    setShowTableEditor(false);
  };

  const handleSendEditedTable = (markdown: string) => {
    onSend(markdown, `📊 Edited table data`, 'edited_table.csv');
    setShowTableEditor(false);
    handleRemoveFile();
    setInput('');
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
    if ((input.trim() || fileContent || imageAttachments.length > 0) && !disabled && !isExtractingFile) {
      const userInput = input.trim();
      let fullContent = userInput;
      let displayContent = userInput;
      
      if (fileContent) {
        // Full content for AI includes the file text
        fullContent += `\n\n[Attached File: ${attachedFile?.name}]\n\n${fileContent}`;
        // Display content only shows the file name, not the extracted text
        displayContent = userInput ? `${userInput}\n\n📎 Attached: ${attachedFile?.name}` : `📎 Attached: ${attachedFile?.name}`;
      }
      
      // Don't add image count text since images are displayed in ChatMessage component
      // The attachments will be rendered visually in the message bubble
      
      onSend(fullContent, displayContent, imageAttachments);
      setInput('');
      handleRemoveFile();
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
      {attachedFile && (
        <div 
          className="max-w-3xl mx-auto mb-4 flex items-center justify-between bg-white p-4 rounded-2xl border border-black/5 shadow-sm"
          role="status"
          aria-label="Attached file"
        >
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
          <div className="flex items-center gap-2">
            {isTableFile && !isExtractingFile && tableData && (
              <button
                type="button"
                onClick={() => setShowTableEditor(true)}
                className="px-3 py-2 bg-theme-primary hover:bg-theme-primary/90 text-white rounded-lg text-sm font-medium flex items-center gap-2 transition-colors"
                title="Edit table data"
                aria-label="Edit table data"
              >
                <Edit className="w-4 h-4" />
                Edit Table
              </button>
            )}
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
        </div>
      )}

      {imageAttachments.length > 0 && (
        <div className="max-w-3xl mx-auto mb-4">
          <ImageAttachmentManager
            attachments={imageAttachments}
            onAttachmentsChange={setImageAttachments}
            disabled={disabled || isExtractingFile}
          />
        </div>
      )}

      <div className="max-w-3xl mx-auto relative">
        <div className="bg-white border border-black/10 rounded-[32px] px-3 py-2 flex items-end gap-3 shadow-sm">
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={disabled || isExtractingFile}
            className="p-2.5 text-gray-600 hover:bg-[#f4f4f6] rounded-2xl transition-colors disabled:text-gray-400 disabled:cursor-not-allowed"
            title="Attach file (Images, PDF, TXT, CSV, XLSX)"
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
            disabled={disabled || isExtractingFile}
            rows={1}
            className="flex-1 resize-none px-1 pb-1 pt-2 border-none bg-transparent focus:outline-none focus:ring-0 disabled:text-gray-400 text-[15px] leading-6"
            aria-label="Message input"
          />

          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setShowAudioRecorder(true)}
              disabled={disabled || isExtractingFile || isTranscribing}
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
              disabled={disabled || (!input.trim() && !fileContent && imageAttachments.length === 0) || isExtractingFile}
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

      {showTableEditor && tableData && createPortal(
        <TableEditor
          initialHeaders={tableData.headers}
          initialRows={tableData.rows}
          onSendToAI={handleSendEditedTable}
          onClose={() => setShowTableEditor(false)}
        />,
        document.body
      )}

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
