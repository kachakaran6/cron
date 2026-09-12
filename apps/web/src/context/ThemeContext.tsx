import React, { createContext, useContext, useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';
export type AccentColor = 'violet' | 'orange' | 'emerald' | 'cyan' | 'rose' | 'amber';

export interface AccentOption {
  id: AccentColor;
  name: string;
  label: string;
  hex: string;
  hover: string;
  muted: string;
  text: string;
  border: string;
  lightBg: string;
  lightText: string;
  lightBorder: string;
}

export const ACCENT_PALETTES: Record<AccentColor, AccentOption> = {
  violet: {
    id: 'violet',
    name: 'Deep Violet',
    label: 'Deep Violet (Infrastructure)',
    hex: '#7c3aed',
    hover: '#6d28d9',
    muted: 'rgba(124, 58, 237, 0.15)',
    text: '#c4b5fd',
    border: 'rgba(124, 58, 237, 0.35)',
    lightBg: 'rgba(124, 58, 237, 0.08)',
    lightText: '#6d28d9',
    lightBorder: 'rgba(124, 58, 237, 0.25)',
  },
  orange: {
    id: 'orange',
    name: 'Reddit Orange',
    label: 'Sunset Orange (Reddit / Linear)',
    hex: '#ea580c',
    hover: '#c2410c',
    muted: 'rgba(234, 88, 12, 0.15)',
    text: '#fdba74',
    border: 'rgba(234, 88, 12, 0.35)',
    lightBg: 'rgba(234, 88, 12, 0.08)',
    lightText: '#c2410c',
    lightBorder: 'rgba(234, 88, 12, 0.25)',
  },
  emerald: {
    id: 'emerald',
    name: 'Terminal Emerald',
    label: 'Terminal Emerald (Matrix)',
    hex: '#059669',
    hover: '#047857',
    muted: 'rgba(5, 150, 105, 0.15)',
    text: '#6ee7b7',
    border: 'rgba(5, 150, 105, 0.35)',
    lightBg: 'rgba(5, 150, 105, 0.08)',
    lightText: '#047857',
    lightBorder: 'rgba(5, 150, 105, 0.25)',
  },
  cyan: {
    id: 'cyan',
    name: 'Electric Cyan',
    label: 'Electric Cyan (Cloud Native)',
    hex: '#0284c7',
    hover: '#0369a1',
    muted: 'rgba(2, 132, 199, 0.15)',
    text: '#7dd3fc',
    border: 'rgba(2, 132, 199, 0.35)',
    lightBg: 'rgba(2, 132, 199, 0.08)',
    lightText: '#0369a1',
    lightBorder: 'rgba(2, 132, 199, 0.25)',
  },
  rose: {
    id: 'rose',
    name: 'Ruby Crimson',
    label: 'Ruby Crimson (High Alert)',
    hex: '#e11d48',
    hover: '#be123c',
    muted: 'rgba(225, 29, 72, 0.15)',
    text: '#fda4af',
    border: 'rgba(225, 29, 72, 0.35)',
    lightBg: 'rgba(225, 29, 72, 0.08)',
    lightText: '#be123c',
    lightBorder: 'rgba(225, 29, 72, 0.25)',
  },
  amber: {
    id: 'amber',
    name: 'Amber Gold',
    label: 'Amber Gold (Luxury Console)',
    hex: '#d97706',
    hover: '#b45309',
    muted: 'rgba(217, 119, 6, 0.15)',
    text: '#fde68a',
    border: 'rgba(217, 119, 6, 0.35)',
    lightBg: 'rgba(217, 119, 6, 0.08)',
    lightText: '#b45309',
    lightBorder: 'rgba(217, 119, 6, 0.25)',
  },
};

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (t: Theme) => void;
  accent: AccentColor;
  setAccent: (a: AccentColor) => void;
  currentPalette: AccentOption;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function applyAccentToDom(accent: AccentColor) {
  const root = document.documentElement;
  const p = ACCENT_PALETTES[accent] || ACCENT_PALETTES.violet;
  root.style.setProperty('--accent', p.hex);
  root.style.setProperty('--accent-hover', p.hover);
  root.style.setProperty('--accent-muted', p.muted);
  root.style.setProperty('--accent-text', p.text);
  root.style.setProperty('--accent-border', p.border);
  root.style.setProperty('--accent-light-bg', p.lightBg);
  root.style.setProperty('--accent-light-text', p.lightText);
  root.style.setProperty('--accent-light-border', p.lightBorder);
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(() => {
    const saved = localStorage.getItem('samast_cron_theme');
    return (saved as Theme) || 'dark';
  });

  const [accent, setAccentState] = useState<AccentColor>(() => {
    const saved = localStorage.getItem('samast_cron_accent');
    return (saved as AccentColor) || 'violet';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('samast_cron_theme', theme);
  }, [theme]);

  useEffect(() => {
    applyAccentToDom(accent);
    localStorage.setItem('samast_cron_accent', accent);
  }, [accent]);

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  const setTheme = (t: Theme) => {
    setThemeState(t);
  };

  const setAccent = (a: AccentColor) => {
    setAccentState(a);
  };

  const currentPalette = ACCENT_PALETTES[accent] || ACCENT_PALETTES.violet;

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme, accent, setAccent, currentPalette }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within a ThemeProvider');
  return context;
}
