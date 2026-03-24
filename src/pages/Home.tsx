import { Link } from 'react-router-dom';
import { posts } from '../lib/posts';
import PostCard from '../components/PostCard';
import { lazy, Suspense, useState, useRef, useEffect } from 'react';
import { useConstellationControls } from '../hooks/useConstellationControls';
import { useTheme } from '../hooks/useTheme';
import graphData from '../lib/graph-index.json';
const ConstellationGraph = lazy(() => import('../components/ConstellationGraph'));

const STAR_COLORS: Record<string, string> = {
  travel: '#34d399',
  design: '#c084fc',
  finance: '#fbbf24',
  projects: '#38bdf8',
  musings: '#fb7185',
  'cool-shit': '#fb923c',
  food: '#a3e635',
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

export default function Home() {
  // Latest post always first, then up to 2 featured posts (excluding the latest)
  const latestPost = posts[0]; // posts are sorted newest-first
  const featuredOthers = posts
    .filter((p) => p.featured && p.id !== latestPost?.id)
    .slice(0, 2);
  const heroCards = latestPost ? [latestPost, ...featuredOthers] : featuredOthers;
  const controls = useConstellationControls();
  const { theme } = useTheme();
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

  const nodeCount = graphData.nodes.length;
  const edgeCount = graphData.edges.length;
  const wikilinkCount = graphData.edges.filter(e => e.type === 'wikilink').length;
  const tagCount = graphData.edges.filter(e => e.type === 'tag').length;

  return (
    <div className="flex flex-col gap-10 sm:gap-16">
      {/* Hero section */}
      <section className="flex flex-col-reverse lg:flex-row items-center lg:items-start gap-8 lg:gap-10">
        {/* Text — left side on desktop, below image on mobile */}
        <div className="flex-1 flex flex-col gap-4 sm:gap-6">
          <h1 className="text-3xl sm:text-4xl font-bold text-content leading-tight">
            Hi, my name is Rich.
          </h1>
          <p className="text-base sm:text-xl font-light text-content-secondary leading-relaxed">
            Former <span className="text-lg sm:text-2xl font-normal">Hardware Designer</span>,
            part-time <span className="text-lg sm:text-2xl font-normal">Adventurer</span>,
            and full-time <span className="text-lg sm:text-2xl font-normal">Loafer</span> and{' '}
            <span className="text-lg sm:text-2xl font-normal">Fudgel</span>. This is a place
            for me to share what I'm learning, building, and thinking about.
          </p>
          <p className="text-base sm:text-xl font-light text-content-secondary leading-relaxed">
            I am by no means an expert... at pretty much anything. But I am a
            naturally <span className="text-lg sm:text-2xl font-normal">curious</span>, and
            find myself with a lot of time to ponder the meaning of
            things. This project is meant to be a{' '}
            <span className="text-lg sm:text-2xl font-normal">learning</span> and{' '}
            <span className="text-lg sm:text-2xl font-normal">growing</span> experience for
            me. It's pretty much not useful to anyone whatsoever 😂... but if
            you've stumbled here by accident:{' '}
            <span className="text-lg sm:text-2xl font-semibold">Welcome Friend!</span>{' '}
            Hopefully I'm able to share a bit of positivity and joy.
          </p>
          <div className="pt-2 flex flex-col gap-1">
            <Link
              to="/about"
              className="text-sm font-medium text-content-muted hover:text-content transition-colors duration-150"
            >
              More about me &rarr;
            </Link>
            <Link
              to="/posts"
              className="text-sm font-medium text-content-muted hover:text-content transition-colors duration-150"
            >
              Latest posts &rarr;
            </Link>
          </div>
        </div>

        {/* Profile image — right side on desktop, top on mobile */}
        <div className="w-[60%] sm:w-[40%] max-w-[414px]">
          <img
            src="/images/profiles/profile-rich.jpeg"
            alt="Rich Mosko"
            className="w-full aspect-square rounded-2xl object-cover shadow-sm"
          />
        </div>
      </section>

      {/* Featured Posts — latest + 2 featured */}
      {heroCards.length > 0 && (
        <section className="flex flex-col gap-8 sm:gap-10">
          <h2 className="text-2xl sm:text-3xl font-semibold text-content text-center">
            Featured Posts
          </h2>
          {/* Desktop: large left (4/3) + two stacked right (16/9). Mobile: stack all */}
          <div className="flex flex-col lg:flex-row gap-6 sm:gap-8">
            {/* Left — latest post, large 4/3 */}
            {heroCards[0] && (
              <div className="lg:w-1/2">
                <PostCard post={heroCards[0]} variant="large" />
              </div>
            )}
            {/* Right — two stacked featured posts, compact 16/9 */}
            {heroCards.length > 1 && (
              <div className="lg:w-1/2 flex flex-col gap-6 sm:gap-8">
                {heroCards.slice(1).map((post) => (
                  <PostCard key={post.id} post={post} variant="compact" />
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* Constellation — ambient preview, lazy loaded */}
      <section className="flex flex-col gap-4">
        {/* Header row: title + status + gear icon */}
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/constellation"
            className="text-2xl sm:text-3xl font-semibold text-content hover:text-accent transition-colors"
          >
            Constellation Graph
          </Link>

          {/* Gear icon + dropdown */}
          {controls && (
            <div ref={dropdownRef} className="relative">
              <button
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="icon-hover text-content p-1"
                aria-label="Graph settings"
              >
                <svg className="w-6 h-6 sm:w-7 sm:h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" />
                </svg>
              </button>

              {dropdownOpen && (
                <div
                  className="absolute top-full right-0 mt-2 px-4 py-3 rounded-xl text-xs space-y-2 min-w-[280px] z-50"
                  style={{
                    background: theme === 'dark' ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.96)',
                    border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
                    backdropFilter: 'blur(12px)',
                    color: theme === 'dark' ? '#aaa' : '#666',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
                  }}
                >
                  {/* Stats */}
                  <div className="text-center pb-1 mb-1 border-b" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                    {nodeCount} posts · {edgeCount} connections
                  </div>

                  {/* Reset All */}
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
                      Graph Settings
                    </span>
                    <button
                      onClick={() => {
                        controls.resetForces();
                        controls.setShowWikilinks(true);
                        controls.setShowTags(true);
                        controls.requestCameraReset();
                      }}
                      className="text-[10px] px-2 py-1 rounded font-medium cursor-pointer"
                      style={{ background: '#4a6cf7', color: '#ffffff' }}
                    >
                      Reset All
                    </button>
                  </div>

                  {/* Visibility */}
                  <div className="font-semibold mb-1 text-[11px]" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.6)' : 'rgba(0,0,0,0.5)' }}>
                    Visibility
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={controls.showWikilinks} onChange={() => controls.setShowWikilinks(!controls.showWikilinks)} />
                    <span className="inline-block w-6 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(180,180,220,0.5)' : 'rgba(80,80,120,0.35)' }} />
                    <span>Links ({wikilinkCount})</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" checked={controls.showTags} onChange={() => controls.setShowTags(!controls.showTags)} />
                    <span className="inline-block w-6 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(150,150,180,0.35)' : 'rgba(100,100,140,0.25)' }} />
                    <span>Shared Tags ({tagCount})</span>
                  </label>

                  {/* Zoom */}
                  <div className="border-t pt-2 mt-1" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                    <div className="font-semibold mb-1" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Zoom</div>
                    <Slider label="Level" value={controls.zoom} min={0.2} max={4} step={0.1} onChange={(v) => controls.setZoom(v)} />
                  </div>

                  {/* Forces */}
                  <div className="border-t pt-2 mt-1 space-y-1" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                    <div className="flex items-center justify-between">
                      <span className="font-semibold" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Forces</span>
                      <button
                        onClick={controls.resetForces}
                        className="text-[10px] px-2 py-0.5 rounded font-medium cursor-pointer"
                        style={{
                          background: theme === 'dark' ? 'rgba(107, 138, 255, 0.2)' : 'rgba(74, 108, 247, 0.12)',
                          color: theme === 'dark' ? '#8da4ff' : '#4a6cf7',
                        }}
                      >
                        Reset
                      </button>
                    </div>
                    <Slider label="Links" value={controls.forces.linkStrength} min={0} max={2} step={0.1} onChange={(v) => controls.setForces({ ...controls.forces, linkStrength: v })} />
                    <Slider label="Tags" value={controls.forces.tagStrength} min={0} max={2} step={0.05} onChange={(v) => controls.setForces({ ...controls.forces, tagStrength: v })} />
                    <Slider label="Repulsion" value={controls.forces.repulsion} min={0} max={3} step={0.1} onChange={(v) => controls.setForces({ ...controls.forces, repulsion: v })} />
                    <Slider label="Gravity" value={controls.forces.gravity} min={0} max={0.5} step={0.01} onChange={(v) => controls.setForces({ ...controls.forces, gravity: v })} />
                    <Slider label="Drift" value={controls.forces.drift} min={0} max={1} step={0.05} onChange={(v) => controls.setForces({ ...controls.forces, drift: v })} />
                  </div>

                  {/* Categories */}
                  <div className="border-t pt-2 mt-1" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
                    <div className="font-semibold mb-1" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>Categories</div>
                    <div className="grid grid-cols-2 gap-x-4 gap-y-1">
                      {Object.entries(STAR_COLORS).map(([cat, color]) => (
                        <div key={cat} className="flex items-center gap-1.5">
                          <span className="inline-block w-2 h-2 rounded-full" style={{ background: color }} />
                          <span className="capitalize">{cat === 'cool-shit' ? 'Cool Shit' : cat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Interactive state indicator */}
                  <div
                    className="border-t pt-2 flex items-center gap-2"
                    style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}
                  >
                    <span
                      className="inline-block w-2 h-2 rounded-full"
                      style={{ background: theme === 'dark' ? '#555' : '#ccc' }}
                    />
                    <span style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
                      Preview only — <Link to="/constellation" className="underline hover:text-accent">open full graph</Link> to interact
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <Suspense fallback={<div className="w-full rounded-xl aspect-video bg-surface-secondary" />}>
          <ConstellationGraph
            autoFit
            showWikilinks={controls?.showWikilinks ?? true}
            showTags={controls?.showTags ?? true}
            interactive={false}
            className="w-full rounded-xl aspect-video"
          />
        </Suspense>
      </section>

    </div>
  );
}
