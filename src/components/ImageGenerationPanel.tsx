import { useState } from 'react';
import { Image as ImageIcon, Sparkles, Download, Copy, X } from 'lucide-react';
import { generateImages, ImageGenerationOptions } from '../services/azureOpenAI';

interface ImageGenerationPanelProps {
  onClose: () => void;
  onImagesGenerated?: (images: string[]) => void;
}

export function ImageGenerationPanel({ onClose, onImagesGenerated }: ImageGenerationPanelProps) {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [quality, setQuality] = useState<'standard' | 'hd'>('standard');
  const [size, setSize] = useState<'1024x1024' | '1792x1024' | '1024x1792'>('1024x1024');
  const [style, setStyle] = useState<'natural' | 'vivid'>('vivid');

  const handleGenerate = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    setError(null);
    setGeneratedImages([]);

    const options: ImageGenerationOptions = {
      prompt: prompt.trim(),
      n: 1,
      size,
      quality,
      style,
    };

    try {
      const images = await generateImages(options);
      setGeneratedImages(images);
      if (onImagesGenerated) {
        onImagesGenerated(images);
      }
    } catch (err) {
      console.error('Error generating images:', err);
      setError(err instanceof Error ? err.message : 'Failed to generate images');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = async (imageUrl: string, index: number) => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `generated-image-${index + 1}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Error downloading image:', err);
    }
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-purple-600" />
            </div>
            <div>
              <h2 className="text-xl font-semibold text-gray-900">Generate Images</h2>
              <p className="text-sm text-gray-500">Create images with DALL-E 3</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
            aria-label="Close"
          >
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Prompt Input */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Describe what you want to create
            </label>
            <div className="relative">
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && e.ctrlKey) {
                    e.preventDefault();
                    handleGenerate();
                  }
                }}
                placeholder="A serene landscape with mountains at sunset, painted in watercolor style..."
                rows={4}
                disabled={isGenerating}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent disabled:bg-gray-50 disabled:text-gray-500"
              />
              <button
                onClick={handleCopyPrompt}
                disabled={!prompt.trim()}
                className="absolute top-3 right-3 p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
                title="Copy prompt"
              >
                <Copy className="w-4 h-4 text-gray-500" />
              </button>
            </div>
            <p className="text-xs text-gray-500 mt-2">
              Press Ctrl+Enter to generate
            </p>
          </div>

          {/* Options */}
          <div className="grid grid-cols-3 gap-4">
            {/* Size */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Size
              </label>
              <select
                value={size}
                onChange={(e) => setSize(e.target.value as typeof size)}
                disabled={isGenerating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
              >
                <option value="1024x1024">Square (1024×1024)</option>
                <option value="1792x1024">Landscape (1792×1024)</option>
                <option value="1024x1792">Portrait (1024×1792)</option>
              </select>
            </div>

            {/* Quality */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quality
              </label>
              <select
                value={quality}
                onChange={(e) => setQuality(e.target.value as typeof quality)}
                disabled={isGenerating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
              >
                <option value="standard">Standard</option>
                <option value="hd">HD (Higher Cost)</option>
              </select>
            </div>

            {/* Style */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Style
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as typeof style)}
                disabled={isGenerating}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 disabled:bg-gray-50"
              >
                <option value="vivid">Vivid (More artistic)</option>
                <option value="natural">Natural (Photorealistic)</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white px-6 py-3 rounded-xl font-semibold flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-5 h-5" />
                Generate Image
              </>
            )}
          </button>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Generated Images */}
          {generatedImages.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900">Generated Images</h3>
              <div className="grid grid-cols-1 gap-4">
                {generatedImages.map((imageUrl, index) => (
                  <div key={index} className="relative group rounded-xl overflow-hidden border border-gray-200 shadow-lg">
                    <img
                      src={imageUrl}
                      alt={`Generated image ${index + 1}`}
                      className="w-full h-auto"
                    />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                      <button
                        onClick={() => handleDownload(imageUrl, index)}
                        className="p-3 bg-white/90 hover:bg-white rounded-xl transition-colors"
                        title="Download image"
                      >
                        <Download className="w-5 h-5 text-gray-700" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
