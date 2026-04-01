import { useEffect, useSyncExternalStore } from 'react';

type Theme = 'light' | 'dark';

// Shared theme state — works across React islands without a provider.
// Reads from localStorage + document.documentElement.classList.
// All islands calling useTheme() share the same underlying state.

let listeners: Array<() => void> = [];

function getTheme(): Theme {
  if (typeof document === 'undefined') return 'light';
  return document.documentElement.classList.contains('dark') ? 'dark' : 'light';
}

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => { listeners = listeners.filter(l => l !== listener); };
}

function setTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === 'dark') {
    root.classList.add('dark');
  } else {
    root.classList.remove('dark');
  }
  localStorage.setItem('theme', theme);
  // Notify all listeners (other islands)
  listeners.forEach(l => l());
}

export function useTheme() {
  const theme = useSyncExternalStore(subscribe, getTheme, () => 'light' as Theme);

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  // Listen for system preference changes
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const handler = (e: MediaQueryListEvent) => {
      if (!localStorage.getItem('theme')) {
        setTheme(e.matches ? 'dark' : 'light');
      }
    };
    mq.addEventListener('change', handler);
    return () => mq.removeEventListener('change', handler);
  }, []);

  return { theme, toggleTheme };
}

// Legacy exports for backward compatibility (no longer needed but prevents import errors)
export function ThemeProvider({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
