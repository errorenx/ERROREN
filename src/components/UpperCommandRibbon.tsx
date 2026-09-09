import React, { useState } from 'react';
import {
  Moon,
  Sun,
  Palette,
  Sparkles,
  Zap,
  Activity,
  Sliders,
  Check,
  ChevronDown,
} from 'lucide-react';
import {
  ColorId,
  COLOR_LIST,
  COLOR_PALETTES,
  ThemeMode,
} from '../utils/theme';

interface UpperCommandRibbonProps {
  currentMode: ThemeMode;
  currentColorId: ColorId;
  onSelectMode: (mode: ThemeMode) => void;
  onSelectColor: (colorId: ColorId) => void;
  onOpenSettings: () => void;
}

export const UpperCommandRibbon: React.FC<UpperCommandRibbonProps> = ({
  currentMode,
  currentColorId,
  onSelectMode,
  onSelectColor,
  onOpenSettings,
}) => {
  const [hoveredColor, setHoveredColor] = useState<string | null>(null);
  const [isPaletteExpandedMobile, setIsPaletteExpandedMobile] = useState(false);

  const activeColorDef = COLOR_PALETTES[currentColorId] || COLOR_PALETTES.cyan;

  return (
    <header className="relative w-full z-20 border-b select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-base)',
      }}
    >
      {/* 1. Cyber Aurora Dynamic Accent Beam */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none opacity-90 transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, transparent 0%, var(--accent) 35%, var(--accent-hover) 70%, transparent 100%)`,
          boxShadow: `0 0 12px var(--accent)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4 flex-wrap sm:flex-nowrap">
        {/* Left: Futuristic Brand & Neural Telemetry Core */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex items-center justify-center">
            <div
              className="w-8 h-8 rounded-lg border flex items-center justify-center relative overflow-hidden transition-all"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--border-focus)',
                boxShadow: `0 0 14px var(--accent-subtle)`,
              }}
            >
              <Zap
                className="w-4 h-4 animate-pulse"
                style={{ color: 'var(--accent)' }}
              />
            </div>
            {/* Pulsing Live Dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: 'var(--accent)' }}
              />
              <span
                className="relative inline-flex rounded-full h-2.5 w-2.5"
                style={{ backgroundColor: 'var(--accent)' }}
              />
            </span>
          </div>

          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span
                className="font-extrabold tracking-wider text-xs uppercase"
                style={{ color: 'var(--text-primary)' }}
              >
                ERROREN
              </span>
              <span
                className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded border"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-subtle)',
                  color: 'var(--accent)',
                }}
              >
                v5.0
              </span>
            </div>
            <div className="flex items-center gap-1 text-[10px] font-mono opacity-75" style={{ color: 'var(--text-muted)' }}>
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
              <span className="hidden md:inline">NEURAL AI ONLINE</span>
              <span className="md:hidden">ONLINE</span>
              <span className="opacity-40">·</span>
              <span className="text-[9px] font-bold" style={{ color: 'var(--accent)' }}>
                {activeColorDef.name.toUpperCase()}
              </span>
            </div>
          </div>
        </div>

        {/* Center / Right: The 10 Separate Colors Dock + Mode Switcher */}
        <div className="flex items-center gap-2 sm:gap-3 ml-auto">
          {/* Quick 10-Color Palette Dock (Desktop/Tablet) */}
          <div
            className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xs transition-all relative"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-base)',
            }}
          >
            <span
              className="text-[10px] font-bold uppercase tracking-wider font-mono mr-1 flex items-center gap-1"
              style={{ color: 'var(--text-muted)' }}
            >
              <Palette className="w-3 h-3" style={{ color: 'var(--accent)' }} />
              Colors:
            </span>

            {/* 10 Separate Color Buttons */}
            <div className="flex items-center gap-1.5">
              {COLOR_LIST.map((c, idx) => {
                const isSelected = currentColorId === c.id;
                return (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => onSelectColor(c.id)}
                    onMouseEnter={() => setHoveredColor(c.name)}
                    onMouseLeave={() => setHoveredColor(null)}
                    className="relative cursor-pointer transition-transform duration-150 hover:scale-125 focus:outline-hidden group"
                    title={`${c.name} (#${idx + 1})`}
                    aria-label={`Select ${c.name} color`}
                  >
                    <div
                      className={`w-5 h-5 rounded-full transition-all flex items-center justify-center ${
                        isSelected
                          ? 'ring-2 ring-white scale-110 shadow-sm'
                          : 'opacity-70 hover:opacity-100'
                      }`}
                      style={{
                        backgroundColor: c.preview,
                        boxShadow: isSelected ? `0 0 10px ${c.preview}` : 'none',
                      }}
                    >
                      {isSelected && (
                        <div className="w-1.5 h-1.5 rounded-full bg-white shadow-xs" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Live Hover Tag */}
            {hoveredColor && (
              <div
                className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded text-[9px] font-mono font-bold uppercase whitespace-nowrap shadow-md pointer-events-none z-30"
                style={{
                  backgroundColor: 'var(--bg-card)',
                  borderColor: 'var(--border-base)',
                  borderWidth: '1px',
                  color: 'var(--accent)',
                }}
              >
                {hoveredColor}
              </div>
            )}
          </div>

          {/* Mobile/Compact 10-Color Dropdown Trigger */}
          <div className="relative lg:hidden">
            <button
              type="button"
              onClick={() => setIsPaletteExpandedMobile(prev => !prev)}
              className="flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-mono font-bold cursor-pointer transition-all"
              style={{
                backgroundColor: 'var(--bg-card)',
                borderColor: 'var(--border-base)',
                color: 'var(--text-primary)',
              }}
              title="10 Accent Colors"
            >
              <div
                className="w-3.5 h-3.5 rounded-full shadow-xs"
                style={{
                  backgroundColor: activeColorDef.preview,
                  boxShadow: `0 0 6px ${activeColorDef.preview}`,
                }}
              />
              <span className="text-[10px] hidden xs:inline">{activeColorDef.name.split(' ')[0]}</span>
              <ChevronDown className="w-3 h-3 opacity-60" />
            </button>

            {/* Mobile Expanded Colors Popover */}
            {isPaletteExpandedMobile && (
              <div
                className="absolute right-0 top-full mt-2 p-2.5 rounded-xl border shadow-xl z-50 grid grid-cols-5 gap-2 w-52 animate-in fade-in zoom-in-95"
                style={{
                  backgroundColor: 'var(--bg-surface)',
                  borderColor: 'var(--border-base)',
                }}
              >
                <div className="col-span-5 text-[10px] font-bold uppercase tracking-wider mb-1 font-mono text-center opacity-70" style={{ color: 'var(--text-muted)' }}>
                  10 Signature Colors
                </div>
                {COLOR_LIST.map(c => {
                  const isSelected = currentColorId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        onSelectColor(c.id);
                        setIsPaletteExpandedMobile(false);
                      }}
                      className="p-1 rounded-lg flex flex-col items-center gap-1 cursor-pointer hover:bg-white/5 transition-all"
                    >
                      <div
                        className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          isSelected ? 'ring-2 ring-white scale-110 shadow-md' : 'opacity-80'
                        }`}
                        style={{ backgroundColor: c.preview }}
                      >
                        {isSelected && <Check className="w-3 h-3 text-white" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          {/* Independent Dark Mode / Light Mode Segmented Toggle Switch */}
          <div
            className="flex items-center p-0.5 rounded-full border shadow-2xs"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-base)',
            }}
          >
            {/* Dark Button */}
            <button
              type="button"
              onClick={() => onSelectMode('dark')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                currentMode === 'dark' ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: currentMode === 'dark' ? 'var(--accent)' : 'transparent',
                color: currentMode === 'dark' ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
              title="Activate Dark Mode"
            >
              <Moon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Dark</span>
            </button>

            {/* Light Button */}
            <button
              type="button"
              onClick={() => onSelectMode('light')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                currentMode === 'light' ? 'shadow-xs' : 'opacity-60 hover:opacity-100'
              }`}
              style={{
                backgroundColor: currentMode === 'light' ? 'var(--accent)' : 'transparent',
                color: currentMode === 'light' ? 'var(--accent-text)' : 'var(--text-secondary)',
              }}
              title="Activate Light Mode"
            >
              <Sun className="w-3.5 h-3.5 text-amber-500" />
              <span className="hidden sm:inline">Light</span>
            </button>
          </div>

          {/* Quick Settings Shortcut */}
          <button
            type="button"
            onClick={onOpenSettings}
            className="p-1.5 rounded-md border transition-all cursor-pointer opacity-75 hover:opacity-100"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-subtle)',
              color: 'var(--text-secondary)',
            }}
            title="Open Complete Appearance & System Settings"
          >
            <Sliders className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </header>
  );
};
