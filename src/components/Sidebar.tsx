import { useState, useEffect, useRef } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { projects } from '../data/projects';

const navItems = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Posts', path: '/posts' },
  { label: 'Travel', path: '/travel' },
  { label: 'Design', path: '/design' },
  { label: 'Goals', path: '/goals' },
  { label: 'Projects', path: '/projects' },
  { label: 'Musings', path: '/musings' },
  { label: 'Cool Shit', path: '/cool-shit' },
  { label: 'Food', path: '/food' },
];

export default function Sidebar() {
  const [isOpen, setIsOpen] = useState(false);
  const sidebarRef = useRef<HTMLDivElement>(null);
  const location = useLocation();

  // Close sidebar on route change
  useEffect(() => {
    setIsOpen(false);
  }, [location.pathname]);

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
        <span className="hamburger-bar block w-[18px] h-[2.5px] rounded-full bg-[#A0A0A0]" />
        <span className="hamburger-bar block w-[18px] h-[2.5px] rounded-full bg-[#A0A0A0]" />
        <span className="hamburger-bar block w-[18px] h-[2.5px] rounded-full bg-[#A0A0A0]" />
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
        className={`fixed left-0 top-0 h-full w-64 bg-white border-r border-edge shadow-lg
                    flex flex-col pt-20 pb-8 px-6
                    transition-transform duration-300 ease-in-out
                    ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Navigation links */}
        <ul className="flex flex-col gap-1">
          {navItems.map((item) => (
            <li key={item.path}>
              <NavLink
                to={item.path}
                className={({ isActive }) =>
                  `block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors duration-150
                   ${
                     isActive
                       ? 'text-content'
                       : 'text-[#A0A0A0] hover:text-[#202020]'
                   }`
                }
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>

        {/* Projects section */}
        <div className="mt-8 pt-6 border-t border-edge">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-[#202020] mb-3">
            Projects
          </p>
          <ul className="flex flex-col gap-1">
            {projects.map((project) => (
              <li key={project.id}>
                <div
                  className="block px-3 py-2 rounded-lg text-sm text-[#A0A0A0]
                             hover:text-[#202020]
                             transition-colors duration-150"
                >
                  <span className="flex items-center gap-2">
                    <span
                      className={`w-1.5 h-1.5 rounded-full ${
                        project.status === 'active'
                          ? 'bg-green-500'
                          : 'bg-content-muted'
                      }`}
                    />
                    {project.name}
                  </span>
                  <span className="block text-xs text-content-muted mt-0.5 pl-3.5">
                    {project.description}
                  </span>
                </div>
              </li>
            ))}
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
