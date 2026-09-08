import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Check,
  Copy,
  Edit2,
  RotateCw,
  ThumbsDown,
  ThumbsUp,
  Volume2,
  VolumeX,
  User,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { ChatMessage } from '../types';
import { CodeBlock } from './CodeBlock';

interface MessageItemProps {
  message: ChatMessage;
  isLastAssistant?: boolean;
  isGenerating?: boolean;
  onRegenerate?: () => void;
  onEditUserMessage?: (messageId: string, newContent: string) => void;
  onFeedback?: (messageId: string, type: 'like' | 'dislike') => void;
}

export const MessageItem: React.FC<MessageItemProps> = ({
  message,
  isLastAssistant,
  isGenerating,
  onRegenerate,
  onEditUserMessage,
  onFeedback,
}) => {
  const [copied, setCopied] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const isUser = message.role === 'user';

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(message.content);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy', err);
    }
  };

  const handleSpeakToggle = () => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported in this browser.');
      return;
    }

    if (isSpeaking) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
      return;
    }

    window.speechSynthesis.cancel(); // Stop any other speech
    // Clean markdown syntax for cleaner speech
    const cleanText = message.content
      .replace(/```[\s\S]*?```/g, 'Code block omitted.')
      .replace(/`([^`]+)`/g, '$1')
      .replace(/[*#_~]/g, '')
      .trim();

    const utterance = new SpeechSynthesisUtterance(cleanText);
    utterance.rate = 1.0;

    // Pick English or Urdu-friendly voice if available
    const voices = window.speechSynthesis.getVoices();
    const preferredVoice = voices.find(v => v.lang.startsWith('en') && v.name.includes('Natural')) || voices[0];
    if (preferredVoice) utterance.voice = preferredVoice;

    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
    setIsSpeaking(true);
  };

  const handleSaveEdit = () => {
    if (editContent.trim() && onEditUserMessage) {
      onEditUserMessage(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className={`group w-full py-6 px-4 sm:px-6 md:px-10 transition-colors ${
        isUser
          ? 'bg-transparent'
          : 'bg-[#080808]/70 border-y border-[#1a1a1a]'
      }`}
    >
      <div className="max-w-3xl mx-auto flex gap-5 md:gap-6 items-start">
        {/* Avatar */}
        <div className="shrink-0 mt-1">
          {isUser ? (
            <div className="w-10 h-10 border border-[#00FF66] shrink-0 flex items-center justify-center text-[10px] font-mono text-[#00FF66]">
              USR
            </div>
          ) : (
            <div className="w-10 h-10 bg-[#00FF66] shrink-0 flex items-center justify-center text-[10px] font-mono text-black font-bold">
              ERR
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-3 mb-2 font-mono">
            <span className="font-bold text-xs text-[#00FF66] uppercase tracking-wider select-none">
              {isUser ? 'USER_PROMPT' : 'ERROREN_SYNTHESIS'}
            </span>
            <span className="text-[10px] text-zinc-500 uppercase tracking-widest select-none">
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.error && (
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-mono uppercase tracking-wider border border-rose-900/60 px-1 py-0.5">
                <AlertCircle className="w-3 h-3" /> DEVIATION_ERR
              </span>
            )}
          </div>

          {/* User Image Attachment */}
          {message.attachment && (
            <div className="mb-3">
              <div className="relative inline-block border border-[#1a1a1a] bg-[#0c0c0c] max-w-sm">
                <img
                  src={message.attachment.previewUrl}
                  alt={message.attachment.name || 'User attachment'}
                  className="max-h-60 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <span className="block text-[10px] font-mono text-[#00FF66] px-2 py-1 bg-[#080808] border-t border-[#1a1a1a] truncate uppercase tracking-wider">
                  SOURCE: {message.attachment.name}
                </span>
              </div>
            </div>
          )}

          {/* Message Content */}
          {isEditing ? (
            <div className="mt-2 space-y-2 font-mono">
              <textarea
                value={editContent}
                onChange={e => setEditContent(e.target.value)}
                className="w-full p-3 bg-[#0c0c0c] border border-[#00FF66] text-white text-sm focus:outline-none font-mono leading-relaxed"
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 bg-[#00FF66] text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-white transition-colors"
                >
                  Commit Flux
                </button>
                <button
                  onClick={() => {
                    setEditContent(message.content);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 bg-[#111] border border-[#222] text-zinc-400 text-xs font-mono uppercase tracking-wider hover:border-zinc-500 transition-colors"
                >
                  Abort
                </button>
              </div>
            </div>
          ) : (
            <div className={`text-[15px] sm:text-base leading-relaxed break-words ${isUser ? 'font-medium text-white' : 'text-[#e0e0e0] opacity-90'}`}>
              <div className="markdown-body prose prose-invert max-w-none space-y-4">
                <ReactMarkdown
                  components={{
                    code({ node, inline, className, children, ...props }: any) {
                      const match = /language-(\w+)/.exec(className || '');
                      const codeText = String(children).replace(/\n$/, '');
                      if (!inline && (match || codeText.includes('\n'))) {
                        return (
                          <CodeBlock
                            language={match ? match[1] : 'code'}
                            value={codeText}
                          />
                        );
                      }
                      return (
                        <code
                          className="px-1.5 py-0.5 bg-[#0c0c0c] border border-[#1a1a1a] text-[#00FF66] text-xs font-mono font-medium rounded-none"
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-3 last:mb-0 leading-relaxed">{children}</p>;
                    },
                    ul({ children }) {
                      return <ul className="list-disc pl-5 my-2 space-y-1">{children}</ul>;
                    },
                    ol({ children }) {
                      return <ol className="list-decimal pl-5 my-2 space-y-1">{children}</ol>;
                    },
                    li({ children }) {
                      return <li className="leading-relaxed">{children}</li>;
                    },
                    h1({ children }) {
                      return <h1 className="text-xl font-bold mt-4 mb-2 text-white font-mono tracking-tight">{children}</h1>;
                    },
                    h2({ children }) {
                      return <h2 className="text-lg font-bold mt-3 mb-2 text-white font-mono tracking-tight">{children}</h2>;
                    },
                    h3({ children }) {
                      return <h3 className="text-base font-semibold mt-2.5 mb-1.5 text-[#00FF66] font-mono">{children}</h3>;
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote className="border-l-2 border-[#00FF66] pl-4 my-3 text-zinc-300 italic font-mono text-sm bg-[#0c0c0c]/40 py-1">
                          {children}
                        </blockquote>
                      );
                    },
                    table({ children }) {
                      return (
                        <div className="overflow-x-auto my-3 border border-[#1a1a1a] font-mono">
                          <table className="min-w-full text-xs text-left divide-y divide-[#1a1a1a]">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th className="px-3 py-2 bg-[#0c0c0c] font-semibold text-[#00FF66] uppercase tracking-wider border-r border-[#1a1a1a] last:border-0 text-[10px]">
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td className="px-3 py-2 border-t border-[#1a1a1a] text-zinc-300 border-r border-[#1a1a1a] last:border-0 bg-[#080808]/50 text-xs">
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span className="inline-block w-2 h-4 ml-1 bg-[#00FF66] animate-pulse align-middle" />
                )}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="mt-4 flex items-center flex-wrap gap-2 text-zinc-400 font-mono text-[9px] uppercase tracking-wider">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 bg-[#111] border border-[#222] hover:border-[#00FF66] hover:text-[#00FF66] text-zinc-400 transition-colors flex items-center gap-1.5 cursor-pointer"
              title="Copy text"
              aria-label="Copy text"
            >
              {copied ? <Check className="w-3 h-3 text-[#00FF66]" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {!isUser && (
              <>
                <button
                  onClick={handleSpeakToggle}
                  className={`px-2.5 py-1 border transition-colors flex items-center gap-1.5 cursor-pointer ${
                    isSpeaking
                      ? 'bg-[#00FF66] text-black border-[#00FF66] font-bold'
                      : 'bg-[#111] border-[#222] hover:border-[#00FF66] hover:text-[#00FF66] text-zinc-400'
                  }`}
                  title={isSpeaking ? 'Stop reading' : 'Read aloud'}
                  aria-label="Read aloud"
                >
                  {isSpeaking ? <VolumeX className="w-3 h-3" /> : <Volume2 className="w-3 h-3" />}
                  <span>{isSpeaking ? 'Auditory Active' : 'Auditory'}</span>
                </button>

                <button
                  onClick={() => onFeedback?.(message.id, 'like')}
                  className={`p-1 bg-[#111] border transition-colors cursor-pointer ${
                    message.feedback === 'like'
                      ? 'text-[#00FF66] border-[#00FF66]'
                      : 'border-[#222] hover:border-[#00FF66] hover:text-[#00FF66] text-zinc-400'
                  }`}
                  title="Validate response"
                  aria-label="Validate response"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onFeedback?.(message.id, 'dislike')}
                  className={`p-1 bg-[#111] border transition-colors cursor-pointer ${
                    message.feedback === 'dislike'
                      ? 'text-rose-400 border-rose-500'
                      : 'border-[#222] hover:border-[#00FF66] hover:text-[#00FF66] text-zinc-400'
                  }`}
                  title="Flag response"
                  aria-label="Flag response"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>

                {isLastAssistant && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    disabled={isGenerating}
                    className="px-3 py-1 bg-[#111] text-[9px] uppercase tracking-wider border border-[#222] hover:border-[#00FF66] text-zinc-300 hover:text-[#00FF66] transition-colors flex items-center gap-1.5 disabled:opacity-30 cursor-pointer"
                    title="Regenerate response"
                  >
                    <RotateCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate Flux</span>
                  </button>
                )}
              </>
            )}

            {isUser && onEditUserMessage && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1 bg-[#111] border border-[#222] hover:border-[#00FF66] hover:text-[#00FF66] text-zinc-400 transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100 cursor-pointer"
                title="Edit message"
                aria-label="Edit message"
              >
                <Edit2 className="w-3 h-3" />
                <span>Alter Vector</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
