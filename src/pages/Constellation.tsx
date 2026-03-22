import { useEffect, useRef, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import graphData from '../lib/graph-index.json';
import {
  type GraphNode,
  type GraphEdge,
  initializePositions,
  computeNodeMetrics,
  tick,
} from '../lib/forceLayout';

// Category → star color (hex for canvas)
const categoryStarColors: Record<string, string> = {
  travel: '#34d399', // emerald-400
  design: '#c084fc', // purple-400
  finance: '#fbbf24', // amber-400
  projects: '#38bdf8', // sky-400
  musings: '#fb7185', // rose-400
  'cool-shit': '#fb923c', // orange-400
  food: '#a3e635', // lime-400
};

const EDGE_COLORS: Record<string, { color: string; width: number; dash: number[] }> = {
  wikilink: { color: 'rgba(255, 255, 255, 0.7)', width: 1.5, dash: [] },
  tag: { color: 'rgba(255, 255, 255, 0.12)', width: 0.5, dash: [4, 4] },
};

export default function Constellation() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  // Simulation state (refs to avoid re-renders)
  const nodesRef = useRef<GraphNode[]>([]);
  const edgesRef = useRef<GraphEdge[]>([]);
  const animFrameRef = useRef<number>(0);
  const alphaRef = useRef(1.0);
  const hoveredRef = useRef<GraphNode | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  // Camera (pan/zoom)
  const cameraRef = useRef({ x: 0, y: 0, zoom: 1 });
  const dragRef = useRef<{ startX: number; startY: number; camX: number; camY: number } | null>(null);

  // Filter state
  const [showWikilinks, setShowWikilinks] = useState(true);
  const [showTags, setShowTags] = useState(true);

  // Twinkle phase per node (stable random offsets)
  const twinkleRef = useRef<number[]>([]);

  // Initialize graph data
  useEffect(() => {
    const nodes: GraphNode[] = (graphData.nodes as Omit<GraphNode, 'x' | 'y' | 'vx' | 'vy' | 'connections' | 'radius'>[]).map((n) => ({
      ...n,
      x: 0,
      y: 0,
      vx: 0,
      vy: 0,
      connections: 0,
      radius: 4,
    }));

    const edges: GraphEdge[] = graphData.edges as GraphEdge[];

    nodesRef.current = nodes;
    edgesRef.current = edges;

    // Random twinkle phases
    twinkleRef.current = nodes.map(() => Math.random() * Math.PI * 2);

    const canvas = canvasRef.current;
    if (!canvas) return;

    const w = canvas.width;
    const h = canvas.height;

    initializePositions(nodes, w, h);
    computeNodeMetrics(nodes, edges);

    // Run simulation to settle
    alphaRef.current = 1.0;
  }, []);

  // Resize canvas to fill container
  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    if (!container || !canvas) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = container.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) ctx.scale(dpr, dpr);

      // Re-init positions if nodes exist
      if (nodesRef.current.length > 0) {
        initializePositions(nodesRef.current, rect.width, rect.height);
        alphaRef.current = 1.0;
      }
    };

    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let frameCount = 0;

    const render = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = canvas.width / dpr;
      const h = canvas.height / dpr;
      const nodes = nodesRef.current;
      const edges = edgesRef.current;
      const cam = cameraRef.current;
      const hovered = hoveredRef.current;
      const time = frameCount * 0.02;

      // Tick physics (slow down over time)
      if (alphaRef.current > 0.001) {
        tick(nodes, edges, w, h, alphaRef.current);
        alphaRef.current *= 0.995;
      }

      // Clear
      ctx.save();
      ctx.clearRect(0, 0, w, h);

      // Background gradient (deep space)
      const grad = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, Math.max(w, h) * 0.7);
      grad.addColorStop(0, '#0a0a1a');
      grad.addColorStop(1, '#050510');
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, w, h);

      // Apply camera transform
      ctx.translate(w / 2, h / 2);
      ctx.scale(cam.zoom, cam.zoom);
      ctx.translate(-w / 2 + cam.x, -h / 2 + cam.y);

      // Draw edges
      const filteredEdges = edges.filter((e) => {
        if (e.type === 'wikilink' && !showWikilinks) return false;
        if (e.type === 'tag' && !showTags) return false;
        return true;
      });

      const nodeMap = new Map<string, GraphNode>();
      nodes.forEach((n) => nodeMap.set(n.id, n));

      for (const edge of filteredEdges) {
        const a = nodeMap.get(edge.source);
        const b = nodeMap.get(edge.target);
        if (!a || !b) continue;

        const style = EDGE_COLORS[edge.type] || EDGE_COLORS.tag;

        // Dim edges not connected to hovered node
        let opacity = 1;
        if (hovered) {
          if (edge.source === hovered.id || edge.target === hovered.id) {
            opacity = 1;
          } else {
            opacity = 0.1;
          }
        }

        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        ctx.lineTo(b.x, b.y);
        ctx.strokeStyle = style.color.replace(/[\d.]+\)$/, `${opacity * parseFloat(style.color.match(/[\d.]+\)$/)?.[0] || '1')})`);
        ctx.lineWidth = style.width;
        ctx.setLineDash(style.dash);
        ctx.stroke();
        ctx.setLineDash([]);
      }

      // Draw nodes (stars)
      for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        const color = categoryStarColors[node.category] || '#ffffff';
        const twinkle = 0.6 + 0.4 * Math.sin(time + twinkleRef.current[i] * 6);

        // Dim nodes not connected to hovered
        let nodeOpacity = twinkle;
        let scale = 1;
        if (hovered) {
          if (node.id === hovered.id) {
            nodeOpacity = 1;
            scale = 1.5;
          } else if (
            filteredEdges.some(
              (e) =>
                (e.source === hovered.id && e.target === node.id) ||
                (e.target === hovered.id && e.source === node.id)
            )
          ) {
            nodeOpacity = 1;
            scale = 1.2;
          } else {
            nodeOpacity = 0.15;
          }
        }

        const r = node.radius * scale;

        // Glow
        const glowRadius = r * 3;
        const glow = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
        glow.addColorStop(0, color.replace(')', `, ${nodeOpacity * 0.4})`).replace('rgb', 'rgba').replace('#', ''));
        glow.addColorStop(1, 'rgba(0,0,0,0)');

        // Convert hex to rgba for glow
        const r2 = parseInt(color.slice(1, 3), 16);
        const g2 = parseInt(color.slice(3, 5), 16);
        const b2 = parseInt(color.slice(5, 7), 16);

        const glowGrad = ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, glowRadius);
        glowGrad.addColorStop(0, `rgba(${r2},${g2},${b2},${nodeOpacity * 0.3})`);
        glowGrad.addColorStop(1, 'rgba(0,0,0,0)');
        ctx.beginPath();
        ctx.arc(node.x, node.y, glowRadius, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Star dot
        ctx.beginPath();
        ctx.arc(node.x, node.y, r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${r2},${g2},${b2},${nodeOpacity})`;
        ctx.fill();

        // Bright center
        ctx.beginPath();
        ctx.arc(node.x, node.y, r * 0.4, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${nodeOpacity * 0.8})`;
        ctx.fill();
      }

      ctx.restore();

      frameCount++;
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animFrameRef.current);
  }, [showWikilinks, showTags]);

  // Hit detection helper
  const getNodeAt = useCallback((clientX: number, clientY: number): GraphNode | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const cam = cameraRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.width / dpr;
    const h = canvas.height / dpr;

    // Convert screen coords to world coords
    const sx = clientX - rect.left;
    const sy = clientY - rect.top;
    const wx = (sx - w / 2) / cam.zoom + w / 2 - cam.x;
    const wy = (sy - h / 2) / cam.zoom + h / 2 - cam.y;

    // Find closest node within hit radius
    const hitRadius = 15 / cam.zoom;
    let closest: GraphNode | null = null;
    let closestDist = Infinity;

    for (const node of nodesRef.current) {
      const dx = wx - node.x;
      const dy = wy - node.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < hitRadius && dist < closestDist) {
        closest = node;
        closestDist = dist;
      }
    }
    return closest;
  }, []);

  // Mouse move — hover detection + tooltip
  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const node = getNodeAt(e.clientX, e.clientY);
    hoveredRef.current = node;

    const canvas = canvasRef.current;
    const tooltip = tooltipRef.current;
    if (canvas) {
      canvas.style.cursor = node ? 'pointer' : dragRef.current ? 'grabbing' : 'grab';
    }
    if (tooltip) {
      if (node) {
        const rect = canvasRef.current?.getBoundingClientRect();
        if (rect) {
          tooltip.style.display = 'block';
          tooltip.style.left = `${e.clientX - rect.left + 12}px`;
          tooltip.style.top = `${e.clientY - rect.top - 10}px`;
          tooltip.textContent = node.title;
        }
      } else {
        tooltip.style.display = 'none';
      }
    }

    // Pan
    if (dragRef.current && !node) {
      const cam = cameraRef.current;
      cam.x = dragRef.current.camX + (e.clientX - dragRef.current.startX) / cam.zoom;
      cam.y = dragRef.current.camY + (e.clientY - dragRef.current.startY) / cam.zoom;
    }
  }, [getNodeAt]);

  // Mouse down — start drag
  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    const node = getNodeAt(e.clientX, e.clientY);
    if (!node) {
      dragRef.current = {
        startX: e.clientX,
        startY: e.clientY,
        camX: cameraRef.current.x,
        camY: cameraRef.current.y,
      };
    }
  }, [getNodeAt]);

  // Mouse up — navigate or end drag
  const handleMouseUp = useCallback((e: React.MouseEvent) => {
    if (dragRef.current) {
      const dx = Math.abs(e.clientX - dragRef.current.startX);
      const dy = Math.abs(e.clientY - dragRef.current.startY);
      dragRef.current = null;
      // If barely moved, treat as click
      if (dx < 3 && dy < 3) {
        const node = getNodeAt(e.clientX, e.clientY);
        if (node) navigate(`/post/${node.id}`);
      }
      return;
    }
    const node = getNodeAt(e.clientX, e.clientY);
    if (node) navigate(`/post/${node.id}`);
  }, [getNodeAt, navigate]);

  // Scroll — zoom
  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    const cam = cameraRef.current;
    const zoomFactor = e.deltaY > 0 ? 0.9 : 1.1;
    cam.zoom = Math.max(0.3, Math.min(5, cam.zoom * zoomFactor));
  }, []);

  // Touch support
  const touchStartRef = useRef<{ x: number; y: number; dist?: number } | null>(null);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      touchStartRef.current = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
      };
      dragRef.current = {
        startX: e.touches[0].clientX,
        startY: e.touches[0].clientY,
        camX: cameraRef.current.x,
        camY: cameraRef.current.y,
      };
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchStartRef.current = {
        x: (e.touches[0].clientX + e.touches[1].clientX) / 2,
        y: (e.touches[0].clientY + e.touches[1].clientY) / 2,
        dist: Math.sqrt(dx * dx + dy * dy),
      };
    }
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    if (e.touches.length === 1 && dragRef.current) {
      const cam = cameraRef.current;
      cam.x = dragRef.current.camX + (e.touches[0].clientX - dragRef.current.startX) / cam.zoom;
      cam.y = dragRef.current.camY + (e.touches[0].clientY - dragRef.current.startY) / cam.zoom;
    } else if (e.touches.length === 2 && touchStartRef.current?.dist) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const newDist = Math.sqrt(dx * dx + dy * dy);
      const scale = newDist / touchStartRef.current.dist;
      cameraRef.current.zoom = Math.max(0.3, Math.min(5, cameraRef.current.zoom * scale));
      touchStartRef.current.dist = newDist;
    }
  }, []);

  const handleTouchEnd = useCallback((e: React.TouchEvent) => {
    if (e.changedTouches.length === 1 && touchStartRef.current) {
      const dx = Math.abs(e.changedTouches[0].clientX - touchStartRef.current.x);
      const dy = Math.abs(e.changedTouches[0].clientY - touchStartRef.current.y);
      if (dx < 10 && dy < 10) {
        const node = getNodeAt(e.changedTouches[0].clientX, e.changedTouches[0].clientY);
        if (node) navigate(`/post/${node.id}`);
      }
    }
    dragRef.current = null;
    touchStartRef.current = null;
  }, [getNodeAt, navigate]);

  return (
    <div className="relative w-full" style={{ height: 'calc(100vh - 80px)' }}>
      {/* Canvas container */}
      <div
        ref={containerRef}
        className="w-full h-full rounded-xl overflow-hidden"
        style={{ background: '#050510' }}
      >
        <canvas
          ref={canvasRef}
          onMouseMove={handleMouseMove}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseLeave={() => {
            hoveredRef.current = null;
            dragRef.current = null;
            if (tooltipRef.current) tooltipRef.current.style.display = 'none';
          }}
          onWheel={handleWheel}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{ cursor: 'grab' }}
        />
        {/* Tooltip */}
        <div
          ref={tooltipRef}
          className="absolute pointer-events-none px-3 py-1.5 rounded-lg text-sm font-medium"
          style={{
            display: 'none',
            background: 'rgba(0,0,0,0.85)',
            color: '#e0e0e0',
            border: '1px solid rgba(255,255,255,0.15)',
            backdropFilter: 'blur(8px)',
            maxWidth: '250px',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            zIndex: 10,
          }}
        />
      </div>

      {/* Legend / controls */}
      <div
        className="absolute bottom-4 left-4 px-4 py-3 rounded-xl text-xs space-y-2"
        style={{
          background: 'rgba(0,0,0,0.7)',
          border: '1px solid rgba(255,255,255,0.1)',
          backdropFilter: 'blur(8px)',
          color: '#aaa',
        }}
      >
        <div className="font-semibold text-white/80 mb-2">Connections</div>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showWikilinks}
            onChange={() => setShowWikilinks(!showWikilinks)}
            className="accent-white"
          />
          <span className="inline-block w-6 border-t border-white/70" />
          <span>Links ({graphData.edges.filter(e => e.type === 'wikilink').length})</span>
        </label>
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={showTags}
            onChange={() => setShowTags(!showTags)}
            className="accent-white"
          />
          <span className="inline-block w-6 border-t border-dashed border-white/30" />
          <span>Shared Tags ({graphData.edges.filter(e => e.type === 'tag').length})</span>
        </label>

        <div className="border-t border-white/10 pt-2 mt-2">
          <div className="font-semibold text-white/80 mb-1">Categories</div>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(categoryStarColors).map(([cat, color]) => (
              <div key={cat} className="flex items-center gap-1.5">
                <span
                  className="inline-block w-2 h-2 rounded-full"
                  style={{ background: color }}
                />
                <span className="capitalize">{cat === 'cool-shit' ? 'Cool Shit' : cat}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-white/10 pt-2 text-white/40">
          Scroll to zoom · Drag to pan · Click a star to visit
        </div>
      </div>

      {/* Post count */}
      <div
        className="absolute top-4 right-4 px-3 py-1.5 rounded-lg text-xs"
        style={{
          background: 'rgba(0,0,0,0.5)',
          color: '#888',
          border: '1px solid rgba(255,255,255,0.1)',
        }}
      >
        {graphData.nodes.length} posts · {graphData.edges.length} connections
      </div>
    </div>
  );
}
