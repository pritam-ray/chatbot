import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Trash2, Send } from 'lucide-react';

interface AudioRecorderProps {
  onRecordingComplete: (audioBlob: Blob, duration: number) => void;
  onCancel: () => void;
}

export function AudioRecorder({ onRecordingComplete, onCancel }: AudioRecorderProps) {
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup function
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : 'audio/webm';

      const mediaRecorder = new MediaRecorder(stream, { mimeType });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setError(null);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error('Error accessing microphone:', err);
      setError('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) {
          clearInterval(timerRef.current);
          timerRef.current = null;
        }
      }
      setIsPaused(!isPaused);
    }
  };

  const discardRecording = () => {
    stopRecording();
    setAudioBlob(null);
    setAudioUrl(null);
    setRecordingTime(0);
    chunksRef.current = [];
    onCancel();
  };

  const sendRecording = () => {
    if (audioBlob) {
      onRecordingComplete(audioBlob, recordingTime);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white border border-gray-200 rounded-2xl p-4 shadow-lg">
      {error && (
        <div className="mb-3 p-3 bg-red-50 text-red-600 text-sm rounded-lg">
          {error}
        </div>
      )}

      {/* Recording controls */}
      {!audioBlob && (
        <div className="flex items-center gap-4">
          {!isRecording ? (
            <button
              onClick={startRecording}
              className="flex-1 flex items-center justify-center gap-2 bg-red-500 hover:bg-red-600 text-white px-6 py-3 rounded-xl font-medium transition-colors"
            >
              <Mic className="w-5 h-5" />
              Start Recording
            </button>
          ) : (
            <>
              <div className="flex-1 flex items-center gap-3">
                <div className="flex items-center gap-2">
                  {!isPaused && (
                    <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                  )}
                  <span className="text-lg font-mono font-semibold text-gray-700">
                    {formatTime(recordingTime)}
                  </span>
                </div>
                <div className="flex-1 h-8 bg-gray-100 rounded-lg flex items-center px-2">
                  <div className="flex gap-0.5 items-center h-full">
                    {Array.from({ length: 20 }).map((_, i) => (
                      <div
                        key={i}
                        className="w-1 bg-red-500 rounded-full transition-all"
                        style={{
                          height: `${Math.random() * 100}%`,
                          opacity: isPaused ? 0.3 : 1,
                        }}
                      />
                    ))}
                  </div>
                </div>
              </div>
              <button
                onClick={pauseRecording}
                className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded-xl transition-colors"
                title={isPaused ? 'Resume' : 'Pause'}
              >
                {isPaused ? '▶' : '⏸'}
              </button>
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded-xl transition-colors"
              >
                <Square className="w-4 h-4" />
                Stop
              </button>
            </>
          )}
        </div>
      )}

      {/* Playback and send controls */}
      {audioBlob && audioUrl && (
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <audio src={audioUrl} controls className="flex-1" />
            <span className="text-sm text-gray-600 font-mono">
              {formatTime(recordingTime)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={discardRecording}
              className="flex items-center gap-2 px-4 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl transition-colors"
            >
              <Trash2 className="w-4 h-4" />
              Discard
            </button>
            <button
              onClick={sendRecording}
              className="flex-1 flex items-center justify-center gap-2 bg-[#10a37f] hover:bg-[#0d8c6c] text-white px-6 py-2 rounded-xl font-medium transition-colors"
            >
              <Send className="w-4 h-4" />
              Send Recording
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
