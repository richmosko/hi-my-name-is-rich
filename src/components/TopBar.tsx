import { Link, useLocation } from 'react-router-dom';
import { useTheme } from '../hooks/useTheme';

const routeLabels: Record<string, string> = {
  '/': '',
  '/about': 'About',
  '/posts': 'Posts',
  '/travel': 'Travel',
  '/design': 'Design',
  '/finance': 'Finance',
};

export default function TopBar() {
  const { pathname } = useLocation();
  const { theme, toggleTheme } = useTheme();

  // Match /post/:slug to "Posts" and /project/:id to "Projects"
  const isPostDetail = pathname.startsWith('/post/');
  const isProjectDetail = pathname.startsWith('/project/');
  const currentLabel = isPostDetail ? 'Posts' : isProjectDetail ? 'Projects' : (routeLabels[pathname] ?? '');

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-edge">
      <div className="flex items-end h-16 pl-[60px] pr-6 pb-3 gap-3">
        {/* Home icon — links to root */}
        <Link
          to="/"
          className="icon-hover text-content-muted"
          aria-label="Home"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        </Link>

        {/* Site title */}
        <h1 className="text-xl font-semibold text-content-muted tracking-tight leading-none">
          Rich Mosko
        </h1>

        {/* Active page breadcrumb */}
        {currentLabel && (
          <>
            <span className="text-content-muted text-sm leading-none mb-[1px]">→</span>
            <span className="text-xl font-semibold text-content-muted tracking-tight leading-none">
              {currentLabel}
            </span>
          </>
        )}

        {/* Theme toggle — fixed position, left of search icon */}
        <button
          onClick={toggleTheme}
          className="fixed right-14 top-5 z-50 icon-hover text-content-muted"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {/* Combined sun/moon icon with diagonal split */}
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
            {/* Sun (top-left) — circle + rays */}
            <circle cx="8" cy="8" r="3" />
            <line x1="8" y1="2" x2="8" y2="3.5" />
            <line x1="8" y1="12.5" x2="8" y2="14" />
            <line x1="2" y1="8" x2="3.5" y2="8" />
            <line x1="12.5" y1="8" x2="14" y2="8" />
            <line x1="3.76" y1="3.76" x2="4.82" y2="4.82" />
            <line x1="11.18" y1="11.18" x2="12.24" y2="12.24" />
            <line x1="12.24" y1="3.76" x2="11.18" y2="4.82" />
            <line x1="4.82" y1="11.18" x2="3.76" y2="12.24" />
            {/* Diagonal line */}
            <line x1="3" y1="21" x2="21" y2="3" />
            {/* Moon (bottom-right) */}
            <path d="M20.5 16.5A5.5 5.5 0 0113.5 9.5a5.5 5.5 0 107 7z" />
          </svg>
        </button>
      </div>
    </header>
  );
}
