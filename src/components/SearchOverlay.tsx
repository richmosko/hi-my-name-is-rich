import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { posts, searchPosts } from '../lib/posts';

export default function SearchPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [prevPathname, setPrevPathname] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const location = useLocation();

  // Close on route change and reset query when closing
  if (location.pathname !== prevPathname) {
    setPrevPathname(location.pathname);
    if (isOpen) setIsOpen(false);
  }
  if (!isOpen && query) {
    setQuery('');
  }

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 200);
    }
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  const results = query.trim() ? searchPosts(posts, query, []) : [];
  const topResults = results.slice(0, 8);
  const totalCount = results.length;

  function handleViewAll() {
    navigate(`/posts?q=${encodeURIComponent(query.trim())}`);
    setIsOpen(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && query.trim()) {
      handleViewAll();
    }
  }

  return (
    <div ref={panelRef} className="fixed right-0 top-0 z-50 h-full">
      {/* Search icon trigger — always visible in top bar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed right-6 top-5 z-50 icon-hover text-[#A0A0A0]"
        aria-label={isOpen ? 'Close search' : 'Search'}
      >
        {isOpen ? (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        ) : (
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z" />
          </svg>
        )}
      </button>

      {/* Backdrop overlay */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />

      {/* Slide-in panel from the right */}
      <nav
        className={`fixed right-0 top-0 h-full w-[320px] bg-surface shadow-2xl
                    flex flex-col transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Search input */}
        <div className="px-5 pt-20 pb-4">
          <div className="flex items-center gap-3 bg-white border border-edge rounded-lg px-3 py-2.5">
            <svg
              className="w-4 h-4 text-content-muted shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M21 21l-5.197-5.197m0 0A7.5 7.5 0 105.196 5.196a7.5 7.5 0 0010.607 10.607z"
              />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search posts..."
              aria-label="Search posts"
              className="flex-1 bg-transparent text-sm text-content outline-none placeholder:text-content-muted"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="text-content-muted hover:text-content transition-colors"
                aria-label="Clear search"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-5">
          {query.trim() ? (
            topResults.length === 0 ? (
              <p className="text-sm text-content-muted py-4">
                No posts found for &ldquo;{query}&rdquo;
              </p>
            ) : (
              <div className="flex flex-col">
                <p className="text-xs font-semibold uppercase tracking-wider text-content-muted mb-3">
                  {totalCount} result{totalCount !== 1 ? 's' : ''}
                </p>
                {topResults.map((post) => (
                  <Link
                    key={post.id}
                    to={`/post/${post.slug}`}
                    onClick={() => setIsOpen(false)}
                    className="block py-3 border-b border-edge/50 last:border-b-0 hover:bg-surface-secondary -mx-2 px-2 rounded transition-colors"
                  >
                    <p className="text-sm font-medium text-content line-clamp-2">
                      {post.title}
                    </p>
                    <p className="text-xs text-content-muted line-clamp-1 mt-1">
                      {post.excerpt}
                    </p>
                  </Link>
                ))}
                {totalCount > 8 && (
                  <button
                    onClick={handleViewAll}
                    className="mt-3 text-xs font-medium text-accent hover:underline text-left"
                  >
                    View all {totalCount} results &rarr;
                  </button>
                )}
              </div>
            )
          ) : (
            <p className="text-sm text-content-muted py-4">
              Type to search posts by title, excerpt, or tag.
            </p>
          )}
        </div>
      </nav>
    </div>
  );
}
