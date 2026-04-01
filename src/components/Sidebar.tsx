import { useState, useEffect, useRef } from 'react';
import { projects } from '../lib/projects';
import { getProjectCompletion } from '../types';
import ConstellationIcon from './ConstellationIcon';
import { useVikunjaIssueCounts } from '../hooks/useVikunja';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Contributors', path: '/contributors' },
  { label: 'Constellation', path: '/constellation' },
];

const categoryItems = [
  { label: 'Travel', path: '/travel' },
  { label: 'Design', path: '/design' },
  { label: 'Finance', path: '/finance' },
  { label: 'Musings', path: '/musings' },
  { label: 'Cool Shit', path: '/cool-shit' },
  { label: 'Food', path: '/food' },
];

export default function Sidebar({ pathname = '/' }: { pathname?: string }) {
  const [isOpen, setIsOpen] = useState(false);
  const [prevPathname, setPrevPathname] = useState('');
  const sidebarRef = useRef<HTMLDivElement>(null);
  const { counts: issueCounts } = useVikunjaIssueCounts();

  // Close sidebar on route change (render-time state adjustment)
  if (pathname !== prevPathname) {
    setPrevPathname(pathname);
    setIsOpen(false);
  }

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  // Close on Escape
  useEffect(() => {
    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') setIsOpen(false);
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, []);

  return (
    <div ref={sidebarRef} className="fixed left-0 top-0 z-50 h-full">
      {/* Hamburger trigger button — always visible */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="hamburger-btn fixed left-5 top-4 z-50 flex flex-col items-center justify-end
                   gap-[6.25px] w-9 h-9 rounded-lg
                   cursor-pointer"
        aria-label={isOpen ? 'Close menu' : 'Open menu'}
      >
        <span className="hamburger-bar block w-[18px] h-[2.5px] rounded-full bg-content-muted" />
        <span className="hamburger-bar block w-[18px] h-[2.5px] rounded-full bg-content-muted" />
        <span className="hamburger-bar block w-[18px] h-[2.5px] rounded-full bg-content-muted" />
      </button>

      {/* Backdrop overlay — click to close */}
      <div
        onClick={() => setIsOpen(false)}
        className={`fixed inset-0 bg-black/40 transition-opacity duration-300
                    ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        aria-hidden="true"
      />

      {/* Sidebar panel */}
      <nav
        className={`fixed left-0 top-0 h-full w-64 bg-surface border-r border-edge shadow-lg
                    flex flex-col pt-20 pb-8 px-6 overflow-y-auto
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Navigation links */}
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <a
                href={item.path}
                className={`block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                   ${pathname === item.path ? 'text-content' : 'text-content-muted hover:text-content'}`}
              >
                {item.label}
                {item.path === '/constellation' && <ConstellationIcon className="w-3.5 h-3.5 inline-block ml-1.5 -mt-0.5" />}
              </a>
            </li>
          ))}
        </ul>

        {/* Posts section — with category sub-links */}
        <div className="mt-8 pt-6 border-t border-edge">
          <a
            href="/posts"
            className="flex items-center justify-between px-3 mb-3 group"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-content group-hover:text-accent transition-colors">
              Posts
            </span>
            <span className="text-xs text-content-muted group-hover:text-accent transition-colors">
              &rarr;
            </span>
          </a>
          <ul className="flex flex-col gap-1 pl-2">
            {categoryItems.map((item) => (
              <li key={item.path}>
                <a
                  href={item.path}
                  className={`block px-3 py-2 rounded-lg text-sm font-medium transition-colors duration-150
                     ${pathname === item.path ? 'text-content' : 'text-content-muted hover:text-content'}`}
                >
                  {item.label}
                </a>
              </li>
            ))}
          </ul>
        </div>

        {/* Projects section — active projects with progress */}
        <div className="mt-8 pt-6 border-t border-edge">
          <a
            href="/projects"
            className="flex items-center justify-between px-3 mb-3 group"
          >
            <span className="text-xs font-semibold uppercase tracking-wider text-content group-hover:text-accent transition-colors">
              Projects
            </span>
            <span className="text-xs text-content-muted group-hover:text-accent transition-colors">
              &rarr;
            </span>
          </a>
          <ul className="flex flex-col gap-1 pl-2">
            {projects
              .filter((p) => p.status === 'active')
              .map((project) => {
                const percent = getProjectCompletion(project);
                const issues = project.vikunjaProjectId ? issueCounts[project.vikunjaProjectId] : null;
                return (
                  <li key={project.id}>
                    <a
                      href={`/project/${project.id}`}
                      className="block px-3 py-2 rounded-lg hover:bg-surface-secondary
                                 transition-colors duration-150"
                    >
                      <span className="flex items-center justify-between">
                        <span className="text-sm font-medium text-content truncate">
                          {project.name}
                        </span>
                        <span className="flex items-center gap-1.5 ml-2 flex-shrink-0">
                          {/* Issue badges */}
                          {issues && issues.bug > 0 && (
                            <span className="text-[10px] font-bold px-1 py-0 rounded-full" style={{ background: '#ef444422', color: '#ef4444' }}>
                              {issues.bug}
                            </span>
                          )}
                          {issues && issues.enhancement > 0 && (
                            <span className="text-[10px] font-bold px-1 py-0 rounded-full" style={{ background: '#3b82f622', color: '#3b82f6' }}>
                              {issues.enhancement}
                            </span>
                          )}
                          {issues && issues.question > 0 && (
                            <span className="text-[10px] font-bold px-1 py-0 rounded-full" style={{ background: '#a855f722', color: '#a855f7' }}>
                              {issues.question}
                            </span>
                          )}
                          <span className="text-xs font-medium text-content-muted tabular-nums">
                            {percent}%
                          </span>
                        </span>
                      </span>
                      {/* Mini progress bar */}
                      <span className="block mt-1.5 w-full h-1 rounded-full bg-surface-secondary overflow-hidden">
                        <span
                          className="block h-full rounded-full bg-accent transition-all duration-500"
                          style={{ width: `${percent}%` }}
                        />
                      </span>
                    </a>
                  </li>
                );
              })}
          </ul>
        </div>

        {/* Bottom section */}
        <div className="mt-auto pt-6 border-t border-edge">
          <p className="px-3 text-xs text-content-muted">
            &copy; {new Date().getFullYear()} Rich
          </p>
        </div>
      </nav>
    </div>
  );
}
