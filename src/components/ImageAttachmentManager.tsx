import { useState } from 'react';
import { X, FileText } from 'lucide-react';
import { Attachment } from '../services/azureOpenAI';

interface ImageAttachmentManagerProps {
  attachments: Attachment[];
  onAttachmentsChange: (attachments: Attachment[]) => void;
  disabled?: boolean;
}

export function ImageAttachmentManager({
  attachments,
  onAttachmentsChange,
  disabled = false,
}: ImageAttachmentManagerProps) {
  const [dragActive, setDragActive] = useState(false);

  const imageAttachments = attachments.filter(a => a.type === 'image');
  const documentAttachments = attachments.filter(a => a.type === 'document');

  const handleFileSelect = async (files: FileList | null) => {
    if (!files || files.length === 0) return;

    const newAttachments: Attachment[] = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      
      // Validate image type
      if (!file.type.startsWith('image/')) {
        alert(`${file.name} is not an image file`);
        continue;
      }

      // Validate size (max 20MB)
      if (file.size > 20 * 1024 * 1024) {
        alert(`${file.name} is too large (max 20MB)`);
        continue;
      }

      // Read file as data URL
      const dataUrl = await readFileAsDataUrl(file);
      
      const attachment: Attachment = {
        id: `img-${Date.now()}-${i}`,
        type: 'image',
        name: file.name,
        mimeType: file.type,
        size: file.size,
        previewUrl: dataUrl,
        dataUrl: dataUrl,
        source: 'upload',
      };

      newAttachments.push(attachment);
    }

    onAttachmentsChange([...attachments, ...newAttachments]);
  };

  const readFileAsDataUrl = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleRemoveAttachment = (id: string) => {
    onAttachmentsChange(attachments.filter(a => a.id !== id));
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!disabled) setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (disabled) return;

    const files = e.dataTransfer.files;
    await handleFileSelect(files);
  };

  const handlePaste = async (e: ClipboardEvent) => {
    if (disabled) return;

    const items = e.clipboardData?.items;
    if (!items) return;

    const files: File[] = [];
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith('image/')) {
        const file = items[i].getAsFile();
        if (file) files.push(file);
      }
    }

    if (files.length > 0) {
      const fileList = new DataTransfer();
      files.forEach(f => fileList.items.add(f));
      await handleFileSelect(fileList.files);
    }
  };

  // Listen for paste events
  useState(() => {
    document.addEventListener('paste', handlePaste as any);
    return () => document.removeEventListener('paste', handlePaste as any);
  });

  if (attachments.length === 0 && !dragActive) {
    return null;
  }

  return (
    <div className="w-full">
      <div
        className={`relative border-2 border-dashed rounded-2xl p-4 transition-colors ${
          dragActive
            ? 'border-[#10a37f] bg-[#10a37f]/5'
            : 'border-gray-200 bg-gray-50'
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* Display images */}
        {imageAttachments.length > 0 && (
          <div className="grid grid-cols-3 gap-3 mb-3">
            {imageAttachments.map((attachment) => (
              <div key={attachment.id} className="relative group">
                <img
                  src={attachment.previewUrl}
                  alt={attachment.name}
                  className="w-full h-24 object-cover rounded-xl border border-black/10"
                />
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="absolute top-1 right-1 p-1.5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity hover:bg-red-600"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <X className="w-3 h-3" />
                </button>
                <div className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-xs p-1.5 rounded-b-xl truncate">
                  {attachment.name}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Display documents */}
        {documentAttachments.length > 0 && (
          <div className="space-y-2">
            {documentAttachments.map((attachment) => (
              <div key={attachment.id} className="flex items-center gap-3 bg-white p-3 rounded-xl border border-black/10 group">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <FileText className="w-5 h-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{attachment.name}</p>
                  <p className="text-xs text-gray-500">{(attachment.size / 1024).toFixed(1)} KB</p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRemoveAttachment(attachment.id)}
                  className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                  aria-label={`Remove ${attachment.name}`}
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between mt-3 pt-3 border-t border-gray-200">
          <p className="text-xs text-gray-500">
            {attachments.length} file{attachments.length !== 1 ? 's' : ''} attached
            {imageAttachments.length > 0 && documentAttachments.length > 0 && 
              ` (${imageAttachments.length} image${imageAttachments.length !== 1 ? 's' : ''}, ${documentAttachments.length} document${documentAttachments.length !== 1 ? 's' : ''})`
            }
          </p>
        </div>
      </div>
    </div>
  );
}
