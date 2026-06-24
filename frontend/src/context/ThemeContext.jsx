import { createContext, useContext, useEffect, useState } from 'react';

const ThemeContext = createContext(null);

const systemPrefersDark = () =>
  typeof window !== 'undefined' && window.matchMedia('(prefers-color-scheme: dark)').matches;

// Stored preference wins; otherwise fall back to the OS setting. Mirrors the
// pre-paint script in index.html so the first render never flashes.
function getInitialTheme() {
  const stored = localStorage.getItem('theme');
  if (stored === 'light' || stored === 'dark') return stored;
  return systemPrefersDark() ? 'dark' : 'light';
}

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(getInitialTheme);

  // Apply the resolved theme to <html>. Transitions are enabled only after the
  // first paint (via .theme-ready) so toggling animates but loading does not.
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle('dark', theme === 'dark');
    const id = requestAnimationFrame(() => root.classList.add('theme-ready'));
    return () => cancelAnimationFrame(id);
  }, [theme]);

  // Follow the OS theme live, but only while the user hasn't made an explicit
  // choice (no stored preference).
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = (e) => {
      if (!localStorage.getItem('theme')) setThemeState(e.matches ? 'dark' : 'light');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const setTheme = (value) => {
    localStorage.setItem('theme', value); // explicit choice persists
    setThemeState(value);
  };
  const toggleTheme = () => setTheme(theme === 'dark' ? 'light' : 'dark');

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
