import React, { useState, useEffect } from 'react';
import { X, Sliders, Trash2, Download, Sparkles, Command, Palette } from 'lucide-react';
import { AppSettings, Conversation } from '../types';
import { ThemeSelector } from './ThemeSelector';
import { ColorId, ThemeId, ThemeMode, applyTheme, THEMES } from '../utils/theme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onSaveSettings: (newSettings: AppSettings) => void;
  onClearAllChats: () => void;
  currentConversation?: Conversation;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onSaveSettings,
  onClearAllChats,
  currentConversation,
}) => {
  const [localSettings, setLocalSettings] = useState<AppSettings>(settings);
  const [activeTab, setActiveTab] = useState<'appearance' | 'system' | 'data'>('appearance');

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

  const handleSaveAndClose = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleExportMarkdown = () => {
    if (!currentConversation || currentConversation.messages.length === 0) {
      alert('No messages to export.');
      return;
    }
    let md = `# ${currentConversation.title}\n*Exported from ERROREN on ${new Date().toLocaleString()}*\n\n---\n\n`;
    currentConversation.messages.forEach(m => {
      const roleName = m.role === 'user' ? 'User' : 'ERROREN';
      md += `### ${roleName} (${new Date(m.timestamp).toLocaleTimeString()}):\n\n${m.content}\n\n---\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentConversation.title.replace(/[^a-z0-9]/gi, '_').toLowerCase() || 'erroren_chat'}.md`;
    a.click();
    URL.revokeObjectURL(url);
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
                Customize color theme, persona, and storage
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
          className="flex items-center gap-2 px-6 pt-3 border-b text-xs shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => setActiveTab('appearance')}
            className={`pb-2.5 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'appearance' ? 'opacity-100' : 'opacity-60 hover:opacity-90'
            }`}
            style={{
              borderColor: activeTab === 'appearance' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'appearance' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Palette className="w-3.5 h-3.5" />
            <span>10 Color Themes</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('system')}
            className={`pb-2.5 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
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

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`pb-2.5 font-bold uppercase tracking-wider text-[11px] border-b-2 transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'data' ? 'opacity-100' : 'opacity-60 hover:opacity-90'
            }`}
            style={{
              borderColor: activeTab === 'data' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'data' ? 'var(--text-primary)' : 'var(--text-muted)',
            }}
          >
            <Download className="w-3.5 h-3.5" />
            <span>Data &amp; Shortcuts</span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1 text-xs">
          {activeTab === 'appearance' && (
            <div>
              <div className="mb-4">
                <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                  Appearance &amp; Color System
                </h3>
                <p className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                  Independent Dark Mode &amp; Light Mode controls paired with 10 separate signature accent colors. Fully active across the entire application.
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

              {/* Optional client API key for static GitHub Pages */}
              <div
                className="p-3.5 rounded-lg border space-y-2"
                style={{
                  backgroundColor: 'var(--bg-base)',
                  borderColor: 'var(--border-subtle)',
                }}
              >
                <div>
                  <div className="font-bold text-xs flex items-center justify-between" style={{ color: 'var(--text-primary)' }}>
                    <span>Static / GitHub Pages API Key</span>
                    <span className="text-[10px] font-mono opacity-60">Optional</span>
                  </div>
                  <div className="text-[11px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    On Cloud Run or full-stack dev, the secure backend server handles all requests automatically. If you deploy statically to GitHub Pages, you can supply your free Gemini key here so ERROREN responds directly in the browser.
                  </div>
                </div>
                <input
                  type="password"
                  value={localSettings.clientApiKey || ''}
                  onChange={e => setLocalSettings({ ...localSettings, clientApiKey: e.target.value.trim() })}
                  placeholder="AIzaSy... (Only needed if hosting purely on GitHub Pages)"
                  className="w-full p-2.5 rounded-md border text-xs font-mono outline-none transition-colors"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-base)',
                    color: 'var(--text-primary)',
                  }}
                />
              </div>
            </div>
          )}

          {activeTab === 'data' && (
            <div className="space-y-5">
              {/* Keyboard Shortcuts */}
              <div>
                <label className="flex items-center gap-2 font-bold uppercase tracking-wider mb-2" style={{ color: 'var(--text-primary)' }}>
                  <Command className="w-3.5 h-3.5 text-zinc-400" />
                  Keyboard Operations
                </label>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div
                    className="p-2.5 rounded-md border flex justify-between items-center"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>Send Message</span>
                    <kbd
                      className="px-2 py-0.5 rounded font-mono text-[10px] border"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-base)',
                        color: 'var(--accent)',
                      }}
                    >
                      Enter
                    </kbd>
                  </div>
                  <div
                    className="p-2.5 rounded-md border flex justify-between items-center"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-subtle)',
                    }}
                  >
                    <span style={{ color: 'var(--text-muted)' }}>New Line</span>
                    <kbd
                      className="px-2 py-0.5 rounded font-mono text-[10px] border"
                      style={{
                        backgroundColor: 'var(--bg-card)',
                        borderColor: 'var(--border-base)',
                        color: 'var(--text-primary)',
                      }}
                    >
                      Shift+Enter
                    </kbd>
                  </div>
                </div>
              </div>

              {/* Export & Purge */}
              <div className="space-y-3 pt-3 border-t" style={{ borderColor: 'var(--border-subtle)' }}>
                <label className="font-bold uppercase tracking-wider block" style={{ color: 'var(--text-primary)' }}>
                  Session Storage &amp; Backup
                </label>
                <div className="flex flex-wrap items-center gap-2.5">
                  <button
                    type="button"
                    onClick={handleExportMarkdown}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs transition-colors cursor-pointer"
                    style={{
                      backgroundColor: 'var(--bg-base)',
                      borderColor: 'var(--border-base)',
                      color: 'var(--text-primary)',
                    }}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Export Active Chat (.md)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm('Are you sure you want to clear all conversations? This action cannot be undone.')) {
                        onClearAllChats();
                        onClose();
                      }
                    }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-md border text-xs text-rose-400 border-rose-900/40 hover:border-rose-500 bg-rose-950/20 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Clear All Conversations</span>
                  </button>
                </div>
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
