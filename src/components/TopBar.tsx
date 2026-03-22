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

        {/* Spacer */}
        <div className="flex-1" />

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className="icon-hover text-content-muted mb-[2px]"
          aria-label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
        >
          {theme === 'dark' ? (
            /* Sun icon — shown in dark mode */
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
          ) : (
            /* Moon icon — shown in light mode */
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
            </svg>
          )}
        </button>
      </div>
    </header>
  );
}
