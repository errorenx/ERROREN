import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Trash2,
  Edit3,
  Check,
  X,
  Search,
  Settings,
  Sun,
  Moon,
  Sparkles,
  Pin,
  ChevronLeft,
} from 'lucide-react';
import { Conversation, AppSettings } from '../types';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewChat: () => void;
  onDeleteConversation: (id: string) => void;
  onRenameConversation: (id: string, newTitle: string) => void;
  isOpen: boolean;
  onToggleOpen: () => void;
  onOpenSettings: () => void;
  settings: AppSettings;
  onToggleTheme: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewChat,
  onDeleteConversation,
  onRenameConversation,
  isOpen,
  onToggleOpen,
  onOpenSettings,
  settings,
  onToggleTheme,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  const filteredConversations = conversations.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const startRename = (c: Conversation, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(c.id);
    setEditTitle(c.title);
  };

  const saveRename = (id: string, e: React.MouseEvent | React.FormEvent) => {
    e.stopPropagation();
    if (editTitle.trim()) {
      onRenameConversation(id, editTitle.trim());
    }
    setEditingId(null);
  };

  const cancelRename = (e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(null);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          onClick={onToggleOpen}
          className="fixed inset-0 z-30 bg-black/60 md:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      {/* Sidebar Container */}
      <aside
        id="app-sidebar"
        className={`fixed md:static inset-y-0 left-0 z-40 flex flex-col justify-between w-[280px] bg-[#080808] border-r border-[#1a1a1a] text-[#e0e0e0] transition-transform duration-200 ease-in-out select-none ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:-translate-x-full'
        } shrink-0`}
      >
        <div className="flex flex-col h-full overflow-hidden p-5">
          {/* Top Header / App Branding */}
          <div className="mb-6 flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-black tracking-tighter text-[#00FF66] mb-0.5">
                ERROREN
              </h1>
              <p className="text-[10px] uppercase tracking-[0.3em] opacity-40 font-mono text-zinc-400">
                Synthetic Intelligence v.4.0
              </p>
            </div>

            <button
              onClick={onToggleOpen}
              className="p-1.5 rounded text-zinc-500 hover:text-white hover:bg-[#111] transition-colors cursor-pointer md:flex"
              title="Collapse sidebar"
              aria-label="Collapse sidebar"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
          </div>

          {/* New Chat Button */}
          <div className="mb-4">
            <button
              onClick={onNewChat}
              className="w-full flex items-center justify-between px-3.5 py-2.5 bg-[#111111] hover:bg-[#1a1a1a] active:bg-[#222] border border-[#222] hover:border-[#00FF66] text-[#e0e0e0] text-xs font-mono tracking-wider shadow-xs transition-all group cursor-pointer"
            >
              <div className="flex items-center gap-2">
                <Plus className="w-3.5 h-3.5 text-[#00FF66]" />
                <span className="uppercase text-[11px] font-bold tracking-widest text-white">Initialize Flux</span>
              </div>
              <span className="text-[9px] font-mono text-zinc-500 group-hover:text-[#00FF66] border border-[#333] px-1 py-0.5">
                CMD+K
              </span>
            </button>
          </div>

          {/* Search input */}
          {conversations.length > 2 && (
            <div className="mb-4">
              <div className="relative flex items-center">
                <Search className="w-3.5 h-3.5 absolute left-2.5 text-zinc-500" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Filter sessions..."
                  className="w-full pl-8 pr-3 py-1.5 bg-[#0c0c0c] border border-[#1a1a1a] text-zinc-200 placeholder-zinc-600 text-xs font-mono focus:outline-none focus:border-[#00FF66] transition-colors"
                />
              </div>
            </div>
          )}

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto pr-1 space-y-1">
            <p className="text-[10px] uppercase tracking-widest text-[#00FF66] mb-3 opacity-70 font-mono">
              Recent Sessions ({filteredConversations.length})
            </p>

            {filteredConversations.length === 0 ? (
              <div className="py-6 text-center text-zinc-600 text-xs font-mono px-2">
                // No sessions logged.
              </div>
            ) : (
              filteredConversations.map(conv => {
                const isActive = conv.id === activeId;
                const isEditingThis = editingId === conv.id;

                return (
                  <div
                    key={conv.id}
                    onClick={() => onSelectConversation(conv.id)}
                    className={`group relative flex items-center justify-between pl-3 pr-2 py-1.5 text-xs font-mono transition-all cursor-pointer ${
                      isActive
                        ? 'border-l-2 border-[#00FF66] bg-[#111111]/90 text-white font-medium shadow-xs'
                        : 'border-l-2 border-transparent text-zinc-400 opacity-60 hover:opacity-100 hover:text-white hover:bg-[#111111]/40'
                    }`}
                  >
                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                      {isEditingThis ? (
                        <input
                          type="text"
                          value={editTitle}
                          onChange={e => setEditTitle(e.target.value)}
                          onClick={e => e.stopPropagation()}
                          onKeyDown={e => {
                            if (e.key === 'Enter') saveRename(conv.id, e);
                            if (e.key === 'Escape') cancelRename(e as any);
                          }}
                          autoFocus
                          className="w-full bg-[#050505] border border-[#00FF66] px-1.5 py-0.5 text-xs text-white focus:outline-none font-mono"
                        />
                      ) : (
                        <span className="truncate text-[12px]">{conv.title}</span>
                      )}
                    </div>

                    {/* Action Icons on hover / active */}
                    <div className="flex items-center gap-1 shrink-0">
                      {isEditingThis ? (
                        <>
                          <button
                            onClick={e => saveRename(conv.id, e)}
                            className="p-1 text-[#00FF66] hover:bg-zinc-800 rounded"
                            title="Save"
                          >
                            <Check className="w-3 h-3" />
                          </button>
                          <button
                            onClick={cancelRename}
                            className="p-1 text-zinc-400 hover:bg-zinc-800 rounded"
                            title="Cancel"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </>
                      ) : (
                        <div className={`flex items-center gap-1 ${isActive ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'} transition-opacity`}>
                          <button
                            onClick={e => startRename(conv, e)}
                            className="p-1 text-zinc-400 hover:text-[#00FF66] hover:bg-black/50 rounded cursor-pointer"
                            title="Rename session"
                          >
                            <Edit3 className="w-3 h-3" />
                          </button>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              if (confirm(`Purge "${conv.title}"?`)) {
                                onDeleteConversation(conv.id);
                              }
                            }}
                            className="p-1 text-zinc-400 hover:text-rose-400 hover:bg-black/50 rounded cursor-pointer"
                            title="Purge session"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Footer / User & System Status Area */}
          <div className="mt-auto pt-4 border-t border-[#1a1a1a] space-y-2">
            <div
              onClick={onOpenSettings}
              className="flex items-center gap-3 p-2.5 bg-[#111] border border-[#1a1a1a] rounded-sm cursor-pointer hover:bg-[#1a1a1a] hover:border-[#333] transition-colors"
            >
              <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-[#00FF66] to-cyan-500 shrink-0 shadow-sm"></div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-white tracking-wide">Alpha Tester</p>
                <p className="text-[10px] opacity-40 italic font-mono text-zinc-400">Tier 01 Access</p>
              </div>
              <Settings className="w-3.5 h-3.5 text-zinc-500 hover:text-[#00FF66] transition-colors" />
            </div>

            <div className="flex items-center justify-between px-1 text-[10px] font-mono text-zinc-500">
              <button
                onClick={onToggleTheme}
                className="flex items-center gap-1 hover:text-[#00FF66] transition-colors cursor-pointer"
              >
                {settings.theme === 'dark' ? (
                  <Moon className="w-3 h-3 text-[#00FF66]" />
                ) : (
                  <Sun className="w-3 h-3 text-amber-400" />
                )}
                <span className="uppercase tracking-widest">{settings.theme} Mode</span>
              </button>
              <span className="text-[#00FF66] opacity-70">LATENT: ACTIVE</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};
