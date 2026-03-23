/**
 * Force-directed graph layout — Obsidian-style physics.
 * No dependencies — just forces.
 *
 * Forces:
 *  - Repulsion: all nodes push each other away (charge force)
 *  - Link attraction: connected nodes pull toward each other (spring force)
 *    - Wikilinks are strong springs (short ideal distance)
 *    - Tag edges are weaker springs (longer ideal distance)
 *  - Centering: gentle gravity toward canvas center
 *  - Damping: velocity decay for stability
 *  - Drift: small random perturbation for ambient motion
 */

export interface GraphNode {
  id: string;
  title: string;
  category: string;
  categories: string[];
  tags: string[];
  date: string;
  featured: boolean;
  image: string;
  // Layout state (mutated in place)
  x: number;
  y: number;
  vx: number;
  vy: number;
  connections: number;
  radius: number;
  // Pinned by drag — skip force application
  pinned?: boolean;
}

export interface GraphEdge {
  source: string;
  target: string;
  type: 'wikilink' | 'tag' | 'category';
  shared?: string[];
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

/**
 * Initialize node positions in a spread circle with randomness.
 */
export function initializePositions(
  nodes: GraphNode[],
  width: number,
  height: number
): void {
  const cx = width / 2;
  const cy = height / 2;
  const radius = Math.min(width, height) * 0.35;

  nodes.forEach((node, i) => {
    const angle = (i / nodes.length) * Math.PI * 2;
    const jitter = (Math.random() - 0.5) * radius * 0.6;
    node.x = cx + Math.cos(angle) * (radius + jitter);
    node.y = cy + Math.sin(angle) * (radius + jitter);
    node.vx = (Math.random() - 0.5) * 0.5;
    node.vy = (Math.random() - 0.5) * 0.5;
  });
}

/**
 * Count connections per node and set radius accordingly.
 */
export function computeNodeMetrics(
  nodes: GraphNode[],
  edges: GraphEdge[]
): void {
  const counts: Record<string, number> = {};
  // Weight wikilinks more than tag edges
  edges.forEach((e) => {
    const w = e.type === 'wikilink' ? 3 : 1;
    counts[e.source] = (counts[e.source] || 0) + w;
    counts[e.target] = (counts[e.target] || 0) + w;
  });

  nodes.forEach((node) => {
    node.connections = counts[node.id] || 0;
    // Radius: 3px base, up to 12px for highly connected nodes
    node.radius = 3 + Math.min(node.connections * 0.4, 9);
  });
}

// Module-level drift timer for smooth sinusoidal ambient motion
let driftTime = 0;

/**
 * Run one tick of the force simulation.
 */
export interface ForceMultipliers {
  linkStrength?: number;   // default 1
  tagStrength?: number;    // default 1 (applied on top of base 0.08)
  repulsion?: number;      // default 1
  gravity?: number;        // default 1
  drift?: number;          // default 1
}

export function tick(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  alpha: number = 0.1,
  multipliers: ForceMultipliers = {}
): void {
  const cx = width / 2;
  const cy = height / 2;
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  const linkMul = multipliers.linkStrength ?? 1;
  const tagMul = multipliers.tagStrength ?? 1;
  const repMul = multipliers.repulsion ?? 1;
  const gravMul = multipliers.gravity ?? 1;
  const driftMul = multipliers.drift ?? 1;

  // ─── Repulsion (all pairs push apart) ───────────────────────
  const repulsionStrength = 5000 * repMul;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      let dx = b.x - a.x;
      let dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) {
        // Jitter to break overlaps
        dx = (Math.random() - 0.5) * 2;
        dy = (Math.random() - 0.5) * 2;
        dist = 1;
      }

      const force = (repulsionStrength * alpha) / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      if (!a.pinned) { a.vx -= fx; a.vy -= fy; }
      if (!b.pinned) { b.vx += fx; b.vy += fy; }
    }
  }

  // ─── Link attraction (spring force) ─────────────────────────
  for (const edge of edges) {
    const a = nodeMap.get(edge.source);
    const b = nodeMap.get(edge.target);
    if (!a || !b) continue;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) dist = 1;

    // Wikilinks: strong pull, short ideal distance → tight clusters
    // Tags: moderate pull, longer ideal distance → loose affinity
    let strength: number;
    let idealDist: number;

    if (edge.type === 'wikilink') {
      strength = 0.4 * alpha * linkMul;
      idealDist = 60;
    } else {
      // tag
      strength = 0.08 * alpha * tagMul;
      idealDist = 150;
    }

    const displacement = dist - idealDist;
    const force = displacement * strength;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    if (!a.pinned) { a.vx += fx; a.vy += fy; }
    if (!b.pinned) { b.vx -= fx; b.vy -= fy; }
  }

  // ─── Centering gravity ──────────────────────────────────────
  const centerStrength = 0.02 * alpha * gravMul;
  for (const node of nodes) {
    if (node.pinned) continue;
    node.vx += (cx - node.x) * centerStrength;
    node.vy += (cy - node.y) * centerStrength;
  }

  // ─── Ambient drift (smooth sinusoidal perturbation) ─────────
  // Each node gets a slow, smooth drift based on time + its index,
  // avoiding the jittery random noise that causes bouncing.
  driftTime += 0.003;
  const driftStrength = 0.015 * driftMul;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if (node.pinned) continue;
    // Use offset sine waves so each node drifts in a unique gentle pattern
    const phase = i * 2.39996; // golden angle in radians
    node.vx += Math.sin(driftTime * 0.7 + phase) * driftStrength;
    node.vy += Math.cos(driftTime * 0.5 + phase * 1.3) * driftStrength;
  }

  // ─── Apply velocity + damping ───────────────────────────────
  const damping = 0.93;
  const maxSpeed = 4;
  for (const node of nodes) {
    if (node.pinned) continue;

    node.vx *= damping;
    node.vy *= damping;

    // Clamp speed
    const speed = Math.sqrt(node.vx * node.vx + node.vy * node.vy);
    if (speed > maxSpeed) {
      node.vx = (node.vx / speed) * maxSpeed;
      node.vy = (node.vy / speed) * maxSpeed;
    }

    node.x += node.vx;
    node.y += node.vy;

    // Soft boundary (gentle, not bouncy)
    const pad = 40;
    const pushBack = 0.05;
    if (node.x < pad) node.vx += (pad - node.x) * pushBack;
    if (node.x > width - pad) node.vx -= (node.x - (width - pad)) * pushBack;
    if (node.y < pad) node.vy += (pad - node.y) * pushBack;
    if (node.y > height - pad) node.vy -= (node.y - (height - pad)) * pushBack;
  }
}
