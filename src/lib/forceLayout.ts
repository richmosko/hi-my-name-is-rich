/**
 * Minimal force-directed graph layout.
 * No dependencies — just physics.
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
 * Initialize node positions in a circle with some randomness.
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
    const jitter = (Math.random() - 0.5) * radius * 0.5;
    node.x = cx + Math.cos(angle) * (radius + jitter);
    node.y = cy + Math.sin(angle) * (radius + jitter);
    node.vx = 0;
    node.vy = 0;
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
  edges.forEach((e) => {
    counts[e.source] = (counts[e.source] || 0) + 1;
    counts[e.target] = (counts[e.target] || 0) + 1;
  });

  nodes.forEach((node) => {
    node.connections = counts[node.id] || 0;
    // Radius: 3px base, up to 8px for highly connected nodes
    node.radius = 3 + Math.min(node.connections / 3, 5);
  });
}

/**
 * Run one tick of the force simulation.
 *
 * Forces:
 *  - Repulsion: all nodes push each other away
 *  - Attraction: connected nodes pull toward each other
 *  - Centering: gentle pull toward canvas center
 *  - Damping: velocity decay for stability
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

  // Repulsion (Barnes-Hut would be faster, but 78 nodes is fine with O(n²))
  const repulsionStrength = 800 * alpha;
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const a = nodes[i];
      const b = nodes[j];
      const dx = b.x - a.x;
      const dy = b.y - a.y;
      let dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 1) dist = 1;

      const force = repulsionStrength / (dist * dist);
      const fx = (dx / dist) * force;
      const fy = (dy / dist) * force;

      a.vx -= fx;
      a.vy -= fy;
      b.vx += fx;
      b.vy += fy;
    }
  }

  // Attraction along edges
  for (const edge of edges) {
    const a = nodeMap.get(edge.source);
    const b = nodeMap.get(edge.target);
    if (!a || !b) continue;

    const dx = b.x - a.x;
    const dy = b.y - a.y;
    let dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < 1) dist = 1;

    // Stronger pull for wikilinks
    const strength =
      edge.type === 'wikilink' ? 0.15 * alpha : 0.03 * alpha;
    const idealDist = edge.type === 'wikilink' ? 80 : 150;

    const force = (dist - idealDist) * strength;
    const fx = (dx / dist) * force;
    const fy = (dy / dist) * force;

    a.vx += fx;
    a.vy += fy;
    b.vx -= fx;
    b.vy -= fy;
  }

  // Centering force
  const centerStrength = 0.01 * alpha;
  for (const node of nodes) {
    node.vx += (cx - node.x) * centerStrength;
    node.vy += (cy - node.y) * centerStrength;
  }

  // Apply velocity + damping
  const damping = 0.85;
  const maxSpeed = 10;
  for (const node of nodes) {
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

    // Keep within bounds (with padding)
    const pad = 30;
    node.x = Math.max(pad, Math.min(width - pad, node.x));
    node.y = Math.max(pad, Math.min(height - pad, node.y));
  }
}
