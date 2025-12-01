# Azure OpenAI Multimodal Expansion Plan

## 1. Objectives
- Transform the ChatGPT-style client into a full multimodal assistant supporting text, images, audio, and document flows.
- Preserve existing features (table editor, cache manager, theme presets) while layering in new modalities.
- Deliver a staged roadmap so work can be tracked, tested, and validated incrementally.

## 2. Target Modalities
| Modality | Inbound Support | Outbound Support | Notes |
| --- | --- | --- | --- |
| Text | ✅ existing | ✅ existing | Expand schema and storage to handle multimodal context metadata.
| Images | Upload (single & multi) + drag/drop + clipboard paste | AI-generated image gallery | Vision reasoning, OCR, comparisons, DALL·E-style creation.
| Audio | Microphone recording + file upload + streaming STT | Text-to-speech playback | Use GPT-4o Audio / Whisper for STT, Azure Speech for TTS (or GPT-4o).
| Documents | Existing PDF/CSV/TXT workflow | Summaries + extracted tables | Coordinate with multimodal payload when paired with images/audio.
| Tools/Functions | Function calling + code sandbox | Results displayed in chat | Ensure schema supports tool invocations alongside media.

## 3. Architecture Updates
1. **Service Layer**
   - Introduce `streamMultimodalCompletion(messages, attachments, options)`.
   - Update `azureOpenAI.ts` to build `content` arrays containing `text`, `image`, `input_audio`, `document` blocks.
   - Add helpers:
     - `transcribeAudio(file | blob): Promise<Transcript>`.
     - `generateImages(prompt, params): Promise<ImageAsset[]>`.
     - `synthesizeSpeech(text, voice): Promise<AudioAsset>`.
2. **Data Model**
   - Extend `Message`:
     ```ts
     interface Attachment {
       id: string;
       type: 'image' | 'audio' | 'document';
       previewUrl: string;
       source: 'upload' | 'generated' | 'recorded';
       mimeType: string;
       data?: string; // base64 for API payloads
     }
     interface Message {
       role: 'user' | 'assistant' | 'system';
       content: string;
       attachments?: Attachment[];
       generatedImages?: string[];
       audioReplyUrl?: string;
       metadata?: Record<string, unknown>;
     }
     ```
   - Update storage/cache schemas to persist attachments and generated assets.
3. **UI/UX**
   - Composer upgrades:
     - Attachment tray with tabs (Docs, Images, Audio) and drag/drop zone.
     - Mic button toggles recorder; show waveform + transcription preview before send.
     - Image previews with remove buttons; show upload progress.
   - Chat message cards:
     - User cards display thumbnails/audio chips next to text.
     - Assistant cards display galleries for generated images + inline download buttons.
     - Audio replies show player + "Download MP3".
   - Quick actions section:
     - "Describe an image", "Create an image", "Transcribe audio", "Explain this diagram" etc.
   - Settings additions:
     - Toggle per modality (enable/disable audio, image generation) for demo control.
4. **Backend Config**
   - Document required Azure resources: OpenAI resource with GPT-4o deployment, Whisper/gpt-4o-audio, DALL·E, Speech service for TTS, Storage for large uploads (optional).
   - Update `.env.example` with new keys (e.g., `AZURE_OPENAI_VISION_ENDPOINT`, `AZURE_OPENAI_IMAGE_DEPLOYMENT`).

## 4. Implementation Phases
1. **Foundation (Schema + API)**
   - Refactor message/attachment structures.
   - Update cache + conversation persistence.
   - Build unified request builder for multimodal payloads.
2. **Vision Input**
   - Image uploader + preview.
   - Vision reasoning pipeline (describe, answer questions, compare images).
3. **Audio Input**
   - Recording UI + MediaRecorder integration.
   - Whisper/GPT-4o transcription service.
   - Display transcript before sending.
4. **Image Generation Output**
   - Prompt form + parameters (size, quality, style).
   - Display generated images in chat; allow downloads.
5. **Audio Output**
   - Convert assistant text to speech (toggle per message).
   - Audio player UI + caching of generated clips.
6. **Advanced Workflows**
   - Multi-attachment reasoning (images + docs + audio together).
   - Function calling + tool triggers that leverage multimodal context.
   - Enhanced analytics/telemetry for usage per modality.

## 5. Testing & QA
- Unit tests for new helpers (transcription, image generation, multimodal payload builder).
- Integration tests simulating:
  - Text + image question.
  - Audio-only prompt.
  - Image generation path.
  - Combined doc + image input.
- Manual QA matrix across browsers (Chrome, Edge, Safari) for media APIs.
- Accessibility: keyboard navigation, ARIA labels for new controls, captions for audio content.

## 6. Risks & Mitigations
| Risk | Impact | Mitigation |
| --- | --- | --- |
| Large file uploads | API errors / high latency | Enforce size limits, show progress, optionally offload to Azure Blob before calling model. |
| Audio recording permission issues | Feature unusable on some browsers | Provide file-upload fallback + permission prompts. |
| Increased token/compute cost | Higher Azure spend | Add per-modality toggles, caching, and warn users before sending large attachments. |
| Schema incompatibility with old conversations | Crashes/blank state | Migrate storage schema with version flag + fallback parsing. |

## 7. Deliverables
- Updated React components (composer, chat message, galleries, audio player).
- Enhanced service layer with multimodal endpoints.
- Documentation (README + inline comments) covering setup & usage.
- Automated tests + manual QA checklist.
- Deployment artifacts confirming multimodal flows.

## 8. Next Steps
1. Finalize Azure resource IDs and environment variables.
2. Implement Phase 1 foundation changes.
3. March through phases 2–6, validating after each stage.
4. Demo full multimodal experience and gather feedback.
