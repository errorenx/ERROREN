import React from 'react';
import {
  Zap,
  Sliders,
  FolderGit2,
  X,
} from 'lucide-react';
import {
  ColorId,
  COLOR_PALETTES,
  ThemeMode,
} from '../utils/theme';
import { Project } from '../types';

interface UpperCommandRibbonProps {
  currentMode: ThemeMode;
  currentColorId: ColorId;
  onOpenSettings: () => void;
  activeProject?: Project | null;
  onClearActiveProject?: () => void;
}

export const UpperCommandRibbon: React.FC<UpperCommandRibbonProps> = ({
  currentColorId,
  onOpenSettings,
  activeProject,
  onClearActiveProject,
}) => {
  const activeColorDef = COLOR_PALETTES[currentColorId] || COLOR_PALETTES.cyan;

  return (
    <header
      className="relative w-full z-20 border-b select-none transition-colors duration-200"
      style={{
        backgroundColor: 'var(--bg-surface)',
        borderColor: 'var(--border-base)',
      }}
    >
      {/* Dynamic Cyber Aurora Accent Beam */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] pointer-events-none opacity-90 transition-all duration-300"
        style={{
          background: `linear-gradient(90deg, transparent 0%, var(--accent) 35%, var(--accent-hover) 70%, transparent 100%)`,
          boxShadow: `0 0 12px var(--accent)`,
        }}
      />

      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2 flex items-center justify-between gap-2 sm:gap-4">
        {/* Left: Brand & Status */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <div className="relative flex items-center justify-center">
            <div
              className="w-7 h-7 rounded-lg border flex items-center justify-center relative overflow-hidden transition-all"
              style={{
                backgroundColor: 'var(--accent-subtle)',
                borderColor: 'var(--border-focus)',
                boxShadow: `0 0 10px var(--accent-subtle)`,
              }}
            >
              <Zap
                className="w-3.5 h-3.5 animate-pulse"
                style={{ color: 'var(--accent)' }}
              />
            </div>
            {/* Pulsing Live Dot */}
            <span className="absolute -top-0.5 -right-0.5 flex h-2 w-2">
              <span
                className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75"
                style={{ backgroundColor: 'var(--accent)' }}
              />
              <span
                className="relative inline-flex rounded-full h-2 w-2"
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
              <span>SYNTHETIC CORE ONLINE</span>
            </div>
          </div>
        </div>

        {/* Center: Active Project Indicator if any */}
        {activeProject && (
          <div
            className="flex items-center gap-2 px-3 py-1 rounded-full border text-xs font-mono"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-focus)',
              color: 'var(--text-primary)',
            }}
          >
            <FolderGit2 className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span className="opacity-60 text-[10px] uppercase tracking-wider">Project:</span>
            <span className="font-bold truncate max-w-[150px]">{activeProject.name}</span>
            {onClearActiveProject && (
              <button
                type="button"
                onClick={onClearActiveProject}
                className="p-0.5 rounded hover:bg-white/10 cursor-pointer opacity-60 hover:opacity-100 transition-opacity ml-1"
                title="Exit project view"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        )}

        {/* Right: Clean Settings Button (Houses Dark/Light, Colors, Profile, Share) */}
        <div className="flex items-center gap-2 ml-auto">
          <button
            type="button"
            onClick={onOpenSettings}
            className="flex items-center gap-2 py-1.5 px-3 rounded-lg border text-xs font-mono font-bold uppercase tracking-wider transition-all cursor-pointer shadow-xs hover:scale-102"
            style={{
              backgroundColor: 'var(--bg-card)',
              borderColor: 'var(--border-base)',
              color: 'var(--text-primary)',
            }}
            title="Open Settings (Theme, Mode, Profile, Share)"
          >
            <div
              className="w-2.5 h-2.5 rounded-full shadow-xs"
              style={{
                backgroundColor: activeColorDef.preview,
                boxShadow: `0 0 6px ${activeColorDef.preview}`,
              }}
            />
            <Sliders className="w-3.5 h-3.5" style={{ color: 'var(--accent)' }} />
            <span>Settings</span>
          </button>
        </div>
      </div>
    </header>
  );
};

