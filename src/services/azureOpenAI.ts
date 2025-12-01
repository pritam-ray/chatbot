export interface Attachment {
  id: string;
  type: 'image' | 'audio' | 'document';
  name: string;
  mimeType: string;
  size: number;
  previewUrl?: string; // For thumbnails/previews
  dataUrl?: string; // Base64 data URL for API payload
  source: 'upload' | 'generated' | 'recorded';
}

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  displayContent?: string; // Optional: content to display in UI (without file data)
  attachments?: Attachment[];
  generatedImages?: string[]; // URLs of AI-generated images
  audioReplyUrl?: string; // URL of TTS audio response
  metadata?: Record<string, unknown>;
}

export interface ChatCompletionChunk {
  choices: Array<{
    delta: {
      content?: string;
      role?: string;
    };
    finish_reason: string | null;
  }>;
}

type MessageContent = string | Array<{
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}>;

function buildMultimodalContent(message: Message): MessageContent {
  if (!message.attachments || message.attachments.length === 0) {
    return message.content;
  }

  const contentParts: Array<{ type: 'text' | 'image_url'; text?: string; image_url?: { url: string } }> = [];

  if (message.content) {
    contentParts.push({ type: 'text', text: message.content });
  }

  for (const attachment of message.attachments) {
    if (attachment.type === 'image' && attachment.dataUrl) {
      contentParts.push({
        type: 'image_url',
        image_url: { url: attachment.dataUrl },
      });
    }
  }

  return contentParts;
}

export async function* streamChatCompletion(messages: Message[]) {
  const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const deployment = import.meta.env.VITE_AZURE_OPENAI_DEPLOYMENT_NAME;
  const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;

  const url = `${endpoint}/openai/deployments/${deployment}/chat/completions?api-version=${apiVersion}`;

  // Build multimodal payload
  const apiMessages = messages.map((msg) => ({
    role: msg.role,
    content: buildMultimodalContent(msg),
  }));

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      messages: apiMessages,
      stream: true,
      max_tokens: 4000,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`Azure OpenAI API error: ${response.status} ${response.statusText}`);
  }

  const reader = response.body?.getReader();
  const decoder = new TextDecoder();

  if (!reader) {
    throw new Error('Response body is not readable');
  }

  let buffer = '';

  while (true) {
    const { done, value } = await reader.read();

    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      const trimmedLine = line.trim();

      if (trimmedLine === '' || trimmedLine === 'data: [DONE]') {
        continue;
      }

      if (trimmedLine.startsWith('data: ')) {
        try {
          const jsonStr = trimmedLine.slice(6);
          const data: ChatCompletionChunk = JSON.parse(jsonStr);

          if (data.choices?.[0]?.delta?.content) {
            yield data.choices[0].delta.content;
          }
        } catch (e) {
          console.error('Error parsing SSE data:', e);
        }
      }
    }
  }
}

// Audio transcription service
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const deployment = import.meta.env.VITE_AZURE_OPENAI_WHISPER_DEPLOYMENT || 'whisper';
  const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;

  const url = `${endpoint}/openai/deployments/${deployment}/audio/transcriptions?api-version=${apiVersion}`;

  const formData = new FormData();
  formData.append('file', audioBlob, 'audio.webm');

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'api-key': apiKey,
    },
    body: formData,
  });

  if (!response.ok) {
    throw new Error(`Transcription failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.text || '';
}

// Image generation service
export interface ImageGenerationOptions {
  prompt: string;
  size?: '1024x1024' | '1792x1024' | '1024x1792';
  quality?: 'standard' | 'hd';
  n?: number;
}

export async function generateImages(options: ImageGenerationOptions): Promise<string[]> {
  const endpoint = import.meta.env.VITE_AZURE_OPENAI_IMAGE_ENDPOINT || import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const deployment = import.meta.env.VITE_AZURE_OPENAI_IMAGE_DEPLOYMENT || 'dall-e-3';
  const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;

  const url = `${endpoint}/openai/deployments/${deployment}/images/generations?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      prompt: options.prompt,
      size: options.size || '1024x1024',
      quality: options.quality || 'standard',
      n: options.n || 1,
    }),
  });

  if (!response.ok) {
    throw new Error(`Image generation failed: ${response.status} ${response.statusText}`);
  }

  const result = await response.json();
  return result.data?.map((item: { url: string }) => item.url) || [];
}

// Text-to-speech service
export async function synthesizeSpeech(text: string, voice: string = 'alloy'): Promise<string> {
  const endpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT;
  const apiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY;
  const deployment = import.meta.env.VITE_AZURE_OPENAI_AUDIO_DEPLOYMENT || 'tts-1';
  const apiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION;

  const url = `${endpoint}/openai/deployments/${deployment}/audio/speech?api-version=${apiVersion}`;

  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'api-key': apiKey,
    },
    body: JSON.stringify({
      input: text,
      voice: voice,
      model: 'tts-1',
    }),
  });

  if (!response.ok) {
    throw new Error(`TTS failed: ${response.status} ${response.statusText}`);
  }

  const audioBlob = await response.blob();
  return URL.createObjectURL(audioBlob);
}
