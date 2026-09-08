import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { ArrowUp, Mic, MicOff, Paperclip, Square, X, Image as ImageIcon } from 'lucide-react';
import { MessageAttachment } from '../types';

interface ChatInputProps {
  onSendMessage: (text: string, attachment?: MessageAttachment) => void;
  isGenerating: boolean;
  onStopGeneration: () => void;
}

export const ChatInput: React.FC<ChatInputProps> = ({
  onSendMessage,
  isGenerating,
  onStopGeneration,
}) => {
  const [text, setText] = useState('');
  const [attachment, setAttachment] = useState<MessageAttachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [text]);

  // Focus textarea on mount
  useEffect(() => {
    textareaRef.current?.focus();
  }, []);

  // Web Speech Recognition setup
  useEffect(() => {
    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      recognition.onresult = (event: any) => {
        let transcript = '';
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setText(prev => (prev ? `${prev} ${transcript}` : transcript));
        }
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }

    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Speech recognition is not supported in this browser. You can type your question.');
      return;
    }

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Error starting speech recognition:', err);
      }
    }
  };

  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (PNG, JPEG, WEBP).');
      return;
    }

    if (file.size > 15 * 1024 * 1024) {
      alert('Image size exceeds 15MB limit.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64Data = dataUrl.split(',')[1];
      setAttachment({
        name: file.name,
        mimeType: file.type,
        data: base64Data,
        previewUrl: dataUrl,
      });
      // reset file input
      if (fileInputRef.current) fileInputRef.current.value = '';
    };
    reader.readAsDataURL(file);
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const handleSubmit = () => {
    if (isGenerating) {
      onStopGeneration();
      return;
    }

    const trimmed = text.trim();
    if (!trimmed && !attachment) return;

    onSendMessage(trimmed, attachment || undefined);
    setText('');
    setAttachment(null);

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const canSubmit = text.trim().length > 0 || attachment !== null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Attachment Preview */}
      {attachment && (
        <div className="mb-2 inline-flex items-center gap-2 p-1.5 pr-3 bg-[#0c0c0c] border border-[#1a1a1a] font-mono">
          <div className="w-10 h-10 bg-black relative shrink-0 border border-[#222]">
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col text-xs max-w-[180px]">
            <span className="font-bold text-[#00FF66] truncate text-[11px]">{attachment.name}</span>
            <span className="text-zinc-500 text-[9px] uppercase tracking-wider">Source Vector Attached</span>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="ml-2 p-1 text-zinc-500 hover:text-white hover:bg-[#1a1a1a] transition-colors cursor-pointer"
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Voice Recording Status */}
      {isListening && (
        <div className="mb-2 flex items-center gap-2 px-3 py-1.5 bg-[#0c0c0c] border border-rose-500 text-rose-400 text-xs font-mono w-fit animate-pulse">
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
          <span className="uppercase tracking-wider text-[10px]">Acoustic Capture Active...</span>
          <button
            onClick={toggleListening}
            className="underline font-bold hover:text-white cursor-pointer ml-1 text-[10px] uppercase"
          >
            Terminate
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div className="relative flex flex-col bg-[#0c0c0c] border border-[#1a1a1a] focus-within:border-[#00FF66] shadow-2xl transition-all">
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Query the void... (English ya Roman Urdu mein poochein)"
          rows={1}
          className="w-full bg-transparent text-white placeholder:opacity-30 placeholder:text-zinc-400 px-5 pt-4 pb-2 text-sm font-mono resize-none focus:outline-none max-h-[200px] leading-relaxed transition-all"
        />

        {/* Action bar inside input bottom */}
        <div className="flex items-center justify-between px-4 pb-3 pt-1 text-zinc-500 font-mono">
          <div className="flex items-center gap-1.5">
            {/* File Upload Button */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleImageUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="p-1.5 hover:bg-[#1a1a1a] hover:text-[#00FF66] text-zinc-400 transition-colors cursor-pointer"
              title="Attach image schema"
              aria-label="Attach image schema"
            >
              <Paperclip className="w-4 h-4" />
            </button>

            {/* Voice Input Button */}
            <button
              type="button"
              onClick={toggleListening}
              className={`p-1.5 transition-colors cursor-pointer ${
                isListening
                  ? 'bg-rose-500/20 text-rose-400 hover:bg-rose-500/30'
                  : 'hover:bg-[#1a1a1a] hover:text-[#00FF66] text-zinc-400'
              }`}
              title={isListening ? 'Stop acoustic capture' : 'Voice dictation'}
              aria-label="Voice dictation"
            >
              {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
            </button>
          </div>

          {/* Submit / Stop Button and Shortcut */}
          <div className="flex items-center gap-3">
            <div className="text-[10px] opacity-30 font-mono hidden sm:inline select-none">
              CMD+ENTER
            </div>

            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="p-2 bg-white hover:bg-rose-500 hover:text-white text-black transition-colors cursor-pointer"
                title="Halt synthesis"
                aria-label="Halt synthesis"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className={`p-2 transition-colors cursor-pointer ${
                  canSubmit
                    ? 'bg-[#00FF66] hover:bg-white text-black'
                    : 'bg-[#181818] text-zinc-600 cursor-not-allowed'
                }`}
                title="Transmit query"
                aria-label="Transmit query"
              >
                <ArrowUp className="w-4 h-4 stroke-[3]" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Cyberpunk artistic footer indicators */}
      <div className="mt-3 flex justify-between items-center opacity-30 text-[9px] uppercase tracking-[0.2em] font-mono select-none px-1">
        <span>End-to-End Latent Encryption Active</span>
        <span className="hidden sm:inline">Built on Error-First Architecture</span>
      </div>
    </div>
  );
};
