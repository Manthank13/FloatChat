import { useState, useEffect } from 'react';
import { ThemeContext } from './themeContextDef';

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    return localStorage.getItem('floatchat_theme') || 'dark';
  });

  const [systemPreference, setSystemPreference] = useState(() => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'dark';
  });

  // Listen for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (e) => {
      setSystemPreference(e.matches ? 'dark' : 'light');
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  const actualTheme = theme === 'system' ? systemPreference : theme;

  // Apply theme to HTML root element
  useEffect(() => {
    const root = document.documentElement;
    root.setAttribute('data-theme', actualTheme);
    localStorage.setItem('floatchat_theme', theme);
  }, [theme, actualTheme]);

  const setTheme = (newTheme) => {
    if (['dark', 'light', 'system'].includes(newTheme)) {
      setThemeState(newTheme);
    }
  };

  const toggleTheme = () => {
    setThemeState((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <ThemeContext.Provider value={{ theme, actualTheme, setTheme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}
