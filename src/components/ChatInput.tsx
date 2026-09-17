import React, { useRef, useEffect, useState, ChangeEvent, KeyboardEvent } from 'react';
import { ArrowUp, Paperclip, Square, X, Image as ImageIcon, Sparkles } from 'lucide-react';
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
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }
  };

  const canSubmit = text.trim().length > 0 || attachment !== null;

  return (
    <div className="w-full max-w-3xl mx-auto px-4 pb-4">
      {/* Attachment Preview */}
      {attachment && (
        <div
          className="mb-2 inline-flex items-center gap-2 p-1.5 pr-3 rounded-lg border font-mono shadow-xs"
          style={{
            backgroundColor: 'var(--bg-card)',
            borderColor: 'var(--border-base)',
          }}
        >
          <div className="w-10 h-10 rounded overflow-hidden relative shrink-0 border" style={{ borderColor: 'var(--border-subtle)' }}>
            <img
              src={attachment.previewUrl}
              alt={attachment.name}
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
          </div>
          <div className="flex flex-col text-xs max-w-[180px]">
            <span className="font-bold truncate text-[11px]" style={{ color: 'var(--accent)' }}>
              {attachment.name}
            </span>
            <span className="text-[9px] uppercase tracking-wider opacity-60" style={{ color: 'var(--text-muted)' }}>
              Image Attached
            </span>
          </div>
          <button
            onClick={() => setAttachment(null)}
            className="ml-2 p-1 rounded opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
            title="Remove attachment"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Main Input Box */}
      <div
        className="relative flex flex-col rounded-xl border shadow-lg transition-all focus-within:ring-2"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-base)',
        }}
      >
        <textarea
          ref={textareaRef}
          value={text}
          onChange={e => setText(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask anything..."
          rows={1}
          className="w-full bg-transparent px-4 pt-3.5 pb-2 text-sm resize-none focus:outline-none max-h-[200px] leading-relaxed transition-all"
          style={{
            color: 'var(--text-primary)',
          }}
        />

        {/* Action bar inside input bottom */}
        <div
          className="flex items-center justify-between px-3 pb-2.5 pt-1 text-xs"
          style={{ color: 'var(--text-muted)' }}
        >
          <div className="flex items-center gap-1.5 sm:gap-2">
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
              className="p-1.5 rounded-md hover:opacity-100 opacity-70 transition-all cursor-pointer flex items-center gap-1.5 text-xs"
              style={{
                color: 'var(--text-secondary)',
              }}
              title="Attach photo to chat or edit"
              aria-label="Attach photo"
            >
              <Paperclip className="w-4 h-4" />
              <span className="text-[11px] hidden sm:inline">Attach</span>
            </button>

            {/* Quick Photo Create / Edit Prompt Button */}
            <button
              type="button"
              onClick={() => {
                if (attachment) {
                  setText(prev => (prev ? prev : 'Edit this image: make it cyberpunk neon style'));
                } else {
                  setText(prev => (prev ? prev : 'Generate an image of '));
                }
                textareaRef.current?.focus();
              }}
              className="p-1.5 rounded-md hover:opacity-100 opacity-75 transition-all cursor-pointer flex items-center gap-1.5 text-xs font-mono"
              style={{
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-subtle)',
              }}
              title="Create or edit photo directly in chat"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span className="text-[11px] font-medium hidden sm:inline">
                {attachment ? 'Edit Photo' : 'Create Photo'}
              </span>
            </button>
          </div>

          {/* Submit / Stop Button and Shortcut */}
          <div className="flex items-center gap-3">
            <div className="text-[10px] opacity-50 font-mono hidden sm:inline select-none" style={{ color: 'var(--text-muted)' }}>
              Enter to send
            </div>

            {isGenerating ? (
              <button
                type="button"
                onClick={onStopGeneration}
                className="p-2 rounded-lg bg-rose-500 hover:bg-rose-600 text-white transition-colors cursor-pointer shadow-xs"
                title="Stop generation"
                aria-label="Stop generation"
              >
                <Square className="w-3.5 h-3.5 fill-current" />
              </button>
            ) : (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="p-2 rounded-lg transition-all cursor-pointer shadow-xs disabled:opacity-30 disabled:cursor-not-allowed"
                style={{
                  backgroundColor: canSubmit ? 'var(--accent)' : 'var(--bg-surface)',
                  color: canSubmit ? 'var(--accent-text)' : 'var(--text-muted)',
                }}
                title="Send message"
                aria-label="Send message"
              >
                <ArrowUp className="w-4 h-4 stroke-[2.5]" />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
