import React, { useRef, useEffect } from 'react';
import {
  Menu,
  Share2,
  Plus,
  Code2,
  Lightbulb,
  FileText,
  Languages,
  ArrowRight,
  User,
  Palette,
  Moon,
  Sun,
} from 'lucide-react';
import { Conversation, MessageAttachment, UserProfile } from '../types';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import { ThemeId, THEMES } from '../utils/theme';

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
  currentProfile: UserProfile | null;
  onOpenAccount: () => void;
  currentThemeId: ThemeId;
  onSelectTheme?: (themeId: ThemeId) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Code2,
    category: 'Code & Debug',
    title: 'TypeScript & React',
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
    title: 'Product Concepts',
    prompt: 'Give me 3 practical, high-impact business ideas leveraging modern AI in 2026.',
  },
  {
    icon: FileText,
    category: 'Writing & Analysis',
    title: 'Professional Email',
    prompt: 'Draft a polite, persuasive proposal email to a prospective software client.',
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
  currentProfile,
  onOpenAccount,
  currentThemeId,
  onSelectTheme,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const activeTheme = THEMES[currentThemeId];

  const handleToggleMode = () => {
    if (!onSelectTheme) return;
    if (activeTheme.mode === 'dark') {
      onSelectTheme('clean-white');
    } else {
      onSelectTheme('midnight-blue');
    }
  };

  const scrollToBottom = (smooth = true) => {
    messagesEndRef.current?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto' });
  };

  useEffect(() => {
    scrollToBottom(false);
  }, [conversation.id]);

  useEffect(() => {
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
      // User dismissed or clipboard denied
    }
  };

  return (
    <div
      className="flex-1 flex flex-col h-full overflow-hidden relative transition-colors"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      {/* Top Header Bar */}
      <header
        className="h-16 shrink-0 flex items-center justify-between px-4 sm:px-6 border-b z-10 transition-colors"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-subtle)',
        }}
      >
        <div className="flex items-center gap-3">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded transition-colors cursor-pointer opacity-75 hover:opacity-100"
              style={{ color: 'var(--text-primary)' }}
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full animate-pulse"
              style={{ backgroundColor: 'var(--accent)' }}
            />
            <span
              className="text-xs uppercase tracking-widest font-mono font-bold"
              style={{ color: 'var(--accent)' }}
            >
              ERROREN
            </span>
            <span className="text-[11px] font-mono opacity-50 hidden sm:inline" style={{ color: 'var(--text-muted)' }}>
              / {conversation.title}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2.5 text-xs font-mono">
          {/* User Profile / Account Trigger */}
          <button
            onClick={onOpenAccount}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border transition-all cursor-pointer opacity-90 hover:opacity-100"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            title="User Profile & Settings"
          >
            <div
              className="w-4 h-4 rounded-full flex items-center justify-center font-bold text-[9px]"
              style={{
                backgroundColor: 'var(--accent)',
                color: 'var(--accent-text)',
              }}
            >
              {currentProfile?.name ? currentProfile.name.charAt(0).toUpperCase() : <User className="w-2.5 h-2.5" />}
            </div>
            <span className="text-[11px] font-medium hidden sm:inline truncate max-w-[100px]">
              {currentProfile?.name || 'Account'}
            </span>
          </button>

          {/* Direct Dark / Light Mode Toggle */}
          <button
            onClick={handleToggleMode}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-semibold uppercase tracking-wider transition-all cursor-pointer opacity-90 hover:opacity-100 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent)',
            }}
            title={`Switch to ${activeTheme.mode === 'dark' ? 'Light' : 'Dark'} Mode`}
            aria-label="Toggle Dark/Light Mode"
          >
            {activeTheme.mode === 'dark' ? (
              <>
                <Sun className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden md:inline">Light</span>
              </>
            ) : (
              <>
                <Moon className="w-3.5 h-3.5 text-indigo-500" />
                <span className="hidden md:inline">Dark</span>
              </>
            )}
          </button>

          {/* Theme Palette Modal Trigger */}
          <button
            onClick={onOpenSettings}
            className="p-1.5 rounded-md border transition-all cursor-pointer opacity-80 hover:opacity-100"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            title={`10 Themes (${activeTheme.name})`}
            aria-label="Change Theme"
          >
            <Palette className="w-4 h-4" />
          </button>

          <div className="flex items-center gap-1.5 border-l pl-2.5" style={{ borderColor: 'var(--border-subtle)' }}>
            <button
              onClick={onNewChat}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md border text-[11px] font-mono uppercase tracking-wider transition-all cursor-pointer opacity-90 hover:opacity-100"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              title="Start fresh conversation"
            >
              <Plus className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">New Chat</span>
            </button>

            <button
              onClick={handleShare}
              className="p-1.5 rounded-md border transition-all cursor-pointer opacity-80 hover:opacity-100"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
              title="Share or copy conversation"
              aria-label="Share or copy conversation"
            >
              <Share2 className="w-4 h-4" />
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
              <div
                className="w-14 h-14 rounded-xl border flex items-center justify-center font-mono text-xl font-bold shadow-lg"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--accent)',
                  color: 'var(--accent)',
                }}
              >
                <span>ERR</span>
              </div>
              <div
                className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold font-mono"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text)',
                }}
              >
                +
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-center tracking-tight mb-2 font-mono" style={{ color: 'var(--text-primary)' }}>
              SYNTHETIC INTELLIGENCE
            </h1>
            <p className="text-xs sm:text-sm text-center max-w-md mb-8 leading-relaxed font-mono opacity-70" style={{ color: 'var(--text-muted)' }}>
              Ask technical questions, dissect architecture, analyze code, or converse in English &amp; Roman Urdu.
            </p>

            {/* Starter Prompt Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
              {STARTER_PROMPTS.map((item, idx) => {
                const IconComponent = item.icon;
                return (
                  <button
                    key={idx}
                    onClick={() => onSendMessage(item.prompt)}
                    className="flex flex-col text-left p-4 rounded-xl border transition-all group cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-card)',
                      borderColor: 'var(--border-base)',
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <IconComponent className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
                        <span className="text-[10px] font-mono uppercase tracking-widest font-bold" style={{ color: 'var(--accent)' }}>
                          {item.category}
                        </span>
                      </div>
                      <ArrowRight className="w-3 h-3 opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all" style={{ color: 'var(--accent)' }} />
                    </div>
                    <span className="text-xs font-mono leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
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
      <div
        className="shrink-0 pt-2 transition-colors"
        style={{
          background: `linear-gradient(to top, var(--bg-base) 80%, transparent)`,
        }}
      >
        <ChatInput
          onSendMessage={onSendMessage}
          isGenerating={isGenerating}
          onStopGeneration={onStopGeneration}
        />
      </div>
    </div>
  );
};
