/**
 * Constellation shared state using window + CustomEvents.
 *
 * Astro islands bundle separately, so nanostores creates duplicate
 * instances per island. Using window.* ensures a single shared state
 * across all islands on the same page.
 */

export const DEFAULT_FORCES = {
  linkStrength: 1.0,
  tagStrength: 0.3,
  repulsion: 1.0,
  gravity: 0.1,
  drift: 0.05,
};

export interface ForceSettings {
  linkStrength: number;
  tagStrength: number;
  repulsion: number;
  gravity: number;
  drift: number;
}

interface ConstellationState {
  showWikilinks: boolean;
  showTags: boolean;
  zoom: number;
  forces: ForceSettings;
  active: boolean;
  nodeCount: number;
  edgeCount: number;
  wikilinkCount: number;
  tagCount: number;
  cameraResetCounter: number;
}

const STATE_KEY = '__constellation__';
const EVENT_NAME = 'constellation-state-change';

function getState(): ConstellationState {
  if (typeof window === 'undefined') {
    return {
      showWikilinks: true, showTags: true, zoom: 1.4,
      forces: { ...DEFAULT_FORCES }, active: false,
      nodeCount: 0, edgeCount: 0, wikilinkCount: 0, tagCount: 0,
      cameraResetCounter: 0,
    };
  }
  if (!(window as Record<string, unknown>)[STATE_KEY]) {
    (window as Record<string, unknown>)[STATE_KEY] = {
      showWikilinks: true, showTags: true, zoom: 1.4,
      forces: { ...DEFAULT_FORCES }, active: false,
      nodeCount: 0, edgeCount: 0, wikilinkCount: 0, tagCount: 0,
      cameraResetCounter: 0,
    };
  }
  return (window as Record<string, unknown>)[STATE_KEY] as ConstellationState;
}

function notify() {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(EVENT_NAME));
  }
}

// Getters
export function getConstellationState(): ConstellationState { return getState(); }

// Setters (each triggers a CustomEvent so subscribers update)
export function setShowWikilinks(v: boolean) { getState().showWikilinks = v; notify(); }
export function setShowTags(v: boolean) { getState().showTags = v; notify(); }
export function setZoom(v: number) { getState().zoom = v; notify(); }
export function setForces(f: ForceSettings) { getState().forces = { ...f }; notify(); }
export function setActive(v: boolean) { getState().active = v; notify(); }
export function setNodeCount(v: number) { getState().nodeCount = v; notify(); }
export function setEdgeCount(v: number) { getState().edgeCount = v; notify(); }
export function setWikilinkCount(v: number) { getState().wikilinkCount = v; notify(); }
export function setTagCount(v: number) { getState().tagCount = v; notify(); }

export function requestCameraReset() {
  getState().cameraResetCounter++;
  notify();
}

export function resetAll() {
  const s = getState();
  s.showWikilinks = true;
  s.showTags = true;
  s.forces = { ...DEFAULT_FORCES };
  s.cameraResetCounter++;
  notify();
}

// Re-export the hook from a separate file to avoid importing React in this module
// (which may be loaded in non-React contexts during SSR)
export { useConstellationState } from './useConstellationState';
