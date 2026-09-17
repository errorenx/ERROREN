import React, { useState } from 'react';
import {
  Plus,
  MessageSquare,
  Search,
  Trash2,
  Pin,
  Sliders,
  ChevronLeft,
  X,
  User,
  Palette,
  Sun,
  Moon,
  LogOut,
  FolderGit2,
  Layers,
  UserPlus,
  LogIn,
} from 'lucide-react';
import { Conversation, UserProfile, Project } from '../types';
import { ColorId, COLOR_PALETTES, DEFAULT_COLOR_ID, DEFAULT_THEME_MODE, ThemeId, ThemeMode, THEMES } from '../utils/theme';

interface SidebarProps {
  conversations: Conversation[];
  activeId: string;
  onSelectConversation: (id: string) => void;
  onNewConversation: () => void;
  onDeleteConversation: (id: string) => void;
  onTogglePin: (id: string) => void;
  onOpenSettings: () => void;
  isOpen: boolean;
  onToggleSidebar: () => void;
  currentProfile: UserProfile | null;
  onOpenAccount: () => void;
  onOpenAccountWithMode?: (mode: 'register' | 'login') => void;
  onLogoutProfile?: () => void;
  currentThemeMode?: ThemeMode;
  currentColorId?: ColorId;
  onSelectThemeMode?: (mode: ThemeMode) => void;
  onSelectColorId?: (colorId: ColorId) => void;
  currentThemeId?: ThemeId;
  onSelectTheme?: (themeId: ThemeId) => void;
  projects?: Project[];
  activeProjectId?: string | null;
  onSelectProject?: (projectId: string | null) => void;
  onOpenCreateProject?: () => void;
  onDeleteProject?: (projectId: string) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  conversations,
  activeId,
  onSelectConversation,
  onNewConversation,
  onDeleteConversation,
  onTogglePin,
  onOpenSettings,
  isOpen,
  onToggleSidebar,
  currentProfile,
  onOpenAccount,
  onOpenAccountWithMode,
  onLogoutProfile,
  currentThemeMode = DEFAULT_THEME_MODE,
  currentColorId = DEFAULT_COLOR_ID,
  onSelectThemeMode,
  onSelectColorId,
  currentThemeId,
  onSelectTheme,
  projects = [],
  activeProjectId = null,
  onSelectProject = () => {},
  onOpenCreateProject = () => {},
  onDeleteProject,
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const activeColor = COLOR_PALETTES[currentColorId] || COLOR_PALETTES[DEFAULT_COLOR_ID];
  const activeTheme = currentThemeId && THEMES[currentThemeId] ? THEMES[currentThemeId] : THEMES[`${currentColorId}-${currentThemeMode}`] || THEMES['cyan-dark'];

  // Filter conversations by active project and search query
  const projectFiltered = activeProjectId
    ? conversations.filter(c => c.projectId === activeProjectId)
    : conversations;

  const filteredConversations = projectFiltered.filter(c =>
    c.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const currentActiveProject = projects.find(p => p.id === activeProjectId);

  // Separate pinned and unpinned
  const pinnedConversations = filteredConversations.filter(c => c.pinned);
  const regularConversations = filteredConversations.filter(c => !c.pinned);

  const toggleThemeMode = () => {
    const nextMode: ThemeMode = currentThemeMode === 'dark' ? 'light' : 'dark';
    if (onSelectThemeMode) {
      onSelectThemeMode(nextMode);
    } else if (onSelectTheme) {
      onSelectTheme(`${currentColorId}-${nextMode}`);
    }
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden backdrop-blur-xs"
          onClick={onToggleSidebar}
        />
      )}

      {/* Main Sidebar Container */}
      <aside
        className={`fixed md:static inset-y-0 left-0 z-40 w-72 flex flex-col transition-transform duration-200 ease-in-out border-r ${
          isOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0 md:hidden'
        }`}
        style={{
          backgroundColor: 'var(--bg-surface)',
          borderColor: 'var(--border-base)',
          color: 'var(--text-primary)',
        }}
      >
        {/* Top Branding */}
        <div
          className="p-4 border-b flex items-center justify-between shrink-0"
          style={{ borderColor: 'var(--border-subtle)' }}
        >
          <div className="flex items-center gap-2.5">
            <img
              src="./logo.png"
              alt="ERROREN"
              className="w-8 h-8 rounded-lg object-contain transition-transform hover:scale-105 shadow-xs"
              onError={(e) => {
                (e.target as HTMLElement).style.display = 'none';
              }}
            />
            <div>
              <div className="font-mono text-sm font-black tracking-wider flex items-center gap-1.5" style={{ color: 'var(--text-primary)' }}>
                <span>ERROREN</span>
              </div>
              <div className="text-[10px] font-mono tracking-widest uppercase opacity-60" style={{ color: 'var(--text-muted)' }}>
                Synthetic Intelligence
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={toggleThemeMode}
              className="p-1.5 rounded opacity-75 hover:opacity-100 transition-opacity cursor-pointer"
              style={{ color: 'var(--text-secondary)' }}
              title={currentThemeMode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {currentThemeMode === 'dark' ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-400" />}
            </button>
            <button
              onClick={onToggleSidebar}
              className="p-1.5 rounded opacity-75 hover:opacity-100 transition-opacity cursor-pointer md:hidden"
              style={{ color: 'var(--text-secondary)' }}
              title="Close sidebar"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* New Chat Button */}
        <div className="p-3 shrink-0">
          <button
            onClick={onNewConversation}
            className="w-full flex items-center justify-between py-2.5 px-3.5 rounded-lg border font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              borderColor: 'var(--accent)',
              color: 'var(--accent)',
            }}
          >
            <div className="flex items-center gap-2">
              <Plus className="w-4 h-4" />
              <span>New Thread</span>
            </div>
            <span className="text-[9px] px-1.5 py-0.5 rounded opacity-80" style={{ backgroundColor: 'var(--bg-card)' }}>
              +
            </span>
          </button>
        </div>

        {/* Search Conversations */}
        <div className="px-3 pb-2 shrink-0">
          <div
            className="relative flex items-center rounded-md border"
            style={{
              backgroundColor: 'var(--bg-base)',
              borderColor: 'var(--border-subtle)',
            }}
          >
            <Search className="w-3.5 h-3.5 ml-2.5 opacity-50 shrink-0" style={{ color: 'var(--text-muted)' }} />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search chat history..."
              className="w-full py-1.5 px-2 text-xs outline-none bg-transparent"
              style={{ color: 'var(--text-primary)' }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="p-1 mr-1 text-xs opacity-60 hover:opacity-100 cursor-pointer"
                style={{ color: 'var(--text-muted)' }}
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </div>

        {/* Projects Section (Separate chat threads by project) */}
        <div className="px-3 pb-2 shrink-0 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
          <div
            className="flex items-center justify-between py-1 text-[10px] font-mono font-bold uppercase tracking-wider opacity-70"
            style={{ color: 'var(--text-muted)' }}
          >
            <div className="flex items-center gap-1.5">
              <FolderGit2 className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              <span>Projects</span>
              {projects.length > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[9px] bg-white/10">{projects.length}</span>
              )}
            </div>
            <button
              type="button"
              onClick={onOpenCreateProject}
              className="flex items-center gap-1 text-[10px] uppercase font-bold transition-opacity hover:opacity-100 cursor-pointer"
              style={{ color: 'var(--accent)' }}
              title="Create new project"
            >
              <Plus className="w-3 h-3" />
              <span>New</span>
            </button>
          </div>

          <div className="space-y-1 mt-1 max-h-36 overflow-y-auto">
            {/* All Conversations button */}
            <button
              type="button"
              onClick={() => onSelectProject(null)}
              className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                activeProjectId === null ? 'font-bold' : 'opacity-70 hover:opacity-100'
              }`}
              style={{
                backgroundColor: activeProjectId === null ? 'var(--accent-subtle)' : 'transparent',
                color: activeProjectId === null ? 'var(--accent)' : 'var(--text-secondary)',
              }}
            >
              <div className="flex items-center gap-2 truncate">
                <Layers className="w-3 h-3 shrink-0" />
                <span className="truncate">All Threads</span>
              </div>
              <span className="text-[10px] opacity-60 font-normal">{conversations.length}</span>
            </button>

            {/* Individual Projects */}
            {projects.map(p => {
              const isSelected = activeProjectId === p.id;
              const count = conversations.filter(c => c.projectId === p.id).length;
              return (
                <div
                  key={p.id}
                  className={`group flex items-center justify-between px-2.5 py-1.5 rounded-md text-xs font-mono transition-colors cursor-pointer ${
                    isSelected ? 'font-bold' : 'opacity-70 hover:opacity-100'
                  }`}
                  style={{
                    backgroundColor: isSelected ? 'var(--accent-subtle)' : 'transparent',
                    color: isSelected ? 'var(--accent)' : 'var(--text-secondary)',
                  }}
                  onClick={() => onSelectProject(p.id)}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2 h-2 rounded-full shrink-0 shadow-xs"
                      style={{ backgroundColor: p.color || 'var(--accent)' }}
                    />
                    <span className="truncate">{p.name}</span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className="text-[10px] opacity-60 font-normal">{count}</span>
                    {onDeleteProject && (
                      <button
                        type="button"
                        onClick={e => {
                          e.stopPropagation();
                          onDeleteProject(p.id);
                        }}
                        className="opacity-0 group-hover:opacity-60 hover:opacity-100! p-0.5 rounded cursor-pointer transition-opacity"
                        title="Delete project"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Conversation List */}
        <div className="flex-1 overflow-y-auto px-2 space-y-3 py-1 text-xs font-mono">
          {currentActiveProject && (
            <div
              className="px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider flex items-center justify-between"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                color: 'var(--accent)',
              }}
            >
              <span className="truncate">In: {currentActiveProject.name}</span>
              <button
                type="button"
                onClick={() => onSelectProject(null)}
                className="opacity-60 hover:opacity-100 cursor-pointer ml-1"
                title="View all chats"
              >
                Clear
              </button>
            </div>
          )}

          {/* Pinned Section */}
          {pinnedConversations.length > 0 && (
            <div>
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
                <Pin className="w-2.5 h-2.5" />
                <span>Pinned</span>
              </div>
              <div className="space-y-1 mt-1">
                {pinnedConversations.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeId}
                    onSelect={() => onSelectConversation(conv.id)}
                    onDelete={() => onDeleteConversation(conv.id)}
                    onTogglePin={() => onTogglePin(conv.id)}
                  />
                ))}
              </div>
            </div>
          )}

          {/* Recents Section */}
          <div>
            {pinnedConversations.length > 0 && (
              <div className="px-2 py-1 text-[10px] uppercase font-bold tracking-wider opacity-60" style={{ color: 'var(--text-muted)' }}>
                Recent
              </div>
            )}
            <div className="space-y-1">
              {regularConversations.length === 0 && pinnedConversations.length === 0 ? (
                <div className="p-4 text-center text-xs opacity-60" style={{ color: 'var(--text-muted)' }}>
                  No chats match &ldquo;{searchQuery}&rdquo;
                </div>
              ) : (
                regularConversations.map(conv => (
                  <ConversationItem
                    key={conv.id}
                    conversation={conv}
                    isActive={conv.id === activeId}
                    onSelect={() => onSelectConversation(conv.id)}
                    onDelete={() => onDeleteConversation(conv.id)}
                    onTogglePin={() => onTogglePin(conv.id)}
                  />
                ))
              )}
            </div>
          </div>
        </div>

        {/* Bottom Profile & Actions */}
        <div
          className="p-3 border-t space-y-2 shrink-0"
          style={{
            backgroundColor: 'var(--bg-surface)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          {/* User Account Bar (Logged In) OR Dual Create Account / Login (Logged Out) */}
          {currentProfile ? (
            <div
              className="flex items-center justify-between p-2 rounded-lg border transition-colors cursor-pointer"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
              }}
              onClick={onOpenAccount}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div
                  className="w-7 h-7 rounded-full flex items-center justify-center font-mono text-[11px] font-bold shrink-0"
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
                    <User className="w-3.5 h-3.5" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="text-xs font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {currentProfile?.name || 'User Profile'}
                  </div>
                  <div className="text-[10px] truncate opacity-70" style={{ color: 'var(--text-muted)' }}>
                    {currentProfile?.email || 'Customize in settings'}
                  </div>
                </div>
              </div>

              {onLogoutProfile && (
                <button
                  type="button"
                  onClick={e => {
                    e.stopPropagation();
                    onLogoutProfile();
                  }}
                  className="p-1 rounded opacity-60 hover:opacity-100 transition-opacity cursor-pointer ml-1"
                  style={{ color: 'var(--text-muted)' }}
                  title="Sign out"
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <button
                  type="button"
                  onClick={() => onOpenAccountWithMode ? onOpenAccountWithMode('register') : onOpenAccount()}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg border font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs hover:scale-102"
                  style={{
                    backgroundColor: 'var(--accent)',
                    borderColor: 'var(--accent)',
                    color: 'var(--accent-text)',
                  }}
                  title="Create a new account"
                >
                  <UserPlus className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Register</span>
                </button>
                <button
                  type="button"
                  onClick={() => onOpenAccountWithMode ? onOpenAccountWithMode('login') : onOpenAccount()}
                  className="flex items-center justify-center gap-1 py-2 px-2 rounded-lg border font-mono text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer hover:bg-white/5"
                  style={{
                    backgroundColor: 'var(--bg-card)',
                    borderColor: 'var(--border-base)',
                    color: 'var(--text-primary)',
                  }}
                  title="Sign in to your account"
                >
                  <LogIn className="w-3.5 h-3.5 shrink-0" />
                  <span className="truncate">Login</span>
                </button>
              </div>
            </div>
          )}

          {/* Quick Controls (Settings) */}
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onOpenSettings}
              className="flex-1 flex items-center justify-center gap-2 py-2 px-2.5 rounded-md border text-xs font-semibold transition-all cursor-pointer opacity-90 hover:opacity-100"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--text-secondary)',
              }}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Settings</span>
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              className="flex items-center gap-1.5 py-2 px-2.5 rounded-md border text-xs font-semibold transition-all cursor-pointer opacity-90 hover:opacity-100"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-subtle)',
                color: 'var(--accent)',
              }}
              title={`Active Color: ${activeColor.name} (${currentThemeMode === 'dark' ? 'Dark' : 'Light'})`}
            >
              <div
                className="w-2.5 h-2.5 rounded-full shadow-xs"
                style={{
                  backgroundColor: activeColor.preview,
                  boxShadow: `0 0 6px ${activeColor.preview}`,
                }}
              />
              <span className="text-[11px] hidden sm:inline">{activeColor.name.split(' ')[0]}</span>
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};

interface ConversationItemProps {
  conversation: Conversation;
  isActive: boolean;
  onSelect: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
}

const ConversationItem: React.FC<ConversationItemProps> = ({
  conversation,
  isActive,
  onSelect,
  onDelete,
  onTogglePin,
}) => {
  return (
    <div
      onClick={onSelect}
      className={`group relative flex items-center justify-between p-2.5 rounded-lg border text-xs cursor-pointer transition-all ${
        isActive ? 'shadow-xs' : 'opacity-80 hover:opacity-100'
      }`}
      style={{
        backgroundColor: isActive ? 'var(--bg-active)' : 'transparent',
        borderColor: isActive ? 'var(--accent)' : 'transparent',
        color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
      }}
    >
      <div className="flex items-center gap-2 min-w-0 pr-2">
        <MessageSquare
          className="w-3.5 h-3.5 shrink-0"
          style={{ color: isActive ? 'var(--accent)' : 'var(--text-muted)' }}
        />
        <span className="truncate font-medium">{conversation.title}</span>
      </div>

      <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={e => {
            e.stopPropagation();
            onTogglePin();
          }}
          className="p-1 rounded opacity-70 hover:opacity-100 cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          title={conversation.pinned ? 'Unpin thread' : 'Pin thread'}
        >
          <Pin className={`w-3 h-3 ${conversation.pinned ? 'fill-current' : ''}`} />
        </button>
        <button
          onClick={e => {
            e.stopPropagation();
            onDelete();
          }}
          className="p-1 rounded opacity-70 hover:opacity-100 hover:text-rose-400 cursor-pointer"
          style={{ color: 'var(--text-muted)' }}
          title="Delete thread"
        >
          <Trash2 className="w-3 h-3" />
        </button>
      </div>
    </div>
  );
};
