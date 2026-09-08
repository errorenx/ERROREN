import React, { useRef, useEffect } from 'react';
import {
  Menu,
  Sparkles,
  Share2,
  Plus,
  Code2,
  Lightbulb,
  FileText,
  Languages,
  ArrowRight,
} from 'lucide-react';
import { Conversation, MessageAttachment, ChatMessage } from '../types';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';

interface ChatAreaProps {
  conversation: Conversation;
  isGenerating: boolean;
  onSendMessage: (text: string, attachment?: MessageAttachment) => void;
  onStopGeneration: () => void;
  onRegenerate: () => void;
  onEditUserMessage: (messageId: string, newContent: string) => void;
  onFeedback: (messageId: string, type: 'like' | 'dislike') => void;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
  onNewChat: () => void;
  onOpenSettings: () => void;
}

const STARTER_PROMPTS = [
  {
    icon: Code2,
    category: 'Code & Debug',
    title: 'Python / React Code',
    prompt: 'Write a clean TypeScript React hook for debouncing search input with examples.',
  },
  {
    icon: Languages,
    category: 'Urdu & Multilingual',
    title: 'Roman Urdu Assistance',
    prompt: 'Mjy Roman Urdu mein explain karo k API aur Database k darmian connection kaisay kaam krta hai?',
  },
  {
    icon: Lightbulb,
    category: 'Brainstorm & Ideas',
    title: 'Startup Concepts',
    prompt: 'Give me 3 practical, high-impact business ideas leveraging Gemini AI in 2026.',
  },
  {
    icon: FileText,
    category: 'Writing & Letters',
    title: 'Professional Email',
    prompt: 'Draft a polite and persuasive proposal email to a prospective software client.',
  },
];

export const ChatArea: React.FC<ChatAreaProps> = ({
  conversation,
  isGenerating,
  onSendMessage,
  onStopGeneration,
  onRegenerate,
  onEditUserMessage,
  onFeedback,
  onToggleSidebar,
  isSidebarOpen,
  onNewChat,
  onOpenSettings,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [conversation.id]);

  useEffect(() => {
    // When messages change or are streaming
    scrollToBottom(true);
  }, [conversation.messages, conversation.messages.length]);

  const isEmpty = conversation.messages.length === 0;

  const handleShare = async () => {
    const text = conversation.messages
      .map(m => `${m.role === 'user' ? 'User' : 'ERROREN'}: ${m.content}`)
      .join('\n\n');
    try {
      if (navigator.share) {
        await navigator.share({
          title: `ERROREN - ${conversation.title}`,
          text,
        });
      } else {
        await navigator.clipboard.writeText(text);
        alert('Conversation copied to clipboard!');
      }
    } catch {
      // User cancelled or clipboard permission denied
    }
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#050505] text-[#e0e0e0] overflow-hidden relative">
      {/* Top Header Bar */}
      <header className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-8 md:px-10 border-b border-[#1a1a1a] bg-[#050505]/80 backdrop-blur-md z-10">
        <div className="flex items-center gap-3">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded text-zinc-400 hover:text-[#00FF66] hover:bg-[#111] transition-colors cursor-pointer"
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#00FF66] animate-pulse" />
            <span className="text-[11px] uppercase tracking-widest opacity-60 font-mono">
              Operational: Low Latency
            </span>
          </div>
        </div>

        <div className="flex items-center gap-4 text-[11px] uppercase tracking-widest opacity-60 font-mono">
          <span className="hidden sm:inline">Context: 128k</span>
          <span className="hidden md:inline">Tokens: 8.4m</span>

          <div className="flex items-center gap-2 border-l border-[#1a1a1a] pl-4">
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#111] hover:border-[#00FF66] border border-[#222] text-[#e0e0e0] hover:text-[#00FF66] text-[10px] font-mono uppercase tracking-wider transition-colors cursor-pointer"
              title="Start fresh conversation"
            >
              <Plus className="w-3 h-3" />
              <span>Reset</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 bg-[#111] hover:border-[#00FF66] border border-[#222] text-[#e0e0e0] hover:text-[#00FF66] transition-colors cursor-pointer"
              title="Share or copy conversation"
              aria-label="Share or copy conversation"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Message Flow or Empty State */}
      <div className="flex-1 overflow-y-auto relative">
        {isEmpty ? (
          <div className="min-h-full flex flex-col justify-center items-center px-4 py-8 max-w-3xl mx-auto">
            {/* Logo Emblem */}
            <div className="relative mb-6">
              <div className="w-14 h-14 border border-[#00FF66] flex items-center justify-center text-[#00FF66] font-mono text-xl font-bold shadow-[0_0_25px_rgba(0,255,102,0.15)] bg-[#050505]">
                <span>ERR</span>
              </div>
              <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-[#00FF66] flex items-center justify-center text-black text-[10px] font-bold font-mono">
                +
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-white text-center tracking-tight mb-2 font-mono">
              QUERY THE VOID
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm text-center max-w-md mb-8 leading-relaxed font-mono opacity-70">
              State your deviance. Ask technical questions, dissect architecture, analyze code, or query in English &amp; Roman Urdu.
            </p>

            {/* Starter Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {STARTER_PROMPTS.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="flex flex-col text-left p-4 bg-[#0c0c0c] hover:bg-[#111] border border-[#1a1a1a] hover:border-[#00FF66] transition-all group cursor-pointer"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-3.5 h-3.5 text-[#00FF66]" />
                        <span className="text-[10px] font-mono text-[#00FF66] uppercase tracking-widest opacity-80">
                          {item.category}
                        </span>
                      </div>
                      <ArrowRight className="w-3 h-3 text-zinc-600 group-hover:text-[#00FF66] group-hover:translate-x-0.5 transition-all" />
                    </div>
                    <span className="text-xs font-mono text-zinc-300 group-hover:text-white line-clamp-2 leading-relaxed">
                      {item.prompt}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="flex flex-col pb-6">
            {conversation.messages.map((message, index) => {
              const isLastAssistant =
                message.role === 'assistant' &&
                index === conversation.messages.length - 1;

              return (
                <MessageItem
                  key={message.id}
                  message={message}
                  isLastAssistant={isLastAssistant}
                  isGenerating={isGenerating}
                  onRegenerate={onRegenerate}
                  onEditUserMessage={onEditUserMessage}
                  onFeedback={onFeedback}
                />
              );
            })}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Input Area */}
      <div className="shrink-0 pt-2 bg-gradient-to-t from-[#050505] via-[#050505]/90 to-transparent">
        <ChatInput
          onSendMessage={onSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={onStopGeneration}
        />
      </div>
    </div>
  );
};
