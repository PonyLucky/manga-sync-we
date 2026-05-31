import React, { createContext, useContext, useEffect, useState } from 'react';
import {
  getTheme,
  setTheme as saveTheme,
  getCustomColors,
  setCustomColors as saveCustomColors,
} from '@/utils/storage';
import { CustomColors } from '@/types';

export type Theme = 'default' | 'dark' | 'light' | 'ereader' | 'custom';

export const DEFAULT_CUSTOM_COLORS: CustomColors = {
  bgPrimary: '#0f172a',
  bgSecondary: '#020617',
  textPrimary: '#f8fafc',
  textSecondary: '#94a3b8',
  textMuted: '#64748b',
  accentPrimary: '#8b5cf6',
  accentSecondary: '#06b6d4',
};

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
  customColors: CustomColors;
  setCustomColors: (colors: CustomColors) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

const CUSTOM_VAR_NAMES = [
  '--color-bg-primary',
  '--color-bg-secondary',
  '--color-bg-card',
  '--color-bg-glass',
  '--color-bg-hover',
  '--color-border',
  '--color-border-hover',
  '--color-text-primary',
  '--color-text-secondary',
  '--color-text-muted',
  '--color-accent-primary',
  '--color-accent-secondary',
  '--color-accent-gradient-start',
  '--color-accent-gradient-end',
  '--shadow-glow-color',
  '--shadow-glow-strong-color',
];

function applyCustomVars(colors: CustomColors) {
  const set = (k: string, v: string) => document.body.style.setProperty(k, v);
  set('--color-bg-primary', colors.bgPrimary);
  set('--color-bg-secondary', colors.bgSecondary);
  set('--color-bg-card', hexToRgba(colors.bgPrimary, 0.8));
  set('--color-bg-glass', hexToRgba(colors.bgSecondary, 0.5));
  set('--color-bg-hover', hexToRgba(colors.bgSecondary, 0.5));
  set('--color-border', hexToRgba(colors.textPrimary, 0.2));
  set('--color-border-hover', hexToRgba(colors.textPrimary, 0.4));
  set('--color-text-primary', colors.textPrimary);
  set('--color-text-secondary', colors.textSecondary);
  set('--color-text-muted', colors.textMuted);
  set('--color-accent-primary', colors.accentPrimary);
  set('--color-accent-secondary', colors.accentSecondary);
  set('--color-accent-gradient-start', colors.accentPrimary);
  set('--color-accent-gradient-end', colors.accentSecondary);
  set('--shadow-glow-color', hexToRgba(colors.accentPrimary, 0.3));
  set('--shadow-glow-strong-color', hexToRgba(colors.accentPrimary, 0.5));
}

function clearCustomVars() {
  CUSTOM_VAR_NAMES.forEach((v) => document.body.style.removeProperty(v));
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');
  const [customColors, setCustomColorsState] = useState<CustomColors>(DEFAULT_CUSTOM_COLORS);

  useEffect(() => {
    getTheme().then((savedTheme) => setThemeState(savedTheme as Theme));
    getCustomColors().then((savedColors) => {
      if (savedColors) setCustomColorsState(savedColors);
    });
  }, []);

  useEffect(() => {
    const baseThemes: Theme[] = ['default', 'dark', 'light', 'ereader'];
    baseThemes.forEach((t) => document.body.classList.remove(`theme-${t}`));
    clearCustomVars();

    if (theme === 'custom') {
      applyCustomVars(customColors);
    } else if (theme !== 'default') {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme, customColors]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  const setCustomColors = (colors: CustomColors) => {
    setCustomColorsState(colors);
    saveCustomColors(colors);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme, customColors, setCustomColors }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
