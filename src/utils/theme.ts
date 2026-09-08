export type ThemeMode = 'dark' | 'light';

export type ThemeId =
  // 5 Dark Themes
  | 'midnight-blue'
  | 'dark-purple'
  | 'emerald-dark'
  | 'crimson-dark'
  | 'graphite-black'
  // 5 Light Themes
  | 'clean-white'
  | 'soft-blue'
  | 'lavender'
  | 'mint'
  | 'warm-cream';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  mode: ThemeMode;
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

export const THEMES: Record<ThemeId, ThemeDefinition> = {
  // --- 5 DARK THEMES ---
  'midnight-blue': {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    mode: 'dark',
    description: 'Deep celestial navy with electric cyan highlights',
    preview: {
      bg: '#070d1a',
      surface: '#0d172e',
      card: '#122040',
      border: '#1e325c',
      accent: '#00d2ff',
      text: '#f0f6fc',
    },
    cssVars: {
      '--bg-base': '#070d1a',
      '--bg-surface': '#0d172e',
      '--bg-card': '#122040',
      '--bg-card-hover': '#182b54',
      '--bg-active': '#1e3568',
      '--border-base': '#1e325c',
      '--border-subtle': '#142342',
      '--border-focus': '#00d2ff',
      '--text-primary': '#f0f6fc',
      '--text-secondary': '#9bb0d1',
      '--text-muted': '#5b7298',
      '--accent': '#00d2ff',
      '--accent-hover': '#38bdf8',
      '--accent-subtle': 'rgba(0, 210, 255, 0.12)',
      '--accent-text': '#021020',
      '--code-bg': '#0a1324',
      '--scrollbar-thumb': '#1e325c',
    },
  },
  'dark-purple': {
    id: 'dark-purple',
    name: 'Dark Purple',
    mode: 'dark',
    description: 'Enigmatic obsidian violet with luminous neon amethyst',
    preview: {
      bg: '#0c0614',
      surface: '#140924',
      card: '#1e0f34',
      border: '#351c58',
      accent: '#c084fc',
      text: '#faf5ff',
    },
    cssVars: {
      '--bg-base': '#0c0614',
      '--bg-surface': '#140924',
      '--bg-card': '#1e0f34',
      '--bg-card-hover': '#291446',
      '--bg-active': '#341959',
      '--border-base': '#351c58',
      '--border-subtle': '#25123d',
      '--border-focus': '#c084fc',
      '--text-primary': '#faf5ff',
      '--text-secondary': '#d8b4fe',
      '--text-muted': '#8a67b5',
      '--accent': '#c084fc',
      '--accent-hover': '#d8b4fe',
      '--accent-subtle': 'rgba(192, 132, 252, 0.14)',
      '--accent-text': '#16072b',
      '--code-bg': '#10081a',
      '--scrollbar-thumb': '#351c58',
    },
  },
  'emerald-dark': {
    id: 'emerald-dark',
    name: 'Emerald Dark',
    mode: 'dark',
    description: 'Deep nocturnal forest with vivid matrix jade',
    preview: {
      bg: '#040f09',
      surface: '#081a10',
      card: '#0d281a',
      border: '#16422b',
      accent: '#00ff88',
      text: '#ecfdf5',
    },
    cssVars: {
      '--bg-base': '#040f09',
      '--bg-surface': '#081a10',
      '--bg-card': '#0d281a',
      '--bg-card-hover': '#123623',
      '--bg-active': '#17442d',
      '--border-base': '#16422b',
      '--border-subtle': '#0e2b1c',
      '--border-focus': '#00ff88',
      '--text-primary': '#ecfdf5',
      '--text-secondary': '#6ee7b7',
      '--text-muted': '#3b785d',
      '--accent': '#00ff88',
      '--accent-hover': '#34d399',
      '--accent-subtle': 'rgba(0, 255, 136, 0.12)',
      '--accent-text': '#02180d',
      '--code-bg': '#06140c',
      '--scrollbar-thumb': '#16422b',
    },
  },
  'crimson-dark': {
    id: 'crimson-dark',
    name: 'Crimson Dark',
    mode: 'dark',
    description: 'Charcoal wine with radiant cyber scarlet pulse',
    preview: {
      bg: '#120507',
      surface: '#1c080c',
      card: '#290c13',
      border: '#4a1723',
      accent: '#ff3366',
      text: '#fff1f2',
    },
    cssVars: {
      '--bg-base': '#120507',
      '--bg-surface': '#1c080c',
      '--bg-card': '#290c13',
      '--bg-card-hover': '#38101a',
      '--bg-active': '#471421',
      '--border-base': '#4a1723',
      '--border-subtle': '#300f17',
      '--border-focus': '#ff3366',
      '--text-primary': '#fff1f2',
      '--text-secondary': '#fda4af',
      '--text-muted': '#9f5160',
      '--accent': '#ff3366',
      '--accent-hover': '#fb7185',
      '--accent-subtle': 'rgba(255, 51, 102, 0.14)',
      '--accent-text': '#220309',
      '--code-bg': '#170609',
      '--scrollbar-thumb': '#4a1723',
    },
  },
  'graphite-black': {
    id: 'graphite-black',
    name: 'Graphite Black',
    mode: 'dark',
    description: 'Pure monochromatic carbon with refined emerald accent',
    preview: {
      bg: '#09090b',
      surface: '#111114',
      card: '#18181c',
      border: '#2e2e38',
      accent: '#22c55e',
      text: '#fafafa',
    },
    cssVars: {
      '--bg-base': '#09090b',
      '--bg-surface': '#111114',
      '--bg-card': '#18181c',
      '--bg-card-hover': '#222228',
      '--bg-active': '#2a2a32',
      '--border-base': '#2e2e38',
      '--border-subtle': '#1e1e24',
      '--border-focus': '#22c55e',
      '--text-primary': '#fafafa',
      '--text-secondary': '#a1a1aa',
      '--text-muted': '#71717a',
      '--accent': '#22c55e',
      '--accent-hover': '#4ade80',
      '--accent-subtle': 'rgba(34, 197, 94, 0.12)',
      '--accent-text': '#050505',
      '--code-bg': '#0e0e11',
      '--scrollbar-thumb': '#2e2e38',
    },
  },

  // --- 5 LIGHT THEMES ---
  'clean-white': {
    id: 'clean-white',
    name: 'Clean White',
    mode: 'light',
    description: 'Minimalist alpine studio with obsidian contrast',
    preview: {
      bg: '#f8fafc',
      surface: '#ffffff',
      card: '#ffffff',
      border: '#cbd5e1',
      accent: '#0f172a',
      text: '#0f172a',
    },
    cssVars: {
      '--bg-base': '#f8fafc',
      '--bg-surface': '#ffffff',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#f1f5f9',
      '--bg-active': '#e2e8f0',
      '--border-base': '#cbd5e1',
      '--border-subtle': '#e2e8f0',
      '--border-focus': '#0f172a',
      '--text-primary': '#0f172a',
      '--text-secondary': '#475569',
      '--text-muted': '#64748b',
      '--accent': '#0f172a',
      '--accent-hover': '#334155',
      '--accent-subtle': 'rgba(15, 23, 42, 0.08)',
      '--accent-text': '#ffffff',
      '--code-bg': '#0f172a',
      '--scrollbar-thumb': '#cbd5e1',
    },
  },
  'soft-blue': {
    id: 'soft-blue',
    name: 'Soft Blue',
    mode: 'light',
    description: 'Crisp morning cerulean with royal sapphire highlights',
    preview: {
      bg: '#f0f6fc',
      surface: '#e6eff9',
      card: '#ffffff',
      border: '#b8d2ee',
      accent: '#2563eb',
      text: '#0f2942',
    },
    cssVars: {
      '--bg-base': '#f0f6fc',
      '--bg-surface': '#e6eff9',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#dbe8f6',
      '--bg-active': '#cde0f4',
      '--border-base': '#b8d2ee',
      '--border-subtle': '#d0e1f4',
      '--border-focus': '#2563eb',
      '--text-primary': '#0f2942',
      '--text-secondary': '#234a70',
      '--text-muted': '#547699',
      '--accent': '#2563eb',
      '--accent-hover': '#1d4ed8',
      '--accent-subtle': 'rgba(37, 99, 235, 0.1)',
      '--accent-text': '#ffffff',
      '--code-bg': '#0d2238',
      '--scrollbar-thumb': '#b8d2ee',
    },
  },
  'lavender': {
    id: 'lavender',
    name: 'Lavender',
    mode: 'light',
    description: 'Delicate pastel lilac with regal amethyst accents',
    preview: {
      bg: '#faf7fd',
      surface: '#f3eafa',
      card: '#ffffff',
      border: '#d0bae8',
      accent: '#7c3aed',
      text: '#241442',
    },
    cssVars: {
      '--bg-base': '#faf7fd',
      '--bg-surface': '#f3eafa',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#ece0f7',
      '--bg-active': '#dfcef2',
      '--border-base': '#d0bae8',
      '--border-subtle': '#e4d5f4',
      '--border-focus': '#7c3aed',
      '--text-primary': '#241442',
      '--text-secondary': '#4d2c86',
      '--text-muted': '#7c5ca8',
      '--accent': '#7c3aed',
      '--accent-hover': '#6d28d9',
      '--accent-subtle': 'rgba(124, 58, 237, 0.1)',
      '--accent-text': '#ffffff',
      '--code-bg': '#1e1136',
      '--scrollbar-thumb': '#d0bae8',
    },
  },
  'mint': {
    id: 'mint',
    name: 'Mint',
    mode: 'light',
    description: 'Invigorating botanical sage with vibrant clean jade',
    preview: {
      bg: '#f0fdf4',
      surface: '#e3f7ea',
      card: '#ffffff',
      border: '#a8dfba',
      accent: '#059669',
      text: '#064e3b',
    },
    cssVars: {
      '--bg-base': '#f0fdf4',
      '--bg-surface': '#e3f7ea',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#d4f2e0',
      '--bg-active': '#c3ebd3',
      '--border-base': '#a8dfba',
      '--border-subtle': '#c9ebd6',
      '--border-focus': '#059669',
      '--text-primary': '#064e3b',
      '--text-secondary': '#047857',
      '--text-muted': '#369a7a',
      '--accent': '#059669',
      '--accent-hover': '#047857',
      '--accent-subtle': 'rgba(5, 150, 105, 0.1)',
      '--accent-text': '#ffffff',
      '--code-bg': '#043629',
      '--scrollbar-thumb': '#a8dfba',
    },
  },
  'warm-cream': {
    id: 'warm-cream',
    name: 'Warm Cream',
    mode: 'light',
    description: 'Ivory alabaster linen with rich golden amber',
    preview: {
      bg: '#fbf8f2',
      surface: '#f3ecde',
      card: '#ffffff',
      border: '#cbbaa0',
      accent: '#b45309',
      text: '#3f2608',
    },
    cssVars: {
      '--bg-base': '#fbf8f2',
      '--bg-surface': '#f3ecde',
      '--bg-card': '#ffffff',
      '--bg-card-hover': '#ebe1cf',
      '--bg-active': '#dfd2bc',
      '--border-base': '#cbbaa0',
      '--border-subtle': '#dfd3c1',
      '--border-focus': '#b45309',
      '--text-primary': '#3f2608',
      '--text-secondary': '#734612',
      '--text-muted': '#93642c',
      '--accent': '#b45309',
      '--accent-hover': '#92400e',
      '--accent-subtle': 'rgba(180, 83, 9, 0.1)',
      '--accent-text': '#ffffff',
      '--code-bg': '#2b1b06',
      '--scrollbar-thumb': '#cbbaa0',
    },
  },
};

export const THEME_LIST: ThemeDefinition[] = Object.values(THEMES);

export const DARK_THEMES = THEME_LIST.filter(t => t.mode === 'dark');
export const LIGHT_THEMES = THEME_LIST.filter(t => t.mode === 'light');

export const DEFAULT_THEME_ID: ThemeId = 'midnight-blue';

const STORAGE_THEME_KEY = 'erroren_color_theme_v2';

export function loadSavedThemeId(): ThemeId {
  try {
    const saved = localStorage.getItem(STORAGE_THEME_KEY) as ThemeId;
    if (saved && THEMES[saved]) {
      return saved;
    }
  } catch {
    // Fallback to default
  }
  return DEFAULT_THEME_ID;
}

export function saveThemeId(themeId: ThemeId): void {
  try {
    localStorage.setItem(STORAGE_THEME_KEY, themeId);
  } catch (err) {
    console.error('Failed to save theme in localStorage', err);
  }
}

/**
 * Applies the given theme CSS variables and data attributes to the document.
 */
export function applyTheme(themeId: ThemeId): void {
  const theme = THEMES[themeId] || THEMES[DEFAULT_THEME_ID];
  const root = document.documentElement;

  // Set data-theme attribute
  root.setAttribute('data-theme', theme.id);
  root.setAttribute('data-mode', theme.mode);

  // Toggle standard Tailwind dark class
  if (theme.mode === 'dark') {
    root.classList.add('dark');
    root.classList.remove('light');
  } else {
    root.classList.remove('dark');
    root.classList.add('light');
  }

  // Inject CSS variables
  Object.entries(theme.cssVars).forEach(([key, val]) => {
    root.style.setProperty(key, val);
  });
}
