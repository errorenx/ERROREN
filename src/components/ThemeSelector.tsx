import React from 'react';
import { Check, Moon, Sun, Sparkles } from 'lucide-react';
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

  const handleModeSwitch = (mode: ThemeMode) => {
    if (mode === currentTheme.mode) return;
    if (mode === 'dark') {
      onSelectTheme('midnight-blue');
    } else {
      onSelectTheme('clean-white');
    }
  };

  return (
    <div className="space-y-6">
      {/* Mode Quick Switcher */}
      <div className="flex items-center justify-between p-3 rounded-lg border transition-colors"
        style={{
          backgroundColor: 'var(--bg-card)',
          borderColor: 'var(--border-base)',
        }}
      >
        <div className="flex items-center gap-2.5">
          <div
            className="w-7 h-7 rounded flex items-center justify-center transition-colors"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent)',
            }}
          >
            {currentTheme.mode === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
          </div>
          <div>
            <div className="font-bold text-xs uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
              Appearance Mode
            </div>
            <div className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
              Active: {currentTheme.mode === 'dark' ? 'Dark Mode' : 'Light Mode'} ({currentTheme.name})
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 p-1 rounded-md border"
          style={{
            backgroundColor: 'var(--bg-base)',
            borderColor: 'var(--border-subtle)',
          }}
        >
          <button
            type="button"
            onClick={() => handleModeSwitch('dark')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              currentTheme.mode === 'dark'
                ? 'shadow-xs'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: currentTheme.mode === 'dark' ? 'var(--accent)' : 'transparent',
              color: currentTheme.mode === 'dark' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Moon className="w-3.5 h-3.5" />
            <span>Dark</span>
          </button>

          <button
            type="button"
            onClick={() => handleModeSwitch('light')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded text-xs font-semibold uppercase tracking-wider transition-all cursor-pointer ${
              currentTheme.mode === 'light'
                ? 'shadow-xs'
                : 'opacity-70 hover:opacity-100'
            }`}
            style={{
              backgroundColor: currentTheme.mode === 'light' ? 'var(--accent)' : 'transparent',
              color: currentTheme.mode === 'light' ? 'var(--accent-text)' : 'var(--text-secondary)',
            }}
          >
            <Sun className="w-3.5 h-3.5" />
            <span>Light</span>
          </button>
        </div>
      </div>

      {/* Dark Themes Group (5 Themes) */}
      <div className="space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            <Moon className="w-3.5 h-3.5 text-indigo-400" />
            <span>Dark Themes (5)</span>
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase opacity-60" style={{ color: 'var(--text-muted)' }}>
            High Contrast Dark
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {DARK_THEMES.map(theme => {
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
                className={`relative p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 outline-none select-none group ${
                  isSelected ? 'ring-2' : 'hover:scale-[1.01]'
                }`}
                style={{
                  backgroundColor: theme.preview.bg,
                  borderColor: isSelected ? theme.preview.accent : theme.preview.border,
                  boxShadow: isSelected ? `0 0 14px ${theme.preview.accent}33` : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5" style={{ color: theme.preview.text }}>
                      <span>{theme.name}</span>
                      {isSelected && (
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider"
                          style={{
                            backgroundColor: theme.preview.accent,
                            color: '#000',
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-70 line-clamp-1" style={{ color: theme.preview.text }}>
                      {theme.description}
                    </div>
                  </div>

                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border"
                    style={{
                      borderColor: isSelected ? theme.preview.accent : theme.preview.border,
                      backgroundColor: isSelected ? theme.preview.accent : 'transparent',
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-black font-bold" />}
                  </div>
                </div>

                {/* Color Swatch Previews */}
                <div className="flex items-center gap-1.5 pt-1">
                  <div
                    className="w-4 h-4 rounded-full border border-black/30 shrink-0"
                    title="Background"
                    style={{ backgroundColor: theme.preview.bg }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/30 shrink-0"
                    title="Card / Surface"
                    style={{ backgroundColor: theme.preview.card }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/30 shrink-0"
                    title="Accent Color"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/30 shrink-0"
                    title="Border"
                    style={{ backgroundColor: theme.preview.border }}
                  />
                  <span className="text-[10px] font-mono ml-auto opacity-60" style={{ color: theme.preview.text }}>
                    {theme.preview.accent}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Light Themes Group (5 Themes) */}
      <div className="space-y-2.5 pt-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
            <Sun className="w-3.5 h-3.5 text-amber-500" />
            <span>Light Themes (5)</span>
          </div>
          <span className="text-[10px] font-mono tracking-widest uppercase opacity-60" style={{ color: 'var(--text-muted)' }}>
            Clean Minimal Light
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {LIGHT_THEMES.map(theme => {
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
                className={`relative p-3 rounded-lg border text-left cursor-pointer transition-all duration-150 outline-none select-none group ${
                  isSelected ? 'ring-2' : 'hover:scale-[1.01]'
                }`}
                style={{
                  backgroundColor: theme.preview.bg,
                  borderColor: isSelected ? theme.preview.accent : theme.preview.border,
                  boxShadow: isSelected ? `0 0 14px ${theme.preview.accent}33` : 'none',
                }}
              >
                <div className="flex items-start justify-between gap-2 mb-2">
                  <div>
                    <div className="font-bold text-xs flex items-center gap-1.5" style={{ color: theme.preview.text }}>
                      <span>{theme.name}</span>
                      {isSelected && (
                        <span
                          className="text-[9px] px-1.5 py-0.2 rounded font-mono font-bold tracking-wider"
                          style={{
                            backgroundColor: theme.preview.accent,
                            color: '#fff',
                          }}
                        >
                          ACTIVE
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] mt-0.5 opacity-70 line-clamp-1" style={{ color: theme.preview.text }}>
                      {theme.description}
                    </div>
                  </div>

                  <div
                    className="w-5 h-5 rounded-full flex items-center justify-center shrink-0 border"
                    style={{
                      borderColor: isSelected ? theme.preview.accent : theme.preview.border,
                      backgroundColor: isSelected ? theme.preview.accent : 'transparent',
                    }}
                  >
                    {isSelected && <Check className="w-3 h-3 text-white font-bold" />}
                  </div>
                </div>

                {/* Color Swatch Previews */}
                <div className="flex items-center gap-1.5 pt-1">
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    title="Background"
                    style={{ backgroundColor: theme.preview.bg }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    title="Card / Surface"
                    style={{ backgroundColor: theme.preview.card }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    title="Accent Color"
                    style={{ backgroundColor: theme.preview.accent }}
                  />
                  <div
                    className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                    title="Border"
                    style={{ backgroundColor: theme.preview.border }}
                  />
                  <span className="text-[10px] font-mono ml-auto opacity-70" style={{ color: theme.preview.text }}>
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
