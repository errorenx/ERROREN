export type ThemeMode = 'dark' | 'light';

export type ColorId =
  | 'cyan'     // 1. Electric Cyan
  | 'emerald'  // 2. Emerald Green
  | 'purple'   // 3. Neon Violet
  | 'crimson'  // 4. Crimson Rose
  | 'amber'    // 5. Solar Amber
  | 'blue'     // 6. Royal Cobalt
  | 'orange'   // 7. Sunset Orange
  | 'lime'     // 8. Cyber Lime
  | 'pink'     // 9. Fuchsia Pink
  | 'teal';    // 10. Obsidian Teal

export interface ColorDefinition {
  id: ColorId;
  name: string;
  preview: string; // The vibrant hex code representing this color
  description: string;
  dark: {
    accent: string;
    accentHover: string;
    accentSubtle: string;
    accentText: string;
    borderFocus: string;
    glow: string;
  };
  light: {
    accent: string;
    accentHover: string;
    accentSubtle: string;
    accentText: string;
    borderFocus: string;
    glow: string;
  };
}

export const COLOR_PALETTES: Record<ColorId, ColorDefinition> = {
  cyan: {
    id: 'cyan',
    name: 'Electric Cyan',
    preview: '#00d2ff',
    description: 'Vivid cyberpunk cyan glow',
    dark: {
      accent: '#00d2ff',
      accentHover: '#38bdf8',
      accentSubtle: 'rgba(0, 210, 255, 0.15)',
      accentText: '#021020',
      borderFocus: '#00d2ff',
      glow: 'rgba(0, 210, 255, 0.45)',
    },
    light: {
      accent: '#0284c7',
      accentHover: '#0369a1',
      accentSubtle: 'rgba(2, 132, 199, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#0284c7',
      glow: 'rgba(2, 132, 199, 0.35)',
    },
  },
  emerald: {
    id: 'emerald',
    name: 'Emerald Green',
    preview: '#10b981',
    description: 'Luminous matrix neon emerald',
    dark: {
      accent: '#00ff88',
      accentHover: '#34d399',
      accentSubtle: 'rgba(0, 255, 136, 0.15)',
      accentText: '#022012',
      borderFocus: '#00ff88',
      glow: 'rgba(0, 255, 136, 0.45)',
    },
    light: {
      accent: '#059669',
      accentHover: '#047857',
      accentSubtle: 'rgba(5, 150, 105, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#059669',
      glow: 'rgba(5, 150, 105, 0.35)',
    },
  },
  purple: {
    id: 'purple',
    name: 'Neon Violet',
    preview: '#a855f7',
    description: 'Enigmatic deep neon amethyst',
    dark: {
      accent: '#c084fc',
      accentHover: '#d8b4fe',
      accentSubtle: 'rgba(192, 132, 252, 0.16)',
      accentText: '#16072b',
      borderFocus: '#c084fc',
      glow: 'rgba(192, 132, 252, 0.45)',
    },
    light: {
      accent: '#7c3aed',
      accentHover: '#6d28d9',
      accentSubtle: 'rgba(124, 58, 237, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#7c3aed',
      glow: 'rgba(124, 58, 237, 0.35)',
    },
  },
  crimson: {
    id: 'crimson',
    name: 'Crimson Rose',
    preview: '#f43f5e',
    description: 'Intense high-energy crimson scarlet',
    dark: {
      accent: '#ff385c',
      accentHover: '#fb7185',
      accentSubtle: 'rgba(255, 56, 92, 0.16)',
      accentText: '#ffffff',
      borderFocus: '#ff385c',
      glow: 'rgba(255, 56, 92, 0.45)',
    },
    light: {
      accent: '#e11d48',
      accentHover: '#be123c',
      accentSubtle: 'rgba(225, 29, 72, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#e11d48',
      glow: 'rgba(225, 29, 72, 0.35)',
    },
  },
  amber: {
    id: 'amber',
    name: 'Solar Amber',
    preview: '#f59e0b',
    description: 'Radiant golden cyber amber',
    dark: {
      accent: '#fbbf24',
      accentHover: '#fcd34d',
      accentSubtle: 'rgba(251, 191, 36, 0.16)',
      accentText: '#241500',
      borderFocus: '#fbbf24',
      glow: 'rgba(251, 191, 36, 0.45)',
    },
    light: {
      accent: '#d97706',
      accentHover: '#b45309',
      accentSubtle: 'rgba(217, 119, 6, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#d97706',
      glow: 'rgba(217, 119, 6, 0.35)',
    },
  },
  blue: {
    id: 'blue',
    name: 'Royal Cobalt',
    preview: '#3b82f6',
    description: 'Majestic sapphire deep ocean blue',
    dark: {
      accent: '#60a5fa',
      accentHover: '#93c5fd',
      accentSubtle: 'rgba(96, 165, 250, 0.16)',
      accentText: '#081a36',
      borderFocus: '#60a5fa',
      glow: 'rgba(96, 165, 250, 0.45)',
    },
    light: {
      accent: '#2563eb',
      accentHover: '#1d4ed8',
      accentSubtle: 'rgba(37, 99, 235, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#2563eb',
      glow: 'rgba(37, 99, 235, 0.35)',
    },
  },
  orange: {
    id: 'orange',
    name: 'Sunset Orange',
    preview: '#f97316',
    description: 'Fiery neon twilight orange',
    dark: {
      accent: '#fb923c',
      accentHover: '#fdba74',
      accentSubtle: 'rgba(251, 146, 60, 0.16)',
      accentText: '#2e1104',
      borderFocus: '#fb923c',
      glow: 'rgba(251, 146, 60, 0.45)',
    },
    light: {
      accent: '#ea580c',
      accentHover: '#c2410c',
      accentSubtle: 'rgba(234, 88, 12, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#ea580c',
      glow: 'rgba(234, 88, 12, 0.35)',
    },
  },
  lime: {
    id: 'lime',
    name: 'Cyber Lime',
    preview: '#84cc16',
    description: 'High-visibility fluorescent neon lime',
    dark: {
      accent: '#a3e635',
      accentHover: '#bef264',
      accentSubtle: 'rgba(163, 230, 53, 0.16)',
      accentText: '#192e03',
      borderFocus: '#a3e635',
      glow: 'rgba(163, 230, 53, 0.45)',
    },
    light: {
      accent: '#65a30d',
      accentHover: '#4d7c0f',
      accentSubtle: 'rgba(101, 163, 13, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#65a30d',
      glow: 'rgba(101, 163, 13, 0.35)',
    },
  },
  pink: {
    id: 'pink',
    name: 'Fuchsia Pink',
    preview: '#ec4899',
    description: 'Electrifying neon fuchsia synthwave',
    dark: {
      accent: '#f472b6',
      accentHover: '#f9a8d4',
      accentSubtle: 'rgba(244, 114, 182, 0.16)',
      accentText: '#2e071b',
      borderFocus: '#f472b6',
      glow: 'rgba(244, 114, 182, 0.45)',
    },
    light: {
      accent: '#db2777',
      accentHover: '#be185d',
      accentSubtle: 'rgba(219, 39, 119, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#db2777',
      glow: 'rgba(219, 39, 119, 0.35)',
    },
  },
  teal: {
    id: 'teal',
    name: 'Obsidian Teal',
    preview: '#14b8a6',
    description: 'Futuristic crystalline seafoam turquoise',
    dark: {
      accent: '#2dd4bf',
      accentHover: '#5eead4',
      accentSubtle: 'rgba(45, 212, 191, 0.16)',
      accentText: '#042421',
      borderFocus: '#2dd4bf',
      glow: 'rgba(45, 212, 191, 0.45)',
    },
    light: {
      accent: '#0d9488',
      accentHover: '#0f766e',
      accentSubtle: 'rgba(13, 148, 136, 0.12)',
      accentText: '#ffffff',
      borderFocus: '#0d9488',
      glow: 'rgba(13, 148, 136, 0.35)',
    },
  },
};

export const COLOR_LIST: ColorDefinition[] = Object.values(COLOR_PALETTES);

export const DARK_BASE_VARS: Record<string, string> = {
  '--bg-base': '#070d1a',
  '--bg-surface': '#0d172e',
  '--bg-card': '#122040',
  '--bg-card-hover': '#182b54',
  '--bg-active': '#1e3568',
  '--border-base': '#1e325c',
  '--border-subtle': '#142342',
  '--text-primary': '#f0f6fc',
  '--text-secondary': '#9bb0d1',
  '--text-muted': '#5b7298',
  '--code-bg': '#0a1324',
  '--scrollbar-thumb': '#1e325c',
};

export const LIGHT_BASE_VARS: Record<string, string> = {
  '--bg-base': '#f6f8fc',
  '--bg-surface': '#ffffff',
  '--bg-card': '#edf2fa',
  '--bg-card-hover': '#e2eaf6',
  '--bg-active': '#d4e2f5',
  '--border-base': '#c5d5ec',
  '--border-subtle': '#dce6f5',
  '--text-primary': '#0a1628',
  '--text-secondary': '#334766',
  '--text-muted': '#687e9d',
  '--code-bg': '#edf2fa',
  '--scrollbar-thumb': '#c5d5ec',
};

export const DEFAULT_THEME_MODE: ThemeMode = 'dark';
export const DEFAULT_COLOR_ID: ColorId = 'cyan';

const STORAGE_MODE_KEY = 'erroren_theme_mode_v3';
const STORAGE_COLOR_KEY = 'erroren_color_id_v3';
const LEGACY_STORAGE_THEME_KEY = 'erroren_color_theme_v2';

export function loadSavedThemeMode(): ThemeMode {
  try {
    const saved = localStorage.getItem(STORAGE_MODE_KEY);
    if (saved === 'dark' || saved === 'light') return saved;
    // Check legacy
    const legacy = localStorage.getItem(LEGACY_STORAGE_THEME_KEY);
    if (legacy && (legacy.includes('white') || legacy.includes('soft') || legacy.includes('lavender') || legacy.includes('mint') || legacy.includes('cream'))) {
      return 'light';
    }
  } catch {}
  return DEFAULT_THEME_MODE;
}

export function saveThemeMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_MODE_KEY, mode);
  } catch (e) {
    console.error('Failed to save theme mode', e);
  }
}

export function loadSavedColorId(): ColorId {
  try {
    const saved = localStorage.getItem(STORAGE_COLOR_KEY) as ColorId;
    if (saved && COLOR_PALETTES[saved]) return saved;
    // Check legacy
    const legacy = localStorage.getItem(LEGACY_STORAGE_THEME_KEY);
    if (legacy) {
      if (legacy.includes('purple') || legacy.includes('lavender')) return 'purple';
      if (legacy.includes('emerald') || legacy.includes('mint')) return 'emerald';
      if (legacy.includes('crimson')) return 'crimson';
      if (legacy.includes('cream')) return 'amber';
      if (legacy.includes('blue')) return 'blue';
    }
  } catch {}
  return DEFAULT_COLOR_ID;
}

export function saveColorId(colorId: ColorId): void {
  try {
    localStorage.setItem(STORAGE_COLOR_KEY, colorId);
  } catch (e) {
    console.error('Failed to save color ID', e);
  }
}

/**
 * Apply the selected Theme Mode ('dark' | 'light') and Color Palette (1 of 10) across the entire application.
 */
export function applyTheme(mode: ThemeMode, colorId: ColorId): void {
  const safeMode: ThemeMode = mode === 'light' ? 'light' : 'dark';
  const colorDef = COLOR_PALETTES[colorId] || COLOR_PALETTES[DEFAULT_COLOR_ID];
  const baseVars = safeMode === 'dark' ? DARK_BASE_VARS : LIGHT_BASE_VARS;
  const colorVars = safeMode === 'dark' ? colorDef.dark : colorDef.light;

  const root = document.documentElement;

  // Set standard HTML data attributes and CSS classes
  root.setAttribute('data-theme-mode', safeMode);
  root.setAttribute('data-theme-color', colorDef.id);
  root.setAttribute('data-theme', `${colorDef.id}-${safeMode}`);
  
  if (safeMode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Inject mode base surface variables
  Object.entries(baseVars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });

  // Inject color accent variables
  root.style.setProperty('--accent', colorVars.accent);
  root.style.setProperty('--accent-hover', colorVars.accentHover);
  root.style.setProperty('--accent-subtle', colorVars.accentSubtle);
  root.style.setProperty('--accent-text', colorVars.accentText);
  root.style.setProperty('--border-focus', colorVars.borderFocus);
  root.style.setProperty('--accent-glow', colorVars.glow);

  // Directly adjust body styles for zero-delay repaints
  document.body.style.backgroundColor = baseVars['--bg-base'];
  document.body.style.color = baseVars['--text-primary'];
}

// ----------------------------------------------------------------------
// BACKWARD COMPATIBILITY LAYER FOR EXISTING COMPONENTS
// ----------------------------------------------------------------------
export type ThemeId = string;

export interface ThemeDefinition {
  id: string;
  name: string;
  mode: ThemeMode;
  colorId: ColorId;
  description: string;
  preview: {
    bg: string;
    surface: string;
    card: string;
    border: string;
    accent: string;
    text: string;
  };
  cssVars: Record<string, string>;
}

export const DEFAULT_THEME_ID = 'midnight-blue';

// Generate synthetic legacy THEMES map so older imports continue working flawlessly
export const THEMES: Record<string, ThemeDefinition> = {};
['dark', 'light'].forEach(m => {
  COLOR_LIST.forEach(c => {
    const id = `${c.id}-${m}`;
    const base = m === 'dark' ? DARK_BASE_VARS : LIGHT_BASE_VARS;
    const colorSty = m === 'dark' ? c.dark : c.light;
    THEMES[id] = {
      id,
      name: `${c.name} (${m === 'dark' ? 'Dark' : 'Light'})`,
      mode: m as ThemeMode,
      colorId: c.id,
      description: c.description,
      preview: {
        bg: base['--bg-base'],
        surface: base['--bg-surface'],
        card: base['--bg-card'],
        border: base['--border-base'],
        accent: colorSty.accent,
        text: base['--text-primary'],
      },
      cssVars: {
        ...base,
        '--accent': colorSty.accent,
        '--accent-hover': colorSty.accentHover,
        '--accent-subtle': colorSty.accentSubtle,
        '--accent-text': colorSty.accentText,
        '--border-focus': colorSty.borderFocus,
      },
    };
  });
});
// Add aliases for old legacy IDs
THEMES['midnight-blue'] = THEMES['cyan-dark'];
THEMES['dark-purple'] = THEMES['purple-dark'];
THEMES['emerald-dark'] = THEMES['emerald-dark'];
THEMES['crimson-dark'] = THEMES['crimson-dark'];
THEMES['graphite-black'] = THEMES['blue-dark'];
THEMES['clean-white'] = THEMES['cyan-light'];
THEMES['soft-blue'] = THEMES['blue-light'];
THEMES['lavender'] = THEMES['purple-light'];
THEMES['mint'] = THEMES['emerald-light'];
THEMES['warm-cream'] = THEMES['amber-light'];

export const THEME_LIST: ThemeDefinition[] = Object.values(THEMES);
export const DARK_THEMES = THEME_LIST.filter(t => t.mode === 'dark');
export const LIGHT_THEMES = THEME_LIST.filter(t => t.mode === 'light');

export function loadSavedThemeId(): string {
  const mode = loadSavedThemeMode();
  const color = loadSavedColorId();
  return `${color}-${mode}`;
}

export function saveThemeId(themeId: string): void {
  // If string like "cyan-dark", extract mode and color
  const parts = themeId.split('-');
  if (parts.length >= 2) {
    const color = parts[0] as ColorId;
    const mode = parts[1] as ThemeMode;
    if (COLOR_PALETTES[color]) saveColorId(color);
    if (mode === 'dark' || mode === 'light') saveThemeMode(mode);
  }
}
