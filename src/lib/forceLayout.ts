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

/**
 * Run one tick of the force simulation.
 */
export function tick(
  nodes: GraphNode[],
  edges: GraphEdge[],
  width: number,
  height: number,
  alpha: number = 0.1
): void {
  const cx = width / 2;
  const cy = height / 2;
  const nodeMap = new Map<string, GraphNode>();
  nodes.forEach((n) => nodeMap.set(n.id, n));

  // ─── Repulsion (all pairs push apart) ───────────────────────
  // Higher = more spread out. Obsidian default is moderate.
  const repulsionStrength = 5000;
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
      strength = 0.4 * alpha;
      idealDist = 60;
    } else {
      // tag
      strength = 0.08 * alpha;
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
  const centerStrength = 0.02 * alpha;
  for (const node of nodes) {
    if (node.pinned) continue;
    node.vx += (cx - node.x) * centerStrength;
    node.vy += (cy - node.y) * centerStrength;
  }

  // ─── Ambient drift (gentle random perturbation) ─────────────
  const driftStrength = 0.15;
  for (const node of nodes) {
    if (node.pinned) continue;
    node.vx += (Math.random() - 0.5) * driftStrength;
    node.vy += (Math.random() - 0.5) * driftStrength;
  }

  // ─── Apply velocity + damping ───────────────────────────────
  const damping = 0.88;
  const maxSpeed = 8;
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

    // Soft boundary
    const pad = 40;
    const bounce = 0.3;
    if (node.x < pad) node.vx += (pad - node.x) * bounce;
    if (node.x > width - pad) node.vx -= (node.x - (width - pad)) * bounce;
    if (node.y < pad) node.vy += (pad - node.y) * bounce;
    if (node.y > height - pad) node.vy -= (node.y - (height - pad)) * bounce;
  }
}
