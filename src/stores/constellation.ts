import { atom, map } from 'nanostores';

// Force settings defaults
export const DEFAULT_FORCES = {
  linkStrength: 1.0,
  tagStrength: 0.3,
  repulsion: 1.0,
  gravity: 0.1,
  drift: 0.05,
};

// Constellation state shared across React islands (TopBar + ConstellationGraph)
export const $showWikilinks = atom(true);
export const $showTags = atom(true);
export const $zoom = atom(1.4);
export const $forces = map({ ...DEFAULT_FORCES });

// Whether the constellation page is active (controls visibility in TopBar)
export const $constellationActive = atom(false);

// Stats (set by ConstellationGraph, read by TopBar)
export const $nodeCount = atom(0);
export const $edgeCount = atom(0);
export const $wikilinkCount = atom(0);
export const $tagCount = atom(0);

// Camera reset trigger — increment to trigger a reset animation
export const $cameraResetCounter = atom(0);

export function requestCameraReset() {
  $cameraResetCounter.set($cameraResetCounter.get() + 1);
}

export function resetAll() {
  $showWikilinks.set(true);
  $showTags.set(true);
  $forces.set({ ...DEFAULT_FORCES });
  requestCameraReset();
}
