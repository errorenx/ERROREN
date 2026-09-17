import React, { useRef, useEffect, useState } from 'react';
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
  Zap,
  Sparkles,
  Check,
  ChevronDown,
  Sliders,
} from 'lucide-react';
import { Conversation, MessageAttachment, UserProfile } from '../types';
import { MessageItem } from './MessageItem';
import { ChatInput } from './ChatInput';
import {
  ColorId,
  COLOR_LIST,
  COLOR_PALETTES,
  DEFAULT_COLOR_ID,
  DEFAULT_THEME_MODE,
  ThemeId,
  ThemeMode,
  THEMES,
} from '../utils/theme';

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
  currentThemeMode?: ThemeMode;
  currentColorId?: ColorId;
  onSelectThemeMode?: (mode: ThemeMode) => void;
  onSelectColorId?: (colorId: ColorId) => void;
  // Optional backward compatibility
  currentThemeId?: ThemeId;
  onSelectTheme?: (themeId: ThemeId) => void;
}

const STARTER_PROMPTS = [
  {
    icon: Code2,
    category: 'Code & Architecture',
    title: 'TypeScript & React Hook',
    prompt: 'Write a clean TypeScript React hook for debouncing search input with real-world examples and unit tests.',
  },
  {
    icon: Languages,
    category: 'Urdu & Multilingual',
    title: 'Roman Urdu Explanation',
    prompt: 'Mjy Roman Urdu mein explain karo k API aur Database k darmian connection kaisay kaam krta hai?',
  },
  {
    icon: Lightbulb,
    category: 'Analysis & Strategy',
    title: 'Modern Web Architecture',
    prompt: 'Compare micro-frontends vs modular monoliths in 2026 with clear pros, cons, and performance metrics.',
  },
  {
    icon: FileText,
    category: 'Synthesis & Summary',
    title: 'Executive Tech Summary',
    prompt: 'Provide a structured executive summary on how Edge Functions and WebAssembly enhance modern web apps.',
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
  currentThemeMode = DEFAULT_THEME_MODE,
  currentColorId = DEFAULT_COLOR_ID,
  onSelectThemeMode,
  onSelectColorId,
  currentThemeId,
  onSelectTheme,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [isMobilePaletteOpen, setIsMobilePaletteOpen] = useState(false);

  // Derive active definitions
  const activeColorDef = COLOR_PALETTES[currentColorId] || COLOR_PALETTES[DEFAULT_COLOR_ID];
  const safeMode = currentThemeMode === 'light' ? 'light' : 'dark';

  const handleModeChange = (mode: ThemeMode) => {
    if (onSelectThemeMode) {
      onSelectThemeMode(mode);
    } else if (onSelectTheme) {
      onSelectTheme(mode === 'dark' ? 'midnight-blue' : 'clean-white');
    }
  };

  const handleColorChange = (colorId: ColorId) => {
    if (onSelectColorId) {
      onSelectColorId(colorId);
    } else if (onSelectTheme) {
      onSelectTheme(`${colorId}-${safeMode}`);
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
      .map(m => `${m.role.toUpperCase()}:\n${m.content}\n`)
      .join('\n---\n\n');

    try {
      if (navigator.share) {
        await navigator.share({
          title: `ERROREN: ${conversation.title}`,
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
      className="flex-1 flex flex-col h-full overflow-hidden relative transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-base)',
        color: 'var(--text-primary)',
      }}
    >
      {/* 
        ========================================================================
        UNIQUE & STYLISH UPPER FRONTEND:
        - Cyber Aurora Glow Beam on header top
        - Live Pulse Neural Core indicator
        - 10 Separate Colors Palette Dock directly visible and interactive
        - Independent Dark 🌙 / Light ☀️ segmented switcher
        ========================================================================
      */}
      <header
        className="h-16 shrink-0 flex items-center justify-between px-3 sm:px-5 border-b z-20 transition-colors duration-200 relative select-none"
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-base)',
        }}
      >
        {/* Dynamic Cyber Aurora Accent Beam */}
        <div
          className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none opacity-95 transition-all duration-300"
          style={{
            background: `linear-gradient(90deg, transparent 0%, var(--accent) 30%, var(--accent-hover) 70%, transparent 100%)`,
            boxShadow: `0 0 10px var(--accent)`,
          }}
        />

        {/* Left Section: Sidebar Toggle, Brand & Telemetry */}
        <div className="flex items-center gap-2.5 min-w-0">
          {!isSidebarOpen && (
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded-lg border transition-colors cursor-pointer opacity-85 hover:opacity-100"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-primary)',
              }}
              title="Open sidebar"
              aria-label="Open sidebar"
            >
              <Menu className="w-4 h-4" />
            </button>
          )}

          <div className="flex items-center gap-2 min-w-0">
            <img
              src="./logo.png"
              alt="ERROREN"
              className="w-6 h-6 rounded-md object-contain shrink-0 shadow-xs"
              onError={(e) => {
                // fallback if image not loaded yet
                (e.target as HTMLElement).style.display = 'none';
              }}
            />

            <div className="flex items-center gap-1.5 min-w-0">
              <span
                className="text-xs uppercase tracking-wider font-mono font-black"
                style={{ color: 'var(--accent)' }}
              >
                ERROREN
              </span>
              <span
                className="text-[10px] font-mono opacity-50 hidden sm:inline truncate max-w-[140px] md:max-w-[200px]"
                style={{ color: 'var(--text-muted)' }}
              >
                / {conversation.title}
              </span>
            </div>
          </div>
        </div>

        {/* Right Section: Clean Quick Action (New Chat & Settings) */}
        <div className="flex items-center gap-2 text-xs font-mono">
          <button
            onClick={onNewChat}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer opacity-90 hover:opacity-100 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            title="Start fresh conversation"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">New Thread</span>
          </button>

          <button
            onClick={onOpenSettings}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer opacity-90 hover:opacity-100 shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-primary)',
            }}
            title="Settings (Theme, Dark/Light Mode, Profile, Share)"
            aria-label="Settings"
          >
            <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span className="hidden sm:inline">Settings</span>
          </button>
        </div>
      </header>

      {/* Main Message Flow or Empty State */}
      <div className="flex-1 overflow-y-auto relative">
        {isEmpty ? (
          <div className="min-h-full flex flex-col justify-center items-center px-4 py-8 max-w-3xl mx-auto">
            {/* Official ERROREN Glowing Logo Display */}
            <div className="relative mb-5 flex items-center justify-center">
              <div
                className="absolute w-32 h-32 rounded-3xl blur-2xl opacity-40 animate-pulse pointer-events-none"
                style={{ backgroundColor: 'var(--accent)' }}
              />

              <div
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-3xl p-1.5 border relative z-10 shadow-2xl transition-transform hover:scale-105"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--accent)',
                  boxShadow: `0 0 30px var(--accent-subtle)`,
                }}
              >
                <img
                  src="./logo.png"
                  alt="ERROREN AI Logo"
                  className="w-full h-full object-contain rounded-2xl"
                />
              </div>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-center tracking-tight mb-2 font-mono" style={{ color: 'var(--text-primary)' }}>
              ERROREN AI
            </h1>

            <p className="text-xs sm:text-sm text-center max-w-lg leading-relaxed font-mono opacity-80" style={{ color: 'var(--text-muted)' }}>
              Ask technical questions, dissect architecture, analyze code, or converse in English &amp; Roman Urdu.
            </p>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto px-4 py-6 space-y-4">
            {conversation.messages.map((message, index) => (
              <MessageItem
                key={message.id}
                message={message}
                isLastAssistant={
                  message.role === 'assistant' &&
                  index === conversation.messages.length - 1
                }
                isGenerating={isGenerating}
                onRegenerate={onRegenerate}
                onEditUserMessage={onEditUserMessage}
                onFeedback={onFeedback}
              />
            ))}
            <div ref={messagesEndRef} className="h-4" />
          </div>
        )}
      </div>

      {/* Persistent Chat Input at Bottom */}
      <ChatInput
        onSendMessage={onSendMessage}
        isGenerating={isGenerating}
        onStopGeneration={onStopGeneration}
      />
    </div>
  );
};
