import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import {
  Check,
  Copy,
  Edit2,
  RotateCw,
  ThumbsDown,
  ThumbsUp,
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

  const handleSaveEdit = () => {
    if (editContent.trim() && onEditUserMessage) {
      onEditUserMessage(message.id, editContent.trim());
      setIsEditing(false);
    }
  };

  return (
    <div
      id={`message-${message.id}`}
      className="group w-full py-5 px-4 sm:px-6 md:px-10 transition-colors border-b"
      style={{
        backgroundColor: isUser ? 'transparent' : 'var(--bg-surface)',
        borderColor: 'var(--border-subtle)',
      }}
    >
      <div className="max-w-3xl mx-auto flex gap-4 md:gap-5 items-start">
        {/* Avatar */}
        <div className="shrink-0 mt-0.5">
          {isUser ? (
            <div
              className="w-8 h-8 rounded-md border flex items-center justify-center text-[10px] font-mono font-bold"
              style={{
                borderColor: 'var(--accent)',
                color: 'var(--accent)',
                backgroundColor: 'var(--accent-subtle)',
              }}
            >
              USR
            </div>
          ) : (
            <div
              className="w-8 h-8 rounded-md flex items-center justify-center text-[10px] font-mono font-black shadow-xs"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              ERR
            </div>
          )}
        </div>

        {/* Content Body */}
        <div className="flex-1 min-w-0 pt-0.5">
          <div className="flex items-center gap-3 mb-1.5 font-mono">
            <span
              className="font-bold text-xs uppercase tracking-wider select-none"
              style={{ color: 'var(--accent)' }}
            >
              {isUser ? 'YOU' : 'ERROREN'}
            </span>
            <span
              className="text-[10px] uppercase tracking-widest select-none opacity-60"
              style={{ color: 'var(--text-muted)' }}
            >
              {new Date(message.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
            {message.error && (
              <span className="inline-flex items-center gap-1 text-[10px] text-rose-400 font-mono uppercase tracking-wider border border-rose-900/60 px-1.5 py-0.5 rounded">
                <AlertCircle className="w-3 h-3" /> Error
              </span>
            )}
          </div>

          {/* User Image Attachment */}
          {message.attachment && (
            <div className="mb-3">
              <div
                className="relative inline-block border rounded-lg overflow-hidden max-w-sm"
                style={{
                  borderColor: 'var(--border-base)',
                  backgroundColor: 'var(--bg-card)',
                }}
              >
                <img
                  src={message.attachment.previewUrl}
                  alt={message.attachment.name || 'User attachment'}
                  className="max-h-60 w-auto object-contain"
                  referrerPolicy="no-referrer"
                />
                <span
                  className="block text-[10px] font-mono px-2 py-1 border-t truncate uppercase tracking-wider"
                  style={{
                    borderColor: 'var(--border-subtle)',
                    color: 'var(--text-secondary)',
                  }}
                >
                  Attachment: {message.attachment.name}
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
                className="w-full p-3 rounded-lg border text-sm outline-none font-mono leading-relaxed"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--accent)',
                  color: 'var(--text-primary)',
                }}
                rows={3}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={handleSaveEdit}
                  className="px-3 py-1 rounded text-xs font-mono font-bold uppercase tracking-wider transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                  }}
                >
                  Save &amp; Submit
                </button>
                <button
                  onClick={() => {
                    setEditContent(message.content);
                    setIsEditing(false);
                  }}
                  className="px-3 py-1 rounded border text-xs font-mono uppercase tracking-wider transition-colors cursor-pointer opacity-75 hover:opacity-100"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-base)',
                    color: 'var(--text-muted)',
                  }}
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <div
              className="text-[15px] sm:text-base leading-relaxed break-words"
              style={{
                color: isUser ? 'var(--text-primary)' : 'var(--text-secondary)',
              }}
            >
              <div className="markdown-body space-y-3">
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
                          className="px-1.5 py-0.5 rounded text-xs font-mono font-semibold"
                          style={{
                            backgroundColor: 'var(--accent-subtle)',
                            color: 'var(--accent)',
                          }}
                          {...props}
                        >
                          {children}
                        </code>
                      );
                    },
                    p({ children }) {
                      return <p className="mb-2.5 last:mb-0 leading-relaxed">{children}</p>;
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
                      return (
                        <h1 className="text-xl font-bold mt-4 mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {children}
                        </h1>
                      );
                    },
                    h2({ children }) {
                      return (
                        <h2 className="text-lg font-bold mt-3 mb-2 tracking-tight" style={{ color: 'var(--text-primary)' }}>
                          {children}
                        </h2>
                      );
                    },
                    h3({ children }) {
                      return (
                        <h3 className="text-base font-semibold mt-2.5 mb-1.5" style={{ color: 'var(--accent)' }}>
                          {children}
                        </h3>
                      );
                    },
                    blockquote({ children }) {
                      return (
                        <blockquote
                          className="border-l-3 pl-3.5 my-2.5 italic text-sm py-1 rounded-r"
                          style={{
                            borderColor: 'var(--accent)',
                            backgroundColor: 'var(--accent-subtle)',
                            color: 'var(--text-primary)',
                          }}
                        >
                          {children}
                        </blockquote>
                      );
                    },
                    table({ children }) {
                      return (
                        <div
                          className="overflow-x-auto my-3 border rounded-lg"
                          style={{ borderColor: 'var(--border-base)' }}
                        >
                          <table className="min-w-full text-xs text-left">
                            {children}
                          </table>
                        </div>
                      );
                    },
                    th({ children }) {
                      return (
                        <th
                          className="px-3 py-2 font-bold uppercase tracking-wider border-b text-[10px]"
                          style={{
                            backgroundColor: 'var(--bg-card)',
                            borderColor: 'var(--border-base)',
                            color: 'var(--accent)',
                          }}
                        >
                          {children}
                        </th>
                      );
                    },
                    td({ children }) {
                      return (
                        <td
                          className="px-3 py-2 border-b text-xs last:border-b-0"
                          style={{
                            borderColor: 'var(--border-subtle)',
                            color: 'var(--text-secondary)',
                          }}
                        >
                          {children}
                        </td>
                      );
                    },
                  }}
                >
                  {message.content}
                </ReactMarkdown>
                {message.isStreaming && (
                  <span
                    className="inline-block w-2 h-4 ml-1 animate-pulse align-middle rounded-xs"
                    style={{ backgroundColor: 'var(--accent)' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Action Toolbar */}
          <div className="mt-3 flex items-center flex-wrap gap-2 text-[10px] uppercase tracking-wider font-mono">
            <button
              onClick={handleCopy}
              className="px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 cursor-pointer opacity-80 hover:opacity-100"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              title="Copy message"
              aria-label="Copy message"
            >
              {copied ? <Check className="w-3 h-3" style={{ color: 'var(--accent)' }} /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>

            {!isUser && (
              <>
                <button
                  onClick={() => onFeedback?.(message.id, 'like')}
                  className="p-1 rounded border transition-colors cursor-pointer opacity-80 hover:opacity-100"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: message.feedback === 'like' ? 'var(--accent)' : 'var(--border-subtle)',
                    color: message.feedback === 'like' ? 'var(--accent)' : 'var(--text-muted)',
                  }}
                  title="Helpful response"
                  aria-label="Helpful response"
                >
                  <ThumbsUp className="w-3 h-3" />
                </button>

                <button
                  onClick={() => onFeedback?.(message.id, 'dislike')}
                  className="p-1 rounded border transition-colors cursor-pointer opacity-80 hover:opacity-100"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: message.feedback === 'dislike' ? '#f43f5e' : 'var(--border-subtle)',
                    color: message.feedback === 'dislike' ? '#f43f5e' : 'var(--text-muted)',
                  }}
                  title="Poor response"
                  aria-label="Poor response"
                >
                  <ThumbsDown className="w-3 h-3" />
                </button>

                {isLastAssistant && onRegenerate && (
                  <button
                    onClick={onRegenerate}
                    disabled={isGenerating}
                    className="px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 disabled:opacity-30 cursor-pointer opacity-80 hover:opacity-100"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-subtle)',
                      color: 'var(--text-secondary)',
                    }}
                    title="Regenerate response"
                  >
                    <RotateCw className={`w-3 h-3 ${isGenerating ? 'animate-spin' : ''}`} />
                    <span>Regenerate</span>
                  </button>
                )}
              </>
            )}

            {isUser && onEditUserMessage && !isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="px-2.5 py-1 rounded border transition-colors flex items-center gap-1.5 opacity-0 group-hover:opacity-100 cursor-pointer"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--text-secondary)',
                }}
                title="Edit message"
                aria-label="Edit message"
              >
                <Edit2 className="w-3 h-3" />
                <span>Edit</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
