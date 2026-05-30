'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';

export type ThemeId = 'default' | 'ocean' | 'forest' | 'royal' | 'sunset' | 'slate' | 'golden';

export interface ThemeDefinition {
  id: ThemeId;
  name: string;
  emoji: string;
  primaryHex: string;
}

export const THEMES: ThemeDefinition[] = [
  { id: 'default', name: 'Warm Orange', emoji: '🔥', primaryHex: '#aa3000' },
  { id: 'ocean',   name: 'Ocean Blue',  emoji: '🌊', primaryHex: '#0070c0' },
  { id: 'forest',  name: 'Forest Green',emoji: '🌿', primaryHex: '#2e7d32' },
  { id: 'royal',   name: 'Royal Purple', emoji: '👑', primaryHex: '#6a1b9a' },
  { id: 'sunset',  name: 'Sunset Pink', emoji: '🌸', primaryHex: '#c62828' },
  { id: 'slate',   name: 'Slate Grey',  emoji: '🪨', primaryHex: '#37474f' },
  { id: 'golden',  name: 'Golden Amber',emoji: '✨', primaryHex: '#e65100' },
];

interface ThemeContextValue {
  theme: ThemeId;
  isDark: boolean;
  setTheme: (theme: ThemeId) => void;
  toggleDark: () => void;
}

const ThemeContext = createContext<ThemeContextValue>({
  theme: 'default',
  isDark: false,
  setTheme: () => {},
  toggleDark: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<ThemeId>(() => {
    if (typeof window === 'undefined') return 'default';
    return (localStorage.getItem('sk_theme') as ThemeId) || 'default';
  });
  const [isDark, setIsDark] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false;
    return localStorage.getItem('sk_dark') === 'true';
  });
  const [mounted, setMounted] = useState(false);

  // Set mounted flag on mount
  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) setMounted(true);
    });
    return () => {
      active = false;
    };
  }, []);

  // Apply to document
  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;
    if (theme === 'default') {
      root.removeAttribute('data-theme');
    } else {
      root.setAttribute('data-theme', theme);
    }
    root.setAttribute('data-dark', isDark ? 'true' : 'false');
  }, [theme, isDark, mounted]);

  const setTheme = useCallback((t: ThemeId) => {
    setThemeState(t);
    localStorage.setItem('sk_theme', t);
  }, []);

  const toggleDark = useCallback(() => {
    setIsDark(prev => {
      const next = !prev;
      localStorage.setItem('sk_dark', next ? 'true' : 'false');
      return next;
    });
  }, []);

  // Prevent flash on initial load
  if (!mounted) {
    return <>{children}</>;
  }

  return (
    <ThemeContext.Provider value={{ theme, isDark, setTheme, toggleDark }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  return useContext(ThemeContext);
}
