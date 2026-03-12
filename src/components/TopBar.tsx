import { Link, useLocation } from 'react-router-dom';

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

  // Match /post/:slug to "Posts"
  const isPostDetail = pathname.startsWith('/post/');
  const currentLabel = isPostDetail ? 'Posts' : (routeLabels[pathname] ?? '');

  return (
    <header className="sticky top-0 z-40 w-full bg-surface/80 backdrop-blur-md border-b border-edge">
      <div className="flex items-end h-16 pl-[60px] pr-6 pb-3 gap-3">
        {/* Home icon — links to root */}
        <Link
          to="/"
          className="icon-hover text-[#A0A0A0]"
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
        <h1 className="text-xl font-semibold text-[#A0A0A0] tracking-tight leading-none">
          Rich Mosko
        </h1>

        {/* Active page breadcrumb */}
        {currentLabel && (
          <>
            <span className="text-[#A0A0A0] text-sm leading-none mb-[1px]">→</span>
            <span className="text-xl font-semibold text-[#A0A0A0] tracking-tight leading-none">
              {currentLabel}
            </span>
          </>
        )}
      </div>
    </header>
  );
}
