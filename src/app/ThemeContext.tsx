import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

type Theme = 'light' | 'dark';
interface ThemeCtx { theme: Theme; toggle: () => void; }

const ThemeContext = createContext<ThemeCtx>({ theme:'light', toggle:()=>{} });

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem('nv_theme') as Theme) || 'light'
  );

  useEffect(() => {
    applyTheme(theme);
  }, [theme]);

  const toggle = () => {
    const next: Theme = theme === 'light' ? 'dark' : 'light';
    localStorage.setItem('nv_theme', next);
    setTheme(next);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() { return useContext(ThemeContext); }

export function applyTheme(theme: Theme) {
  const root = document.documentElement;
  const isDark = theme === 'dark';
  root.style.setProperty('--bg',      isDark ? '#0F172A' : '#FFFFFF');
  root.style.setProperty('--bg2',     isDark ? '#1E293B' : '#F9FAFB');
  root.style.setProperty('--border',  isDark ? '#334155' : '#E5E7EB');
  root.style.setProperty('--text',    isDark ? '#F1F5F9' : '#111827');
  root.style.setProperty('--text2',   isDark ? '#94A3B8' : '#9CA3AF');
  root.style.setProperty('--card',    isDark ? '#1E293B' : '#F9FAFB');
  document.body.style.background = isDark ? '#0F172A' : '#FFFFFF';
  document.body.style.color      = isDark ? '#F1F5F9' : '#111827';
}
