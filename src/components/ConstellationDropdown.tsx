import { useStore } from '@nanostores/react';
import { useTheme } from '../hooks/useTheme';
import {
  $showWikilinks, $showTags, $zoom, $forces,
  $wikilinkCount, $tagCount,
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

/**
 * Constellation controls dropdown — isolated component so useStore
 * re-renders only this dropdown, not the entire TopBar.
 */
export default function ConstellationDropdown() {
  const { theme } = useTheme();
  const showWikilinks = useStore($showWikilinks);
  const showTags = useStore($showTags);
  const zoom = useStore($zoom);
  const forces = useStore($forces);
  const wikilinkCount = useStore($wikilinkCount);
  const tagCount = useStore($tagCount);

  return (
    <div
      className="fixed right-6 top-14 px-4 py-3 rounded-xl text-xs space-y-2 min-w-[280px] z-50"
      onTouchStart={(e) => e.stopPropagation()}
      onTouchMove={(e) => e.stopPropagation()}
      style={{
        background: theme === 'dark' ? 'rgba(0,0,0,0.92)' : 'rgba(255,255,255,0.97)',
        border: `1px solid ${theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}`,
        backdropFilter: 'blur(12px)',
        color: theme === 'dark' ? '#aaa' : '#666',
        boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
      }}
    >
      {/* Reset All */}
      <div className="flex items-center justify-between mb-1">
        <span className="font-semibold" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
          Graph Settings
        </span>
        <button
          onClick={resetAll}
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
        <input type="checkbox" checked={showWikilinks} onChange={() => $showWikilinks.set(!showWikilinks)} />
        <span className="inline-block w-6 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(180,180,220,0.5)' : 'rgba(80,80,120,0.35)' }} />
        <span>Links ({wikilinkCount})</span>
      </label>
      <label className="flex items-center gap-2 cursor-pointer">
        <input type="checkbox" checked={showTags} onChange={() => $showTags.set(!showTags)} />
        <span className="inline-block w-6 border-t" style={{ borderColor: theme === 'dark' ? 'rgba(150,150,180,0.35)' : 'rgba(100,100,140,0.25)' }} />
        <span>Shared Tags ({tagCount})</span>
      </label>

      {/* Zoom */}
      <div className="border-t pt-2 mt-2" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        <div className="font-semibold mb-1" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
          Zoom
        </div>
        <Slider label="Level" value={zoom} min={0.2} max={4} step={0.1} onChange={(v) => $zoom.set(v)} />
      </div>

      {/* Forces */}
      <div className="border-t pt-2 mt-1 space-y-1" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
        <div className="flex items-center justify-between">
          <span className="font-semibold" style={{ color: theme === 'dark' ? 'rgba(255,255,255,0.8)' : 'rgba(0,0,0,0.7)' }}>
            Forces
          </span>
          <button
            onClick={() => $forces.set({ ...DEFAULT_FORCES })}
            className="text-[10px] cursor-pointer"
            style={{ color: theme === 'dark' ? '#8da4ff' : '#4a6cf7' }}
          >
            Reset
          </button>
        </div>
        <Slider label="Links" value={forces.linkStrength} min={0} max={2} step={0.1} onChange={(v) => $forces.set({ ...forces, linkStrength: v })} />
        <Slider label="Tags" value={forces.tagStrength} min={0} max={2} step={0.05} onChange={(v) => $forces.set({ ...forces, tagStrength: v })} />
        <Slider label="Repulsion" value={forces.repulsion} min={0} max={3} step={0.1} onChange={(v) => $forces.set({ ...forces, repulsion: v })} />
        <Slider label="Gravity" value={forces.gravity} min={0} max={0.5} step={0.01} onChange={(v) => $forces.set({ ...forces, gravity: v })} />
        <Slider label="Drift" value={forces.drift} min={0} max={0.25} step={0.01} onChange={(v) => $forces.set({ ...forces, drift: v })} />
      </div>

      {/* Categories */}
      <div className="border-t pt-2 mt-1" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)' }}>
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
      <div className="border-t pt-2" style={{ borderColor: theme === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)', color: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)' }}>
        Drag nodes · Scroll to zoom · Drag space to pan
      </div>
    </div>
  );
}
