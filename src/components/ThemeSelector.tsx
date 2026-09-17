import React from 'react';
import { Check, Moon, Sun, Palette, Sparkles, ShieldCheck } from 'lucide-react';
import {
  ColorId,
  COLOR_LIST,
  COLOR_PALETTES,
  DEFAULT_COLOR_ID,
  DEFAULT_THEME_MODE,
  ThemeMode,
} from '../utils/theme';

interface ThemeSelectorProps {
  currentMode: ThemeMode;
  currentColorId: ColorId;
  onSelectMode: (mode: ThemeMode) => void;
  onSelectColor: (colorId: ColorId) => void;
  // Optional backward compatibility
  currentThemeId?: string;
  onSelectTheme?: (themeId: string) => void;
}

export const ThemeSelector: React.FC<ThemeSelectorProps> = ({
  currentMode = DEFAULT_THEME_MODE,
  currentColorId = DEFAULT_COLOR_ID,
  onSelectMode,
  onSelectColor,
  onSelectTheme,
}) => {
  const activeColor = COLOR_PALETTES[currentColorId] || COLOR_PALETTES[DEFAULT_COLOR_ID];

  const handleModeChange = (mode: ThemeMode) => {
    onSelectMode(mode);
    if (onSelectTheme) {
      onSelectTheme(`${currentColorId}-${mode}`);
    }
  };

  const handleColorChange = (colorId: ColorId) => {
    onSelectColor(colorId);
    if (onSelectTheme) {
      onSelectTheme(`${colorId}-${currentMode}`);
    }
  };

  return (
    <div className="space-y-6">
      {/* SECTION 1: APPEARANCE MODE (DARK MODE vs LIGHT MODE) */}
      <div>
        <div className="flex items-center justify-between mb-2.5">
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-md"
              style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              {currentMode === 'dark' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                1. Appearance Mode
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Independent Dark and Light base architecture
              </p>
            </div>
          </div>
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent)',
            }}
          >
            Active: {currentMode === 'dark' ? 'Dark Mode' : 'Light Mode'}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {/* Dark Mode Card */}
          <button
            type="button"
            onClick={() => handleModeChange('dark')}
            className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer group ${
              currentMode === 'dark'
                ? 'ring-2 shadow-lg'
                : 'opacity-75 hover:opacity-100'
            }`}
            style={{
              backgroundColor: '#0c1424',
              borderColor: currentMode === 'dark' ? 'var(--accent)' : '#1e293b',
              color: '#f8fafc',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#152238] border border-[#233554] flex items-center justify-center text-cyan-400">
                  <Moon className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-white">Dark Mode</div>
                  <div className="text-[10px] text-slate-400">Deep cyber midnight surfaces</div>
                </div>
              </div>
              {currentMode === 'dark' && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Mini preview illustration */}
            <div className="p-2.5 rounded-lg bg-[#070d1a] border border-[#182642] flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeColor.dark.accent }} />
              <div className="h-2 flex-1 rounded bg-[#162544]" />
              <div
                className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold"
                style={{ backgroundColor: activeColor.dark.accent, color: activeColor.dark.accentText }}
              >
                AI
              </div>
            </div>
          </button>

          {/* Light Mode Card */}
          <button
            type="button"
            onClick={() => handleModeChange('light')}
            className={`p-4 rounded-xl border text-left transition-all relative cursor-pointer group ${
              currentMode === 'light'
                ? 'ring-2 shadow-lg'
                : 'opacity-75 hover:opacity-100'
            }`}
            style={{
              backgroundColor: '#ffffff',
              borderColor: currentMode === 'light' ? 'var(--accent)' : '#e2e8f0',
              color: '#0f172a',
            }}
          >
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-[#f1f5f9] border border-[#cbd5e1] flex items-center justify-center text-amber-500">
                  <Sun className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-slate-900">Light Mode</div>
                  <div className="text-[10px] text-slate-500">Clean high-contrast daylight surfaces</div>
                </div>
              </div>
              {currentMode === 'light' && (
                <div
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold"
                  style={{ backgroundColor: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  <Check className="w-3 h-3" />
                </div>
              )}
            </div>

            {/* Mini preview illustration */}
            <div className="p-2.5 rounded-lg bg-[#f8fafc] border border-[#e2e8f0] flex items-center gap-2">
              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: activeColor.light.accent }} />
              <div className="h-2 flex-1 rounded bg-[#e2e8f0]" />
              <div
                className="text-[9px] px-1.5 py-0.5 rounded font-mono font-bold"
                style={{ backgroundColor: activeColor.light.accent, color: activeColor.light.accentText }}
              >
                AI
              </div>
            </div>
          </button>
        </div>
      </div>

      {/* SECTION 2: 10 SEPARATE ACCENT COLORS */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div
              className="p-1.5 rounded-md"
              style={{ backgroundColor: 'var(--accent-subtle)', color: 'var(--accent)' }}
            >
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--text-primary)' }}>
                2. Signature Color Palette
              </h3>
              <p className="text-[11px]" style={{ color: 'var(--text-muted)' }}>
                Select any theme color to apply across Dark or Light Mode
              </p>
            </div>
          </div>
          <span
            className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full uppercase"
            style={{
              backgroundColor: 'var(--accent-subtle)',
              color: 'var(--accent)',
            }}
          >
            {activeColor.name}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
          {COLOR_LIST.map(color => {
            const isSelected = currentColorId === color.id;
            const accentHex = currentMode === 'dark' ? color.dark.accent : color.light.accent;
            const isGradient = color.preview.startsWith('linear-gradient');

            return (
              <button
                key={color.id}
                type="button"
                onClick={() => handleColorChange(color.id)}
                className={`p-3 rounded-xl border flex flex-col items-center text-center gap-2.5 transition-all cursor-pointer relative group ${
                  isSelected
                    ? 'ring-2 scale-[1.02] shadow-md'
                    : 'opacity-85 hover:opacity-100 hover:scale-[1.01]'
                }`}
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: isSelected ? accentHex : 'var(--border-subtle)',
                }}
              >
                {/* Active Check Indicator */}
                <div className="w-full flex items-center justify-end px-0.5 h-4">
                  {isSelected && (
                    <span
                      className="w-4 h-4 rounded-full flex items-center justify-center text-white text-[9px] shadow-xs"
                      style={{ backgroundColor: accentHex }}
                    >
                      <Check className="w-2.5 h-2.5" />
                    </span>
                  )}
                </div>

                {/* Color Swatch Circle with Glow */}
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 shadow-sm border border-white/10"
                  style={{
                    background: isGradient ? color.preview : undefined,
                    backgroundColor: isGradient ? undefined : color.preview,
                    boxShadow: isSelected ? '0 0 16px rgba(255, 255, 255, 0.25)' : 'none',
                  }}
                />

                {/* Color Name */}
                <div className="w-full">
                  <div className="text-[11px] font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                    {color.name}
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Synchronized Status Banner */}
      <div
        className="p-3 rounded-lg border flex items-center justify-between gap-3 text-xs"
        style={{
          backgroundColor: 'var(--bg-base)',
          borderColor: 'var(--border-subtle)',
          color: 'var(--text-secondary)',
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4" style={{ color: 'var(--accent)' }} />
          <span>
            Active Setup: <strong style={{ color: 'var(--text-primary)' }}>{currentMode === 'dark' ? 'Dark Mode' : 'Light Mode'}</strong> with <strong style={{ color: 'var(--accent)' }}>{activeColor.name}</strong>
          </span>
        </div>
        <div className="flex items-center gap-1.5 text-[10px] font-mono opacity-70">
          <ShieldCheck className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
          <span>100% Active</span>
        </div>
      </div>
    </div>
  );
};
