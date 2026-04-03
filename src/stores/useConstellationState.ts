import { useSyncExternalStore } from 'react';
import { getConstellationState, type ForceSettings } from './constellation';

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

const EVENT_NAME = 'constellation-state-change';

/**
 * React hook to subscribe to constellation state changes.
 * Uses window CustomEvents for cross-island reactivity.
 */
export function useConstellationState(): ConstellationState {
  return useSyncExternalStore(
    (callback: () => void) => {
      if (typeof window === 'undefined') return () => {};
      window.addEventListener(EVENT_NAME, callback);
      return () => window.removeEventListener(EVENT_NAME, callback);
    },
    () => getConstellationState(),
    () => getConstellationState(),
  );
}
