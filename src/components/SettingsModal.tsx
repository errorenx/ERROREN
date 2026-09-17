import React, { useState, useEffect } from 'react';
import { X, Sliders, Sparkles, Palette, User, Share2, Copy, Download, Check, Sun, Moon, LogOut } from 'lucide-react';
import { AppSettings, Conversation, UserProfile } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { ColorId, ThemeMode, applyTheme } from '../utils/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearAllChats?: () => void;
  currentConversation?: Conversation;
  currentProfile?: UserProfile | null;
  onOpenAccount?: () => void;
  onLogoutProfile?: () => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  currentConversation,
  currentProfile,
  onOpenAccount,
  onLogoutProfile,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'appearance' | 'profile' | 'share' | 'system'>('appearance');
  const [copiedShare, setCopiedShare] = useState(false);
  const [copiedTranscript, setCopiedTranscript] = useState(false);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings, isOpen]);

  if (!isOpen) return null;

  const handleSelectMode = (mode: ThemeMode) => {
    const currentColor = localSettings.colorId || 'cyan';
    const updated = {
      ...localSettings,
      themeMode: mode,
      themeId: `${currentColor}-${mode}`,
    };
    setLocalSettings(updated);
    applyTheme(mode, currentColor);
    onSaveSettings(updated);
  };

  const handleSelectColor = (colorId: ColorId) => {
    const currentMode = localSettings.themeMode || 'dark';
    const updated = {
      ...localSettings,
      colorId,
      themeId: `${colorId}-${currentMode}`,
    };
    setLocalSettings(updated);
    applyTheme(currentMode, colorId);
    onSaveSettings(updated);
  };

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleCopyTranscript = async () => {
    if (!currentConversation) return;
    const text = currentConversation.messages
      .map(m => `[${m.role.toUpperCase()}]\n${m.content}`)
      .join('\n\n---\n\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopiedTranscript(true);
      setTimeout(() => setCopiedTranscript(false), 2000);
    } catch {
      // fallback
    }
  };

  const handleDownloadMarkdown = () => {
    if (!currentConversation) return;
    const text = `# ${currentConversation.title}\n\nDate: ${new Date(currentConversation.createdAt).toLocaleString()}\n\n` +
      currentConversation.messages
        .map(m => `### ${m.role === 'user' ? 'User' : 'ERROREN'}\n\n${m.content}`)
        .join('\n\n---\n\n');
    const blob = new Blob([text], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConversation.title.toLowerCase().replace(/[^a-z0-9]/g, '-') || 'chat'}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleSaveAndClose = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/75 backdrop-blur-xs animate-in fade-in">
      <div
        className="relative w-full max-w-2xl rounded-xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] transition-all"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-base)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Header */}
        <div
          className="flex items-center justify-between px-6 py-4 border-b shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <div className="flex items-center gap-2.5">
            <div
              className="w-7 h-7 rounded-md flex items-center justify-center"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
              }}
            >
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-xs font-bold uppercase tracking-wider">
                Preferences &amp; Settings
              </h2>
              <p className="text-[11px] opacity-70" style={{ color: 'var(--text-muted)' }}>
                Customize color theme, dark/light mode, profile, and share options
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded opacity-70 hover:opacity-100 transition-opacity cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div
          className="flex items-center gap-2 px-6 pt-3 border-b text-xs shrink-0 overflow-x-auto"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'appearance' ? 'opacity-100' : 'opacity-60 hover:opacity-90'
            }`}
            style={{
              borderColor: activeTab === 'appearance' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'appearance' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>Theme &amp; Colors</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('profile')}
            className={`pb-2.5 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'profile' ? 'opacity-100' : 'opacity-60 hover:opacity-90'
            }`}
            style={{
              borderColor: activeTab === 'profile' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'profile' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <User className="w-3.5 h-3.5" />
            <span>Profile Setting</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('share')}
            className={`pb-2.5 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'share' ? 'opacity-100' : 'opacity-60 hover:opacity-90'
            }`}
            style={{
              borderColor: activeTab === 'share' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'share' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>Share &amp; Export</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`pb-2.5 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer flex items-center gap-1.5 shrink-0 ${
              activeTab === 'system' ? 'opacity-100' : 'opacity-60 hover:opacity-90'
            }`}
            style={{
              borderColor: activeTab === 'system' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'system' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>AI Persona</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'appearance' && (
            <div>
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Theme Mode &amp; Color Palettes
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Dark &amp; Light modes paired with high-contrast color themes including Black, White, and Rainbow (Rambo).
                </p>
              </div>

              <ThemeSelector
                currentMode={localSettings.themeMode || 'dark'}
                currentColorId={localSettings.colorId || 'cyan'}
                onSelectMode={handleSelectMode}
                onSelectColor={handleSelectColor}
              />
            </div>
          )}

          {activeTab === 'profile' && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  User Account &amp; Profile Setting
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Manage your personal user profile, customize your identity, or log in with email.
                </p>
              </div>

              <div
                className="p-4 rounded-xl border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 rounded-full flex items-center justify-center font-mono text-sm font-bold shadow-xs"
                    style={{
                      backgroundColor: 'var(--accent)',
                      color: 'var(--accent-text)',
                    }}
                  >
                    {currentProfile?.avatar ? (
                      <img
                        src={currentProfile.avatar}
                        alt={currentProfile.name}
                        className="w-full h-full rounded-full object-cover"
                      />
                    ) : currentProfile?.name ? (
                      currentProfile.name.slice(0, 2).toUpperCase()
                    ) : (
                      <User className="w-6 h-6" />
                    )}
                  </div>
                  <div>
                    <div className="font-bold text-sm" style={{ color: 'var(--text-primary)' }}>
                      {currentProfile?.name || 'Guest User'}
                    </div>
                    <div className="text-[11px] opacity-70" style={{ color: 'var(--text-muted)' }}>
                      {currentProfile?.email || 'No email account linked'}
                    </div>
                    {currentProfile?.bio && (
                      <div className="text-[11px] mt-1 italic opacity-80" style={{ color: 'var(--text-secondary)' }}>
                        &ldquo;{currentProfile.bio}&rdquo;
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenAccount?.();
                    }}
                    className="px-3.5 py-1.5 rounded-lg border text-xs font-bold uppercase tracking-wider cursor-pointer transition-all"
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                    }}
                  >
                    {currentProfile ? 'Edit Profile' : 'Sign In / Register'}
                  </button>

                  {currentProfile && onLogoutProfile && (
                    <button
                      type="button"
                      onClick={onLogoutProfile}
                      className="p-2 rounded-lg border text-xs cursor-pointer opacity-70 hover:opacity-100 transition-opacity"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-subtle)',
                        color: 'var(--text-muted)',
                      }}
                      title="Log out"
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}

          {activeTab === 'share' && (
            <div className="space-y-4">
              <div className="mb-2">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Share &amp; Export Chat
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Share conversation link or download current chat thread.
                </p>
              </div>

              {/* Share link */}
              <div
                className="p-4 rounded-xl border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                      Applet Share Link
                    </div>
                    <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                      Copy current applet URL to clipboard
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyShareLink}
                    className="px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                    style={{
                      backgroundColor: 'var(--accent-subtle)',
                      borderColor: 'var(--accent)',
                      color: 'var(--accent)',
                    }}
                  >
                    {copiedShare ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedShare ? 'Copied Link' : 'Copy Link'}</span>
                  </button>
                </div>
              </div>

              {/* Export transcript */}
              {currentConversation && (
                <div
                  className="p-4 rounded-xl border space-y-3"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-subtle)',
                  }}
                >
                  <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Export Current Chat: &ldquo;{currentConversation.title}&rdquo;
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={handleCopyTranscript}
                      className="px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-base)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      {copiedTranscript ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                      <span>{copiedTranscript ? 'Copied' : 'Copy Text'}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDownloadMarkdown}
                      className="px-3 py-1.5 rounded-md border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 cursor-pointer"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-base)',
                        color: 'var(--text-secondary)',
                      }}
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download .MD</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'system' && (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider mb-1" style={{ color: 'var(--text-primary)' }}>
                  System Instructions &amp; Persona
                </label>
                <p className="text-[11px] mb-2" style={{ color: 'var(--text-muted)' }}>
                  Add custom behavioral guidance (e.g. &ldquo;Always answer in Roman Urdu&rdquo;, &ldquo;Focus on Python code efficiency&rdquo;, or &ldquo;Keep answers brief&rdquo;).
                </p>
                <textarea
                  value={localSettings.systemPrompt}
                  onChange={e => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
                  placeholder="e.g. You are ERROREN. Assist with accurate, step-by-step code and clear explanations in English and Roman Urdu..."
                  rows={4}
                  className="w-full p-3 rounded-md border text-xs outline-none transition-colors font-mono leading-relaxed"
                  style={{
                    backgroundColor: 'var(--bg-base)',
                    borderColor: 'var(--border-base)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>

              <div
                className="p-3.5 rounded-lg border flex items-center justify-between"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div>
                  <div className="font-bold text-xs" style={{ color: 'var(--text-primary)' }}>
                    Real-time Token Streaming
                  </div>
                  <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                    Display AI output progressively token-by-token
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={localSettings.streamResponses}
                  onChange={e => setLocalSettings({ ...localSettings, streamResponses: e.target.checked })}
                  className="w-4 h-4 cursor-pointer"
                  style={{ accentColor: 'var(--accent)' }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          className="flex items-center justify-end gap-3 px-6 py-3.5 border-t shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs opacity-70 hover:opacity-100 uppercase tracking-wider transition-opacity cursor-pointer"
            style={{ color: 'var(--text-muted)' }}
          >
            Close
          </button>
          <button
            onClick={handleSaveAndClose}
            className="px-4 py-1.5 rounded-md text-xs font-bold uppercase tracking-wider transition-colors cursor-pointer shadow-xs"
            style={{
              backgroundColor: 'var(--accent)',
              color: 'var(--accent-text)',
            }}
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};

