/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useState, useRef, type ReactNode } from 'react';

export interface ForceSettings {
  linkStrength: number;   // 0–2, default 1
  tagStrength: number;    // 0–2, default 0.3
  repulsion: number;      // 0–3, default 1
  gravity: number;        // 0–1, default 0.1
  drift: number;          // 0–0.25, default 0.05
}

const DEFAULT_FORCES: ForceSettings = {
  linkStrength: 1,
  tagStrength: 0.3,
  repulsion: 1,
  gravity: 0.1,
  drift: 0.05,
};

export interface ConstellationControls {
  showWikilinks: boolean;
  setShowWikilinks: (v: boolean) => void;
  showTags: boolean;
  setShowTags: (v: boolean) => void;
  nodeCount: number;
  edgeCount: number;
  wikilinkCount: number;
  tagCount: number;
  active: boolean;
  setActive: (v: boolean) => void;
  setCounts: (nodes: number, edges: number, wikilinks: number, tags: number) => void;
  // Zoom
  zoom: number;
  setZoom: (z: number) => void;
  zoomRef: React.MutableRefObject<number>;
  // Force settings
  forces: ForceSettings;
  setForces: (f: ForceSettings) => void;
  forcesRef: React.MutableRefObject<ForceSettings>;
  resetForces: () => void;
  // Animated camera reset
  requestCameraReset: () => void;
  onCameraResetRef: React.MutableRefObject<(() => void) | null>;
}

const ConstellationContext = createContext<ConstellationControls | null>(null);

export function ConstellationProvider({ children }: { children: ReactNode }) {
  const [showWikilinks, setShowWikilinks] = useState(true);
  const [showTags, setShowTags] = useState(true);
  const [active, setActive] = useState(false);
  const [counts, setCountsState] = useState({ nodes: 0, edges: 0, wikilinks: 0, tags: 0 });
  const [zoom, setZoomState] = useState(1.4);
  const [forces, setForcesState] = useState<ForceSettings>({ ...DEFAULT_FORCES });

  const zoomRef = useRef(1.4);
  const forcesRef = useRef<ForceSettings>({ ...DEFAULT_FORCES });

  const setZoom = (z: number) => { zoomRef.current = z; setZoomState(z); };
  const setForces = (f: ForceSettings) => { forcesRef.current = f; setForcesState(f); };
  const resetForces = () => setForces({ ...DEFAULT_FORCES });

  // Camera reset callback — set by ConstellationGraph, called by TopBar
  const onCameraResetRef = useRef<(() => void) | null>(null);
  const requestCameraReset = () => { onCameraResetRef.current?.(); };

  const setCounts = (nodes: number, edges: number, wikilinks: number, tags: number) => {
    setCountsState({ nodes, edges, wikilinks, tags });
  };

  return (
    <ConstellationContext.Provider
      value={{
        showWikilinks, setShowWikilinks,
        showTags, setShowTags,
        nodeCount: counts.nodes, edgeCount: counts.edges,
        wikilinkCount: counts.wikilinks, tagCount: counts.tags,
        active, setActive, setCounts,
        zoom, setZoom, zoomRef,
        forces, setForces, forcesRef, resetForces,
        requestCameraReset, onCameraResetRef,
      }}
    >
      {children}
    </ConstellationContext.Provider>
  );
}

export function useConstellationControls() {
  return useContext(ConstellationContext);
}
