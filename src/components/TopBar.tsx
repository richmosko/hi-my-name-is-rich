import { useState, useRef, useEffect, useSyncExternalStore } from 'react';
import { useTheme } from '../hooks/useTheme';
import ConstellationIcon from './ConstellationIcon';
import ConstellationDropdown from './ConstellationDropdown';
import { useConstellationState, getConstellationState } from '../stores/constellation';

const routeLabels: Record<string, string> = {
  '/': '',
  '/about': 'About',
  '/posts': 'Posts',
  '/travel': 'Travel',
  '/design': 'Design',
  '/finance': 'Finance',
  '/constellation': 'Constellation',
  '/contributors': 'Contributors',
  '/admin': 'Admin',
  '/changelog': 'Changelog',
};

export default function TopBar({ pathname = '/' }: { pathname?: string }) {
  const { theme, toggleTheme } = useTheme();
  const mounted = useSyncExternalStore(() => () => {}, () => true, () => false);
  const cState = useConstellationState();

  const isPostDetail = pathname.startsWith('/post/');
  const isProjectDetail = pathname.startsWith('/project/');
  const currentLabel = isPostDetail ? 'Posts' : isProjectDetail ? 'Projects' : (routeLabels[pathname] ?? '');

  const isConstellationPage = mounted && pathname === '/constellation' && cState.active;

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!dropdownOpen) return;
    const handleClick = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [dropdownOpen]);

  // Close dropdown on route change
  const [prevPathname, setPrevPathname] = useState(pathname);
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    if (dropdownOpen) setDropdownOpen(false);
  }

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-edge">
      <div className="flex items-end h-16 pl-[60px] pr-6 pb-3 gap-3">
        {/* Home icon */}
        <a href="/" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="icon-hover text-content-muted" aria-label="Home">
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </a>

        {/* Site title */}
        <h1 className="text-xl font-semibold text-content-muted tracking-tight leading-none">
          Rich Mosko
        </h1>

        {/* Breadcrumb — hidden on mobile */}
        {currentLabel && (
          <>
            <span className="hidden sm:inline text-content-muted text-sm leading-none mb-[1px]">→</span>
            <span className="hidden sm:inline text-xl font-semibold text-content-muted tracking-tight leading-none">
              {currentLabel}
            </span>
          </>
        )}

        {/* Constellation stats — inline after breadcrumb */}
        {isConstellationPage && (
          <span className="text-xs text-content-muted leading-none mb-[1px] ml-1 hidden sm:inline">
            ({cState.nodeCount} posts · {cState.edgeCount} connections)
          </span>
        )}

        {/* Spacer */}
        <div className="flex-1" />

        {/* Constellation: gear icon (replaces sparkle) at same position */}
        {isConstellationPage && (
          <div ref={dropdownRef} className="contents">
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className="fixed right-[5.5rem] top-5 z-50 icon-hover text-content-muted"
              aria-label="Graph settings"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
              </svg>
            </button>

            {dropdownOpen && <ConstellationDropdown />}
          </div>
        )}

        {/* Constellation link icon — hidden on constellation page (gear replaces it) */}
        {!isConstellationPage && (
          <a
            href="/constellation"
            className="fixed right-[5.5rem] top-5 z-50 icon-hover text-content-muted"
            aria-label="Constellation Graph"
          >
            <ConstellationIcon className="w-5 h-5" />
          </a>
        )}

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="fixed right-14 top-5 z-50 icon-hover text-content-muted"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
