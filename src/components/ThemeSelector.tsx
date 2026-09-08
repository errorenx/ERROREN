import React, { useState } from 'react';
import { Check, Moon, Sun, Palette, Sparkles } from 'lucide-react';
import {
  ThemeId,
  ThemeMode,
  THEMES,
  DARK_THEMES,
  LIGHT_THEMES,
  DEFAULT_THEME_ID,
} from '../utils/theme';

interface ThemeSelectorProps {
  currentThemeId: ThemeId;
  onSelectTheme: (themeId: ThemeId) => void;
  onToggleMode?: () => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentThemeId,
  onSelectTheme,
}) => {
  const currentTheme = THEMES[currentThemeId] || THEMES[DEFAULT_THEME_ID];
  // Active tab defaults to the mode of the currently selected theme
  const [activeTab, setActiveTab] = useState<ThemeMode>(currentTheme.mode);

  const handleTabChange = (mode: ThemeMode) => {
    setActiveTab(mode);
  };

  const handleQuickToggle = () => {
    const nextMode: ThemeMode = currentTheme.mode === 'dark' ? 'light' : 'dark';
    setActiveTab(nextMode);
    if (nextMode === 'dark') {
      onSelectTheme('midnight-blue');
    } else {
      onSelectTheme('clean-white');
    }
  };

  const displayedThemes = activeTab === 'dark' ? DARK_THEMES : LIGHT_THEMES;

  return (
    <div className="space-y-5">
      {/* Top Controls: Quick Mode Toggle & Distinct Tab Switcher */}
      <div
        className="p-3.5 rounded-xl border flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xs"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-base)',
        }}
      >
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div
            className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0 border"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--accent)',
            }}
          >
            {activeTab === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5 text-amber-500" />}
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-wider flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
              <span>Theme Category</span>
              <span
                className="text-[9px] font-mono px-1.5 py-0.5 rounded font-bold uppercase tracking-wider"
                style={{
                  backgroundColor: 'var(--accent)',
                  color: 'var(--accent-text)',
                }}
              >
                {currentTheme.name}
              </span>
            </div>
            <div className="text-[11px] opacity-70" style={{ color: 'var(--text-muted)' }}>
              Choose from 5 dark or 5 light hand-crafted color palettes
            </div>
          </div>
        </div>

        {/* Distinct Segmented Control Tabs */}
        <div
          className="flex items-center p-1 rounded-lg border w-full sm:w-auto justify-center"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => handleTabChange('dark')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'dark' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'dark' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'dark' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark Themes (5)</span>
          </button>

          <button
            type="button"
            onClick={() => handleTabChange('light')}
            className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-md text-xs font-bold uppercase tracking-wider transition-all cursor-pointer ${
              activeTab === 'light' ? 'shadow-md' : 'opacity-60 hover:opacity-100'
            }`}
            style={{
              backgroundColor: activeTab === 'light' ? 'var(--accent)' : 'transparent',
              color: activeTab === 'light' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light Themes (5)</span>
          </button>
        </div>
      </div>

      {/* Themes Grid */}
      <div className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            {activeTab === 'dark' ? (
              <>
                <Moon className="w-4 h-4 text-indigo-400" />
                <span>Selected: Dark Mode Color Palettes</span>
              </>
            ) : (
              <>
                <Sun className="w-4 h-4 text-amber-500" />
                <span>Selected: Light Mode Color Palettes</span>
              </>
            )}
          </div>
          <button
            type="button"
            onClick={handleQuickToggle}
            className="text-[11px] font-mono uppercase tracking-wider flex items-center gap-1 cursor-pointer transition-opacity opacity-80 hover:opacity-100"
            style={{ color: 'var(--accent)' }}
          >
            <Sparkles className="w-3 h-3" />
            <span>Toggle {activeTab === 'dark' ? 'Light' : 'Dark'}</span>
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {displayedThemes.map(theme => {
            const isSelected = theme.id === currentThemeId;
            return (
              <div
                key={theme.id}
                role="button"
                tabIndex={0}
                onClick={() => onSelectTheme(theme.id)}
                onKeyDown={e => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    onSelectTheme(theme.id);
                  }
                }}
                className={`relative p-3.5 rounded-xl border text-left cursor-pointer transition-all duration-200 outline-none select-none group ${
                  isSelected ? 'scale-[1.02] shadow-xl' : 'hover:scale-[1.01]'
                }`}
                style={{
                  backgroundColor: theme.preview.bg,
                  borderColor: isSelected ? theme.preview.accent : theme.preview.border,
                  boxShadow: isSelected ? `0 0 16px ${theme.preview.accent}30` : 'none',
                }}
              >
                {/* Header with Title and Active Badge */}
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-bold text-xs flex items-center gap-2" style={{ color: theme.preview.text }}>
                      <span>{theme.name}</span>
                      {isSelected && (
                        <span
                          className="text-[9px] px-2 py-0.5 rounded font-mono font-bold tracking-wider"
                          style={{
                            backgroundColor: theme.preview.accent,
                            color: theme.mode === 'dark' ? '#021020' : '#ffffff',
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] mt-1 opacity-75 leading-tight" style={{ color: theme.preview.text }}>
                      {theme.description}
                    </div>
                  </div>

                  {/* Selection Radio / Checkmark Indicator */}
                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border transition-transform group-hover:scale-110"
                    style={{
                      borderColor: isSelected ? theme.preview.accent : theme.preview.border,
                      backgroundColor: isSelected ? theme.preview.accent : 'transparent',
                    }}
                  >
                    {isSelected && (
                      <Check
                        className="w-3 h-3 font-bold"
                        style={{ color: theme.mode === 'dark' ? '#021020' : '#ffffff' }}
                      />
                    )}
                  </div>
                </div>

                {/* Color Swatch Previews */}
                <div
                  className="mt-3 pt-2.5 border-t flex items-center gap-2"
                  style={{ borderColor: `${theme.preview.border}80` }}
                >
                  <div className="flex items-center gap-1.5">
                    <div
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                      title="Background"
                      style={{ backgroundColor: theme.preview.bg }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                      title="Surface / Card"
                      style={{ backgroundColor: theme.preview.card }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                      title="Accent"
                      style={{ backgroundColor: theme.preview.accent }}
                    />
                    <div
                      className="w-4 h-4 rounded-full border border-black/20 shrink-0 shadow-2xs"
                      title="Border"
                      style={{ backgroundColor: theme.preview.border }}
                    />
                  </div>

                  <span
                    className="text-[10px] font-mono ml-auto font-bold uppercase tracking-wider"
                    style={{ color: theme.preview.accent }}
                  >
                    {theme.preview.accent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
