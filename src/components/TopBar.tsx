import { useState, useRef, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { useTheme } from '../hooks/useTheme';
import ConstellationIcon from './ConstellationIcon';
import {
  $showWikilinks, $showTags, $zoom, $forces, $constellationActive,
  $nodeCount, $edgeCount, $wikilinkCount, $tagCount,
  DEFAULT_FORCES, resetAll,
} from '../stores/constellation';

const STAR_COLORS: Record<string, string> = {
  travel: '#34d399',
  design: '#c084fc',
  finance: '#fbbf24',
  projects: '#38bdf8',
  musings: '#fb7185',
  'cool-shit': '#fb923c',
  food: '#a3e635',
};

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

function Slider({ label, value, min, max, step, onChange }: {
  label: string; value: number; min: number; max: number; step: number;
  onChange: (v: number) => void;
}) {
  const { theme } = useTheme();
  const thumbColor = theme === 'dark' ? '#6b8aff' : '#4a6cf7';
  return (
    <label className="flex items-center gap-2">
      <span className="w-20 text-right" style={{ color: theme === 'dark' ? '#aaa' : '#666' }}>{label}</span>
      <input
        type="range"
        min={min} max={max} step={step} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="slider-thumb flex-1 h-1 rounded-full appearance-none cursor-pointer"
        style={{
          background: theme === 'dark' ? 'rgba(255,255,255,0.15)' : 'rgba(0,0,0,0.12)',
          touchAction: 'auto',
          // @ts-expect-error CSS custom property for thumb color
          '--thumb-color': thumbColor,
        }}
      />
      <span className="w-8 text-right tabular-nums" style={{ color: theme === 'dark' ? '#888' : '#999' }}>
        {value.toFixed(step < 0.1 ? 2 : 1)}
      </span>
    </label>
  );
}

export default function TopBar({ pathname = '/' }: { pathname?: string }) {
  const { theme, toggleTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => { setMounted(true); }, []);
  const constellationActive = useStore($constellationActive);

  const isPostDetail = pathname.startsWith('/post/');
  const isProjectDetail = pathname.startsWith('/project/');
  const currentLabel = isPostDetail ? 'Posts' : isProjectDetail ? 'Projects' : (routeLabels[pathname] ?? '');

  const isConstellationPage = mounted && pathname === '/constellation' && constellationActive;

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
            ({$nodeCount.get()} posts · {$edgeCount.get()} connections)
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

            {/* Dropdown — read stores imperatively to avoid re-render loops */}
            {dropdownOpen && (() => {
              const showWikilinks = $showWikilinks.get();
              const showTags = $showTags.get();
              const zoom = $zoom.get();
              const forces = $forces.get();
              const nodeCount = $nodeCount.get();
              const edgeCount = $edgeCount.get();
              const wikilinkCount = $wikilinkCount.get();
              const tagCount = $tagCount.get();
              return (<div
                className="fixed right-6 top-14 px-4 py-3 rounded-xl text-xs space-y-2 min-w-[280px] z-50"
                onTouchStart={(e) => e.stopPropagation()}
                onTouchMove={(e) => e.stopPropagation()}
                style={{
                  background: theme === 'dark' ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.96)',
                  border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                  backdropFilter: 'blur(12px)',
                  color: theme === 'dark' ? '#aaa' : '#666',
                  boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  touchAction: 'auto',
                }}
              >
                {/* Reset All button */}
                <div className="flex items-center justify-between mb-1">
                  <span className="font-semibold" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
                    Graph Settings
                  </span>
                  <button
                    onClick={() => {
                      $forces.set({ ...DEFAULT_FORCES });
                      $showWikilinks.set(true);
                      $showTags.set(true);
                      resetAll();
                    }}
                    className="text-[10px] px-2 py-1 rounded font-medium cursor-pointer"
                    style={{
                      background: theme === 'dark' ? '#4a6cf7' : '#4a6cf7',
                      color: '#ffffff',
                    }}
                  >
                    Reset All
                  </button>
                </div>

                {/* Visibility toggles */}
                <div className="font-semibold mb-1 text-[11px]" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
                  Visibility
                </div>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showWikilinks}
                    onChange={() => $showWikilinks.set(!showWikilinks)}
                  />
                  <span
                    className="inline-block w-6 border-t"
                    style={{ borderColor: theme === 'dark' ? 'rgba(180,180,220,0.5)' : 'rgba(80,80,120,0.35)' }}
                  />
                  <span>Links ({wikilinkCount})</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showTags}
                    onChange={() => $showTags.set(!showTags)}
                  />
                  <span
                    className="inline-block w-6 border-t"
                    style={{ borderColor: theme === 'dark' ? 'rgba(150,150,180,0.35)' : 'rgba(100,100,140,0.25)' }}
                  />
                  <span>Shared Tags ({tagCount})</span>
                </label>

                {/* Zoom */}
                <div
                  className="border-t pt-2 mt-2"
                  style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                >
                  <div className="font-semibold mb-1" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
                    Zoom
                  </div>
                  <Slider
                    label="Level"
                    value={zoom}
                    min={0.2} max={4} step={0.1}
                    onChange={(v) => $zoom.set(v)}
                  />
                </div>

                {/* Forces */}
                <div
                  className="border-t pt-2 mt-1 space-y-1"
                  style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-semibold" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
                      Forces
                    </span>
                    <button
                      onClick={$forces.set({ ...DEFAULT_FORCES })}
                      className="text-[10px] px-2 py-0.5 rounded font-medium cursor-pointer"
                      style={{
                        background: theme === 'dark' ? 'rgba(107, 138, 255, 0.2)' : 'rgba(74, 108, 247, 0.12)',
                        color: theme === 'dark' ? '#8da4ff' : '#4a6cf7',
                      }}
                    >
                      Reset
                    </button>
                  </div>
                  <Slider
                    label="Links"
                    value={forces.linkStrength}
                    min={0} max={2} step={0.1}
                    onChange={(v) => $forces.set({ ...forces, linkStrength: v })}
                  />
                  <Slider
                    label="Tags"
                    value={forces.tagStrength}
                    min={0} max={2} step={0.05}
                    onChange={(v) => $forces.set({ ...forces, tagStrength: v })}
                  />
                  <Slider
                    label="Repulsion"
                    value={forces.repulsion}
                    min={0} max={3} step={0.1}
                    onChange={(v) => $forces.set({ ...forces, repulsion: v })}
                  />
                  <Slider
                    label="Gravity"
                    value={forces.gravity}
                    min={0} max={0.5} step={0.01}
                    onChange={(v) => $forces.set({ ...forces, gravity: v })}
                  />
                  <Slider
                    label="Drift"
                    value={forces.drift}
                    min={0} max={0.25} step={0.01}
                    onChange={(v) => $forces.set({ ...forces, drift: v })}
                  />
                </div>

                {/* Categories */}
                <div
                  className="border-t pt-2 mt-1"
                  style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                >
                  <div className="font-semibold mb-1" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
                    Categories
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(STAR_COLORS).map(([cat, color]) => (
                      <div key={cat} className="flex items-center gap-1.5">
                        <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                        <span className="capitalize">{cat === 'cool-shit' ? 'Cool Shit' : cat}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Help */}
                <div
                  className="border-t pt-2"
                  style={{
                    borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
                    color: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)',
                  }}
                >
                  Drag nodes · Scroll to zoom · Drag space to pan
                </div>
              </div>);
            })()}
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
