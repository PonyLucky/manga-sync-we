import React, { createContext, useContext, useEffect, useState } from 'react';
import { getTheme, setTheme as saveTheme } from '@/utils/storage';

type Theme = 'default' | 'dark' | 'light' | 'ereader';

interface ThemeContextType {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>('default');

  useEffect(() => {
    getTheme().then((savedTheme) => {
      setThemeState(savedTheme as Theme);
    });
  }, []);

  useEffect(() => {
    // Apply theme class to body
    const themes: Theme[] = ['default', 'dark', 'light', 'ereader'];
    themes.forEach((t) => {
      document.body.classList.remove(`theme-${t}`);
    });

    if (theme !== 'default') {
      document.body.classList.add(`theme-${theme}`);
    }
  }, [theme]);

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    saveTheme(newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
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
