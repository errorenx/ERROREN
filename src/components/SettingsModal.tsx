import React, { useState, useEffect } from 'react';
import { X, Sliders, Volume2, Trash2, Download, ShieldCheck, Sparkles, Command } from 'lucide-react';
import { AppSettings, Conversation } from '../types';

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
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  useEffect(() => {
    setLocalSettings(settings);
  }, [settings]);

  useEffect(() => {
    if ('speechSynthesis' in window) {
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        setAvailableVoices(voices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  if (!isOpen) return null;

  const handleSave = () => {
    onSaveSettings(localSettings);
    onClose();
  };

  const handleExportMarkdown = () => {
    if (!currentConversation || currentConversation.messages.length === 0) {
      alert('No messages to export.');
      return;
    }
    let md = `# ${currentConversation.title}\n*Exported from ERROREN AI on ${new Date().toLocaleString()}*\n\n---\n\n`;
    currentConversation.messages.forEach(m => {
      const roleName = m.role === 'user' ? 'You' : 'ERROREN';
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
      <div className="relative w-full max-w-lg bg-[#080808] border border-[#1a1a1a] shadow-2xl text-[#e0e0e0] overflow-hidden font-mono">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#1a1a1a] bg-[#050505]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 border border-[#00FF66] flex items-center justify-center text-[#00FF66]">
              <Sliders className="w-3.5 h-3.5" />
            </div>
            <h2 className="text-sm font-bold uppercase tracking-widest text-[#00FF66]">Config Schema // Settings</h2>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-[#00FF66] transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto text-xs">
          {/* Custom System Persona */}
          <div className="space-y-2">
            <label className="flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-200">
              <Sparkles className="w-3.5 h-3.5 text-[#00FF66]" />
              System Persona Directive
            </label>
            <p className="text-[11px] text-zinc-500 leading-normal">
              Define latent instructions for ERROREN (e.g. &ldquo;Hamesha Roman Urdu mein jawab dein&rdquo; or &ldquo;Maintain poetic precision&rdquo;).
            </p>
            <textarea
              value={localSettings.systemPrompt}
              onChange={e => setLocalSettings({ ...localSettings, systemPrompt: e.target.value })}
              placeholder="e.g. You are ERROREN. Answer with high technical precision and concise structure..."
              rows={3}
              className="w-full p-3 bg-[#0c0c0c] border border-[#1a1a1a] focus:border-[#00FF66] text-zinc-200 placeholder-zinc-700 focus:outline-none text-xs font-mono leading-relaxed transition-colors"
            />
          </div>

          {/* Voice & Speech synthesis */}
          <div className="space-y-3 pt-4 border-t border-[#1a1a1a]">
            <label className="flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-200">
              <Volume2 className="w-3.5 h-3.5 text-[#00FF66]" />
              Auditory Synthesis Engine
            </label>
            <div className="space-y-2">
              <select
                value={localSettings.speechVoiceName}
                onChange={e => setLocalSettings({ ...localSettings, speechVoiceName: e.target.value })}
                className="w-full p-2.5 bg-[#0c0c0c] border border-[#1a1a1a] focus:border-[#00FF66] text-zinc-300 text-xs focus:outline-none font-mono"
              >
                <option value="">Default System Voice</option>
                {availableVoices.map(voice => (
                  <option key={voice.name} value={voice.name}>
                    {voice.name} ({voice.lang})
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Keyboard Shortcuts Reference */}
          <div className="space-y-2 pt-4 border-t border-[#1a1a1a]">
            <label className="flex items-center gap-2 font-bold uppercase tracking-wider text-zinc-200">
              <Command className="w-3.5 h-3.5 text-zinc-400" />
              Keyboard Operations
            </label>
            <div className="grid grid-cols-2 gap-2 text-[11px]">
              <div className="p-2.5 bg-[#0c0c0c] border border-[#1a1a1a] flex justify-between items-center">
                <span className="text-zinc-500">Query Void</span>
                <kbd className="px-1.5 py-0.5 bg-[#181818] text-[#00FF66] font-mono text-[10px] border border-[#222]">Enter</kbd>
              </div>
              <div className="p-2.5 bg-[#0c0c0c] border border-[#1a1a1a] flex justify-between items-center">
                <span className="text-zinc-500">New Line</span>
                <kbd className="px-1.5 py-0.5 bg-[#181818] text-zinc-300 font-mono text-[10px] border border-[#222]">Shift+Enter</kbd>
              </div>
            </div>
          </div>

          {/* Export & Data Management */}
          <div className="space-y-3 pt-4 border-t border-[#1a1a1a]">
            <label className="font-bold uppercase tracking-wider text-zinc-200 block">Session State &amp; Ledger</label>
            <div className="flex flex-wrap items-center gap-2">
              <button
                type="button"
                onClick={handleExportMarkdown}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#111] hover:border-[#00FF66] hover:text-[#00FF66] text-zinc-300 text-xs border border-[#222] transition-colors cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                Export Active Schema (.md)
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Are you sure you want to purge all sessions? This cannot be reversed.')) {
                    onClearAllChats();
                    onClose();
                  }
                }}
                className="flex items-center gap-1.5 px-3 py-2 bg-[#111] hover:bg-rose-950/40 text-rose-400 text-xs border border-rose-900/40 hover:border-rose-500 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Purge All Sessions
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-[#1a1a1a] bg-[#050505]">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-zinc-500 hover:text-white uppercase tracking-wider transition-colors cursor-pointer"
          >
            Abort
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 text-xs font-bold uppercase tracking-wider bg-[#00FF66] hover:bg-white text-black transition-colors cursor-pointer"
          >
            Commit Changes
          </button>
        </div>
      </div>
    </div>
  );
};
